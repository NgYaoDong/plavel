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

  // Get trip to determine which day to assign (default to day 1)
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { locations: true },
  });

  // Calculate which day to assign based on existing locations
  // Default to day 1, or distribute evenly across trip days
  let assignedDay = 1;
  let orderInDay = 0;

  if (trip) {
    const tripDuration = Math.ceil(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Count locations per day
    const locationCounts = Array.from({ length: tripDuration }, (_, i) => {
      const day = i + 1;
      return {
        day,
        count: trip.locations.filter((loc) => loc.day === day).length,
      };
    });

    // Assign to the day with the fewest locations
    const targetDay = locationCounts.reduce((prev, curr) =>
      curr.count < prev.count ? curr : prev
    );
    assignedDay = targetDay.day;
    orderInDay = targetDay.count; // Order within the day (0-indexed)
  }

  await prisma.location.create({
    data: {
      locationTitle: address,
      address: formattedAddress, // Store the full formatted address
      latitude: lat,
      longitude: lng,
      tripId,
      order: orderInDay, // Order within the specific day
      day: assignedDay, // Auto-assign to a day
    },
  });

  redirect(`/trips/${tripId}`);
}
