// auth.js
import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  reload
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export let userRole = "";
export let isEmployer = false;

export async function handleRegisterStep1() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirmPassword").value;

  if (password !== confirm) {
    showMessage("كلمة المرور غير متطابقة", "error");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);

    userRole = document.getElementById("role").value;
    isEmployer = userRole === "employer";

    document.getElementById("verificationEmailDisplay").textContent = email;
    showStep(2);
  } catch (e) {
    showMessage(e.message, "error");
  }
}

export async function confirmEmailVerification() {
  const user = auth.currentUser;
  if (!user) return;

  await reload(user);
  if (!user.emailVerified) {
    showMessage("يرجى توثيق الإيميل أولاً", "error");
    return;
  }

  showStep(3);
}