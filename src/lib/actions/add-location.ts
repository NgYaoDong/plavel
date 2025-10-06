"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { redirect } from "next/navigation";

async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; formattedAddress: string }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Google Maps API key is not set");
  }
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`
  );
  const data = await response.json();
  if (!response.ok || !data.results || data.results.length === 0) {
    throw new Error("Failed to geocode address");
  }
  const { lat, lng } = data.results[0].geometry.location;
  const formattedAddress = data.results[0].formatted_address;
  return { lat, lng, formattedAddress };
}

export async function addLocation(formData: FormData, tripId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  const address = formData.get("address")?.toString();
  if (!address) {
    throw new Error("Address is required");
  }
  // Try to use precise lat/lng from Places autocomplete if provided
  const formLat = formData.get("lat")?.toString();
  const formLng = formData.get("lng")?.toString();
  let lat: number;
  let lng: number;
  const coords = await geocodeAddress(address);
  const formattedAddress = coords.formattedAddress;

  if (formLat && formLng) {
    lat = parseFloat(formLat);
    lng = parseFloat(formLng);
  } else {
    lat = coords.lat;
    lng = coords.lng;
  }

  const count = await prisma.location.count({
    where: { tripId },
  });

  await prisma.location.create({
    data: {
      locationTitle: address,
      address: formattedAddress, // Store the full formatted address
      latitude: lat,
      longitude: lng,
      tripId,
      order: count,
    },
  });

  redirect(`/trips/${tripId}`);
}
