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

function getFirebaseApp(): FirebaseApp {
    return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

// Lazy singletons — only initialized when first accessed at runtime
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _rtdb: Database | null = null;

export const db: Firestore = new Proxy({} as Firestore, {
    get(_, prop) {
        if (!_db) _db = getFirestore(getFirebaseApp());
        return (_db as any)[prop];
    },
});

export const auth: Auth = new Proxy({} as Auth, {
    get(_, prop) {
        if (!_auth) _auth = getAuth(getFirebaseApp());
        return (_auth as any)[prop];
    },
});

export const rtdb: Database = new Proxy({} as Database, {
    get(_, prop) {
        if (!_rtdb) _rtdb = getDatabase(getFirebaseApp());
        return (_rtdb as any)[prop];
    },
});

export default getFirebaseApp;

