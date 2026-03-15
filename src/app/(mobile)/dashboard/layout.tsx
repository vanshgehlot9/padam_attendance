"use client";

import { useState } from "react";
import { Home, Activity, Camera, MapIcon, User, X, MapPin, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { LocationBlocker } from "@/components/shared/LocationBlocker";
import { useAuth } from "@/components/providers/AuthProvider";

function BottomNavContent({ onCaptureClick }: { onCaptureClick: () => void }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const role = searchParams.get("role") || "office";

    const navItems = [
        { icon: Home, label: "Home", href: `/dashboard?role=${role}`, active: pathname === "/dashboard" },
        { icon: Activity, label: "Activity", href: `/dashboard/activity?role=${role}`, active: pathname.includes("activity") },
        { icon: Camera, label: "Capture", isPrimary: true },
        { icon: MapIcon, label: "Map", href: `/dashboard/map?role=${role}`, active: pathname.includes("map") },
        { icon: User, label: "Profile", href: `/dashboard/profile?role=${role}`, active: pathname.includes("profile") },
    ];

    return (
        <div className="absolute bottom-0 w-full bg-white border-t border-slate-100 pb-safe pt-2 px-6 z-[60]">
            <div className="flex justify-between items-center h-16 pb-2">
                {navItems.map((item, idx) => {
                    if (item.isPrimary) {
                        return (
                            <button
                                key={idx}
                                onClick={onCaptureClick}
                                className="relative -top-6 flex items-center justify-center w-14 h-14 bg-[#2563EB] text-white rounded-full shadow-[0_8px_20px_0_rgba(37,99,235,0.4)] hover:scale-105 transition-transform active:scale-95"
                                aria-label="Submit Deal"
                            >
                                <Camera className="w-6 h-6" />
                            </button>
                        );
                    }
                    return (
                        <Link
                            key={idx}
                            href={item.href || '#'}
                            className={`flex flex-col items-center gap-1 min-w-[3rem] ${item.active ? "text-[#2563EB]" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${item.active ? "stroke-[2.5]" : "stroke-2"}`} />
                            <span className={`text-[10px] font-medium ${item.active ? "text-[#2563EB]" : ""}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

function GlobalCaptureModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("0%");
    const [isSuccess, setIsSuccess] = useState(false);
    const [notes, setNotes] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
    const { user, employeeData } = useAuth();

    const accuracy = 12; // Will be replaced by live GPS accuracy from useLiveLocation

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show quick preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Compress image using Canvas
        const img = new Image();
        img.src = objectUrl;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 1000;
            const MAX_HEIGHT = 1000;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                // Compress to JPEG at 70% quality (results in KB instead of MB)
                canvas.toBlob(
                    (blob) => {
                        if (blob) setCompressedBlob(blob);
                    },
                    "image/jpeg",
                    0.7
                );
            }
        };
    };

    const uploadToCloudinary = async (blob: Blob): Promise<string> => {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            throw new Error("Cloudinary credentials missing. Please check .env.local");
        }

        const formData = new FormData();
        formData.append("file", blob, "deal_proof.jpg");
        formData.append("upload_preset", uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) throw new Error("Failed to upload image to Cloudinary");
        const data = await res.json();
        return data.secure_url;
    };

    const handleSubmit = async () => {
        if (!compressedBlob) {
            alert("Please capture a photo first.");
            return;
        }

        setIsSubmitting(true);
        setUploadProgress("Getting location...");
        try {
            // Get current position with fallback for low accuracy
            const getPosition = async (): Promise<GeolocationPosition> => {
                return new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        resolve,
                        (err) => {
                            if (err.code === 3) {
                                // High accuracy timed out, fallback to low accuracy
                                console.warn("High accuracy GPS timed out, falling back to low accuracy...");
                                navigator.geolocation.getCurrentPosition(
                                    resolve,
                                    reject,
                                    {
                                        enableHighAccuracy: false,
                                        timeout: 15000,
                                        maximumAge: 60000 // Accept 1-minute old cached location
                                    }
                                );
                            } else {
                                reject(err);
                            }
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 10000, // Wait 10 seconds for high accuracy
                            maximumAge: 10000, // 10 second old cache
                        }
                    );
                });
            };

            const position = await getPosition();

            setUploadProgress("Uploading photo...");
            const photoUrl = await uploadToCloudinary(compressedBlob);

            setUploadProgress("Saving deal...");
            const employeeId = employeeData?.id || user?.uid || "unknown";

            const res = await fetch("/api/tracking/submit-deal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employee_id: employeeId,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: Date.now(),
                    notes,
                    photo_url: photoUrl,
                }),
            });

            if (res.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    setIsSuccess(false);
                    setNotes("");
                    setPreviewUrl(null);
                    setCompressedBlob(null);
                    setUploadProgress("0%");
                    onClose();
                }, 2000);
            } else {
                const errData = await res.json();
                throw new Error(errData.error || "Backend save failed");
            }
        } catch (err: any) {
            console.error("Deal submission failed:", err);

            // Handle Geolocation Errors specifically
            if (err.code === 1) {
                alert("Location access denied. Please allow location permissions to submit deals.");
            } else if (err.code === 2) {
                alert("Location unavailable. Please check your GPS signal.");
            } else if (err.code === 3) {
                alert("Location request timed out. Please try again outside or check your signal.");
            } else {
                alert(`Error: ${err.message || "Failed to submit deal"}`);
            }
        } finally {
            setIsSubmitting(false);
            setUploadProgress("0%");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute bottom-0 left-0 w-full bg-white rounded-t-3xl p-6 z-[80] shadow-2xl pb-safe flex flex-col max-h-[90vh]"
                    >
                        {isSuccess ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring" }}
                                    className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6"
                                >
                                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                                </motion.div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Deal Captured!</h2>
                                <p className="text-slate-500">Your deal and geo-coordinates have been successfully logged.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-slate-900">Submit Deal Proof</h2>
                                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 active:scale-95">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-5 overflow-y-auto hide-scrollbar flex-1 pb-24">
                                    {/* Camera Input */}
                                    {previewUrl ? (
                                        <div className="w-full h-48 bg-slate-900 rounded-2xl relative overflow-hidden group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-90" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white font-semibold text-sm flex items-center gap-2">
                                                    <Camera className="w-4 h-4" /> Retake Photo
                                                </span>
                                            </div>
                                            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />

                                            {isSubmitting && (
                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center space-y-3 z-10 backdrop-blur-sm">
                                                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <p className="text-white text-xs font-bold font-mono bg-black/40 px-3 py-1 rounded-full">{uploadProgress}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full h-48 bg-slate-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 relative overflow-hidden group hover:border-[#2563EB] hover:bg-blue-50 transition-colors">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                                <Camera className="w-6 h-6 text-[#2563EB]" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">Tap to capture proof</span>
                                            <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Required</span>
                                            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10" />
                                        </div>
                                    )}

                                    {/* GPS Coordinates Section */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-[#2563EB]" />
                                                <span className="text-sm font-bold text-slate-700">Live GPS Status</span>
                                            </div>
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] uppercase font-bold rounded-md">
                                                High Accuracy
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">GPS coordinates will be captured automatically on submission</p>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1.5 ml-1">Notes (Optional)</label>
                                        <textarea
                                            className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                                            placeholder="Add any specific details about the visit..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-slate-50">
                                    <Button
                                        onClick={handleSubmit}
                                        className="w-full h-14 text-lg font-bold shadow-xl"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Processing..." : "Complete Submission"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
    const [isCaptureModalOpen, setCaptureModalOpen] = useState(false);

    return (
        <div className="flex flex-col flex-1 bg-slate-50 relative pb-[84px] overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
                {children}
            </div>
            <Suspense fallback={null}>
                <BottomNavContent onCaptureClick={() => setCaptureModalOpen(true)} />
            </Suspense>

            <GlobalCaptureModal isOpen={isCaptureModalOpen} onClose={() => setCaptureModalOpen(false)} />
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, employeeData } = useAuth();
    // Use authenticated employee ID, fallback to UID or a default
    const employeeId = employeeData?.id || user?.uid || "unknown";

    return (
        <LocationBlocker employeeId={employeeId}>
            <LayoutContent>{children}</LayoutContent>
        </LocationBlocker>
    );
}
