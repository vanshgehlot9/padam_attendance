"use client";

import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Save, MapPin, Loader2, Calendar as CalendarIcon, X } from "lucide-react";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

function createCircleCoords(center: [number, number], radiusMeters: number, points = 64): [number, number][] {
    const km = radiusMeters / 1000;
    const ret: [number, number][] = [];
    const distanceX = km / (111.320 * Math.cos((center[1] * Math.PI) / 180));
    const distanceY = km / 110.574;
    for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        ret.push([center[0] + distanceX * Math.cos(theta), center[1] + distanceY * Math.sin(theta)]);
    }
    ret.push(ret[0]);
    return ret;
}

export default function SettingsPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);

    const [lat, setLat] = useState(26.3217462);
    const [lng, setLng] = useState(73.0733824);
    const [radius, setRadius] = useState(100);
    const [name, setName] = useState("Main Office — Jodhpur");
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [holidays, setHolidays] = useState<string[]>([]);
    const [newHoliday, setNewHoliday] = useState("");
    const [savingHolidays, setSavingHolidays] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load office location from Firestore on mount
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/admin/employees");
                const data = await res.json();
                if (data.officeLocation) {
                    setLat(data.officeLocation.latitude);
                    setLng(data.officeLocation.longitude);
                    setRadius(data.officeLocation.radius);
                    setName(data.officeLocation.name);
                }

                // Fetch holidays
                const holRes = await fetch("/api/admin/settings/holidays");
                const holData = await holRes.json();
                if (holData.holidays) {
                    setHolidays(holData.holidays);
                }
            } catch (e) {
                console.error("Failed to load office settings:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const updateCircle = (map: maplibregl.Map, center: [number, number], r: number) => {
        const src = map.getSource("geofence") as maplibregl.GeoJSONSource;
        if (src) {
            src.setData({ type: "Feature", geometry: { type: "Polygon", coordinates: [createCircleCoords(center, r)] }, properties: {} });
        }
    };

    useEffect(() => {
        if (loading || !containerRef.current || mapRef.current) return;
        const map = new maplibregl.Map({
            container: containerRef.current, style: MAP_STYLE,
            center: [lng, lat], zoom: 16, attributionControl: false,
        });

        map.on("load", () => {
            map.addSource("geofence", { type: "geojson", data: { type: "Feature", geometry: { type: "Polygon", coordinates: [createCircleCoords([lng, lat], radius)] }, properties: {} } });
            map.addLayer({ id: "geofence-fill", type: "fill", source: "geofence", paint: { "fill-color": "#2563EB", "fill-opacity": 0.12 } });
            map.addLayer({ id: "geofence-line", type: "line", source: "geofence", paint: { "line-color": "#2563EB", "line-width": 2.5, "line-opacity": 0.5 } });
        });

        const marker = new maplibregl.Marker({ color: "#2563EB", draggable: true })
            .setLngLat([lng, lat]).addTo(map);

        marker.on("dragend", () => {
            const p = marker.getLngLat();
            setLat(p.lat); setLng(p.lng);
            updateCircle(map, [p.lng, p.lat], radius);
        });

        markerRef.current = marker;
        mapRef.current = map;

        return () => { map.remove(); mapRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    const handleRadiusChange = (newRadius: number) => {
        setRadius(newRadius);
        if (mapRef.current) updateCircle(mapRef.current, [lng, lat], newRadius);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save to Firestore via a dedicated API endpoint
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ latitude: lat, longitude: lng, radius, name }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (e) {
            console.error("Failed to save settings:", e);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveHolidays = async (updatedHolidays: string[]) => {
        setSavingHolidays(true);
        try {
            await fetch("/api/admin/settings/holidays", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dates: updatedHolidays }),
            });
        } catch (e) {
            console.error("Failed to save holidays:", e);
        } finally {
            setSavingHolidays(false);
        }
    };

    const addHoliday = () => {
        if (!newHoliday || holidays.includes(newHoliday)) return;
        const updated = [...holidays, newHoliday].sort();
        setHolidays(updated);
        setNewHoliday("");
        handleSaveHolidays(updated);
    };

    const removeHoliday = (dateObj: string) => {
        const updated = holidays.filter(h => h !== dateObj);
        setHolidays(updated);
        handleSaveHolidays(updated);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Office Location Settings</h1>
                    <p className="text-sm text-slate-500 mt-1">Configure the geo-fence for attendance validation</p>
                </div>
                <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all active:scale-95 ${saved ? "bg-green-600 shadow-green-600/20 text-white" : "bg-blue-600 shadow-blue-600/20 text-white hover:bg-blue-700"}`}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saved ? "Saved ✓" : saving ? "Saving..." : "Save Location"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ height: 500 }}>
                    <div ref={containerRef} className="w-full h-full" />
                </div>

                {/* Config Panel */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /> Location Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">Office Name</label>
                                <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">Latitude</label>
                                    <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono bg-slate-50 focus:outline-none" readOnly value={lat.toFixed(7)} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">Longitude</label>
                                    <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono bg-slate-50 focus:outline-none" readOnly value={lng.toFixed(7)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-4">Geofence Radius</h3>
                        <div className="space-y-3">
                            <input type="range" min="50" max="200" step="10" value={radius} onChange={e => handleRadiusChange(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>50m</span>
                                <span className="font-bold text-blue-600 text-sm">{radius}m</span>
                                <span>200m</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                            💡 Drag the marker on the map to set office location. Adjust the slider to change the attendance validation radius. Only GPS coordinates within this radius will be accepted for auto-attendance.
                        </p>
                    </div>

                    {/* Holidays Settings Module */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mt-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-orange-500" />
                            Manage Holidays
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Select dates that should be marked as holidays in the attendance system. Note: Sundays are no longer automatic holidays unless explicitly added.
                        </p>

                        <div className="flex items-center gap-3 mb-5">
                            <input
                                type="date"
                                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={newHoliday}
                                onChange={(e) => setNewHoliday(e.target.value)}
                            />
                            <button
                                onClick={addHoliday}
                                disabled={!newHoliday || savingHolidays}
                                className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
                            >
                                {savingHolidays ? "Adding..." : "Add"}
                            </button>
                        </div>

                        <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2">
                            {holidays.length === 0 ? (
                                <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-xs text-slate-400">No custom holidays configured.</p>
                                </div>
                            ) : (
                                holidays.map((date) => (
                                    <div key={date} className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg group hover:border-slate-300 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                            <span className="text-sm font-semibold text-slate-700">
                                                {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removeHoliday(date)}
                                            className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
