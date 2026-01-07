// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBsIaCjE7QOQ6QkhqhCIMA3sLdMvxBxPHk",
  authDomain: "shaglni-c64c0.firebaseapp.com",
  projectId: "shaglni-c64c0",
  storageBucket: "shaglni-c64c0.appspot.com",
  messagingSenderId: "768887356636",
  appId: "1:768887356636:web:11ec1d6991add3309c8819"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);