// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCn0rBJSrfLxgKVrsd_UpGEPUjcxbX0Xow",
    authDomain: "atmapravartak-sansthan-bhugoan.firebaseapp.com",
    projectId: "atmapravartak-sansthan-bhugoan",
    storageBucket: "atmapravartak-sansthan-bhugoan.firebasestorage.app",
    messagingSenderId: "575288625663",
    appId: "1:575288625663:web:fd72509062b4fabf26ffca",
    measurementId: "G-JT1BXKXBJ2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (optional)
let analytics;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

export { analytics };
export default app;
