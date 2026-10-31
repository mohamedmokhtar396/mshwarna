import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  getFirestore
} from "firebase/firestore";

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
googleProvider.setCustomParameters({
  prompt: "select_account"
});

// Initialize Firestore with fast single-tab persistent local cache to prevent multi-tab Web Lock freezing on mobile browsers
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() })
  });
} catch {
  try {
    firestoreDb = getFirestore(app);
  } catch {
    firestoreDb = null;
  }
}

export const db = firestoreDb;

// Analytics runs non-blocking in background
if (typeof window !== "undefined") {
  isSupported().then((yes) => yes && getAnalytics(app)).catch(() => {});
}
