import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAT404j_qYiPYAJOojKwNdTUh1u5CnbM8c",
  authDomain: "mipyme-xml-generator.firebaseapp.com",
  projectId: "mipyme-xml-generator",
  storageBucket: "mipyme-xml-generator.firebasestorage.app",
  messagingSenderId: "886948431257",
  appId: "1:886948431257:web:33e54a03b9857ae4ebbf08",
  measurementId: "G-QC85EQXNPL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;