"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Login() {
    const router = useRouter();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier || !password) return;

        setIsLoading(true);
        setError("");

        try {
            // Support both email and phone-based login
            // If identifier doesn't contain @, append a default domain
            const email = identifier.includes("@")
                ? identifier
                : `${identifier}@workforce.app`;

            await login(email, password);
            router.push("/dashboard");
        } catch (err: any) {
            console.error("Login failed:", err);
            if (err.code === "auth/user-not-found") {
                setError("No account found with these credentials");
            } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
                setError("Invalid password. Please try again.");
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 bg-white relative">
            <div className="flex-1 px-6 flex flex-col pt-24 pb-12">
                <div className="mb-12">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm">
                        <BriefcaseBusiness className="w-7 h-7 text-[#2563EB]" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                        Welcome back
                    </h1>
                    <p className="text-slate-500">
                        Enter your credentials to access your dashboard.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-5 flex-1">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 ml-1">
                            Employee ID / Email
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g. EMP4091 or email"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="h-14 text-base shadow-sm"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 ml-1 flex justify-between">
                            <span>Password</span>
                            <a href="#" className="text-[#2563EB] hover:underline font-normal">Forgot?</a>
                        </label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-14 text-base shadow-sm"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="mt-auto pt-8">
                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-semibold shadow-xl"
                            disabled={isLoading || !identifier || !password}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                "Login to Dashboard"
                            )}
                        </Button>

                        <p className="text-center text-sm text-slate-500 mt-6">
                            Need help? <a href="#" className="font-medium text-[#2563EB]">Contact Support</a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
