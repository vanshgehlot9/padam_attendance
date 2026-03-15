"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Users, Map, Briefcase, FileBarChart2,
    Settings, ChevronLeft, ChevronRight, Radio, Shield, Bell, LogOut, CalendarDays
} from "lucide-react";
import { AdminAuthProvider, useAdminAuth } from "@/components/providers/AdminAuthProvider";

/** Real-time unread alert count from Firestore */
function useUnreadAlertCount() {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let unsub: (() => void) | null = null;
        const start = async () => {
            const { collection, query, where, onSnapshot } = await import("firebase/firestore");
            const { getDb } = await import("@/lib/firebase");
            const q = query(collection(getDb(), "alerts"), where("read", "==", false));
            unsub = onSnapshot(q, snap => setCount(snap.size), () => { });
        };
        start().catch(console.error);
        return () => unsub?.();
    }, []);
    return count;
}

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: Users, label: "Employees", href: "/admin/employees" },
    { icon: Map, label: "Live Map", href: "/admin/live-map" },
    { icon: Briefcase, label: "Field Staff", href: "/admin/field" },
    { icon: Bell, label: "Alerts", href: "/admin/alerts" },
    { icon: FileBarChart2, label: "Daily Reports", href: "/admin/reports" },
    { icon: CalendarDays, label: "Monthly Reports", href: "/admin/reports/monthly" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const { logout } = useAdminAuth();
    const unreadAlertCount = useUnreadAlertCount();

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`${collapsed ? "w-[72px]" : "w-[260px]"} bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out shrink-0`}
            >
                {/* Logo */}
                <div className={`h-16 flex items-center border-b border-slate-800 ${collapsed ? "justify-center px-2" : "px-5 gap-3"}`}>
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                        <Image src="/logo.jpeg" alt="Padam Enterprises" width={36} height={36} className="object-cover w-full h-full" />
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <h1 className="text-sm font-bold tracking-tight leading-tight truncate">Padam Enterprises</h1>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Command Center</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto hide-scrollbar">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                        const isAlertsItem = item.href === "/admin/alerts";
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                                    ${isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                    }
                                    ${collapsed ? "justify-center" : ""}
                                `}
                                title={collapsed ? item.label : undefined}
                            >
                                <div className="relative">
                                    <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-500 group-hover:text-white"}`} />
                                    {isAlertsItem && unreadAlertCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                            {unreadAlertCount > 99 ? "99+" : unreadAlertCount}
                                        </span>
                                    )}
                                </div>
                                {!collapsed && <span className="flex-1">{item.label}</span>}
                                {!collapsed && isAlertsItem && unreadAlertCount > 0 && (
                                    <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full animate-pulse">
                                        {unreadAlertCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Live Indicator */}
                <div className={`px-3 py-3 border-t border-slate-800 ${collapsed ? "flex justify-center" : ""}`}>
                    <div className={`flex items-center gap-2 ${collapsed ? "" : "px-2"}`}>
                        <div className="relative">
                            <Radio className="w-4 h-4 text-green-400" />
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        </div>
                        {!collapsed && <span className="text-xs text-slate-400 font-medium">System Live</span>}
                    </div>
                </div>

                {/* Logout Button */}
                <div className="px-3 py-3 border-t border-slate-800">
                    <button
                        onClick={logout}
                        title={collapsed ? "Logout" : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-red-400 hover:text-white hover:bg-red-500/20 ${collapsed ? "justify-center" : ""}`}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="h-10 border-t border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminAuthProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </AdminAuthProvider>
    );
}
