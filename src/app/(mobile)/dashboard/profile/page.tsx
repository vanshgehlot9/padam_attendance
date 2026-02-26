"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { User, Phone, Briefcase, Clock, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
    const { user, employeeData, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            router.push("/login");
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 min-h-[1000px]">
            {/* Header Area */}
            <div className="bg-white px-6 pt-12 pb-8 rounded-b-[2rem] shadow-[0_10px_20px_-10px_rgba(0,0,0,0.05)] mb-6 z-10 relative">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm overflow-hidden shrink-0">
                        {employeeData?.avatarInitials ? (
                            <span className="text-xl font-bold text-blue-700">{employeeData.avatarInitials}</span>
                        ) : (
                            <User className="w-8 h-8 text-blue-600" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                            {employeeData?.name || "Employee Profile"}
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            ID: <span className="font-medium text-slate-700">{employeeData?.id || user?.uid?.substring(0, 8)}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full border border-green-100">
                        {employeeData?.active ? "Active" : "Inactive"}
                    </span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-100">
                        {employeeData?.role || "Staff"}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 flex-1 flex flex-col gap-6 pb-24">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                >
                    {/* Personal Details */}
                    <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Personal Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                    <Phone className="w-5 h-5 text-slate-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-500">Phone Number</p>
                                    <p className="text-sm font-medium text-slate-900 mt-0.5">{employeeData?.phone || "Not provided"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                    <Briefcase className="w-5 h-5 text-slate-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-500">Role</p>
                                    <p className="text-sm font-medium text-slate-900 mt-0.5 capitalize">{employeeData?.role || "Not assigned"}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Shift Details */}
                    <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Shift Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                    <Clock className="w-5 h-5 text-slate-500" />
                                </div>
                                <div className="flex-1 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-slate-500">Timing</p>
                                        <p className="text-sm font-medium text-slate-900 mt-0.5">
                                            {employeeData?.shiftStart || "09:00 AM"} - {employeeData?.shiftEnd || "06:00 PM"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Grace</p>
                                        <p className="text-sm font-medium text-slate-900 mt-0.5">{employeeData?.graceMinutes || 15} mins</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* App Settings link (Placeholder) */}
                    <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <button className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors active:bg-slate-100">
                            <h3 className="text-sm font-bold text-slate-900">App Settings</h3>
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                        </button>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6"
                >
                    <Button
                        onClick={handleLogout}
                        variant="destructive"
                        className="w-full h-14 rounded-xl text-base font-bold flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-none border-none"
                    >
                        <LogOut className="w-5 h-5" />
                        Log Out securely
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
