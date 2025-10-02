"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "../ui/button";
import { addLocation } from "@/lib/actions/add-location";
import { Autocomplete, GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { MapPin, Loader2 } from "lucide-react";

export default function NewLocationClient({ tripId }: { tripId: string }) {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [placeId, setPlaceId] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  if (loadError) {
    return <div className="p-4 text-red-600">Error loading Google Maps</div>;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 shadow-lg rounded-lg flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>Loading map library…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white p-8 shadow-xl rounded-2xl border border-gray-100">
          <h1 className="text-3xl font-bold mb-2 text-center">
            Add New Location
          </h1>
          <p className="text-center text-gray-500 mb-6">
            Search for a place using Google suggestions, then add it to your trip.
          </p>
          <form
            className="space-y-6"
            action={(formData: FormData) => {
              startTransition(() => {
                addLocation(formData, tripId);
              });
            }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address or place name
              </label>
              <Autocomplete
                onLoad={(auto) => {
                  autocompleteRef.current = auto;
                }}
                onPlaceChanged={() => {
                  const place = autocompleteRef.current?.getPlace();
                  const addr = place?.formatted_address || place?.name || "";
                  setQuery(addr);
                  setPlaceId(place?.place_id || "");
                  const loc = place?.geometry?.location;
                  if (loc) {
                    setLat(String(loc.lat()));
                    setLng(String(loc.lng()));
                  } else {
                    setLat("");
                    setLng("");
                  }
                }}
                options={{
                  fields: ["formatted_address", "geometry", "name", "place_id"],
                  types: ["establishment", "geocode"],
                }}
              >
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    name="address"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search places (e.g. Gardens by the Bay)"
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </Autocomplete>
              <p className="text-xs text-gray-500 mt-2">
                Tip: Select a suggestion to use the exact coordinates from Google.
              </p>
              {/* Hidden fields with selected place details, used to skip server geocoding when available */}
              <input type="hidden" name="lat" value={lat} />
              <input type="hidden" name="lng" value={lng} />
              <input type="hidden" name="placeId" value={placeId} />
            </div>
            {lat && lng && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
                <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-200">
                  <GoogleMap
                    mapContainerStyle={{ height: "100%", width: "100%" }}
                    center={{ lat: parseFloat(lat), lng: parseFloat(lng) }}
                    zoom={15}
                    options={{ streetViewControl: false, mapTypeControl: false }}
                  >
                    <Marker position={{ lat: parseFloat(lat), lng: parseFloat(lng) }} />
                  </GoogleMap>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full">
              {isPending ? "Adding..." : "Add Location"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
