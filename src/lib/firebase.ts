import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache, setLogLevel } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

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

// Initialize Firebase (singleton)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore — persistent cache is browser-only (IndexedDB/LocalStorage)
// On the server (SSR/Node.js) we fall back to memory cache to avoid the error:
// "IndexedDB persistence is only available on platforms that support LocalStorage"
let db: ReturnType<typeof getFirestore>;

try {
    const isBrowser = typeof window !== "undefined";
    db = initializeFirestore(app, {
        localCache: isBrowser
            ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
            : memoryLocalCache(),
    });
} catch (e) {
    console.warn("Failed to initialize Firestore, falling back to default.", e);
    db = getFirestore(app);
}

// Suppress normal development warnings about IndexedDB primary leases
setLogLevel('error');

const auth = getAuth(app);
const rtdb = getDatabase(app);

// Exports as getter functions (used by firestore.ts and other consumers)
export function getDb() { return db; }
export function getFirebaseAuth() { return auth; }
export function getRtdb() { return rtdb; }
export function getFirebaseApp() { return app; }
