import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import path from "path";

function getAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // Use service account key file
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        path.join(process.cwd(), "attenance-pe-firebase-adminsdk-fbsvc-05b09c6c4f.json");

    return initializeApp({
        credential: cert(serviceAccountPath),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
}

export const adminAuth = getAuth(getAdminApp());
