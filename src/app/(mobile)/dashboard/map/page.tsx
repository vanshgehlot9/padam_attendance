"use client";

import { useSearchParams } from "next/navigation";
import { BossDashboardMap } from "@/components/map/BossDashboardMap";
import { StaffFieldMap } from "@/components/map/StaffFieldMap";
import React, { useEffect, useState } from "react";

function MapPageContent() {
    const searchParams = useSearchParams();
    const role = searchParams.get("role") || "office";

    // For Boss View Mock
    const [mockHeartbeats, setMockHeartbeats] = useState<Record<string, any>>({});

    // Simulating fetching DB heartbeats for the boss view every 10s
    useEffect(() => {
        if (role !== "boss" && role !== "admin") return;

        const fetchHeartbeats = async () => {
            try {
                const res = await fetch("/api/tracking/heartbeat");
                if (res.ok) {
                    const data = await res.json();
                    setMockHeartbeats(data.heartbeats || {});
                }
            } catch (err) {
                console.error("Failed to fetch fleet data", err);
            }
        };
        fetchHeartbeats();
        const interval = setInterval(fetchHeartbeats, 10000);
        return () => clearInterval(interval);
    }, [role]);

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="pt-8 px-6 pb-4 bg-white z-10 shrink-0 shadow-sm relative">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {role === "boss" || role === "admin" ? "Live Fleet Activity" : "Live Field Tracking"}
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    {role === "boss" || role === "admin" ? "Monitoring all staff inside & outside office" : "High-accuracy GPS field tracking active"}
                </p>
            </div>

            <div className="flex-1 relative z-0">
                {(role === "boss" || role === "admin") ? (
                    <BossDashboardMap
                        heartbeats={mockHeartbeats}
                        onEmployeeClick={(id) => console.log("Open Detail Panel for", id)}
                    />
                ) : (
                    <StaffFieldMap employeeId="EMP-LIVE-1" />
                )}
            </div>

            {/* Start Field Work Toggle for Staff */}
            {(role === "field" || role === "office") && (
                <div className="px-6 relative z-10 w-full pb-8 pt-4 bg-white border-t border-slate-100">
                    <button className="w-full h-14 bg-[#2563EB] text-white font-bold text-lg rounded-xl shadow-[0_8px_20px_0_rgba(37,99,235,0.3)] hover:scale-[1.02] transition-transform active:scale-95">
                        Mark Attendance / Start Field Work
                    </button>
                </div>
            )}
        </div>
    );
}

export default function MapPage() {
    return (
        <React.Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <MapPageContent />
        </React.Suspense>
    );
}

