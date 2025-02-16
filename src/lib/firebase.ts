
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDIK6OL0zDd9RxSfa40R4hN4fJ_O5IHNAU",
  authDomain: "token-launcher-magic.firebaseapp.com",
  projectId: "token-launcher-magic",
  storageBucket: "token-launcher-magic.appspot.com",
  messagingSenderId: "205173481115",
  appId: "1:205173481115:web:c2b1911f0ca6535f2b343d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export the app instance if needed
export default app;
