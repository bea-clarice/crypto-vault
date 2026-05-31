import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDXpz5ckI8mNob2srVfjgxVZQkApL63RWI",
  authDomain: "crypto-vault-9f85c.firebaseapp.com",
  projectId: "crypto-vault-9f85c",
  storageBucket: "crypto-vault-9f85c.firebasestorage.app",
  messagingSenderId: "1011197409551",
  appId: "1:1011197409551:web:e1b75368159753792f667a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
