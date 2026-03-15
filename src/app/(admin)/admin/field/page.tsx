"use client";

import { useEffect, useState } from "react";
import { Camera, MapPin, Clock, User, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FieldStaffPage() {
    const [data, setData] = useState<any>(null);
    const [filterEmp, setFilterEmp] = useState("");
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/admin/employees");
            const json = await res.json();
            setData(json);
        })();
    }, []);

    if (!data) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

    const fieldEmployees = (data.employees || []).filter((e: any) => e.role === "field" && e.active);
    const deals = data.deals || [];
    const filteredDeals = filterEmp ? deals.filter((d: any) => d.employeeId === filterEmp) : deals;

    return (
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Field Staff Monitoring</h1>
                    <p className="text-sm text-slate-500 mt-1">{fieldEmployees.length} field employees • {deals.length} deal submissions</p>
                </div>
                <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
                    >
                        <option value="">All Field Staff</option>
                        {fieldEmployees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Field Staff Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {fieldEmployees.map((emp: any) => {
                    const empDeals = deals.filter((d: any) => d.employeeId === emp.id);
                    const hb = data.heartbeats?.[emp.id];
                    return (
                        <div key={emp.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">{emp.avatarInitials}</div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{emp.name}</p>
                                    <p className="text-[11px] text-slate-400">{emp.id} • {emp.shiftStart}–{emp.shiftEnd}</p>
                                </div>
                                <div className="ml-auto">
                                    <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${hb ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                        {hb ? "LIVE" : "OFFLINE"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{empDeals.length} deals</span>
                                {hb && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />±{hb.accuracy}m</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Deal Submissions */}
            <h2 className="text-lg font-bold text-slate-900 mb-4">Deal Submissions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDeals.map((deal: any) => {
                    const emp = data.employees.find((e: any) => e.id === deal.employeeId);
                    return (
                        <div key={deal.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            {/* Photo area */}
                            <div
                                className="h-48 bg-slate-100 flex items-center justify-center border-b border-slate-100 relative group overflow-hidden cursor-pointer"
                                onClick={() => deal.photoUrl && setSelectedPhoto(deal.photoUrl)}
                            >
                                {deal.photoUrl ? (
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={deal.photoUrl} alt="Deal Proof" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        {/* Remove the standalone anchor tag and rely on the full div click */}
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <Camera className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                                        <span className="text-xs text-slate-400">No Photo</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="text-sm font-semibold text-slate-900">{emp?.name || deal.employeeId}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{deal.id}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="flex items-center gap-1.5 text-slate-500"><MapPin className="w-3 h-3" />±{deal.accuracy}m accuracy</div>
                                    <div className="flex items-center gap-1.5 text-slate-500"><Clock className="w-3 h-3" />{new Date(deal.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                                </div>
                                {deal.notes && <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">{deal.notes}</p>}
                                <div className="font-mono text-[10px] text-slate-400">
                                    {deal.latitude.toFixed(6)}, {deal.longitude.toFixed(6)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Photo Preview Modal */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedPhoto(null)}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
                    >
                        <button
                            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPhoto(null);
                            }}
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            src={selectedPhoto}
                            alt="Full Screen Deal Proof"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
