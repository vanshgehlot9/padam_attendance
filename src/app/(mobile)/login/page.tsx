"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/AuthProvider";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// High-end mobile ambient background
const MobilePremiumBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#F4F7FB] z-0">
        {/* Soft top-down gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#E0EBF8]/50 to-transparent h-[40%]" />
        
        {/* Subtle glowing orbs for depth */}
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[50%] bg-[#3B82F6]/10 rounded-full mix-blend-multiply filter blur-[80px]" />
        <div className="absolute top-[20%] right-[-20%] w-[60%] h-[60%] bg-[#93C5FD]/10 rounded-full mix-blend-multiply filter blur-[80px]" />
        
        {/* Faint premium grid pattern overlay */}
        <div 
            className="absolute inset-0 opacity-[0.02] mix-blend-overlay" 
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%23000000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundSize: '24px 24px'
            }}
        />
    </div>
);

export default function MobileLogin() {
    const router = useRouter();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    
    // Login state
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier || !password) return;

        setIsLoading(true);
        setError("");

        try {
            // Support both email and phone-based login
            const email = identifier.includes("@")
                ? identifier
                : `${identifier}@workforce.app`;

            await login(email, password);
            router.push("/dashboard");
        } catch (err: unknown) {
            console.error("Login failed:", err);
            const firebaseError = err as { code?: string };
            if (firebaseError.code === "auth/user-not-found") {
                setError("No account found with these credentials.");
            } else if (firebaseError.code === "auth/wrong-password" || firebaseError.code === "auth/invalid-credential") {
                setError("Invalid password. Please try again.");
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-8 font-sans overflow-hidden bg-[#F4F7FB]">
            <MobilePremiumBackground />

            <motion.div 
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                    duration: 0.6, 
                    ease: [0.22, 1, 0.36, 1], // Custom spring-like easing for premium feel
                }}
                className="w-full w-[90%] max-w-[400px] relative z-10 flex flex-col"
            >
                {/* Elevated Mobile Card Container */}
                <div className="bg-white/95 backdrop-blur-2xl rounded-[26px] shadow-[0_8px_32px_-12px_rgba(15,23,42,0.12),0_2px_8px_-4px_rgba(15,23,42,0.05)] border border-white/60 p-6 sm:p-8 relative overflow-hidden flex flex-col">
                    
                    {/* Top Branding Area */}
                    <div className="flex flex-col items-center text-center mb-8 mt-2">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
                            className="w-12 h-12 bg-white rounded-[14px] shadow-sm border border-slate-100/80 flex items-center justify-center mb-4 p-1 overflow-hidden"
                        >
                            <div className="w-full h-full relative rounded-lg overflow-hidden">
                                <Image src="/logo.jpeg" alt="Padam Enterprises" fill className="object-cover" />
                            </div>
                        </motion.div>
                        
                        <h2 className="text-[10px] font-[700] text-slate-400 uppercase tracking-[0.25em] mb-2.5">
                            Padam Enterprises
                        </h2>
                        <h1 className="text-[26px] font-[700] text-[#0F172A] tracking-[-0.02em] leading-tight mb-1.5">
                            Welcome Back
                        </h1>
                        <p className="text-[14px] text-[#64748B] font-medium px-2">
                            Access your workforce dashboard securely.
                        </p>
                    </div>

                    {/* Authentication Form */}
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center justify-center bg-red-50 text-red-600 py-3 px-4 rounded-[14px] text-[13px] font-medium border border-red-100 mb-2 text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Group 1 */}
                        <div className="space-y-2 relative group">
                            <label className="text-[13px] font-[600] text-[#0F172A] ml-1 block">
                                Employee ID or Email
                            </label>
                            <div className="relative flex items-center">
                                <Mail className="w-[18px] h-[18px] text-[#64748B] absolute left-4 transition-colors duration-200 group-focus-within:text-[#3B82F6] z-10" strokeWidth={2.5} />
                                <Input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="e.g. EMP4091 or email"
                                    className="h-[56px] pl-[44px] pr-4 rounded-[14px] border-slate-200/80 bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-[15px] font-medium text-[#0F172A] placeholder:text-slate-400 transition-all duration-300 focus-visible:ring-[3px] focus-visible:ring-[#3B82F6]/15 focus-visible:border-[#3B82F6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                    required
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                />
                            </div>
                        </div>

                        {/* Input Group 2 */}
                        <div className="space-y-2 relative group mt-1">
                            <div className="flex items-center justify-between ml-1 mr-1">
                                <label className="text-[13px] font-[600] text-[#0F172A]">
                                    Password
                                </label>
                                <button type="button" className="text-[12px] font-[600] text-[#3B82F6] hover:text-[#2563EB] active:text-[#1D4ED8] transition-colors relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-current after:scale-x-0 outline-none focus-visible:after:scale-x-100 hover:after:scale-x-100 after:transition-transform after:origin-right hover:after:origin-left">
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative flex items-center">
                                <Lock className="w-[18px] h-[18px] text-[#64748B] absolute left-4 transition-colors duration-200 group-focus-within:text-[#3B82F6] z-10" strokeWidth={2.5} />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-[56px] pl-[44px] pr-12 rounded-[14px] border-slate-200/80 bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-[15px] font-medium text-[#0F172A] placeholder:text-slate-400 placeholder:tracking-widest tracking-widest transition-all duration-300 focus-visible:ring-[3px] focus-visible:ring-[#3B82F6]/15 focus-visible:border-[#3B82F6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                    required
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 w-6 h-6 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] active:scale-90 transition-all focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={2.5} /> : <Eye className="w-[18px] h-[18px]" strokeWidth={2.5} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <motion.div 
                            whileTap={{ scale: 0.96 }} 
                            className="mt-6"
                        >
                            <Button
                                type="submit"
                                disabled={isLoading || !identifier || !password}
                                className="w-full h-[52px] rounded-[16px] bg-gradient-to-br from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white font-[600] text-[16px] shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] transition-all duration-300 relative overflow-hidden group border border-blue-500/50"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-[22px] h-[22px] animate-spin text-white/90" />
                                ) : (
                                    <span className="relative z-10 tracking-[0.01em]">Login to Dashboard</span>
                                )}
                                
                                {/* Subtle internal sheen effect on hover */}
                                <div className="absolute inset-0 h-full w-full bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                            </Button>
                        </motion.div>
                    </form>

                    {/* Compact Security Indicator */}
                    <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2">
                        <ShieldCheck className="w-[14px] h-[14px] text-slate-400" strokeWidth={2.5} />
                        <span className="text-[12px] font-medium text-slate-400">
                            Secure access • Encrypted authentication
                        </span>
                    </div>

                    {/* Support Link */}
                    <div className="mt-8 text-center text-[13px] font-medium text-slate-500">
                        Need help? <a href="#" className="text-[#3B82F6] hover:text-[#2563EB] active:text-[#1D4ED8] transition-colors">Contact IT Support</a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
