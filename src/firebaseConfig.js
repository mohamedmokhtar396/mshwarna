import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyACL0Z82kRhbdcshcB40d6PEI6bmZWYGaM",
  authDomain: "gehaz-el3rosa.firebaseapp.com",
  projectId: "gehaz-el3rosa",
  storageBucket: "gehaz-el3rosa.firebasestorage.app",
  messagingSenderId: "848639592475",
  appId: "1:848639592475:web:522fe1b5819198f3e350be",
  measurementId: "G-VN82QDMLWB"
};

export const SUPER_ADMIN_EMAIL = "mohameddmm027@gmail.com";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Enable Firestore with offline persistence so it works seamlessly inside markets with weak signal
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

isSupported().then((yes) => yes && getAnalytics(app));
