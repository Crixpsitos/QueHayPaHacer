import { IpLocationSycn } from "@/app/store/Location/IpLocationProvider"
import { headers } from "next/headers";

export const ServerLocationHydration = async () => {
    try {
        const geoReader = globalThis.cachedGeoReader;
        if(!geoReader) return null
        const hdrs = await headers();
        const ip = hdrs.get("x-real-ip") || hdrs.get("x-forwarded-for") || null;


        if (!ip) {
            console.log("No IP found, using cached location");
            return null;
        }

        
        const location = geoReader.city(ip);


        return <IpLocationSycn data={{
            city: location.city?.names.es || location.city?.names.en || "",
            country: { isoCode: location.country?.isoCode || "", name: location.country?.names.es || location.country?.names.en || "" },
            state: { isoCode: location.subdivisions?.[0]?.isoCode || "", name: location.subdivisions?.[0]?.names.es || location.subdivisions?.[0]?.names.en || "" },
        }} />

    } catch {
        return <IpLocationSycn data={null} />
    }
}