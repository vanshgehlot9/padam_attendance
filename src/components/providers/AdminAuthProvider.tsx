"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, ShieldAlert, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

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

export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);

    // Login state
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

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
                setError("Invalid admin credentials");
            }
            setIsLoggingIn(false);
        }, 600); // Small delay for UX
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-100 p-6">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                    <div className="bg-slate-900 p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center mb-4 overflow-hidden p-1">
                            <div className="w-full h-full relative rounded-lg overflow-hidden">
                                <Image src="/logo.jpeg" alt="Padam Enterprises" fill className="object-cover" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Padam Command Center</h1>
                        <p className="text-sm text-slate-400 mt-2 font-medium tracking-wide uppercase">Admin Secure Access</p>
                    </div>

                    <form onSubmit={handleLogin} className="p-8 space-y-6">
                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">
                                <ShieldAlert className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Admin Email ID</label>
                                <Input
                                    type="email"
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    placeholder="admin@padam.in"
                                    className="h-12 border-slate-200 focus:border-blue-500 bg-slate-50 font-medium"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Access Key</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-12 border-slate-200 focus:border-blue-500 bg-slate-50 font-medium tracking-widest"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoggingIn || !id || !password}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/20"
                        >
                            {isLoggingIn ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <KeyRound className="w-5 h-5 mr-2" />
                                    Authenticate
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                <p className="text-sm text-slate-500 mt-8 font-medium">Secured by Padam Enterprises IT</p>
            </div>
        );
    }

    return (
        <AdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AdminAuthContext.Provider>
    );
}
