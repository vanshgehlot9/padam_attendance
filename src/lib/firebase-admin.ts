import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import path from "path";

function getAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // In Vercel, use the stringified JSON from environment variables
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            credential = cert(serviceAccount);
        } catch (error) {
            console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error);
            throw error;
        }
    } else {
        // Local development fallback
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
            path.join(process.cwd(), "attenance-pe-firebase-adminsdk-fbsvc-05b09c6c4f.json");
        credential = cert(serviceAccountPath);
    }

    return initializeApp({
        credential,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
}

// Lazy initialization — only runs at runtime, not during build
let _adminAuth: Auth | null = null;
export const adminAuth: Auth = new Proxy({} as Auth, {
    get(_, prop) {
        if (!_adminAuth) _adminAuth = getAuth(getAdminApp());
        return (_adminAuth as any)[prop];
    },
});
