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

    // Reordered nav items to make space for the FAB in the center
    const navItems = [
        { icon: Home, label: "Home", href: `/dashboard?role=${role}`, active: pathname === "/dashboard" },
        { icon: Activity, label: "Activity", href: `/dashboard/activity?role=${role}`, active: pathname.includes("activity") },
        { isSeparator: true }, // Spacer for FAB
        { icon: MapIcon, label: "Map", href: `/dashboard/map?role=${role}`, active: pathname.includes("map") },
        { icon: User, label: "Profile", href: `/dashboard/profile?role=${role}`, active: pathname.includes("profile") },
    ];

    return (
        <div className="absolute bottom-0 w-full left-1/2 -translate-x-1/2 max-w-[430px] z-[60]">
            {/* The Floating Action Button (FAB) */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-6 flex justify-center z-20">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCaptureClick}
                    className="relative flex items-center justify-center w-[58px] h-[58px] rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-white shadow-[0_8px_20px_-4px_rgba(59,130,246,0.6)] outline-none ring-4 ring-[#F4F7FB]"
                    aria-label="Submit Deal"
                >
                    <div className="absolute inset-0 rounded-full border border-white/20" />
                    {/* Continuous subtle pulse ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-[#3B82F6]/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] pointer-events-none" />
                    <Camera className="w-[26px] h-[26px]" strokeWidth={2} />
                </motion.button>
            </div>

            {/* Background of the bottom nav */}
            <div className="bg-white border-t border-slate-100 rounded-t-[20px] shadow-[0_-4px_24px_-8px_rgba(15,23,42,0.08)] pb-safe pt-2 px-6 relative z-10">
                <div className="flex justify-between items-center h-[60px] pb-1">
                    {navItems.map((item, idx) => {
                        if (item.isSeparator) {
                            return <div key={`sep-${idx}`} className="w-14" />; // Empty space for the center FAB
                        }
                        return (
                            <Link
                                key={idx}
                                href={item.href || '#'}
                                className="flex flex-col items-center justify-center min-w-[3.5rem] flex-1 group"
                            >
                                <motion.div 
                                    whileTap={{ scale: 0.9 }}
                                    className="flex flex-col items-center gap-1"
                                >
                                    {item.icon && (
                                        <item.icon 
                                            className={`w-[22px] h-[22px] transition-colors duration-200 ${
                                                item.active ? "text-[#3B82F6] stroke-[2.5]" : "text-[#64748B] group-hover:text-slate-800 stroke-2"
                                            }`} 
                                        />
                                    )}
                                    <span 
                                        className={`text-[10px] font-[600] tracking-wide transition-colors duration-200 ${
                                            item.active ? "text-[#3B82F6]" : "text-[#64748B] group-hover:text-slate-800"
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
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
        <div className="flex flex-col flex-1 bg-slate-900 relative h-[100dvh] overflow-hidden">
            {/* The mobile container - Center it on desktop, full width on mobile */}
            <div className="w-full max-w-[430px] mx-auto h-full flex flex-col relative bg-[#F4F7FB] shadow-[0_0_40px_rgba(0,0,0,0.1)]">
                
                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar pb-[90px]">
                    {children}
                </div>
                
                {/* Bottom Navigation */}
                <Suspense fallback={null}>
                    <BottomNavContent onCaptureClick={() => setCaptureModalOpen(true)} />
                </Suspense>

                {/* Modals overlay inside the mobile container */}
                <GlobalCaptureModal isOpen={isCaptureModalOpen} onClose={() => setCaptureModalOpen(false)} />
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, employeeData } = useAuth();
    const employeeId = employeeData?.id || user?.uid || "unknown";
    const employeeRole = employeeData?.role || "office";

    return (
        <LocationBlocker employeeId={employeeId} employeeRole={employeeRole}>
            <LayoutContent>{children}</LayoutContent>
        </LocationBlocker>
    );
}
