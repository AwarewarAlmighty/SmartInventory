// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAM_BjYMQq4-Jg0KjgRcR5AGymO8tMzZoU",
  authDomain: "inventory-management-elice.firebaseapp.com",
  projectId: "inventory-management-elice",
  storageBucket: "inventory-management-elice.firebasestorage.app",
  messagingSenderId: "190267342460",
  appId: "1:190267342460:web:7d67cdd734b0b6b787d3f9",
  measurementId: "G-3CKPHS8H1R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, analytics };