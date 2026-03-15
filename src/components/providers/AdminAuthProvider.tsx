"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

import { Loader2, ShieldAlert, ShieldCheck, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface AdminAuthContextType {
    isAuthenticated: boolean;
    login: (id: string, pass: string) => boolean;
    logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
    isAuthenticated: false,
    login: () => false,
    logout: () => { },
});

export function useAdminAuth() {
    return useContext(AdminAuthContext);
}

// Modern subtle gradient/noise background component
const EnterpriseBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#F8FAFC]">
        {/* Abstract gentle gradient mesh */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-100/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-100/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-indigo-100/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000" />
        
        {/* Subtle grid pattern for technical/enterprise feel */}
        <div 
            className="absolute inset-0 opacity-[0.015]" 
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
        />
    </div>
);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);

    // Login state
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Check session storage on mount
        const storedAuth = sessionStorage.getItem("adminAuth");
        if (storedAuth === "true") {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const login = (inputId: string, inputPass: string) => {
        if (inputId === "admin@padam.in" && inputPass === "admin2026") {
            setIsAuthenticated(true);
            sessionStorage.setItem("adminAuth", "true");
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem("adminAuth");
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoggingIn(true);

        setTimeout(() => {
            const success = login(id, password);
            if (!success) {
                setError("Invalid administrator credentials");
            }
            setIsLoggingIn(false);
        }, 800); // Slightly longer delay for smoother premium UX feel
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="relative flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 font-sans overflow-hidden">
                <EnterpriseBackground />

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-[440px] relative z-10"
                >
                    {/* Main Login Card - Glass effect with soft shadow */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-white p-8 sm:p-10 relative overflow-hidden">
                        
                        {/* Shimmer effect line at top */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-300/50 to-transparent" />

                        {/* Top Section */}
                        <div className="flex flex-col items-center text-center mb-8">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-5 overflow-hidden p-1.5"
                            >
                                <div className="w-full h-full relative rounded-xl overflow-hidden">
                                    <Image src="/logo.jpeg" alt="Padam Enterprises" fill className="object-cover" />
                                </div>
                            </motion.div>
                            
                            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                                Padam Enterprises
                            </h2>
                            <h1 className="text-2xl font-[700] text-slate-900 tracking-tight leading-tight">
                                Welcome Back
                            </h1>
                            <p className="text-[14px] text-slate-500 mt-2">
                                Access your enterprise workforce dashboard.
                            </p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="space-y-5">
                            <AnimatePresence>
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0, y: -10 }}
                                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -10 }}
                                        className="flex items-center gap-3 bg-red-50/80 backdrop-blur-sm text-red-600 p-3.5 rounded-2xl text-[13px] font-medium border border-red-100 shadow-sm"
                                    >
                                        <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-4">
                                <div className="space-y-2 relative group">
                                    <label className="text-[13px] font-semibold text-slate-700 ml-1">
                                        Employee ID or Email
                                    </label>
                                    <div className="relative flex items-center">
                                        <Mail className="w-4 h-4 text-slate-400 absolute left-4 transition-colors group-focus-within:text-blue-500 z-10" />
                                        <Input
                                            type="email"
                                            value={id}
                                            onChange={(e) => setId(e.target.value)}
                                            placeholder="admin@padam.in"
                                            className="h-[52px] pl-11 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-[15px] transition-all duration-300 focus-visible:ring-4 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 relative group">
                                    <div className="flex items-center justify-between ml-1 mr-1">
                                        <label className="text-[13px] font-semibold text-slate-700">
                                            Password
                                        </label>
                                        <button type="button" className="text-[12px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <div className="relative flex items-center">
                                        <Lock className="w-4 h-4 text-slate-400 absolute left-4 transition-colors group-focus-within:text-blue-500 z-10" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="h-[52px] pl-11 pr-11 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-[15px] transition-all duration-300 focus-visible:ring-4 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm font-medium tracking-wide"
                                            required
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={isLoggingIn || !id || !password}
                                    className="w-full h-[52px] rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-[600] text-[15px] shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-[1px] transition-all duration-300 relative overflow-hidden group"
                                >
                                    {isLoggingIn ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <span className="relative z-10">Login to Dashboard</span>
                                    )}
                                    <div className="absolute inset-0 h-full w-full bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                </Button>
                            </motion.div>
                        </form>

                        {/* Secondary Social Login (Optional styling) */}
                        <div className="mt-8 flex items-center justify-center gap-3">
                            <div className="h-[1px] flex-1 bg-slate-100" />
                            <span className="text-[12px] text-slate-400 font-medium px-2">OR</span>
                            <div className="h-[1px] flex-1 bg-slate-100" />
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button type="button" className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[13px] font-medium text-slate-600 transition-all flex items-center justify-center gap-2 shadow-sm">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                                Google
                            </button>
                            <button type="button" className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[13px] font-medium text-slate-600 transition-all flex items-center justify-center gap-2 shadow-sm">
                                <svg className="w-4 h-4" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg"><path d="M10 0H0v10h10V0zM21 0H11v10h10V0zM10 11H0v10h10V11zM21 11H11v10h10V11z" fill="#00a4ef"/></svg>
                                Microsoft
                            </button>
                        </div>
                    </div>

                    {/* Bottom Security Trust Elements */}
                    <div className="mt-8 flex flex-col items-center justify-center space-y-3">
                        <div className="flex items-center gap-2 text-slate-500 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/50 shadow-sm">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span className="text-[12px] font-medium tracking-wide">Secure access • Encrypted authentication</span>
                        </div>
                        <button className="text-[13px] font-medium text-slate-400 hover:text-slate-600 transition-colors">
                            Need help? Contact IT Support
                        </button>
                    </div>
                </motion.div>
                
                {/* Embedded Tailwind Keyframes for background animation */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes blob {
                        0% { transform: translate(0px, 0px) scale(1); }
                        33% { transform: translate(30px, -50px) scale(1.1); }
                        66% { transform: translate(-20px, 20px) scale(0.9); }
                        100% { transform: translate(0px, 0px) scale(1); }
                    }
                    .animate-blob {
                        animation: blob 15s infinite;
                    }
                    .animation-delay-2000 {
                        animation-delay: 2s;
                    }
                    .animation-delay-4000 {
                        animation-delay: 4s;
                    }
                `}} />
            </div>
        );
    }

    return (
        <AdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AdminAuthContext.Provider>
    );
}
