// profile-app.js - منطق Firebase والبيانات
// يُحمّل كـ module منفصل لتجنب مشاكل الشبكة

const firebaseConfig={
  apiKey:"AIzaSyBsIaCjE7QOQ6QkhqhCIMA3sLdMvxBxPHk",
  authDomain:"shaglni-c64c0.firebaseapp.com",
  projectId:"shaglni-c64c0",
  storageBucket:"shaglni-c64c0.appspot.com",
  messagingSenderId:"768887356636",
  appId:"1:768887356636:web:11ec1d6991add3309c8819",
  measurementId:"G-98GQGZS09W"
};

const CLOUDINARY_URL="https://api.cloudinary.com/v1_1/dbmjg23hl/image/upload";
const CLOUDINARY_UPLOAD_PRESET="Companies_emploies";

let currentUser=null;
let userRole='employee';
let userCollection='employees';
let profileData={};
let db,auth;

// ====== Helpers ======
function safeAwait(promise,ms=8000,fallback=null){
  return Promise.race([
    promise,
    new Promise((_,rej)=>setTimeout(()=>rej(new Error('Timeout')),ms))
  ]).catch(err=>{console.warn('Operation failed:',err.message);return fallback;});
}

function showMsg(elId,msg,type){
  const el=document.getElementById(elId);if(!el)return;
  el.className='message';void el.offsetWidth;el.textContent=msg;el.classList.add('show',type+'-message');
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.className='message',300);},type==='error'?6000:4000);
}

function esc(s){if(s==null)return'';return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

// ====== Initialize Firebase ======
async function init(){
  try{
    const {initializeApp}=await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    const {getFirestore,doc,getDoc,updateDoc}=await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const {getAuth,onAuthStateChanged,signOut,updateProfile,EmailAuthProvider,reauthenticateWithCredential,updatePassword}=await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');

    const app=initializeApp(firebaseConfig);
    db=getFirestore(app);auth=getAuth(app);

    window.__firebase={db,auth,doc,getDoc,updateDoc,onAuthStateChanged,signOut,updateProfile,EmailAuthProvider,reauthenticateWithCredential,updatePassword};

    onAuthStateChanged(auth,handleAuth);
    window.__profileAppLoaded=true;
  }catch(e){
    console.error('Firebase init failed:',e);
    document.getElementById('page-loader').classList.add('hidden');
    document.getElementById('network-retry').classList.remove('hidden');
  }
}

// ====== Auth Handler ======
async function handleAuth(user){
  document.getElementById('page-loader').classList.add('hidden');
  if(!user){
    document.getElementById('not-logged-in').classList.remove('hidden');
    return;
  }
  currentUser=user;
  document.getElementById('main-header').style.display='';
  document.getElementById('page-content').classList.remove('hidden');

  // Header user info
  const name=user.displayName||user.email.split('@')[0];
  document.getElementById('dropdown-username').textContent=name;
  document.getElementById('dropdown-email').textContent=user.email;
  document.getElementById('user-initial').textContent=name.charAt(0).toUpperCase();

  // Logout
  document.getElementById('logout-btn').onclick=()=>{signOut(auth).then(()=>location.href='index.html');};

  await loadProfile();
}

// ====== Load Profile Data ======
async function loadProfile(){
  try{
    let snap=await safeAwait(getDoc(doc(db,'employees',currentUser.uid)),5000);
    if(snap&&snap.exists()){
      userRole='employee';userCollection='employees';profileData=snap.data();
    }else{
      snap=await safeAwait(getDoc(doc(db,'All_jops',currentUser.uid)),5000);
      if(snap&&snap.exists()){
        userRole='employer';userCollection='All_jops';profileData=snap.data();
      }else{
        profileData={uid:currentUser.uid,name:currentUser.displayName||'مستخدم جديد',email:currentUser.email,role:'employee'};
        userCollection='employees';
      }
    }
    renderAll();
  }catch(err){
    console.error('Load profile error:',err);
    showMsg('header-message','تعذر تحميل البيانات. أعد تحميل الصفحة.','error');
  }
}

// ====== Render All ======
function renderAll(){
  if(userRole==='employer'){
    const st=document.getElementById('tab-btn-skills');if(st)st.style.display='none';
  }
  renderHeader();
  renderOverview();
  renderSkills();
  renderPortfolio();
  renderSettings();
}

function calcCompletion(d){
  let score=30;
  if(d.profileImageUrl)score+=12;
  if(d.coverPhotoUrl)score+=5;
  if(Array.isArray(d.previousWorksUrls)&&d.previousWorksUrls.length>=5)score+=15;
  else if(Array.isArray(d.previousWorksUrls)&&d.previousWorksUrls.length>0)score+=8;
  if(Array.isArray(d.skills)&&d.skills.length>0)score+=8;
  if(d.bio)score+=8;
  if(d.experience)score+=5;
  if(Array.isArray(d.education)&&d.education.length>0)score+=5;
  if(Array.isArray(d.workExperience)&&d.workExperience.length>0)score+=5;
  if(Array.isArray(d.languages)&&d.languages.length>0)score+=3;
  if(d.links?.cv)score+=2;
  if(d.contact?.location?.city)score+=2;
  return Math.min(score,100);
}

function renderHeader(){
  const name=profileData.name||currentUser.displayName||'مستخدم';
  document.getElementById('display-name').textContent=name;
  document.getElementById('user-initial').textContent=name.charAt(0).toUpperCase();

  const headline=userRole==='employer'?(profileData.companyInfo?.businessType||'صاحب عمل'):profileData.headline||'مبدع مستقل';
  document.getElementById('display-headline').textContent=headline;

  const loc=userRole==='employer'?profileData.companyInfo?.location:profileData.contact?.location;
  const city=loc?.city||'';const state=loc?.state||'';
  document.getElementById('display-location').innerHTML='<i class="fas fa-map-marker-alt ml-1"></i>'+(city&&state?city+'، '+state:'الموقع غير محدد');

  const avatarUrl=userRole==='employer'?profileData.companyInfo?.logoUrl:profileData.profileImageUrl;
  document.getElementById('profile-avatar').src=avatarUrl||'https://ui-avatars.com/api/?background=2563eb&color=fff&name='+encodeURIComponent(name);

  const coverUrl=profileData.coverPhotoUrl;
  const coverImg=document.getElementById('cover-photo');
  const coverFallback=document.getElementById('cover-fallback');
  if(coverUrl){coverImg.src=coverUrl;coverImg.classList.remove('hidden');coverFallback.classList.add('hidden');}
  else{coverImg.classList.add('hidden');coverFallback.classList.remove('hidden');}

  const statusBadge=document.getElementById('job-status-badge');
  if(userRole==='employee'){
    const status=profileData.jobStatus||'متاح للعمل';
    statusBadge.innerHTML='<span class="'+(status==='متاح للعمل'?'status-available':'status-not-looking')+'">'+status+'</span>';
  }else if(statusBadge){statusBadge.innerHTML='';}

  const verifiedWrap=document.getElementById('verified-badge-wrap');
  if(userRole==='employer'&&profileData.verification?.isVerified){
    verifiedWrap.innerHTML='<span class="verified-badge"><i class="fas fa-badge-check"></i> شركة موثقة</span>';
  }else if(verifiedWrap){verifiedWrap.innerHTML='';}

  const ratingWrap=document.getElementById('display-rating-wrap');
  if(profileData.averageRating){
    ratingWrap.innerHTML='<span class="rating-simple"><i class="fas fa-star text-amber-500"></i> '+parseFloat(profileData.averageRating).toFixed(1)+'</span>';
  }else if(ratingWrap){ratingWrap.innerHTML='';}

  const pct=calcCompletion(profileData);
  document.getElementById('completion-percentage').textContent=pct+'%';
  const bar=document.getElementById('completion-bar');
  bar.style.width=pct+'%';bar.classList.toggle('complete',pct>=100);
  document.getElementById('completion-hint').textContent=pct>=100?'رائع! ملفك الشخصي مكتمل بالكامل.':'أكمل بياناتك (المهارات، الصور، النبذة الشخصية) لزيادة فرصك في الحصول على عمل.';

  document.getElementById('input-name').value=profileData.name||'';
  document.getElementById('input-headline').value=profileData.headline||'';
  document.getElementById('input-email-readonly').value=currentUser.email||'';
  document.getElementById('input-job-status').value=profileData.jobStatus||'متاح للعمل';
  document.getElementById('stat-views').textContent=profileData.profileViews||0;
  document.getElementById('stat-applications').textContent=profileData.applications||0;
  document.getElementById('stat-offers').textContent=profileData.jobOffers||0;
}

function renderOverview(){
  document.getElementById('bio-view').textContent=profileData.bio||'لم تتم إضافة نبذة بعد.';
  document.getElementById('view-email').textContent=currentUser.email||'—';
  document.getElementById('view-phone').textContent=profileData.contact?.phone||profileData.companyInfo?.phone||'غير مضاف';
  const loc=userRole==='employer'?profileData.companyInfo?.location:profileData.contact?.location;
  document.getElementById('view-full-location').textContent=(loc?.city||loc?.state)?[loc.city,loc.state].filter(Boolean).join('، '):'غير محدد';
  document.getElementById('view-linkedin').textContent=profileData.links?.linkedin||'غير مضاف';

  const langWrap=document.getElementById('languages-view-mini');
  const langs=profileData.languages||[];
  if(langWrap)langWrap.innerHTML=langs.map(l=>'<span class="skill-tag">'+esc(l.name)+' · '+esc(l.level)+'</span>').join('');
  const langEmpty=document.getElementById('languages-view-mini-empty');
  if(langEmpty)langEmpty.classList.toggle('hidden',langs.length>0);
}

function renderRepeatable(viewId,emptyId,items,templateFn){
  const wrap=document.getElementById(viewId);const empty=document.getElementById(emptyId);
  const list=Array.isArray(items)?items:[];
  if(empty)empty.classList.toggle('hidden',list.length>0);
  if(wrap)wrap.innerHTML=list.map(templateFn).join('');
}

function renderSkills(){
  const tagsWrap=document.getElementById('skills-view-tags');
  const skills=profileData.skills||[];
  if(tagsWrap)tagsWrap.innerHTML=skills.length?skills.map(s=>'<span class="skill-tag">'+esc(s)+'</span>').join(''):'<p class="text-gray-400 text-sm">لم تتم إضافة مهارات بعد.</p>';
  const expView=document.getElementById('experience-view');
  if(expView)expView.textContent=profileData.experience||'غير محدد';

  renderRepeatable('languages-view','languages-view-empty',profileData.languages,l=>
    '<div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"><span class="font-bold text-gray-700 text-sm">'+esc(l.name)+'</span><span class="skill-tag !m-0">'+esc(l.level)+'</span></div>');

  renderRepeatable('workexp-view','workexp-view-empty',profileData.workExperience,it=>
    '<div class="timeline-item"><span class="timeline-dot"></span><p class="font-bold text-gray-800">'+esc(it.title)+'</p><p class="text-blue-600 text-sm font-medium">'+esc(it.company)+'</p><p class="text-gray-400 text-xs mb-1">'+esc(it.duration)+'</p><p class="text-gray-600 text-sm">'+esc(it.description)+'</p></div>');

  renderRepeatable('education-view','education-view-empty',profileData.education,it=>
    '<div class="timeline-item"><span class="timeline-dot"></span><p class="font-bold text-gray-800">'+esc(it.degree)+'</p><p class="text-blue-600 text-sm font-medium">'+esc(it.institution)+'</p><p class="text-gray-400 text-xs">'+esc(it.year)+'</p></div>');

  renderRepeatable('certs-view','certs-view-empty',profileData.certifications,it=>
    '<div class="timeline-item"><span class="timeline-dot"></span><p class="font-bold text-gray-800">'+esc(it.name)+'</p><p class="text-blue-600 text-sm font-medium">'+esc(it.issuer)+' · '+esc(it.year)+'</p>'+(it.url?'<a href="'+esc(it.url)+'" target="_blank" class="text-xs text-gray-500 hover:text-blue-600"><i class="fas fa-link ml-1"></i>عرض الشهادة</a>':'')+'</div>');
}

function renderPortfolio(){
  const grid=document.getElementById('portfolio-grid');
  const works=profileData.previousWorksUrls||[];
  const empty=document.getElementById('portfolio-empty');
  if(empty)empty.classList.toggle('hidden',works.length>0);
  if(grid){
    grid.innerHTML=works.map((url,i)=>'<div class="portfolio-item"><img src="'+url+'" loading="lazy" alt="عمل سابق"><button class="portfolio-remove" onclick="window.removeWork('+i+')" title="حذف"><i class="fas fa-times"></i></button></div>').join('');
  }
  const cvView=document.getElementById('view-cv');
  if(cvView){
    if(profileData.links?.cv)cvView.innerHTML='<a href="'+esc(profileData.links.cv)+'" target="_blank" class="text-blue-600 hover:underline font-bold">عرض السيرة الذاتية</a>';
    else cvView.textContent='لا يوجد رابط سيرة ذاتية';
  }
}

function renderSettings(){
  const n=profileData.notificationSettings||{};
  const ne=document.getElementById('notif-email');
  const nj=document.getElementById('notif-jobalerts');
  const nm=document.getElementById('notif-messages');
  const na=document.getElementById('notif-applications');
  if(ne)ne.checked=n.emailNotifications!==false;
  if(nj)nj.checked=n.jobAlerts!==false;
  if(nm)nm.checked=n.messageNotifications!==false;
  if(na)na.checked=n.applicationUpdates!==false;
}

// ====== Populate Edit Forms ======
window.populateEditForm=function(name){
  if(name==='bio'){const el=document.getElementById('input-bio');if(el)el.value=profileData.bio||'';}
  if(name==='contact'){
    const phoneEl=document.getElementById('input-phone');const linkedinEl=document.getElementById('input-linkedin');
    const stateSel=document.getElementById('input-state');const citySel=document.getElementById('input-city');
    if(phoneEl)phoneEl.value=profileData.contact?.phone||'';
    if(linkedinEl)linkedinEl.value=profileData.links?.linkedin||'';
    const loc=profileData.contact?.location||{};
    if(stateSel){stateSel.value=loc.state||'';stateSel.dispatchEvent(new Event('change'));}
    setTimeout(()=>{if(citySel)citySel.value=loc.city||'';},50);
  }
  if(name==='skills'){
    const container=document.getElementById('skills-input-container');
    if(container){container.innerHTML='';const skills=(profileData.skills&&profileData.skills.length)?profileData.skills:[''];skills.forEach(s=>addSkillRow(s));}
    const expSel=document.getElementById('input-experience');if(expSel)expSel.value=profileData.experience||'';
  }
  if(name==='languages'){
    const container=document.getElementById('languages-input-container');
    if(container){container.innerHTML='';const langs=(profileData.languages&&profileData.languages.length)?profileData.languages:[{name:'',level:'متوسط'}];langs.forEach(l=>addLangRow(l));}
  }
  if(name==='workexp'){
    const container=document.getElementById('workexp-input-container');
    if(container){container.innerHTML='';const items=(profileData.workExperience&&profileData.workExperience.length)?profileData.workExperience:[{}];items.forEach(it=>addWorkRow(it));}
  }
  if(name==='education'){
    const container=document.getElementById('education-input-container');
    if(container){container.innerHTML='';const items=(profileData.education&&profileData.education.length)?profileData.education:[{}];items.forEach(it=>addEduRow(it));}
  }
  if(name==='certs'){
    const container=document.getElementById('certs-input-container');
    if(container){container.innerHTML='';const items=(profileData.certifications&&profileData.certifications.length)?profileData.certifications:[{}];items.forEach(it=>addCertRow(it));}
  }
  if(name==='links'){const el=document.getElementById('input-cv');if(el)el.value=profileData.links?.cv||'';}
};

// ====== Dynamic Rows ======
function addSkillRow(v){
  const container=document.getElementById('skills-input-container');if(!container)return;
  if(container.children.length>=6){document.getElementById('skills-limit-message').classList.remove('hidden');return;}
  document.getElementById('skills-limit-message').classList.add('hidden');
  const row=document.createElement('div');row.className='mb-2 flex items-center gap-2';
  row.innerHTML='<input type="text" class="field-input skill-input" placeholder="مثال: React.js" value="'+esc(v||'')+'"><button type="button" class="item-remove-btn" onclick="this.parentElement.remove();document.getElementById('skills-limit-message').classList.add('hidden')"><i class="fas fa-minus"></i></button>';
  container.appendChild(row);
}

function addLangRow(item={}){
  const container=document.getElementById('languages-input-container');if(!container)return;
  const row=document.createElement('div');row.className='flex items-center gap-2';
  row.innerHTML='<input type="text" class="field-input lang-name" placeholder="اللغة" value="'+esc(item.name||'')+'"><select class="field-select lang-level" style="max-width:140px"><option value="مبتدئ">مبتدئ</option><option value="متوسط">متوسط</option><option value="متقدم">متقدم</option><option value="لغة أم">لغة أم</option></select><button type="button" class="item-remove-btn" onclick="this.parentElement.remove()"><i class="fas fa-minus"></i></button>';
  const sel=row.querySelector('.lang-level');if(sel)sel.value=item.level||'متوسط';
  container.appendChild(row);
}

function addWorkRow(item={}){
  const container=document.getElementById('workexp-input-container');if(!container)return;
  const row=document.createElement('div');row.className='border border-gray-200 rounded-xl p-4 space-y-2 relative';
  row.innerHTML='<div class="flex justify-end"><button type="button" class="item-remove-btn" onclick="this.closest('.border').remove()"><i class="fas fa-trash"></i></button></div><input type="text" class="field-input we-title" placeholder="المسمى الوظيفي" value="'+esc(item.title||'')+'"><input type="text" class="field-input we-company" placeholder="اسم الشركة" value="'+esc(item.company||'')+'"><input type="text" class="field-input we-duration" placeholder="المدة" value="'+esc(item.duration||'')+'"><textarea class="field-textarea we-description" rows="2" placeholder="وصف مختصر">'+esc(item.description||'')+'</textarea>';
  container.appendChild(row);
}

function addEduRow(item={}){
  const container=document.getElementById('education-input-container');if(!container)return;
  const row=document.createElement('div');row.className='border border-gray-200 rounded-xl p-4 space-y-2';
  row.innerHTML='<div class="flex justify-end"><button type="button" class="item-remove-btn" onclick="this.closest('.border').remove()"><i class="fas fa-trash"></i></button></div><input type="text" class="field-input ed-degree" placeholder="الدرجة العلمية" value="'+esc(item.degree||'')+'"><input type="text" class="field-input ed-institution" placeholder="اسم الجامعة" value="'+esc(item.institution||'')+'"><input type="text" class="field-input ed-year" placeholder="سنة التخرج" value="'+esc(item.year||'')+'">';
  container.appendChild(row);
}

function addCertRow(item={}){
  const container=document.getElementById('certs-input-container');if(!container)return;
  const row=document.createElement('div');row.className='border border-gray-200 rounded-xl p-4 space-y-2';
  row.innerHTML='<div class="flex justify-end"><button type="button" class="item-remove-btn" onclick="this.closest('.border').remove()"><i class="fas fa-trash"></i></button></div><input type="text" class="field-input cert-name" placeholder="اسم الشهادة" value="'+esc(item.name||'')+'"><input type="text" class="field-input cert-issuer" placeholder="الجهة المانحة" value="'+esc(item.issuer||'')+'"><input type="text" class="field-input cert-year" placeholder="سنة الحصول عليها" value="'+esc(item.year||'')+'"><input type="url" class="field-input cert-url" placeholder="رابط الشهادة (اختياري)" value="'+esc(item.url||'')+'">';
  container.appendChild(row);
}

window.addLanguageRow=function(){addLangRow();};
window.addWorkExpRow=function(){addWorkRow();};
window.addEducationRow=function(){addEduRow();};
window.addCertRow=function(){addCertRow();};

// ====== Save Operations ======
async function saveField(updates,msgId,sectionToClose){
  try{
    if(!currentUser)throw new Error('لا يوجد مستخدم');
    await safeAwait(updateDoc(doc(db,userCollection,currentUser.uid),{...updates,updatedAt:new Date()}),8000);
    Object.assign(profileData,updates);
    renderAll();
    showMsg(msgId,'تم الحفظ بنجاح.','success');
    if(sectionToClose)setTimeout(()=>{const el=document.getElementById(sectionToClose+'-edit');const v=document.getElementById(sectionToClose+'-view');if(el)el.classList.add('hidden');if(v)v.classList.remove('hidden');},700);
  }catch(err){
    console.error(err);showMsg(msgId,'حدث خطأ أثناء الحفظ. حاول مرة أخرى.','error');
  }
}

window.saveBio=function(){saveField({bio:document.getElementById('input-bio').value.trim()},'bio-message','bio');};
window.saveContact=function(){
  const stateSel=document.getElementById('input-state');const citySel=document.getElementById('input-city');
  saveField({
    contact:{phone:document.getElementById('input-phone').value.trim(),location:{state:stateSel?stateSel.value:'',city:citySel?citySel.value:'',area:profileData.contact?.location?.area||null}},
    links:{...(profileData.links||{}),linkedin:document.getElementById('input-linkedin').value.trim()}
  },'contact-message','contact');
};
window.saveJobStatus=function(v){saveField({jobStatus:v},'jobstatus-message',null);};
window.saveSkills=function(){
  const skills=Array.from(document.querySelectorAll('#skills-input-container .skill-input')).map(i=>i.value.trim()).filter(Boolean);
  saveField({skills,experience:document.getElementById('input-experience').value},'skills-message','skills');
};
window.saveLanguages=function(){
  const languages=Array.from(document.querySelectorAll('#languages-input-container>div')).map(row=>({
    name:row.querySelector('.lang-name')?.value.trim()||'',
    level:row.querySelector('.lang-level')?.value||'متوسط'
  })).filter(l=>l.name);
  saveField({languages},'languages-message','languages');
};
window.saveWorkExp=function(){
  const workExperience=Array.from(document.querySelectorAll('#workexp-input-container>div')).map(row=>({
    title:row.querySelector('.we-title')?.value.trim()||'',
    company:row.querySelector('.we-company')?.value.trim()||'',
    duration:row.querySelector('.we-duration')?.value.trim()||'',
    description:row.querySelector('.we-description')?.value.trim()||''
  })).filter(w=>w.title||w.company);
  saveField({workExperience},'workexp-message','workexp');
};
window.saveEducation=function(){
  const education=Array.from(document.querySelectorAll('#education-input-container>div')).map(row=>({
    degree:row.querySelector('.ed-degree')?.value.trim()||'',
    institution:row.querySelector('.ed-institution')?.value.trim()||'',
    year:row.querySelector('.ed-year')?.value.trim()||''
  })).filter(e=>e.degree||e.institution);
  saveField({education},'education-message','education');
};
window.saveCerts=function(){
  const certifications=Array.from(document.querySelectorAll('#certs-input-container>div')).map(row=>({
    name:row.querySelector('.cert-name')?.value.trim()||'',
    issuer:row.querySelector('.cert-issuer')?.value.trim()||'',
    year:row.querySelector('.cert-year')?.value.trim()||'',
    url:row.querySelector('.cert-url')?.value.trim()||''
  })).filter(c=>c.name);
  saveField({certifications},'certs-message','certs');
};
window.saveLinks=function(){saveField({links:{...(profileData.links||{}),cv:document.getElementById('input-cv').value.trim()}},'links-message','links');};

window.saveBasicInfo=async function(){
  const name=document.getElementById('input-name').value.trim();
  const headline=document.getElementById('input-headline').value.trim();
  if(!name){showMsg('basic-message','يرجى إدخال الاسم الكامل.','error');return;}
  try{await updateProfile(currentUser,{displayName:name});await saveField({name,headline},'basic-message',null);}
  catch(err){showMsg('basic-message','حدث خطأ أثناء الحفظ.','error');}
};

window.savePassword=async function(){
  const current=document.getElementById('input-current-password').value;
  const next=document.getElementById('input-new-password').value;
  const confirm=document.getElementById('input-confirm-password').value;
  if(!current||!next){showMsg('password-message','يرجى تعبئة جميع الحقول.','error');return;}
  if(next.length<6){showMsg('password-message','كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.','error');return;}
  if(next!==confirm){showMsg('password-message','كلمة المرور الجديدة وتأكيدها غير متطابقين.','error');return;}
  const btn=document.getElementById('save-password-btn');if(!btn)return;
  const original=btn.innerHTML;btn.disabled=true;btn.innerHTML='<span class="loading-spinner"></span> جاري التحديث...';
  try{
    const credential=EmailAuthProvider.credential(currentUser.email,current);
    await reauthenticateWithCredential(currentUser,credential);
    await updatePassword(currentUser,next);
    showMsg('password-message','تم تحديث كلمة المرور بنجاح.','success');
    document.getElementById('input-current-password').value='';
    document.getElementById('input-new-password').value='';
    document.getElementById('input-confirm-password').value='';
  }catch(err){
    let msg='حدث خطأ أثناء تحديث كلمة المرور.';
    if(err.code==='auth/wrong-password'||err.code==='auth/invalid-credential')msg='كلمة المرور الحالية غير صحيحة.';
    showMsg('password-message',msg,'error');
  }finally{btn.disabled=false;btn.innerHTML=original;}
};

window.saveNotifications=function(){
  saveField({
    notificationSettings:{
      emailNotifications:document.getElementById('notif-email')?.checked??true,
      jobAlerts:document.getElementById('notif-jobalerts')?.checked??true,
      messageNotifications:document.getElementById('notif-messages')?.checked??true,
      applicationUpdates:document.getElementById('notif-applications')?.checked??true
    }
  },'notifications-message',null);
};

// ====== Image Upload ======
async function uploadImage(file){
  const formData=new FormData();
  formData.append('file',file);
  formData.append('upload_preset',CLOUDINARY_UPLOAD_PRESET);
  const res=await fetch(CLOUDINARY_URL,{method:'POST',body:formData});
  if(!res.ok)throw new Error('upload failed');
  const data=await res.json();
  if(!data.secure_url)throw new Error('no url');
  return data.secure_url;
}

window.triggerCoverUpload=function(){document.getElementById('cover-input').click();};
document.getElementById('cover-input').addEventListener('change',async(e)=>{
  const file=e.target.files[0];if(!file)return;
  showMsg('header-message','جاري رفع صورة الغلاف...','success');
  try{const url=await uploadImage(file);await saveField({coverPhotoUrl:url},'header-message',null);}
  catch(err){showMsg('header-message','تعذر رفع الصورة. تأكد من الإنترنت.','error');}
  e.target.value='';
});

window.triggerAvatarUpload=function(){document.getElementById('avatar-input').click();};
document.getElementById('avatar-input').addEventListener('change',async(e)=>{
  const file=e.target.files[0];if(!file)return;
  showMsg('header-message','جاري رفع الصورة الشخصية...','success');
  try{
    const url=await uploadImage(file);
    const updates=userRole==='employer'?{companyInfo:{...(profileData.companyInfo||{}),logoUrl:url}}:{profileImageUrl:url};
    await saveField(updates,'header-message',null);
  }catch(err){showMsg('header-message','تعذر رفع الصورة. تأكد من الإنترنت.','error');}
  e.target.value='';
});

window.handlePortfolioUpload=async function(input){
  const files=Array.from(input.files||[]);if(!files.length)return;
  showMsg('portfolio-message','جاري رفع الصور...','success');
  try{
    const urls=await Promise.all(files.map(f=>uploadImage(f)));
    const previousWorksUrls=[...(profileData.previousWorksUrls||[]),...urls];
    await saveField({previousWorksUrls},'portfolio-message',null);
  }catch(err){showMsg('portfolio-message','تعذر رفع بعض الصور. حاول مرة أخرى.','error');}
  input.value='';
};

window.removeWork=async function(index){
  const urls=[...(profileData.previousWorksUrls||[])];
  urls.splice(index,1);
  await saveField({previousWorksUrls:urls},'portfolio-message',null);
};

// ====== Start ======
init();