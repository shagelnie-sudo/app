/* خبير البرمجة: تم إعداد هذا الملف ليعمل كـ Module.
   تأكد من ربطه في HTML هكذا: <script type="module" src="script.js"></script>
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, reload, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBsIaCjE7QOQ6QkhqhCIMA3sLdMvxBxPHk",
    authDomain: "shaglni-c64c0.firebaseapp.com",
    projectId: "shaglni-c64c0",
    storageBucket: "shaglni-c64c0.appspot.com", 
    messagingSenderId: "768887356636",
    appId: "1:768887356636:web:11ec1d6991add3309c8819", 
    measurementId: "G-98GQGZS09W" 
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 2. Cloudinary Data
const CLOUDINARY_CLOUD_NAME = "dbmjg23hl"; 
const CLOUDINARY_UPLOAD_PRESET = "Companies_emploies";

// 3. Application State
let currentStep = 1;
let isEmployerFlow = false;
let userRoleAfterStep1 = ''; 

// 4. Constants
const sudanLocations = {
    "الخرطوم": {
        "الخرطوم": ["السجانة", "العمارات", "الرياض", "الطائف", "المنشية", "بري", "الخرطوم 2", "الخرطوم 3", "السوق العربي", "حي المطار", "الشجرة", "جبرة", "الأزهري", "الصحافة", "الكلاكلة"],
        "أم درمان": ["العباسية", "بيت المال", "الملازمين", "أبو روف", "الموردة", "الهاشماب", "العرضة", "ود نوباوي", "حي العرب", "الشهداء", "المسالمة", "بانت", "الثورة", "الحتانة", "الفتيحاب", "الواحة", "أم بدة", "السلام", "الفتح", "دار السلام"],
        "الخرطوم بحري": ["كافوري", "شمبات", "الشعبية", "الدناقلة", "الخوجلاب", "الصافية", "كوبر", "الحلفايا", "الدروشاب", "الحاج يوسف", "سوبا شرق", "العيلفون", "أم ضوا بان", "أم دوم", "الشقلة", "النصر", "الوادي الأخضر"],
        "شرق النيل": ["شرق النيل"], "جبل أولياء": ["جبل أولياء"], "كرري": ["كرري"]
    },
    "الجزيرة": ["ود مدني", "الحصاحيصا", "المناقل", "رفاعة"],
    "البحر الأحمر": ["بورتسودان", "سواكن", "طوكر", "هيا"],
    "كسلا": ["كسلا", "حلفا الجديدة", "القضارف", "همشكوريب"],
    "القضارف": ["القضارف", "الفشقة", "القلابات", "الرهد"],
    "سنار": ["سنار", "سنجة", "التينا", "الدندر"],
    "النيل الأبيض": ["ربك", "كوستي", "الدويّم", "تندلتي"],
    "النيل الأزرق": ["الدمازين", "الروصيرص", "الكرمك", "باو"],
    "شمال كردفان": ["الأبيض", "أم روابة", "بارا", "سودري"],
    "جنوب كردفان": ["كادقلي", "تلودي", "العباسية", "أبو جبيهة"],
    "غرب كردفان": ["الفولة", "لقاوة", "الميرم", "أبو زبد"],
    "الشمالية": ["دنقلا", "حلفا", "مروي", "القولد"],
    "نهر النيل": ["الدامر", "عطبرة", "شندي", "بربر"],
    "شمال دارفور": ["الفاشر", "كبكابية", "المالحة", "كتم"],
    "جنوب دارفور": ["نيالا", "الضعين", "رهيد البردي", "كاس"],
    "غرب دارفور": ["الجنينة", "سرف عمرة", "كرينك", "كلبس"],
    "وسط دارفور": ["زالنجي", "وداد", "مكجر"],
    "شرق دارفور": ["الضعين", "عديلة", "أبو كارنكا", "ياسين"],
};

// 5. Utility Functions
function showMessage(msg, type) {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;
    messageDiv.textContent = msg;
    messageDiv.className = `message ${type}-message`;
    messageDiv.classList.remove('hidden');
}

function togglePasswordVisibility(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(iconId);
    if (!passwordInput) return;
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    toggleIcon.classList.toggle('fa-eye');
    toggleIcon.classList.toggle('fa-eye-slash');
}

function validatePassword() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return false;
    const password = passwordInput.value;
    const checks = {
        minLength: password.length >= 6,
        hasUpper: /[A-Z]/.test(password),
        hasLower: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password)
    };
    const requirements = {
        minLength: document.getElementById('min-length'),
        hasUpper: document.getElementById('has-upper'),
        hasLower: document.getElementById('has-lower'),
        hasNumber: document.getElementById('has-number'),
    };
    for (const key in checks) {
        const element = requirements[key];
        if (element) {
            if (checks[key]) {
                element.classList.add('valid');
                element.querySelector('i').className = 'fas fa-check-circle ml-2 text-green-500';
            } else {
                element.classList.remove('valid');
                element.querySelector('i').className = 'fas fa-times-circle ml-2 text-red-500';
            }
        }
    }
    return Object.values(checks).every(Boolean);
}

// 6. Navigation Functions
function updateStepIndicator() {
    const steps = document.querySelectorAll('.step');
    steps.forEach(stepEl => stepEl.classList.remove('active'));

    const ind5 = document.getElementById('stepIndicator5');
    const ind6 = document.getElementById('stepIndicator6');
    const ind7 = document.getElementById('stepIndicator7');

    if (ind5) ind5.classList.add('hidden');
    if (ind6) ind6.classList.add('hidden');
    if (ind7) ind7.classList.add('hidden'); 

    if (isEmployerFlow) {
        if (ind5) ind5.classList.remove('hidden');
        if (ind6) ind6.classList.remove('hidden');
        if (ind7) ind7.classList.remove('hidden'); 
    } else {
        if (ind5) ind5.classList.remove('hidden'); 
    }

    for (let i = 1; i <= currentStep; i++) {
        const indicator = document.getElementById(`stepIndicator${i}`);
        if (indicator) indicator.classList.add('active');
    }
}

function showStep(stepNumber, flow) {
    const stepId = flow === 'employer' ? `step${stepNumber}-employer` : `step${stepNumber}-employee`;
    const allSteps = document.querySelectorAll('.form-card');
    allSteps.forEach(el => el.classList.add('hidden'));

    if (stepNumber === 2) {
        document.getElementById('step2-verification').classList.remove('hidden');
    } else if (stepNumber === 1) {
        document.getElementById('step1').classList.remove('hidden');
    } else {
        const target = document.getElementById(stepId);
        if (target) target.classList.remove('hidden');
    }

    currentStep = stepNumber;
    updateStepIndicator();
}

async function handleStep1Next() {
    const currentStepElementId = 'step1';
    const step1El = document.getElementById(currentStepElementId);
    const formInputs = step1El.querySelectorAll('input:required, select:required');
    let isStepValid = true;
    formInputs.forEach(input => {
        if (!input.checkValidity()) {
            input.reportValidity();
            isStepValid = false;
        }
    });
    if (!isStepValid) return;

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (password !== confirmPassword) {
        showMessage('كلمة المرور وتأكيدها غير متطابقين.', 'error');
        return;
    }
    if (!validatePassword()) {
        showMessage('كلمة المرور لا تستوفي جميع المتطلبات.', 'error');
        return;
    }

    const email = document.getElementById('email').value;
    userRoleAfterStep1 = document.getElementById('role').value;
    isEmployerFlow = (userRoleAfterStep1 === 'employer');

    const nextBtn = document.getElementById('nextBtn1');
    nextBtn.disabled = true;
    const originalText = nextBtn.textContent;
    nextBtn.textContent = 'جاري التسجيل...';

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendEmailVerification(user);
        document.getElementById('verificationEmailDisplay').textContent = email;
        step1El.classList.add('hidden');
        showStep(2, null); 
        showMessage('تم إنشاء حسابك! تم إرسال رابط توثيق إلى بريدك الإلكتروني.', 'success');
    } catch (error) {
        console.error("خطأ في التسجيل:", error);
        showMessage('حدث خطأ: ' + error.message, 'error');
    } finally {
        nextBtn.disabled = false;
        nextBtn.textContent = originalText;
    }
}

function nextStep(step) {
    if (step === 1) {
        handleStep1Next();
        return;
    }

    const stepIdSuffix = isEmployerFlow ? 'employer' : 'employee';
    const currentStepElementId = `step${step}-${stepIdSuffix}`;
    const currentEl = document.getElementById(currentStepElementId);

    const formInputs = currentEl.querySelectorAll('input:required, select:required, textarea:required');
    let isStepValid = true;
    formInputs.forEach(input => {
        if (!input.checkValidity()) {
            input.reportValidity();
            isStepValid = false;
        }
    });
    if (!isStepValid) return;

    currentEl.classList.add('hidden');

    if (isEmployerFlow && step === 5) {
        document.getElementById('step7-employer').classList.remove('hidden');
        currentStep = 7;
    } else {
        const nextStepElementId = isEmployerFlow ? `step${step + 1}-employer` : `step${step + 1}-employee`;
        document.getElementById(nextStepElementId).classList.remove('hidden');
        currentStep++;
    }
    updateStepIndicator();
}

function prevStep(step) {
    const stepIdSuffix = isEmployerFlow ? 'employer' : 'employee';
    const currentStepElementId = (step === 2) ? 'step2-verification' : (step === 7 && isEmployerFlow) ? 'step7-employer' : `step${step}-${stepIdSuffix}`;

    let prevStepElementId;
    if (step === 3) {
        prevStepElementId = 'step2-verification';
    } else if (step === 7 && isEmployerFlow) {
        prevStepElementId = 'step5-employer';
    } else {
        prevStepElementId = `step${step - 1}-${stepIdSuffix}`;
    }

    document.getElementById(currentStepElementId).classList.add('hidden');
    document.getElementById(prevStepElementId).classList.remove('hidden');

    if (step === 7 && isEmployerFlow) {
        currentStep = 5;
    } else {
        currentStep--;
    }
    updateStepIndicator();
}

// 7. File Upload & Submission
async function uploadFile(file) {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, { method: 'POST', body: formData });
    const data = await response.json();
    return data.secure_url;
}

async function handleDataSubmission(event) {
    event.preventDefault();
    const submitButton = event.target;
    submitButton.disabled = true;
    const user = auth.currentUser;
    const role = userRoleAfterStep1;
    const mainForm = document.getElementById('unifiedForm');
    const formInputs = mainForm.elements;

    try {
        let userData;
        if (role === 'employee') {
            const profileImageUrl = await uploadFile(formInputs['profilePhoto'].files[0]);
            const previousWorksUrls = await Promise.all(Array.from(formInputs['previousWorks'].files).map(file => uploadFile(file)));
            const skills = Array.from(document.querySelectorAll('.skill-input')).map(input => input.value.trim()).filter(s => s !== '');

            userData = {
                name: formInputs['name'].value,
                email: user.email,
                role: role,
                isProfileComplete: true,
                createdAt: serverTimestamp(),
                headline: formInputs['headline'].value,
                bio: formInputs['bio'].value,
                profileImageUrl,
                contact: { phone: formInputs['phone'].value, location: { state: formInputs['state'].value, city: formInputs['city'].value, area: formInputs['area'].value } },
                skills,
                experience: formInputs['experience'].value,
                jobStatus: formInputs['jobStatus'].value,
                links: { cv: formInputs['cvUrl'].value, linkedin: formInputs['linkedinUrl'].value },
                previousWorksUrls,
            };
        } else {
            const companyLogoUrl = await uploadFile(formInputs['companyLogo'].files[0]);
            const commercialRegisterUrl = await uploadFile(formInputs['commercialRegister'].files[0]);
            const companyPhotosUrls = await Promise.all(Array.from(formInputs['companyPhotos'].files).map(file => uploadFile(file)));

            userData = {
                name: formInputs['name'].value,
                email: user.email,
                role: role,
                isProfileComplete: true,
                createdAt: serverTimestamp(),
                companyInfo: {
                    name: formInputs['companyName'].value,
                    email: formInputs['companyEmail'].value,
                    phone: formInputs['companyPhone'].value,
                    logoUrl: companyLogoUrl,
                    businessType: formInputs['businessType'].value,
                    description: formInputs['companyDescription'].value,
                    location: { state: formInputs['companyState'].value, city: formInputs['companyCity'].value, area: formInputs['companyArea'].value }
                },
                verification: { isVerified: !!commercialRegisterUrl, commercialRegisterUrl, companyPhotosUrls },
                subRole: formInputs['employerType'].value
            };
        }

        await setDoc(doc(db, role === 'employee' ? 'employees' : 'All_jops', user.uid), userData);
        await signOut(auth);
        window.location.href = "index.html";

    } catch (error) {
        console.error("Error saving data:", error);
        showMessage('حدث خطأ في حفظ البيانات.', 'error');
        submitButton.disabled = false;
    }
}

// 8. Location Handling
function populateLocations(stateSelect, citySelect, areaSelect, cityContainer, areaContainer) {
    stateSelect.addEventListener('change', function() {
        const selectedState = this.value;
        citySelect.innerHTML = '<option value="">اختر مدينة</option>';
        cityContainer.classList.add('hidden');
        if (selectedState && sudanLocations[selectedState]) {
            const cities = sudanLocations[selectedState];
            Object.keys(cities).forEach(city => {
                const option = document.createElement('option');
                option.value = city; option.textContent = city;
                citySelect.appendChild(option);
            });
            cityContainer.classList.remove('hidden');
        }
    });
    citySelect.addEventListener('change', function() {
        const selectedState = stateSelect.value;
        const selectedCity = this.value;
        areaSelect.innerHTML = '<option value="">اختر منطقة</option>';
        areaContainer.classList.add('hidden');
        if (sudanLocations[selectedState][selectedCity]) {
            sudanLocations[selectedState][selectedCity].forEach(area => {
                const option = document.createElement('option');
                option.value = area; option.textContent = area;
                areaSelect.appendChild(option);
            });
            areaContainer.classList.remove('hidden');
        }
    });
}

// 9. Initializing Events (Crucial for External Module)
document.addEventListener('DOMContentLoaded', () => {
    // Setup Locations
    const eState = document.getElementById('state');
    const eCity = document.getElementById('city');
    const eArea = document.getElementById('area');
    const emState = document.getElementById('companyState');
    const emCity = document.getElementById('companyCity');
    const emArea = document.getElementById('companyArea');

    if (eState) populateLocations(eState, eCity, eArea, document.getElementById('cityContainer'), document.getElementById('areaContainer'));
    if (emState) populateLocations(emState, emCity, emArea, document.getElementById('companyCityContainer'), document.getElementById('companyAreaContainer'));

    // Populate States
    const stateNames = Object.keys(sudanLocations);
    [eState, emState].forEach(select => {
        if (select) {
            stateNames.forEach(state => {
                const option = document.createElement('option');
                option.value = state; option.textContent = state;
                select.appendChild(option);
            });
        }
    });

    // Event Listeners for Buttons
    document.getElementById('togglePassword')?.addEventListener('click', () => togglePasswordVisibility('password', 'togglePassword'));
    document.getElementById('toggleConfirmPassword')?.addEventListener('click', () => togglePasswordVisibility('confirmPassword', 'toggleConfirmPassword'));
    document.getElementById('password')?.addEventListener('input', validatePassword);
    
    document.getElementById('role')?.addEventListener('change', (e) => {
        isEmployerFlow = (e.target.value === 'employer');
        updateStepIndicator();
    });

    document.getElementById('confirmVerificationBtn')?.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
            await reload(user); 
            if (user.emailVerified) {
                document.getElementById('step2-verification').classList.add('hidden');
                isEmployerFlow ? showStep(3, 'employer') : showStep(3, 'employee');
            } else {
                showMessage('لم يتم توثيق الإيميل بعد.', 'error');
            }
        } catch (e) { showMessage('خطأ في التحقق.', 'error'); }
    });

    // Buttons Actions
    document.getElementById('nextBtn1')?.addEventListener('click', () => nextStep(1));
    document.getElementById('nextBtn3-employee')?.addEventListener('click', () => nextStep(3));
    document.getElementById('nextBtn4-employee')?.addEventListener('click', () => nextStep(4));
    document.getElementById('nextBtn3-employer')?.addEventListener('click', () => nextStep(3));
    document.getElementById('nextBtn4-employer')?.addEventListener('click', () => nextStep(4));
    document.getElementById('nextBtn5-employer')?.addEventListener('click', () => nextStep(5));

    document.getElementById('prevBtn3-employee')?.addEventListener('click', () => prevStep(3));
    document.getElementById('prevBtn4-employee')?.addEventListener('click', () => prevStep(4));
    document.getElementById('prevBtn5-employee')?.addEventListener('click', () => prevStep(5));
    document.getElementById('prevBtn3-employer')?.addEventListener('click', () => prevStep(3));
    document.getElementById('prevBtn4-employer')?.addEventListener('click', () => prevStep(4));
    document.getElementById('prevBtn5-employer')?.addEventListener('click', () => prevStep(5));
    document.getElementById('prevBtn7-employer')?.addEventListener('click', () => prevStep(7)); 

    document.getElementById('submitBtn-employee')?.addEventListener('click', handleDataSubmission);
    document.getElementById('submitBtn-employer')?.addEventListener('click', handleDataSubmission);

    // Skills Container
    document.getElementById('skillsContainer')?.addEventListener('click', function(event) {
        if (event.target.closest('.add-skill-btn') && document.querySelectorAll('.skill-input').length < 6) {
            const html = `<div class="mb-4 flex items-center"><input type="text" name="skills[]" class="skill-input w-full pr-4 py-2 border border-gray-300 rounded-lg"><button type="button" class="remove-skill-btn mr-2 p-2 bg-red-100 text-red-600 rounded-lg"><i class="fas fa-minus"></i></button></div>`;
            this.insertAdjacentHTML('beforeend', html);
        }
        if (event.target.closest('.remove-skill-btn')) event.target.closest('.mb-4').remove();
    });

    // Initial View
    document.querySelectorAll('.form-card').forEach(el => el.classList.add('hidden'));
    document.getElementById('step1')?.classList.remove('hidden');
    updateStepIndicator();
});
