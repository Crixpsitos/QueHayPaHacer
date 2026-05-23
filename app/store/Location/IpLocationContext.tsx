"use client"

import { createContext, useContext } from "react";
export interface UserLocation {
    city: string;
    state: { isoCode: string; name: string };
    country: { isoCode: string; name: string };
    isDetecting: boolean;
}

export const LocationContext = createContext<{
    location: UserLocation | null;
    setLocation: (location: UserLocation | null) => void;
}>({
    location: null,
    setLocation: () => undefined,
})

export const useLocationInfo = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error("useLocationInfo must be used within a LocationProvider");
    }
    return context;
};