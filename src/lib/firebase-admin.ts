import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import path from "path";

function initAdminApp(): App | undefined {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            credential = cert(serviceAccount);
        } catch (error) {
            console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error);
            return undefined;
        }
    } else {
        // Local development fallback
        try {
            const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
                path.join(process.cwd(), "attenance-pe-firebase-adminsdk-fbsvc-05b09c6c4f.json");
            credential = cert(serviceAccountPath);
        } catch {
            return undefined;
        }
    }

    try {
        return initializeApp({
            credential,
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
    } catch {
        return undefined;
    }
}

// Initialize eagerly for fast runtime access
const adminApp = initAdminApp();
const _adminAuth: Auth | undefined = adminApp ? getAuth(adminApp) : undefined;

export const adminAuth: Auth = new Proxy({} as Auth, {
    get(_, prop) {
        if (!_adminAuth) throw new Error("Firebase Admin is not initialized.");
        return (_adminAuth as any)[prop];
    },
});
