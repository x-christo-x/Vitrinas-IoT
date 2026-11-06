import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
    apiKey: "AIzaSyDDsKyWSQviJhmqGmoUlKgmkP5HzjIkoGU",
    authDomain: "vitrina-ba1cd.firebaseapp.com",
    projectId: "vitrina-ba1cd",
    storageBucket: "vitrina-ba1cd.firebasestorage.app",
    messagingSenderId: "548969607292",
    appId: "1:548969607292:web:8ec9c8f5df6c88195119f9"
};

// Inicialización de Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

