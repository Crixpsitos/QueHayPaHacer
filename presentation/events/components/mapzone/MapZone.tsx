"use client";

import Map, {
  NavigationControl,
  Marker,
  type MapRef,
} from "react-map-gl/maplibre";
import type { MapStyleImageMissingEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

interface MapZoneProps {
  cityCoords?: { latitude: number; longitude: number } | null;
  pointCoords?: { lat: number; lng: number } | null;
  onMarkerDrag?: (lat: number, lng: number) => void; 
}

export const MapZone = ({ cityCoords, pointCoords, onMarkerDrag }: MapZoneProps) => {
  const mapRef = useRef<MapRef>(null);

  const markerLng = pointCoords?.lng ?? cityCoords?.longitude ?? -75.21;
  const markerLat = pointCoords?.lat ?? cityCoords?.latitude ?? 4.43;

  useEffect(() => {
    if (pointCoords?.lat && pointCoords?.lng) {
      mapRef.current?.flyTo({
        center: [pointCoords.lng, pointCoords.lat],
        zoom: 16.5,
        duration: 2500,
      });
      return;
    }

    if (cityCoords?.latitude && cityCoords?.longitude) {
      mapRef.current?.flyTo({
        center: [cityCoords.longitude, cityCoords.latitude],
        zoom: 12,
        duration: 2000,
      });
      return;
    }
  }, [cityCoords?.latitude, cityCoords?.longitude, pointCoords?.lat, pointCoords?.lng]);

  return (
    <div className="w-full h-125 rounded-lg overflow-hidden border border-border relative">
      <Map
        initialViewState={{
          longitude: markerLng,
          latitude: markerLat,
          zoom: 12,
        }}
        ref={mapRef}
        mapStyle="https://tiles.openfreemap.org/styles/bright"
        onLoad={(e) => {
          // Sustituye sprites desconocidos del estilo con un pixel transparente para silenciar los warnings.
          e.target.on("styleimagemissing", (ev) => {
            if (ev.target.hasImage(ev.id)) return;
            ev.target.addImage(ev.id, { width: 1, height: 1, data: new Uint8Array(4) });
          });
        }}
      >
        <NavigationControl position="top-right" />
        <Marker
          longitude={markerLng}
          latitude={markerLat}
          anchor="bottom"
          draggable={true}
          onDragEnd={(evt) => {
            const { lng, lat } = evt.lngLat;
            if (onMarkerDrag) {
              onMarkerDrag(lat, lng);
            }
          }}
          color="#ef4444"
          aria-label="Marcador de ubicación"
        />
      </Map>
    </div>
  );
};