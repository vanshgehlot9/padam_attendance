"use client";

import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Save, MapPin, Loader2 } from "lucide-react";

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
                </div>
            </div>
        </div>
    );
}
