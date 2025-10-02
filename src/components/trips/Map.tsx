"use client";

import { Location } from "@/generated/prisma";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

interface MapProps {
  itineraries: Location[];
}

export default function Map({ itineraries }: MapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });
  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  const center =
    itineraries.length > 0
      ? { lat: itineraries[0].latitude, lng: itineraries[0].longitude }
      : { lat: 0, lng: 0 };

  return (
    <GoogleMap
      mapContainerStyle={{ height: "100%", width: "100%" }}
      zoom={8}
      center={center}
    >
      {itineraries.map((location, key) => (
        <Marker
          key={key}
          position={{ lat: location.latitude, lng: location.longitude }}
          title={location.locationTitle}
        />
      ))}
      ;
    </GoogleMap>
  );
}
