import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Lazy singletons — only initialized when first accessed at runtime
let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _rtdb: Database | null = null;

export function getFirebaseApp(): FirebaseApp {
    if (!_app) {
        _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    }
    return _app;
}

export function getDb(): Firestore {
    if (!_db) _db = getFirestore(getFirebaseApp());
    return _db;
}

export function getFirebaseAuth(): Auth {
    if (!_auth) _auth = getAuth(getFirebaseApp());
    return _auth;
}

export function getRtdb(): Database {
    if (!_rtdb) _rtdb = getDatabase(getFirebaseApp());
    return _rtdb;
}
