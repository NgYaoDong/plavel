"use client";

import { useRef, useState, useEffect } from "react";
import { Autocomplete, useLoadScript } from "@react-google-maps/api";
import { MapPin, Loader2 } from "lucide-react";

interface AddressAutocompleteProps {
  id: string;
  name: string;
  value?: string;
  onChange?: (address: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const libraries: "places"[] = ["places"];

export default function AddressAutocomplete({
  id,
  name,
  value = "",
  onChange,
  placeholder = "Search for an address...",
  required = false,
  disabled = false,
  className = "",
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  // Update internal state when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    const address = place?.formatted_address || place?.name || "";

    setInputValue(address);
    if (onChange) {
      onChange(address);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  if (!isLoaded) {
    return (
      <div className="relative">
        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        <input
          type="text"
          id={id}
          name={name}
          value={inputValue}
          disabled
          className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 ${className}`}
          placeholder="Loading..."
        />
      </div>
    );
  }

  return (
    <Autocomplete
      onLoad={(auto) => {
        autocompleteRef.current = auto;
      }}
      onPlaceChanged={handlePlaceChanged}
      options={{
        fields: ["formatted_address", "name", "geometry"],
        types: ["establishment","geocode"],
      }}
    >
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          id={id}
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />
      </div>
    </Autocomplete>
  );
}
