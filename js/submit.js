// submit.js
import { db, auth } from "./firebase-config.js";
import { userRole } from "./auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CLOUDINARY_NAME = "dbmjg23hl";
const PRESET = "Companies_emploies";

async function uploadFile(file) {
  if (!file) return null;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/auto/upload`, {
    method: "POST",
    body: fd
  });

  const data = await res.json();
  return data.secure_url || null;
}

export async function submitFinalData(e) {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return;

  try {
    let data = {
      uid: user.uid,
      email: user.email,
      role: userRole,
      createdAt: serverTimestamp(),
      profileCompleted: true
    };

    const collection = userRole === "employee" ? "employees" : "employers";
    await setDoc(doc(db, collection, user.uid), data);

    showMessage("تم إنشاء الحساب بنجاح", "success");
  } catch (err) {
    showMessage("فشل حفظ البيانات", "error");
  }
}