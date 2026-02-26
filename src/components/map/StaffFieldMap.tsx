"use client";

import { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useLiveLocation } from "@/hooks/useLiveLocation";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export function StaffFieldMap({ employeeId }: { employeeId: string }) {
    const { location: { latitude, longitude, accuracy, status } } = useLiveLocation(employeeId);
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);
    const initializedRef = useRef(false);

    // Initialize map once
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: MAP_STYLE,
            center: [73.0733824, 26.3217462], // default until GPS lock
            zoom: 16,
            attributionControl: false,
        });

        mapRef.current = map;

        return () => {
            markerRef.current?.remove();
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update marker when location changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !latitude || !longitude) return;

        if (!initializedRef.current) {
            map.flyTo({ center: [longitude, latitude], zoom: 16 });
            initializedRef.current = true;
        }

        if (markerRef.current) {
            markerRef.current.setLngLat([longitude, latitude]);
        } else {
            const el = document.createElement("div");
            el.innerHTML = `
                <div style="position:relative;display:flex;align-items:center;justify-content:center;">
                    <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(37,99,235,0.2);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
                    <div style="width:20px;height:20px;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.4);z-index:10;display:flex;align-items:center;justify-content:center;">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L19 21 12 17 5 21Z"/></svg>
                    </div>
                </div>
            `;

            markerRef.current = new maplibregl.Marker({ element: el })
                .setLngLat([longitude, latitude])
                .addTo(map);
        }
    }, [latitude, longitude]);

    if (status === "DENIED") {
        return (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-center p-6">
                GPS Permission Denied — Enable Location Services
            </div>
        );
    }

    return (
        <div className="w-full h-full relative">
            <div ref={containerRef} className="w-full h-full" style={{ minHeight: "100%" }} />

            {/* Accuracy Badge */}
            {accuracy && (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md border border-slate-100 z-10">
                    <span className="text-[11px] font-mono font-bold text-slate-600">
                        Accuracy: ±{Math.round(accuracy)}m
                    </span>
                </div>
            )}

            {!latitude && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm font-medium text-slate-500">Acquiring GPS Signal...</p>
                    </div>
                </div>
            )}

            {/* Recenter Button */}
            {latitude && longitude && (
                <button
                    onClick={() => mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 16 })}
                    className="absolute bottom-6 right-4 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-blue-600 border border-slate-100 hover:bg-slate-50 transition-colors z-10"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L19 21 12 17 5 21Z" /></svg>
                </button>
            )}

            <style jsx global>{`
                @keyframes ping {
                    75%, 100% { transform: scale(2.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
