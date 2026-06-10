import { IpLocationSycn } from "@/app/store/Location/IpLocationProvider"
import { headers } from "next/headers";
import { connection } from "next/server";

export const ServerLocationHydration = async () => {
    // Opt-out del prerenderizado estático — este componente requiere headers de request
    await connection();

    try {
        const geoReader = globalThis.cachedGeoReader;
        if(!geoReader) {
            console.log("GeoReader not available");
            return null;
        }

        const hdrs = await headers();

        // x-forwarded-for puede tener múltiples IPs: "clientIP, proxy1, proxy2"
        // Firebase App Hosting agrega el load balancer al final — tomamos solo el primero
        const forwardedFor = hdrs.get("x-forwarded-for");
        const rawIp = hdrs.get("x-real-ip") || (forwardedFor ? forwardedFor.split(",")[0].trim() : null);

        if (!rawIp) {
            console.log("No IP found in headers");
            return <IpLocationSycn data={null} />;
        }

        // Ignorar IPs privadas/localhost que no tienen geolocalización
        const isPrivateIp = /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$|fc|fd)/.test(rawIp);
        if (isPrivateIp) {
            console.log("Private IP detected, skipping geolocation:", rawIp);
            return <IpLocationSycn data={null} />;
        }

        const location = geoReader.city(rawIp);

        return <IpLocationSycn data={{
            city: location.city?.names.es || location.city?.names.en || "",
            country: { isoCode: location.country?.isoCode || "", name: location.country?.names.es || location.country?.names.en || "" },
            state: { isoCode: location.subdivisions?.[0]?.isoCode || "", name: location.subdivisions?.[0]?.names.es || location.subdivisions?.[0]?.names.en || "" },
        }} />

    } catch (error) {
        console.error("Error in ServerLocationHydration:", error);
        return <IpLocationSycn data={null} />
    }
}