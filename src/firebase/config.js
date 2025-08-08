// firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validar que todas las variables de entorno estén presentes
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing Firebase environment variables:', missingVars);
  console.error('Please check your .env file and ensure all Firebase variables are set.');
  throw new Error(`Missing Firebase configuration: ${missingVars.join(', ')}`);
}

// Mostrar información del entorno (solo en desarrollo)
if (import.meta.env.DEV) {
  const instituciones = import.meta.env.VITE_INSTITUCION_NOMBRE || 'Desarrollo - MiPymes XML';
  console.log(`🏢 Institución: ${instituciones}`);
  console.log(`🔥 Firebase Project: ${firebaseConfig.projectId}`);
  console.log(`🌍 Environment: ${import.meta.env.MODE}`);
}

// Inicializar Firebase
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  
  if (import.meta.env.DEV) {
    console.log('✅ Firebase initialized successfully');
  }
} catch (error) {
  console.error('❌ Error initializing Firebase:', error);
  throw error;
}

// Funciones de utilidad para el entorno
export const getAppConfig = () => ({
  institucionNombre: import.meta.env.VITE_INSTITUCION_NOMBRE || 'MiPymes XML',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  firebaseProject: firebaseConfig.projectId
});

// Configuración de EmailJS
export const getEmailJSConfig = () => ({
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
});

export { db };
export default app;