import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración dinámica basada en variables de entorno (VITE)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validación para desarrollo
if (import.meta.env.DEV) {
  console.log('🔥 Conectando a Firebase:', firebaseConfig.projectId);
  console.log('🏢 Institución:', import.meta.env.VITE_INSTITUCION_NOMBRE || 'Desarrollo');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;