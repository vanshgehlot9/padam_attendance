"use client";

import { useRef, useEffect, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { OFFICE_COORDS, OFFICE_RADIUS_METERS, getDistanceInMeters } from "@/lib/geo";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

function createCircleCoords(center: [number, number], radiusMeters: number, points = 64): [number, number][] {
    const km = radiusMeters / 1000;
    const ret: [number, number][] = [];
    const distanceX = km / (111.320 * Math.cos((center[1] * Math.PI) / 180));
    const distanceY = km / 110.574;

    for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        ret.push([center[0] + x, center[1] + y]);
    }
    ret.push(ret[0]);
    return ret;
}

interface BossDashboardMapProps {
    heartbeats: Record<string, any>;
    onEmployeeClick: (empId: string) => void;
}

export function BossDashboardMap({ heartbeats, onEmployeeClick }: BossDashboardMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<Record<string, maplibregl.Marker>>({});

    const updateMarkers = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;

        const now = Date.now();

        // Remove old markers
        Object.keys(markersRef.current).forEach((id) => {
            if (!heartbeats[id]) {
                markersRef.current[id].remove();
                delete markersRef.current[id];
            }
        });

        // Update / create markers
        Object.entries(heartbeats).forEach(([empId, data]: [string, any]) => {
            const diff = now - data.last_seen;
            const isOffline = diff > 120000;
            const dist = getDistanceInMeters(OFFICE_COORDS.latitude, OFFICE_COORDS.longitude, data.latitude, data.longitude);

            let color = "#ef4444"; // red (outside)
            if (isOffline) color = "#94a3b8"; // grey
            else if (dist <= OFFICE_RADIUS_METERS) color = "#22c55e"; // green
            else if (dist <= OFFICE_RADIUS_METERS + 50) color = "#eab308"; // yellow

            if (markersRef.current[empId]) {
                markersRef.current[empId].setLngLat([data.longitude, data.latitude]);
                const el = markersRef.current[empId].getElement();
                const dot = el.querySelector(".emp-dot") as HTMLElement;
                if (dot) dot.style.backgroundColor = color;
            } else {
                const el = document.createElement("div");
                el.className = "cursor-pointer";
                el.innerHTML = `
                    <div style="position:relative;display:flex;align-items:center;justify-content:center;">
                        <div class="emp-dot" style="width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2);background:${color};z-index:10;"></div>
                        <div style="position:absolute;font-size:10px;font-weight:700;white-space:nowrap;top:18px;background:white;padding:1px 6px;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.1);pointer-events:none;">${empId}</div>
                    </div>
                `;
                el.addEventListener("click", () => onEmployeeClick(empId));

                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat([data.longitude, data.latitude])
                    .addTo(map);

                markersRef.current[empId] = marker;
            }
        });
    }, [heartbeats, onEmployeeClick]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: MAP_STYLE,
            center: [OFFICE_COORDS.longitude, OFFICE_COORDS.latitude],
            zoom: 16,
            attributionControl: false,
        });

        map.on("load", () => {
            // Add geofence circle
            const circleCoords = createCircleCoords(
                [OFFICE_COORDS.longitude, OFFICE_COORDS.latitude],
                OFFICE_RADIUS_METERS
            );

            map.addSource("geofence", {
                type: "geojson",
                data: {
                    type: "Feature",
                    geometry: { type: "Polygon", coordinates: [circleCoords] },
                    properties: {},
                },
            });

            map.addLayer({
                id: "geofence-fill",
                type: "fill",
                source: "geofence",
                paint: { "fill-color": "#2563EB", "fill-opacity": 0.1 },
            });

            map.addLayer({
                id: "geofence-line",
                type: "line",
                source: "geofence",
                paint: { "line-color": "#2563EB", "line-width": 2, "line-opacity": 0.5 },
            });

            // Office marker
            const officeEl = document.createElement("div");
            officeEl.innerHTML = `<div style="width:28px;height:28px;background:#2563EB;border-radius:6px;border:2px solid white;box-shadow:0 4px 12px rgba(37,99,235,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;">🏢</div>`;
            new maplibregl.Marker({ element: officeEl })
                .setLngLat([OFFICE_COORDS.longitude, OFFICE_COORDS.latitude])
                .addTo(map);
        });

        mapRef.current = map;

        return () => {
            Object.values(markersRef.current).forEach((m) => m.remove());
            markersRef.current = {};
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        updateMarkers();
    }, [heartbeats, updateMarkers]);

    return <div ref={containerRef} className="w-full h-full" style={{ minHeight: "100%" }} />;
}
