// Configuración modular de Firebase (SDK v11 / v12)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    onSnapshot, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { 
    getDatabase, 
    ref, 
    set, 
    onValue, 
    update 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

// Credenciales del proyecto Firebase proporcionadas
export const firebaseConfig = {
    apiKey: "AIzaSyDDsKyWSQviJhmqGmoUlKgmkP5HzjIkoGU",
    authDomain: "vitrina-ba1cd.firebaseapp.com",
    projectId: "vitrina-ba1cd",
    storageBucket: "vitrina-ba1cd.firebasestorage.app",
    messagingSenderId: "548969607292",
    appId: "1:548969607292:web:8ec9c8f5df6c88195119f9"
};

// Inicialización de la App de Firebase
export const app = initializeApp(firebaseConfig);

// Inicialización de Servicios
export const firestore = getFirestore(app);
export const rtdb = getDatabase(app);

// Configuración general del dispositivo Vitrina
export const VITRINA_CONFIG = {
    // ID único de esta vitrina (puede sobreescribirse por parámetro URL: ?id=vitrina_02)
    vitrinaId: new URLSearchParams(window.location.search).get("id") || "vitrina_01",
    location: "Acceso Principal - Laboratorio IoT",
    qrRefreshIntervalSecs: 30,
    // Modo de base de datos preferido: 'firestore' o 'rtdb'
    dbMode: "firestore"
};

