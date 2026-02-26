/**
 * Office Location Constants
 * Latitude: 26.3217462
 * Longitude: 73.0733824
 */
export const OFFICE_COORDS = {
    latitude: 26.3217462,
    longitude: 73.0733824,
};

export const OFFICE_RADIUS_METERS = 100;

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns Distance in meters
 */
export function getDistanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Earth radius in meters
    const toRadians = (deg: number) => (deg * Math.PI) / 180;

    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Helper to determine if a coordinate is strictly within the office radius
 */
export function isWithinOfficeRadius(lat: number, lon: number): boolean {
    const distance = getDistanceInMeters(
        OFFICE_COORDS.latitude,
        OFFICE_COORDS.longitude,
        lat,
        lon
    );
    return distance <= OFFICE_RADIUS_METERS;
}
