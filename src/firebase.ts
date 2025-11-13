import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAl1mllYr63-E-y7G3g86edck6S9jm7Qqc",
  authDomain: "planer-8edbd.firebaseapp.com",
  projectId: "planer-8edbd",
  storageBucket: "planer-8edbd.firebasestorage.app",
  messagingSenderId: "102757281956",
  appId: "1:102757281956:web:f38d558f0c6d570435f631"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

