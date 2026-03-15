"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Pencil, X, UserPlus, Copy, CheckCircle2, Shield, Mail, Lock } from "lucide-react";

interface Employee {
    id: string; name: string; phone: string; role: string; email?: string;
    shiftStart: string; shiftEnd: string; graceMinutes: number;
    active: boolean; avatarInitials: string;
}

interface CreatedCredentials {
    uid: string;
    email: string;
    password: string;
}

const EMPTY_FORM = { name: "", phone: "", role: "office", shiftStart: "09:00", shiftEnd: "18:00", graceMinutes: 15, active: true, email: "", password: "" };

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<any>({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [createdCreds, setCreatedCreds] = useState<CreatedCredentials | null>(null);
    const [copiedField, setCopiedField] = useState("");

    const load = async () => {
        const res = await fetch("/api/admin/employees");
        const data = await res.json();
        setEmployees(data.employees || []);
    };
    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setError(""); setCreatedCreds(null); setShowModal(true); };
    const openEdit = (emp: Employee) => {
        setEditingId(emp.id);
        setForm({ name: emp.name, phone: emp.phone, role: emp.role, shiftStart: emp.shiftStart, shiftEnd: emp.shiftEnd, graceMinutes: emp.graceMinutes, active: emp.active, email: emp.email || "", password: "" });
        setError("");
        setCreatedCreds(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            const initials = form.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
            if (editingId) {
                const { email, password, ...updates } = form;
                const res = await fetch("/api/admin/employees", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingId, ...updates, avatarInitials: initials }) });
                if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
                setShowModal(false);
            } else {
                if (!form.email || !form.password) { setError("Email and password are required"); setSaving(false); return; }
                if (form.password.length < 6) { setError("Password must be at least 6 characters"); setSaving(false); return; }
                const res = await fetch("/api/admin/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, avatarInitials: initials }) });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                // Show created credentials
                setCreatedCreds(data.credentials);
            }
            load();
        } catch (err: any) {
            setError(err.message || "Failed to save employee");
        } finally {
            setSaving(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(""), 2000);
    };

    const filtered = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search));

    return (
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Management</h1>
                    <p className="text-sm text-slate-500 mt-1">{employees.length} total employees</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all">
                    <UserPlus className="w-4 h-4" /> Add Employee
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium">Employee</th>
                            <th className="px-4 py-3 text-left font-medium">Role</th>
                            <th className="px-4 py-3 text-left font-medium">Shift</th>
                            <th className="px-4 py-3 text-left font-medium">Grace</th>
                            <th className="px-4 py-3 text-left font-medium">Status</th>
                            <th className="px-4 py-3 text-left font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(emp => (
                            <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">{emp.avatarInitials}</div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{emp.name}</p>
                                            <p className="text-xs text-slate-400">{emp.phone || emp.email || emp.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${emp.role === "field" ? "bg-blue-100 text-blue-700" : emp.role === "factory" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{emp.role}</span></td>
                                <td className="px-4 py-4 font-mono text-xs text-slate-600">{emp.shiftStart} – {emp.shiftEnd}</td>
                                <td className="px-4 py-4 text-slate-600">{emp.graceMinutes}m</td>
                                <td className="px-4 py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${emp.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{emp.active ? "Active" : "Disabled"}</span></td>
                                <td className="px-4 py-4">
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(emp)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors" title="Edit">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (confirm(`Are you sure you want to permanently delete ${emp.name}? This action cannot be undone.`)) {
                                                    try {
                                                        const res = await fetch("/api/admin/employees", {
                                                            method: "DELETE",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ id: emp.id })
                                                        });
                                                        if (!res.ok) throw new Error("Failed to delete");
                                                        load();
                                                    } catch (e: any) {
                                                        alert(e.message || "Failed to delete employee");
                                                    }
                                                }
                                            }}
                                            className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-500 transition-colors"
                                            title="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-16 text-slate-400">No employees found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { if (!createdCreds) setShowModal(false); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">
                                {createdCreds ? "✅ Employee Created" : editingId ? "Edit Employee" : "Create New Employee"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
                        </div>

                        {createdCreds ? (
                            /* Credential Display */
                            <div className="p-6 space-y-5">
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="w-5 h-5 text-green-600" />
                                        <p className="font-bold text-green-800">Login Credentials Generated</p>
                                    </div>
                                    <p className="text-sm text-green-700">Share these securely with the employee. The password cannot be viewed again.</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email / Username</p>
                                            <p className="font-mono text-sm font-semibold text-slate-900">{createdCreds.email}</p>
                                        </div>
                                        <button onClick={() => copyToClipboard(createdCreds.email, "email")} className="p-2 rounded-lg hover:bg-slate-200 transition-colors">
                                            {copiedField === "email" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                        </button>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Password</p>
                                            <p className="font-mono text-sm font-semibold text-slate-900">{createdCreds.password}</p>
                                        </div>
                                        <button onClick={() => copyToClipboard(createdCreds.password, "password")} className="p-2 rounded-lg hover:bg-slate-200 transition-colors">
                                            {copiedField === "password" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                        </button>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Employee UID</p>
                                        <p className="font-mono text-xs text-slate-600">{createdCreds.uid}</p>
                                    </div>
                                </div>

                                <button onClick={() => setShowModal(false)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                                    Done
                                </button>
                            </div>
                        ) : (
                            /* Form */
                            <div className="p-6 space-y-4">
                                {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 font-medium">{error}</div>}

                                <div>
                                    <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">Full Name</label>
                                    <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                                </div>

                                {!editingId && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                                            <input type="email" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider flex items-center gap-1"><Lock className="w-3 h-3" /> Password</label>
                                            <input type="text" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 chars" />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">Phone</label>
                                        <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">Role</label>
                                        <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                            <option value="office">Office</option>
                                            <option value="field">Field</option>
                                            <option value="factory">Factory</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">Shift Start</label>
                                        <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={form.shiftStart} onChange={e => setForm({ ...form, shiftStart: e.target.value })}>
                                            {["07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00"].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">Shift End</label>
                                        <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={form.shiftEnd} onChange={e => setForm({ ...form, shiftEnd: e.target.value })}>
                                            {["16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">Grace (min)</label>
                                        <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={form.graceMinutes} onChange={e => setForm({ ...form, graceMinutes: parseInt(e.target.value) })}>
                                            {[0, 5, 10, 15, 20, 30].map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {editingId && (
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">Account Status</label>
                                        <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={form.active ? "active" : "disabled"} onChange={e => setForm({ ...form, active: e.target.value === "active" })}>
                                            <option value="active">Active</option>
                                            <option value="disabled">Disabled</option>
                                        </select>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                                    <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                        {saving ? "Creating..." : editingId ? "Update" : "Create Employee"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
