"use client"

import Map, { NavigationControl, Marker } from "react-map-gl/maplibre"; 
import "maplibre-gl/dist/maplibre-gl.css";
import { useState } from "react";

export const MapZone = () => {
  const [coordinates, setCoordinates] = useState({
    longitude: 13.388,
    latitude: 52.517,
  });

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-border">
      <Map 
        initialViewState={{
          longitude: coordinates.longitude,
          latitude: coordinates.latitude,
          zoom: 9.5,
        }}
        
        mapStyle="https://tiles.openfreemap.org/styles/liberty" 
        onMoveEnd={(evt) => {
          const { longitude, latitude } = evt.viewState;
          
          setCoordinates({ longitude, latitude });
          console.log("Coordenadas guardadas sin romper React:", latitude, longitude);
        }}
      >
        <NavigationControl position="top-right" />
        <Marker longitude={coordinates.longitude} latitude={coordinates.latitude} color="#ef4444" />
      </Map>
    </div>
  );
};