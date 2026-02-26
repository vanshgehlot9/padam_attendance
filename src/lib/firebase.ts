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

// Initialize eagerly at import time (fast!) but skip during build if env vars are missing
const isConfigured = !!firebaseConfig.apiKey;
const app: FirebaseApp | undefined = isConfigured
    ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
    : undefined;

// Pre-initialize singletons for fast runtime access
const _db: Firestore | undefined = app ? getFirestore(app) : undefined;
const _auth: Auth | undefined = app ? getAuth(app) : undefined;
const _rtdb: Database | undefined = app ? getDatabase(app) : undefined;

// Export getters that return the cached instances (never re-initialize)
export function getFirebaseApp(): FirebaseApp {
    if (!app) throw new Error("Firebase is not configured. Check your NEXT_PUBLIC_FIREBASE_* env vars.");
    return app;
}

export function getDb(): Firestore {
    if (!_db) throw new Error("Firestore is not initialized. Check your NEXT_PUBLIC_FIREBASE_* env vars.");
    return _db;
}

export function getFirebaseAuth(): Auth {
    if (!_auth) throw new Error("Firebase Auth is not initialized. Check your NEXT_PUBLIC_FIREBASE_* env vars.");
    return _auth;
}

export function getRtdb(): Database {
    if (!_rtdb) throw new Error("Realtime Database is not initialized. Check your NEXT_PUBLIC_FIREBASE_* env vars.");
    return _rtdb;
}
