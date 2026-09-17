"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export interface ContactLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
}

const markerIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#3b8fc4;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.25);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center"><div style="width:8px;height:8px;border-radius:999px;background:white"></div></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

export default function ContactMap({ locations }: { locations: ContactLocation[] }) {
  return (
    <MapContainer center={[24.9, 55.1]} zoom={8} scrollWheelZoom={false} className="h-[320px] w-full sm:h-[380px] lg:h-[430px]">
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {locations.map((location) => (
        <Marker key={location.id} position={[location.latitude, location.longitude]} icon={markerIcon}>
          <Popup><strong>{location.name}</strong><div className="mt-1">{location.address}</div></Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
