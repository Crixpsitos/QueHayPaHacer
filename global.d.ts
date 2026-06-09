import { type ReaderModel } from "@maxmind/geoip2-node"; 

declare global {
    var cachedGeoReader: ReaderModel | undefined;
}

export {};