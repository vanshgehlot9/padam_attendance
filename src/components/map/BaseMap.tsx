"use client";

import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

interface BaseMapProps {
    center?: [number, number]; // [lng, lat]
    zoom?: number;
    interactive?: boolean;
    className?: string;
    onMapReady?: (map: maplibregl.Map) => void;
    children?: React.ReactNode;
}

export function BaseMap({
    center = [73.0733824, 26.3217462],
    zoom = 16,
    interactive = true,
    className = "",
    onMapReady,
}: BaseMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: MAP_STYLE,
            center,
            zoom,
            interactive,
            attributionControl: false,
        });

        map.on("load", () => {
            setIsLoaded(true);
            onMapReady?.(map);
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full ${className}`}
            style={{ minHeight: "100%" }}
        />
    );
}

export { maplibregl };
