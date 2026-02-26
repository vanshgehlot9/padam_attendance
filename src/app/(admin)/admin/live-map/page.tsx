"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getDistanceInMeters } from "@/lib/geo";
import {
    X, MapPin, Clock, Navigation, Radio, Briefcase, Shield, Search,
    Layers, Flame, Route, Play, Pause, FastForward, Navigation2, ChevronRight, Users
} from "lucide-react";

// ================= CONSTANTS & STYLES =================
const STYLES = {
    STANDARD: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    SATELLITE: {
        version: 8,
        sources: {
            "satellite-tiles": {
                type: "raster",
                tiles: [
                    "https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                    "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                ],
                tileSize: 256,
                attribution: "&copy; Google"
            }
        },
        layers: [
            { id: "satellite", type: "raster", source: "satellite-tiles", minzoom: 0, maxzoom: 22 }
        ]
    } as any,
    DARK: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

const OFFICE_LNG = 73.0733824;
const OFFICE_LAT = 26.3217462;
const OFFICE_RADIUS = 100;

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

type MarkerStatus = "inside" | "field" | "near" | "outside" | "offline";
const STATUS_COLORS: Record<MarkerStatus, string> = {
    inside: "#22c55e", field: "#3b82f6", near: "#eab308", outside: "#ef4444", offline: "#94a3b8",
};
const STATUS_LABELS: Record<MarkerStatus, string> = {
    inside: "Inside", field: "Field", near: "Near", outside: "Outside", offline: "Offline",
};

interface EmployeeMapData {
    id: string; name: string; initials: string; role: string;
    shiftStart: string; shiftEnd: string;
    arrivalTime: string | null; status: string;
    distance: number; lat: number; lng: number; lastSeen: number;
    markerStatus: MarkerStatus; accuracy: number;
}

interface LocationHistoryContent {
    lat: number; lng: number; accuracy: number; timestamp: number;
}

// ================= COMPONENT =================
export default function LiveMapPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<Record<string, maplibregl.Marker>>({});

    // State
    const [employees, setEmployees] = useState<EmployeeMapData[]>([]);
    const [selected, setSelected] = useState<EmployeeMapData | null>(null);
    const [search, setSearch] = useState("");
    const [mapStyle, setMapStyle] = useState<"STANDARD" | "SATELLITE">("STANDARD");
    const [is3D, setIs3D] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);

    // Feature States
    const [routeGeometry, setRouteGeometry] = useState<any>(null);

    // Replay State
    const [replayData, setReplayData] = useState<LocationHistoryContent[]>([]);
    const [isReplaying, setIsReplaying] = useState(false);
    const [replayIdx, setReplayIdx] = useState(0);
    const [replaySpeed, setReplaySpeed] = useState(1);
    const replayIntervalRef = useRef<any>(null);
    const replayMarkerRef = useRef<maplibregl.Marker | null>(null);

    const boundsSetRef = useRef(false);

    // ================= DATA FETCHING =================
    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/employees");
            const json = await res.json();

            const hbs = json.heartbeats || {};
            const emps = json.employees || [];
            const att = json.attendance || [];
            const office = json.officeLocation || { latitude: OFFICE_LAT, longitude: OFFICE_LNG, radius: OFFICE_RADIUS };
            const now = Date.now();

            const mapped: EmployeeMapData[] = emps
                .filter((e: any) => e.active)
                .map((emp: any) => {
                    const hb = hbs[emp.id];
                    const rec = att.find((a: any) => a.employeeId === emp.id);
                    const lat = hb?.latitude || null;
                    const lng = hb?.longitude || null;
                    const dist = lat && lng ? Math.round(getDistanceInMeters(office.latitude, office.longitude, lat, lng)) : -1;

                    let markerStatus: MarkerStatus = "offline";
                    if (hb && now - hb.last_seen <= 120000) {
                        if (emp.role === "field") markerStatus = "field";
                        else if (dist <= office.radius) markerStatus = "inside";
                        else if (dist <= office.radius + 50) markerStatus = "near";
                        else markerStatus = "outside";
                    }

                    return {
                        id: emp.id, name: emp.name,
                        initials: emp.avatarInitials || emp.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
                        role: emp.role, shiftStart: emp.shiftStart, shiftEnd: emp.shiftEnd,
                        arrivalTime: rec?.arrivalTime || null, status: rec?.status || "ABSENT",
                        distance: dist, lat: lat || 0, lng: lng || 0,
                        lastSeen: hb?.last_seen || 0, markerStatus, accuracy: hb?.accuracy || 0,
                    };
                });
            setEmployees(mapped);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i); }, [fetchData]);

    // ================= INIT MAP =================
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: STYLES.STANDARD,
            center: [OFFICE_LNG, OFFICE_LAT],
            zoom: 16,
            pitch: 0,
            attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), "bottom-right");

        map.on("load", () => {
            setupMapLayers(map);
        });

        // Save reference
        mapRef.current = map;
        return () => {
            Object.values(markersRef.current).forEach(m => m.remove());
            replayMarkerRef.current?.remove();
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Setup function for map loads / style changes
    const setupMapLayers = (map: maplibregl.Map) => {
        const circleCoords = createCircleCoords([OFFICE_LNG, OFFICE_LAT], OFFICE_RADIUS);

        // 1. Geofence
        if (!map.getSource("geofence")) {
            map.addSource("geofence", {
                type: "geojson",
                data: { type: "Feature", geometry: { type: "Polygon", coordinates: [circleCoords] }, properties: {} },
            });
            map.addLayer({ id: "geofence-fill", type: "fill", source: "geofence", paint: { "fill-color": "#2563EB", "fill-opacity": 0.06 } });
            map.addLayer({ id: "geofence-line", type: "line", source: "geofence", paint: { "line-color": "#2563EB", "line-width": 2.5, "line-opacity": 0.5, "line-dasharray": [6, 3] } });
        }

        // 2. Heatmap Source
        if (!map.getSource("heatmap-source")) {
            map.addSource("heatmap-source", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
            map.addLayer({
                id: "heatmap-layer", type: "heatmap", source: "heatmap-source",
                paint: {
                    "heatmap-weight": ["interpolate", ["linear"], ["get", "mag"], 0, 0, 1, 1],
                    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 18, 5],
                    "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(33,102,172,0)", 0.2, "rgb(103,169,207)", 0.4, "rgb(209,229,240)", 0.6, "rgb(253,219,199)", 0.8, "rgb(239,138,98)", 1, "rgb(178,24,43)"],
                    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 18, 40],
                    "heatmap-opacity": 0, // hidden by default
                }
            });
        }

        // 3. Route Layer
        if (!map.getSource("route-source")) {
            map.addSource("route-source", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} } });
            map.addLayer({
                id: "route-layer", type: "line", source: "route-source",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#3b82f6", "line-width": 5, "line-opacity": 0.8 }
            });
            // Replay Trailing Line
            map.addSource("replay-source", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} } });
            map.addLayer({
                id: "replay-layer", type: "line", source: "replay-source",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#f43f5e", "line-width": 4, "line-opacity": 0.8, "line-dasharray": [2, 2] }
            });
        }

        // Add Office Marker if not exists (using manual element overlay)
        const existingOffice = document.getElementById("office-marker");
        if (!existingOffice) {
            const officeEl = document.createElement("div");
            officeEl.id = "office-marker";
            officeEl.innerHTML = `<div style="width:40px;height:40px;background:linear-gradient(135deg,#2563EB,#1d4ed8);border-radius:12px;border:3px solid white;box-shadow:0 4px 20px rgba(37,99,235,0.5);display:flex;align-items:center;justify-content:center;font-size:18px;">🏢</div>`;
            new maplibregl.Marker({ element: officeEl }).setLngLat([OFFICE_LNG, OFFICE_LAT]).addTo(map);
        }
    };

    // ================= MAP UPDATES =================
    // Update Theme / 3D
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        map.setStyle(STYLES[mapStyle]);

        map.once("styledata", () => {
            setupMapLayers(map);

            // Re-apply 3D buildings if needed and map style supports it (standard OSM vector tiles typically do)
            if (is3D && mapStyle === "STANDARD") {
                if (!map.getLayer("3d-buildings")) {
                    try {
                        // Dynamically find the source that provides building data
                        const sources = map.getStyle().sources;
                        const vectorSourceId = Object.keys(sources).find(k => sources[k].type === 'vector');

                        if (vectorSourceId) {
                            map.addLayer({
                                id: '3d-buildings',
                                source: vectorSourceId,
                                'source-layer': 'building', // common name in OSM vector tiles
                                type: 'fill-extrusion',
                                paint: {
                                    'fill-extrusion-color': '#e2e8f0',
                                    'fill-extrusion-height': ['get', 'render_height'],
                                    'fill-extrusion-base': ['get', 'render_min_height'],
                                    'fill-extrusion-opacity': 0.8
                                }
                            });
                        }
                    } catch (e) {
                        console.warn("3D buildings source layer not available in this style.", e);
                    }
                }
                map.easeTo({ pitch: 60, bearing: -20, duration: 1000 });
            } else {
                if (map.getLayer("3d-buildings")) map.removeLayer("3d-buildings");
                map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
            }
        });
    }, [mapStyle, is3D]);

    // Update Employee Markers
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;
        const existingIds = new Set(employees.map(e => e.id));

        Object.keys(markersRef.current).forEach(id => {
            if (!existingIds.has(id)) {
                markersRef.current[id].remove();
                delete markersRef.current[id];
            }
        });

        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([OFFICE_LNG, OFFICE_LAT]);

        employees.forEach(emp => {
            if (!emp.lat || !emp.lng) return;
            const color = STATUS_COLORS[emp.markerStatus];

            // Update Heatmap Source (add all current visible + history if we fetched it, for now just current for simplicity unless replay loaded)

            if (markersRef.current[emp.id]) {
                markersRef.current[emp.id].setLngLat([emp.lng, emp.lat]);
                const ring = markersRef.current[emp.id].getElement().querySelector(".marker-ring") as HTMLElement;
                if (ring) ring.style.borderColor = color;
            } else {
                const el = document.createElement("div");
                el.className = "cursor-pointer select-none";
                el.style.transition = "transform 0.3s ease";
                el.innerHTML = `
                    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
                        <div class="marker-ring" style="width:36px;height:36px;border-radius:50%;border:3px solid ${color};background:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#1e293b;box-shadow:0 2px 12px rgba(0,0,0,0.15);transition:border-color 0.5s ease, transform 0.2s ease;">${emp.initials}</div>
                        <div style="margin-top:2px;font-size:9px;font-weight:700;white-space:nowrap;background:white;padding:1px 6px;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.1);color:#475569;">${emp.name.split(" ")[0]}</div>
                    </div>
                `;
                el.addEventListener("mouseenter", () => { const ring = el.querySelector(".marker-ring") as HTMLElement; if (ring) ring.style.transform = "scale(1.15)"; });
                el.addEventListener("mouseleave", () => { const ring = el.querySelector(".marker-ring") as HTMLElement; if (ring) ring.style.transform = "scale(1)"; });
                el.addEventListener("click", () => {
                    setSelected(emp);
                });

                markersRef.current[emp.id] = new maplibregl.Marker({ element: el, anchor: "bottom" })
                    .setLngLat([emp.lng, emp.lat])
                    .addTo(map);
            }
            bounds.extend([emp.lng, emp.lat]);
        });

        // Heatmap update
        if (map.getSource("heatmap-source")) {
            const features = employees.filter(e => e.lat).map(e => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: [e.lng, e.lat] },
                properties: { mag: 1 }
            }));
            (map.getSource("heatmap-source") as maplibregl.GeoJSONSource).setData({ type: "FeatureCollection", features: features as any });
            map.setPaintProperty("heatmap-layer", "heatmap-opacity", showHeatmap ? 0.7 : 0);
        }

        if (!boundsSetRef.current && employees.some(e => e.lat && e.lng)) {
            map.fitBounds(bounds, { padding: 80, maxZoom: 17, duration: 1000 });
            boundsSetRef.current = true;
        }
    }, [employees, showHeatmap]);

    // Update Route Geometry
    useEffect(() => {
        if (!mapRef.current || !mapRef.current.getSource("route-source")) return;
        const source = mapRef.current.getSource("route-source") as maplibregl.GeoJSONSource;
        if (routeGeometry) {
            source.setData({ type: "Feature", geometry: routeGeometry, properties: {} });

            // Fit route
            const bounds = new maplibregl.LngLatBounds();
            routeGeometry.coordinates.forEach((c: any) => bounds.extend(c));
            mapRef.current.fitBounds(bounds, { padding: 60, duration: 800 });
        } else {
            source.setData({ type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} });
        }
    }, [routeGeometry]);

    // ================= ACTIONS =================
    const focusEmployee = (emp: EmployeeMapData) => {
        if (mapRef.current && emp.lat && emp.lng) {
            mapRef.current.flyTo({ center: [emp.lng, emp.lat], zoom: 18, pitch: is3D ? 60 : 0, duration: 800 });
        }
        setSelected(emp);
        setRouteGeometry(null); // clear old route
        setReplayData([]); // clear old replay
    };

    const handleNavigate = async () => {
        if (!selected || !selected.lat) return;
        try {
            // Using public OSRM for live routing
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${OFFICE_LNG},${OFFICE_LAT};${selected.lng},${selected.lat}?geometries=geojson`);
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
                setRouteGeometry(data.routes[0].geometry);
            }
        } catch (e) { console.error("OSRM Routing failed", e); }
    };

    const handleFetchReplay = async () => {
        if (!selected) return;
        try {
            const today = new Date().toISOString().split("T")[0];
            const res = await fetch(`/api/admin/employees/${selected.id}/history?date=${today}`);
            const data = await res.json();
            if (data.history && data.history.length > 0) {
                // sort chronologically
                const sorted = data.history.sort((a: any, b: any) => a.timestamp - b.timestamp);
                setReplayData(sorted);
                setReplayIdx(0);

                // Draw initial empty replay line
                if (mapRef.current) {
                    const source = mapRef.current.getSource("replay-source") as maplibregl.GeoJSONSource;
                    source.setData({ type: "Feature", geometry: { type: "LineString", coordinates: sorted.map((p: any) => [p.lng, p.lat]) }, properties: {} });

                    // Fit map
                    const bounds = new maplibregl.LngLatBounds();
                    sorted.forEach((p: any) => bounds.extend([p.lng, p.lat]));
                    mapRef.current.fitBounds(bounds, { padding: 60 });
                }
            } else {
                alert("No movement history available for today.");
            }
        } catch (e) { console.error(e); }
    };

    // Replay playback loop
    useEffect(() => {
        if (!isReplaying || replayData.length === 0 || !mapRef.current) return;

        replayIntervalRef.current = setInterval(() => {
            setReplayIdx(prev => {
                const next = prev + 1;
                if (next >= replayData.length) {
                    setIsReplaying(false);
                    return prev;
                }

                // Update marker position
                const point = replayData[next];
                if (!replayMarkerRef.current && mapRef.current) {
                    const el = document.createElement("div");
                    el.className = "w-6 h-6 bg-pink-500 rounded-full border-2 border-white shadow-xl";
                    replayMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([point.lng, point.lat]).addTo(mapRef.current);
                } else if (replayMarkerRef.current) {
                    replayMarkerRef.current.setLngLat([point.lng, point.lat]);
                }

                return next;
            });
        }, 1000 / replaySpeed); // 1s scaled by speed

        return () => clearInterval(replayIntervalRef.current);
    }, [isReplaying, replayData, replaySpeed]);

    // Clear replay marker on cancel
    useEffect(() => {
        if (replayData.length === 0 && replayMarkerRef.current) {
            replayMarkerRef.current.remove();
            replayMarkerRef.current = null;
            if (mapRef.current) {
                const source = mapRef.current.getSource("replay-source") as maplibregl.GeoJSONSource;
                if (source) source.setData({ type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} });
            }
        }
    }, [replayData]);


    const counts = employees.reduce((acc, e) => {
        acc[e.markerStatus] = (acc[e.markerStatus] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const filteredList = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="h-full flex relative overflow-hidden bg-slate-50">
            {/* LEFT SIDEBAR: Employee Sync List */}
            <div className="w-[300px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-lg">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Workforce Sync
                        <span className="ml-auto text-xs bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">{employees.length}</span>
                    </h2>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-slate-100 rounded-xl focus:outline-none focus:border-blue-500 bg-white shadow-sm transition-colors"
                            placeholder="Find employee..."
                            value={search} onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredList.map(emp => (
                        <button
                            key={emp.id}
                            onClick={() => focusEmployee(emp)}
                            className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left border ${selected?.id === emp.id ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-transparent hover:bg-slate-50"}`}
                        >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md border-2 border-white" style={{ background: STATUS_COLORS[emp.markerStatus] }}>
                                {emp.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{emp.name}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs">
                                    <span className={`font-bold uppercase tracking-wider ${emp.markerStatus === "inside" ? "text-green-600" : emp.markerStatus === "outside" ? "text-red-600" : emp.markerStatus === "offline" ? "text-slate-400" : "text-blue-600"}`}>
                                        {STATUS_LABELS[emp.markerStatus]}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-500 font-mono">{emp.distance >= 0 ? `${emp.distance}m` : "No GPS"}</span>
                                </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${selected?.id === emp.id ? "text-blue-500 translate-x-1" : "text-slate-300"}`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN MAP AREA */}
            <div className="flex-1 relative">

                {/* TOOLBAR: Style Switcher & Toggles */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 flex overflow-hidden border border-slate-200 p-1">
                        <button onClick={() => setMapStyle("STANDARD")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${mapStyle === "STANDARD" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>Map</button>
                        <button onClick={() => setMapStyle("SATELLITE")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${mapStyle === "SATELLITE" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>Satellite</button>
                    </div>

                    <button onClick={() => setIs3D(!is3D)} className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg border transition-all flex items-center gap-2 ${is3D ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}>
                        <Layers className="w-4 h-4" /> 3D View
                    </button>

                    <button onClick={() => setShowHeatmap(!showHeatmap)} className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg border transition-all flex items-center gap-2 ${showHeatmap ? "bg-rose-500 text-white border-rose-400 shadow-rose-500/20" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}>
                        <Flame className="w-4 h-4" /> Heatmap
                    </button>
                </div>

                {/* LEGEND */}
                <div className="absolute top-4 right-4 z-10">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-3 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Live Status</span>
                        <div className="flex gap-2">
                            {(["inside", "field", "near", "outside", "offline"] as MarkerStatus[]).map(s => (
                                <div key={s} className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-50 border border-slate-100/50">
                                    <div className="w-2.5 h-2.5 rounded-full mb-1 shadow-sm" style={{ background: STATUS_COLORS[s] }} />
                                    <span className="text-[11px] font-bold text-slate-700">{counts[s] || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MAP CONTAINER */}
                <div ref={containerRef} className="w-full h-full" />

                {/* RIGHT DOORS: Detail Profile Panel */}
                {selected && (
                    <div className="absolute top-24 right-4 bottom-4 w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-20 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
                        {/* Header Banner */}
                        <div className="h-24 bg-gradient-to-br relative shrink-0" style={{ backgroundImage: `linear-gradient(135deg, ${STATUS_COLORS[selected.markerStatus]}aa, ${STATUS_COLORS[selected.markerStatus]})` }}>
                            <button onClick={() => { setSelected(null); setRouteGeometry(null); setReplayData([]); }} className="absolute top-3 right-3 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white transition-colors backdrop-blur-sm">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="absolute -bottom-8 left-6">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-slate-900 border-4 border-white shadow-xl" style={{ background: "white", color: STATUS_COLORS[selected.markerStatus] }}>
                                    {selected.initials}
                                </div>
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="pt-10 px-6 pb-4 border-b border-slate-100 flex-1 overflow-y-auto">
                            <h3 className="text-xl font-black text-slate-900">{selected.name}</h3>
                            <div className="flex items-center gap-2 mt-1 mb-6">
                                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${selected.role === "field" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                                    {selected.role}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">• {STATUS_LABELS[selected.markerStatus]}</span>
                            </div>

                            <div className="space-y-3">
                                {/* Distance Big Card */}
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Distance to Office</p>
                                        <p className={`text-3xl font-black ${selected.markerStatus === "inside" ? "text-green-600" : selected.markerStatus === "outside" ? "text-red-500" : "text-slate-800"}`}>
                                            {selected.distance >= 0 ? `${selected.distance}m` : "UNKNOWN"}
                                        </p>
                                    </div>
                                    <MapPin className="w-8 h-8 text-slate-200" />
                                </div>

                                {/* Shift Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                        <Clock className="w-4 h-4 text-amber-500 mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Assigned Shift</p>
                                        <p className="text-sm font-bold text-slate-900">{selected.shiftStart} – {selected.shiftEnd}</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                        <Briefcase className="w-4 h-4 text-emerald-500 mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Arrival Mark</p>
                                        <p className="text-sm font-bold text-slate-900">{selected.arrivalTime || "No entry"}</p>
                                    </div>
                                </div>

                                {/* GPS Info */}
                                <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 font-mono text-[11px] shadow-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-white flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-green-400" /> Telemetry</span>
                                        <span>{selected.lastSeen ? Math.round((Date.now() - selected.lastSeen) / 1000) + "s ago" : "No ping"}</span>
                                    </div>
                                    <div className="space-y-1 mt-3 pt-3 border-t border-slate-700/50">
                                        <p>LAT: <span className="text-blue-400">{selected.lat?.toFixed(6) || "N/A"}</span></p>
                                        <p>LNG: <span className="text-blue-400">{selected.lng?.toFixed(6) || "N/A"}</span></p>
                                        <p>ACC: ±{Math.round(selected.accuracy || 0)}m</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Footer */}
                        <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2 shrink-0">
                            {/* Live Routing */}
                            <button onClick={handleNavigate} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                                <Navigation2 className="w-5 h-5" /> Live Route to Employee
                            </button>

                            {/* History Replay Panel */}
                            <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Route className="w-3.5 h-3.5" /> Historical Movement Replay
                                </p>
                                {replayData.length === 0 ? (
                                    <button onClick={handleFetchReplay} className="w-full py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm">
                                        Download Today's Data
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setIsReplaying(!isReplaying)} className={`flex-1 py-2 ${isReplaying ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"} font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors`}>
                                            {isReplaying ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Play Replay</>}
                                        </button>
                                        <button onClick={() => setReplaySpeed(s => s === 1 ? 5 : s === 5 ? 10 : 1)} className="px-3 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1">
                                            <FastForward className="w-3.5 h-3.5" /> {replaySpeed}x
                                        </button>
                                        <button onClick={() => { setReplayData([]); setIsReplaying(false); }} className="px-3 py-2 bg-slate-100 text-slate-500 hover:text-red-500 font-bold rounded-lg text-xs">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                {replayData.length > 0 && (
                                    <div className="mt-3 relative h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-300 pointer-events-none" style={{ width: `${(replayIdx / Math.max(1, replayData.length - 1)) * 100}%` }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
