import { initializeApp } from "firebase/app";
// Importamos las herramientas de caché
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAKhewBO7qI8imJAOC0GNjxyZXnXKzW_nE",
    authDomain: "obsiappbase.firebaseapp.com",
    projectId: "obsiappbase",
    storageBucket: "obsiappbase.appspot.com",
    messagingSenderId: "1055119037026",
    appId: "1:1055119037026:web:24bbc4d1a1a58eab79773b",
    measurementId: "G-YMNZYEYL93"
};

console.log("ID del Proyecto detectado:", firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services con Caché Persistente (Acelerador de carga)
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
export const auth = getAuth(app);

// Initialize Analytics
export let analytics: any = null;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export default app;