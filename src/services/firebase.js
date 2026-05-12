import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBGKGkyK9aI9gmyZtRlhivvMT4KFayADxU",
  authDomain: "nexify-connect-prod.firebaseapp.com",
  projectId: "nexify-connect-prod",
  storageBucket: "nexify-connect-prod.firebasestorage.app",
  messagingSenderId: "1055135318628",
  appId: "1:1055135318628:web:70e36377ac5d3b92769571",
  measurementId: "G-Y2F59CGTV9"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, db, storage, googleProvider };
