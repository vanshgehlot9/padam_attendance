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

export const adminAuth = getAuth(getAdminApp());
