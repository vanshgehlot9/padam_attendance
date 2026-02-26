"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Briefcase, Camera, Navigation, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const slideVariants = {
    initial: (direction: number) => ({
        x: direction > 0 ? 100 : -100,
        opacity: 0
    }),
    animate: {
        x: 0,
        opacity: 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transition: { type: "spring" as any, stiffness: 300, damping: 30 }
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 100 : -100,
        opacity: 0,
        transition: { duration: 0.2 }
    })
};

export default function Onboarding() {
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const router = useRouter();

    const nextStep = () => {
        if (step === 2) {
            router.push("/login");
            return;
        }
        setDirection(1);
        setStep((prev) => prev + 1);
    };

    const prevStep = () => {
        setDirection(-1);
        setStep((prev) => prev - 1);
    };

    return (
        <div className="flex flex-col flex-1 bg-white relative">
            <div className="pt-12 px-6 flex items-center justify-between z-10 shrink-0 mb-4">
                <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-[#2563EB]" : "w-4 bg-slate-200"
                                }`}
                        />
                    ))}
                </div>
                {step < 2 && (
                    <button
                        onClick={() => router.push("/login")}
                        className="text-sm font-medium text-slate-400 hover:text-slate-600"
                    >
                        Skip
                    </button>
                )}
            </div>

            <div className="flex-1 relative overflow-hidden flex flex-col justify-end">
                <div className="absolute inset-0 block h-full">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        {step === 0 && (
                            <motion.div
                                key="step1"
                                custom={direction}
                                variants={slideVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="absolute inset-0 flex flex-col px-6 pt-16"
                            >
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    <div className="w-48 h-48 bg-blue-50 rounded-full flex items-center justify-center mb-8 relative">
                                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20" />
                                        <MapPin className="w-20 h-20 text-[#2563EB]" />
                                    </div>
                                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
                                        Smart Attendance & Live Tracking
                                    </h1>
                                    <p className="text-lg text-slate-500 max-w-[280px]">
                                        Auto attendance. Live location. Deal verification.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {step === 1 && (
                            <motion.div
                                key="step2"
                                custom={direction}
                                variants={slideVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="absolute inset-0 flex flex-col px-6 pt-16"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">How It Works</h2>
                                    <p className="text-slate-500">Your day, simplified and tracked automatically.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                                        <div className="bg-white p-3 rounded-xl shadow-sm min-w-12 flex justify-center">
                                            <Briefcase className="w-6 h-6 text-[#2563EB]" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">Enter Office</h3>
                                            <p className="text-sm text-slate-500">Attendance auto marked</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                                        <div className="bg-white p-3 rounded-xl shadow-sm min-w-12 flex justify-center">
                                            <Navigation className="w-6 h-6 text-[#16A34A]" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">Field Work</h3>
                                            <p className="text-sm text-slate-500">Live tracking + deal capture</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                                        <div className="bg-white p-3 rounded-xl shadow-sm min-w-12 flex justify-center">
                                            <Camera className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">Real Proof</h3>
                                            <p className="text-sm text-slate-500">GPS + photo ensures attendance</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step3"
                                custom={direction}
                                variants={slideVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="absolute inset-0 flex flex-col px-6 pt-16"
                            >
                                <div className="mb-8 flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                                        <ShieldCheck className="w-10 h-10 text-[#16A34A]" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Permissions needed</h2>
                                    <p className="text-slate-500">To ensure accurate tracking and verified checks, we need a few permissions.</p>
                                </div>

                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-5">
                                    <div className="flex gap-4">
                                        <MapPin className="w-6 h-6 text-[#2563EB] shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-slate-900">Location Access</h4>
                                            <p className="text-sm text-slate-500 leading-snug">Required (always on) for auto-attendance.</p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-slate-200" />
                                    <div className="flex gap-4">
                                        <Camera className="w-6 h-6 text-[#2563EB] shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-slate-900">Camera Access</h4>
                                            <p className="text-sm text-slate-500 leading-snug">Required for taking photos as proof.</p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-slate-200" />
                                    <div className="flex gap-4">
                                        <CheckCircle2 className="w-6 h-6 text-[#2563EB] shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-slate-900">Internet</h4>
                                            <p className="text-sm text-slate-500 leading-snug">Required for syncing records.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="px-6 relative z-10 w-full pb-8 bg-white/80 backdrop-blur-md pt-4 shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.05)] mt-auto border-t border-slate-50/50">
                    <Button
                        onClick={nextStep}
                        className="w-full text-lg shadow-xl"
                        size="lg"
                    >
                        {step === 0 ? "Get Started" : step === 1 ? "Continue" : "Allow & Proceed"}
                    </Button>

                    {step > 0 && (
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            className="w-full mt-2 text-slate-500"
                        >
                            Back
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
