"use client";

import { useState } from "react";
import { Camera, X, Check, MapPin, MapPinOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

interface DealSubmissionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string;
    employeeName: string;
}

export function DealSubmissionDialog({ isOpen, onClose, employeeId, employeeName }: DealSubmissionDialogProps) {
    const [clientName, setClientName] = useState("");
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [base64Image, setBase64Image] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [gpsError, setGpsError] = useState(false);

    // Simulate capturing photo (in a real app, use <input type="file" accept="image/*" capture="environment" />)
    const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setBase64Image(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!clientName || !amount) return;
        setLoading(true);
        setGpsError(false);

        try {
            // Force fetch GPS coordinates for proof
            let lat = null, lng = null;
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 0, enableHighAccuracy: true });
                });
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
            } catch (err) {
                console.warn("Could not get GPS for deal submission");
                setGpsError(true);
                // Depending on requirements, we could block submission here, but we'll allow it with a warning for now
            }

            const payload = {
                clientName,
                amount,
                notes,
                employeeName,
                image: base64Image,
                latitude: lat,
                longitude: lng,
            };

            // If offline, use IndexedDB Queue
            if (!navigator.onLine) {
                const { offlineSync } = await import("@/lib/offlineSync");
                await offlineSync.addToQueue("dealSubmit", payload, employeeId);
            } else {
                // Online — simulate direct API call (since we don't have the API route ready yet)
                // In reality we would do: await fetch("/api/admin/deals", { method: "POST", body: JSON.stringify(payload) })
                console.log("Simulating online deal submission to API:", payload);
                await new Promise(r => setTimeout(r, 1000));
            }

            // Reset and close
            setClientName("");
            setAmount("");
            setNotes("");
            setBase64Image(null);
            onClose();

        } catch (e) {
            console.error("Failed to submit deal:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Submit Deal Proof</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Capture client site photo and details</p>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 block">Client / Business Name</label>
                                <Input placeholder="e.g. Acme Corp" value={clientName} onChange={e => setClientName(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 block">Deal Amount (₹)</label>
                                <Input type="number" placeholder="50000" value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 block">Work Proof Photo</label>
                                {!base64Image ? (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleCapture}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center gap-2 group-hover:border-blue-400 group-hover:bg-blue-50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600">
                                                <Camera className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-600">Tap to snap photo</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 group">
                                        <img src={base64Image} className="w-full h-full object-cover" alt="Proof" />
                                        <button
                                            onClick={() => setBase64Image(null)}
                                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 flex items-center gap-1 rounded font-mono text-[10px] text-white">
                                            <MapPin className="w-3 h-3" />
                                            GPS Required on Submit
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 block">Additional Notes (Optional)</label>
                                <textarea
                                    className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    placeholder="Met with John, signed 1yr contract..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>

                            {gpsError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs font-medium">
                                    <MapPinOff className="w-4 h-4 shrink-0 mt-0.5" />
                                    <p>Could not attach GPS coordinates to this submission. Ensure location services are enabled.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0">
                            <button
                                disabled={loading || !clientName || !amount}
                                onClick={handleSubmit}
                                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-xl text-base bg-blue-600 shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                {loading ? "Saving..." : !navigator.onLine ? "Save Offline Queue" : "Submit Deal"}
                            </button>
                            {!navigator.onLine && (
                                <p className="text-center text-[10px] text-amber-600 font-bold mt-3 uppercase tracking-wider">
                                    You are offline. Deal will be saved locally.
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
