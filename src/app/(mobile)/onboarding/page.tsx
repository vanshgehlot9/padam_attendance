"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Camera, ShieldCheck, Building2, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const slideVariants = {
    initial: (direction: number) => ({
        x: direction > 0 ? "100%" : "-100%",
        opacity: 0,
        scale: 0.95
    }),
    animate: {
        x: 0,
        opacity: 1,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.8 }
    },
    exit: (direction: number) => ({
        x: direction < 0 ? "-100%" : "100%",
        opacity: 0,
        scale: 0.95,
        transition: { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.8 }
    })
};

const screens = [
    {
        id: 0,
        headline: "Smart Attendance",
        subtext: "Attendance automatically marks when you arrive at work. No manual check-in required.",
        cta: "Get Started",
        Illustration: () => (
            <div className="relative w-full h-full flex flex-col items-center justify-center pt-8">
                {/* Background Glass Card */}
                <motion.div 
                    initial={{ y: 20, opacity: 0, rotate: -6 }}
                    animate={{ y: 0, opacity: 1, rotate: -6, transition: { delay: 0.2, duration: 0.5, ease: "easeOut" } }}
                    className="absolute w-56 h-56 bg-white/50 backdrop-blur-xl border border-white/40 rounded-3xl shadow-[0_8px_32px_rgba(29,78,216,0.1)] flex items-center justify-center ml-4 mt-8"
                />
                
                {/* Foreground Hero Card */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1, transition: { delay: 0.1, duration: 0.5, ease: "easeOut" } }}
                    className="w-64 h-64 bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col items-center justify-center relative z-10 overflow-hidden"
                >
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-50/80 to-transparent" />
                    
                    <motion.div 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="relative w-full h-full flex flex-col items-center justify-center"
                    >
                        <Building2 className="w-20 h-20 text-slate-200 absolute bottom-6 right-8 opacity-60 blur-[0.5px]" />
                        
                        <div className="relative flex flex-col items-center z-10 -mt-4">
                            {/* Pulsing Pin */}
                            <div className="relative">
                                <motion.div 
                                    animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                    className="absolute inset-0 bg-blue-400 rounded-full blur-md"
                                />
                                <div className="bg-blue-600 rounded-full p-4 relative shadow-lg shadow-blue-600/30 border-2 border-white">
                                    <MapPin className="w-10 h-10 text-white" />
                                </div>
                            </div>
                            
                            {/* Soft shadow under pin */}
                            <motion.div 
                                animate={{ scale: [1, 0.8, 1], opacity: [0.3, 0.1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="w-14 h-3 bg-slate-300 rounded-[100%] blur-sm mt-6" 
                            />
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        )
    },
    {
        id: 1,
        headline: "Live Location Tracking",
        subtext: "Know where your workforce is in real time. Stay connected to field teams and office staff.",
        cta: "Continue",
        Illustration: () => (
            <div className="relative w-full h-full flex flex-col items-center justify-center pt-8">
                {/* Map Grid Background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-100/60 to-transparent opacity-80 rounded-full scale-150 blur-xl pointer-events-none" />
                
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }}
                    className="relative w-72 h-72"
                >
                    {/* SVG Connecting Path */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 288 288" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <motion.path 
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.4, transition: { delay: 0.3, duration: 1.5, ease: "easeInOut" } }}
                            d="M60 200 C90 150, 160 190, 210 90" 
                            stroke="#3b82f6" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" 
                        />
                    </svg>

                    {/* Secondary Marker 1 */}
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, transition: { delay: 0.4, type: "spring", stiffness: 300, damping: 20 } }}
                        className="absolute bottom-16 left-10 w-12 h-12 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center p-2 z-10"
                    >
                        <User className="w-6 h-6 text-slate-400" />
                    </motion.div>

                    {/* Primary Highlighted Marker */}
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, transition: { delay: 0.6, type: "spring", stiffness: 300, damping: 20 } }}
                        className="absolute top-16 right-10 flex flex-col items-center z-20"
                    >
                        <div className="relative">
                            <motion.div 
                                animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
                                className="absolute inset-[-12px] bg-blue-500 rounded-full opacity-30"
                            />
                            <div className="bg-blue-600 w-16 h-16 rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.4)] flex items-center justify-center relative z-10 border-[3px] border-white">
                                <Navigation className="w-7 h-7 text-white ml-0.5 mt-0.5 -rotate-[40deg]" fill="currentColor" />
                            </div>
                        </div>
                        {/* Tooltip */}
                        <motion.div 
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { delay: 0.8, type: "spring" } }}
                            className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-md border border-slate-100 mt-4 flex items-center gap-2"
                        >
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                            <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">Active</span>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        )
    },
    {
        id: 2,
        headline: "Verified Work Activity",
        subtext: "Location & photo verification ensures transparency and accountability for every check-in.",
        cta: "Continue to Login",
        Illustration: () => (
            <div className="relative w-full h-full flex flex-col items-center justify-center pt-8">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }}
                    className="relative"
                >
                    {/* Photo Frame Container */}
                    <div className="w-56 h-64 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-2.5 relative z-10 overflow-hidden">
                        <div className="w-full h-full bg-slate-50/50 rounded-2xl border border-slate-100/50 flex flex-col items-center justify-center overflow-hidden relative">
                            {/* Inner Background gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-slate-50/20" />
                            
                            {/* Scanning line animation */}
                            <motion.div 
                                animate={{ y: ['-100%', '400%'] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                                className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent blur-[2px] z-20"
                            />

                            <Camera className="w-14 h-14 text-slate-300 mb-4 relative z-10" />
                            <div className="w-24 h-2.5 bg-slate-200 rounded-full relative z-10" />
                            <div className="w-16 h-2.5 bg-slate-200 rounded-full mt-2.5 relative z-10" />
                        </div>
                    </div>

                    {/* Verification Badges floating over the frame */}
                    <motion.div 
                        initial={{ scale: 0, x: -20, opacity: 0 }}
                        animate={{ scale: 1, x: 0, opacity: 1, transition: { delay: 0.3, type: "spring", stiffness: 400, damping: 25 } }}
                        className="absolute -left-6 top-10 bg-white p-3.5 rounded-2xl shadow-lg shadow-blue-900/5 border border-slate-50 z-20 flex items-center justify-center"
                    >
                        <MapPin className="w-7 h-7 text-blue-600" fill="rgba(37,99,235,0.1)" />
                    </motion.div>

                    <motion.div 
                        initial={{ scale: 0, x: 20, opacity: 0 }}
                        animate={{ scale: 1, x: 0, opacity: 1, transition: { delay: 0.5, type: "spring", stiffness: 400, damping: 25 } }}
                        className="absolute -right-6 bottom-14 bg-green-500 p-3 rounded-full shadow-[0_8px_20px_rgba(34,197,94,0.4)] z-20 flex items-center justify-center text-white border-[3px] border-white"
                    >
                        <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />
                    </motion.div>

                </motion.div>
            </div>
        )
    }
];

export default function Onboarding() {
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const router = useRouter();

    const nextStep = () => {
        if (step === screens.length - 1) {
            router.push("/login");
            return;
        }
        setDirection(1);
        setStep((prev) => prev + 1);
    };

    return (
        <div className="flex flex-col h-screen bg-[#F8FAFC] relative overflow-hidden font-sans">
            {/* Soft Ambient Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-blue-400/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-[40%] right-[-20%] w-[40%] h-[40%] bg-indigo-400/5 blur-[100px] rounded-full pointer-events-none" />

            {/* Top Navigation Bar */}
            <div className="pt-14 px-8 flex items-center justify-between z-20 shrink-0 relative">
                <div className="flex gap-2.5 items-center">
                    {screens.map((_, i) => (
                        <div key={i} className="relative h-1.5 w-10 bg-slate-200/80 rounded-full overflow-hidden">
                            <motion.div
                                initial={false}
                                animate={{ 
                                    width: i === step ? "100%" : i < step ? "100%" : "0%"
                                }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="absolute left-0 top-0 bottom-0 rounded-full bg-blue-600"
                            />
                        </div>
                    ))}
                </div>
                {step < screens.length - 1 ? (
                    <button
                        onClick={() => router.push("/login")}
                        className="text-[15px] font-semibold text-slate-400 hover:text-slate-600 transition-colors px-2 py-1"
                    >
                        Skip
                    </button>
                ) : (
                    <div className="w-10 h-8" /> // Empty space to maintain layout balance
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative flex flex-col overflow-hidden z-10 w-full mt-4">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 flex flex-col w-full h-full"
                    >
                        {/* Hero Illustration Container */}
                        <div className="flex-[1.5] flex items-center justify-center px-8 relative">
                            {screens[step].Illustration()}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 px-8 pt-8 pb-4 text-center flex flex-col items-center">
                            <motion.h2 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.4 }}
                                className="text-[32px] font-[800] tracking-tight text-slate-900 mb-4 leading-tight"
                            >
                                {screens[step].headline}
                            </motion.h2>
                            <motion.p 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.4 }}
                                className="text-[17px] text-slate-500 font-medium max-w-[300px] leading-relaxed"
                            >
                                {screens[step].subtext}
                            </motion.p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Actions Area */}
            <div className="px-8 pb-12 pt-4 relative z-20 w-full bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent">
                <Button
                    onClick={nextStep}
                    className="w-full h-16 rounded-[1.25rem] text-[17px] font-bold shadow-[0_8px_30px_rgb(37,99,235,0.25)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.4)] transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2.5 group overflow-hidden relative"
                >
                    {/* Button Ripple Effect element */}
                    <div className="absolute inset-0 w-full h-full bg-white/20 scale-0 group-hover:scale-[2] rounded-full transition-transform duration-700 ease-out opacity-0 group-hover:opacity-100 origin-center" />
                    
                    <span className="relative z-10">{screens[step].cta}</span>
                    <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={3} />
                </Button>
            </div>
        </div>
    );
}
