import { openDB, DBSchema, IDBPDatabase } from "idb";

export type SyncOperationType = "punchIn" | "punchOut" | "dealSubmit" | "heartbeat";

export interface SyncRecord {
    id?: number; // auto-increment primary key
    type: SyncOperationType;
    payload: any;
    timestamp: number;
    employeeId: string;
    retryCount: number;
}

interface OfflineDB extends DBSchema {
    syncQueue: {
        key: number;
        value: SyncRecord;
        indexes: { "by-timestamp": number };
    };
}

class OfflineSyncManager {
    private dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;
    private isSyncing = false;

    constructor() {
        if (typeof window !== "undefined") {
            this.dbPromise = openDB<OfflineDB>("PadamOfflineSync", 1, {
                upgrade(db) {
                    const store = db.createObjectStore("syncQueue", {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    store.createIndex("by-timestamp", "timestamp");
                },
            });

            // Start sync automatically on reconnect
            window.addEventListener("online", () => this.syncNow());
        }
    }

    /** Add a new operation to the offline IndexedDB queue */
    async addToQueue(type: SyncOperationType, payload: any, employeeId: string) {
        if (!this.dbPromise) return;
        const db = await this.dbPromise;

        await db.add("syncQueue", {
            type,
            payload,
            timestamp: Date.now(),
            employeeId,
            retryCount: 0,
        });

        // If online when added unexpectedly, try syncing immediately
        if (navigator.onLine) {
            this.syncNow();
        }
    }

    /** Get the current count of pending items */
    async getPendingCount(): Promise<number> {
        if (!this.dbPromise) return 0;
        const db = await this.dbPromise;
        return db.count("syncQueue");
    }

    /** Process the queue in the background */
    async syncNow() {
        if (!this.dbPromise || !navigator.onLine || this.isSyncing) return;
        this.isSyncing = true;

        try {
            const db = await this.dbPromise;
            const tx = db.transaction("syncQueue", "readonly");
            const records = await tx.objectStore("syncQueue").getAll();

            if (records.length === 0) {
                this.isSyncing = false;
                return;
            }

            console.log(`[Offline Sync] Processing ${records.length} pending items...`);

            const { doc, setDoc, updateDoc, addDoc, collection } = await import("firebase/firestore");
            const { getDb } = await import("@/lib/firebase");
            const dbRef = getDb();

            for (const record of records) {
                try {
                    // Process based on type
                    if (record.type === "punchIn") {
                        const attDocId = `${record.employeeId}_${record.payload.date}`;
                        await setDoc(doc(dbRef, "attendance", attDocId), record.payload.data, { merge: true });
                    }
                    else if (record.type === "punchOut") {
                        const attDocId = `${record.employeeId}_${record.payload.date}`;
                        await updateDoc(doc(dbRef, "attendance", attDocId), record.payload.data);
                        // If early leave alert is included
                        if (record.payload.alertData) {
                            await addDoc(collection(dbRef, "alerts"), record.payload.alertData);
                        }
                    }
                    else if (record.type === "dealSubmit") {
                        // For deals, we simulate an API call or direct firestore write
                        const formData = new FormData();
                        formData.append("amount", record.payload.amount);
                        formData.append("notes", record.payload.notes);
                        formData.append("employeeId", record.employeeId);
                        formData.append("employeeName", record.payload.employeeName);
                        formData.append("clientName", record.payload.clientName);
                        formData.append("latitude", record.payload.latitude);
                        formData.append("longitude", record.payload.longitude);

                        // Use fetch to hit the Next.js API route that handles Cloudinary + Firebase
                        // Note: If the file was large, it's safer to store base64 in IDB strings
                        const res = await fetch("/api/admin/deals", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                ...record.payload,
                                isOfflineSync: true,
                            })
                        });

                        if (!res.ok) throw new Error("Deal sync failed");
                    }

                    // Success — remove from IDB
                    const delTx = db.transaction("syncQueue", "readwrite");
                    if (record.id) {
                        await delTx.objectStore("syncQueue").delete(record.id);
                    }
                } catch (err) {
                    console.error(`[Offline Sync] Failed to sync record ${record.id}:`, err);
                    // Increment retry
                    const updateTx = db.transaction("syncQueue", "readwrite");
                    record.retryCount += 1;
                    if (record.id) {
                        await updateTx.objectStore("syncQueue").put(record);
                    }
                }
            }
        } catch (globalErr) {
            console.error("[Offline Sync] Fatal error during sync:", globalErr);
        } finally {
            this.isSyncing = false;
        }
    }
}

// Export singleton instance
export const offlineSync = new OfflineSyncManager();
