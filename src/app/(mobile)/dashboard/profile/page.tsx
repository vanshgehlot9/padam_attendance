"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    User, Phone, Briefcase, Clock,
    LogOut, ChevronRight, Settings, Timer,
    ShieldCheck
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

// ── Info Row (icon + label + value) ─────────────────────────────────────────
function InfoRow({
    icon: Icon,
    iconColor,
    iconBg,
    label,
    value,
    isLast = false,
}: {
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    label: string;
    value: string;
    isLast?: boolean;
}) {
    return (
        <>
            <div className="flex items-center gap-4 py-[14px]">
                <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className={`w-[18px] h-[18px] ${iconColor}`} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                    <p className="text-[11px] font-[600] text-[#64748B] uppercase tracking-wider">{label}</p>
                    <p className="text-[15px] font-[600] text-[#0F172A] mt-[2px] tracking-tight">{value}</p>
                </div>
            </div>
            {!isLast && <div className="h-px bg-slate-100 ml-14" />}
        </>
    );
}

// ── Section Card wrapper ─────────────────────────────────────────────────────
function SectionCard({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-[20px] px-5 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.06)] border border-white/50"
        >
            <p className="text-[11px] font-[700] text-[#64748B] uppercase tracking-widest pt-5 pb-1">
                {title}
            </p>
            {children}
        </motion.div>
    );
}

// ── Main Profile Page ─────────────────────────────────────────────────────────
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

    const employeeName = employeeData?.name || user?.displayName || "Employee";
    const initials =
        employeeData?.avatarInitials ||
        employeeName
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    const employeeId = employeeData?.id || user?.uid || "—";
    const role = employeeData?.role || "office";
    const phone = employeeData?.phone || "Not provided";
    const shiftStart = employeeData?.shiftStart || "09:00";
    const shiftEnd = employeeData?.shiftEnd || "18:00";
    const graceMinutes = employeeData?.graceMinutes ?? 15;
    const isActive = employeeData?.active !== false;

    return (
        <div className="flex flex-col bg-[#F4F7FB] min-h-full pb-10">

            {/* Top Profile Identity Card */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="mx-4 mt-5"
            >
                <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.08)] border border-white/50">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <motion.div
                            whileTap={{ scale: 0.95 }}
                            className="w-[64px] h-[64px] rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center shrink-0 shadow-[0_6px_16px_-4px_rgba(59,130,246,0.45)] ring-4 ring-white"
                        >
                            <span className="text-[22px] font-[700] text-white tracking-tight select-none">
                                {initials}
                            </span>
                        </motion.div>

                        {/* Identity Info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-[20px] font-[700] text-[#0F172A] tracking-tight leading-tight truncate">
                                {employeeName}
                            </h1>
                            <p className="text-[12px] font-[500] text-[#64748B] mt-[3px] font-mono truncate">
                                ID: {employeeId.length > 16 ? employeeId.slice(0, 16) + "…" : employeeId}
                            </p>

                            {/* Status pills */}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-[700] uppercase tracking-wider border ${
                                    isActive
                                        ? "bg-green-50 text-[#22C55E] border-green-100"
                                        : "bg-red-50 text-red-500 border-red-100"
                                }`}>
                                    {isActive ? "Active" : "Inactive"}
                                </span>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-[700] uppercase tracking-wider bg-blue-50 text-[#3B82F6] border border-blue-100">
                                    {role}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Sections */}
            <div className="px-4 mt-4 flex flex-col gap-3">

                {/* Personal Information */}
                <SectionCard title="Personal Information" delay={0.06}>
                    <InfoRow
                        icon={User}
                        iconColor="text-[#3B82F6]"
                        iconBg="bg-blue-50"
                        label="Full Name"
                        value={employeeName}
                    />
                    <InfoRow
                        icon={Phone}
                        iconColor="text-[#22C55E]"
                        iconBg="bg-green-50"
                        label="Phone Number"
                        value={phone}
                    />
                    <InfoRow
                        icon={Briefcase}
                        iconColor="text-[#8B5CF6]"
                        iconBg="bg-violet-50"
                        label="Role"
                        value={role.charAt(0).toUpperCase() + role.slice(1)}
                        isLast
                    />
                </SectionCard>

                {/* Shift Information */}
                <SectionCard title="Shift Information" delay={0.12}>
                    <InfoRow
                        icon={Clock}
                        iconColor="text-[#3B82F6]"
                        iconBg="bg-blue-50"
                        label="Shift Timing"
                        value={`${shiftStart} – ${shiftEnd}`}
                    />
                    <InfoRow
                        icon={Timer}
                        iconColor="text-[#F59E0B]"
                        iconBg="bg-amber-50"
                        label="Grace Period"
                        value={graceMinutes + " mins"}
                        isLast
                    />
                </SectionCard>

                {/* Security / Compliance quick badge */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-[#EFF6FF] border border-blue-100/80 rounded-[18px] px-5 py-4 flex items-center gap-3.5"
                >
                    <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center shrink-0 shadow-sm">
                        <ShieldCheck className="w-[18px] h-[18px] text-[#3B82F6]" strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-[13px] font-[700] text-[#0F172A] tracking-tight">Enterprise Account</p>
                        <p className="text-[12px] font-[500] text-[#64748B] mt-[2px]">Secured and managed by Padam Enterprises.</p>
                    </div>
                </motion.div>

                {/* App Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white rounded-[20px] shadow-[0_2px_8px_-4px_rgba(15,23,42,0.06)] border border-white/50 overflow-hidden"
                >
                    <motion.button
                        whileTap={{ scale: 0.98, backgroundColor: "#F8FAFC" }}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors active:bg-slate-50"
                    >
                        <div className="w-10 h-10 bg-slate-50 rounded-[12px] flex items-center justify-center shrink-0">
                            <Settings className="w-[18px] h-[18px] text-[#64748B]" strokeWidth={2} />
                        </div>
                        <span className="flex-1 text-[15px] font-[600] text-[#0F172A] tracking-tight">App Settings</span>
                        <ChevronRight className="w-[18px] h-[18px] text-slate-300" strokeWidth={2.5} />
                    </motion.button>
                </motion.div>

                {/* Logout Button */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleLogout}
                        className="w-full h-[54px] rounded-[16px] bg-red-50/80 border border-red-100 text-[#EF4444] font-[600] text-[15px] flex items-center justify-center gap-2.5 transition-colors active:bg-red-100"
                    >
                        <LogOut className="w-[18px] h-[18px]" strokeWidth={2.5} />
                        Log Out Securely
                    </motion.button>
                </motion.div>

            </div>
        </div>
    );
}
