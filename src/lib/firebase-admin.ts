import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import path from "path";

function getAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            // Fix Vercel's escaped newlines in the private key
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
            }
            credential = cert(serviceAccount);
        } catch (error) {
            console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error);
            throw error;
        }
    } else {
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
            path.join(process.cwd(), "attenance-pe-firebase-adminsdk-fbsvc-05b09c6c4f.json");
        credential = cert(serviceAccountPath);
    }

    return initializeApp({
        credential,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
}

// Lazy initialization — admin SDK is server-only and must not init during build
let _adminAuth: ReturnType<typeof getAuth> | null = null;
export function getAdminAuth() {
    if (!_adminAuth) _adminAuth = getAuth(getAdminApp());
    return _adminAuth;
}

// Backward-compatible export (used by API routes)
export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
    get(_, prop) {
        return (getAdminAuth() as any)[prop];
    },
});
