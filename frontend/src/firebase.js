import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFirestore, collection, addDoc, setDoc, serverTimestamp, doc, getDocs, query, where } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyCYf-xflkPk9u8tk2Dj104LCSQZfGLSc_0",
    authDomain: "versatilevertex-c982f.firebaseapp.com",
    projectId: "versatilevertex-c982f",
    storageBucket: "versatilevertex-c982f.firebasestorage.app",
    messagingSenderId: "691417436221",
    appId: "1:691417436221:web:d2a472262fa117058d1a54"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    connectStorageEmulator(storage, "localhost", 9199);
    connectFunctionsEmulator(functions, "localhost", 5001);
}

export { auth, db, storage, collection, addDoc, setDoc, serverTimestamp, doc, getDocs, onAuthStateChanged, query, where, functions };