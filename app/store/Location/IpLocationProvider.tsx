"use client"

import { ReactNode, useEffect, useState } from "react";
import { LocationContext, useLocationInfo, type UserLocation } from "./IpLocationContext";

interface IpLocationProviderProps {
    children: ReactNode;
}

export const IpLocationProvider = ({children}: IpLocationProviderProps) => {
    const [location, setLocation] = useState<UserLocation | null>(null);
    return (
        <LocationContext.Provider value={{location, setLocation}}>
            {children}
        </LocationContext.Provider>
    );
}

export const IpLocationSycn = ({data} : {data: Omit<UserLocation, "isDetecting"> | null }) => {
    const {setLocation} = useLocationInfo();
    
    useEffect(() => {
        if(data) {
            setLocation({
                ...data,
                isDetecting: false,
            });
        }
    }, [data, setLocation]);
    
    return null;
}