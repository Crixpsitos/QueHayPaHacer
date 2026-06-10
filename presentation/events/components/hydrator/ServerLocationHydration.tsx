import { IpLocationSycn } from "@/app/store/Location/IpLocationProvider"
import { headers } from "next/headers";

export const ServerLocationHydration = async () => {
    try {
        const geoReader = globalThis.cachedGeoReader;
        if (!geoReader) return null;

        const hdrs = await headers();
        // La IP ya fue extraída y saneada en el middleware (proxy.ts)
        const rawIp = hdrs.get("x-client-ip");

        if (!rawIp) {
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