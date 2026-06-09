import { Reader } from '@maxmind/geoip2-node';
import { getFirebaseStorage } from "@/infraestructure/firebase/config/admin/firebase";


export async function register() {
    console.log("Registering instrumentation...");

    if (process.env.NEXT_RUNTIME === "nodejs") {
        try {
            const bucket = getFirebaseStorage().bucket();
            const file = bucket.file("Geolite/GeoLite2-City.mmdb")
            const [buffer] = await file.download();



            globalThis.cachedGeoReader = Reader.openBuffer(buffer);
            console.log("GeoLite2 database loaded successfully.");
        } catch (error) {
            console.error("Error loading GeoLite2 database:", error);
            throw error;
            
        }

        


    }
}