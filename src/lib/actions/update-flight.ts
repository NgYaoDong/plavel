"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { canEditTrip } from "@/lib/trip-permissions";

export async function updateFlight(
  flightId: string,
  formData: FormData,
  tripId: string
) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Check if user has permission to edit this trip (editor, admin, or owner)
  const canEdit = await canEditTrip(tripId, session.user.id);
  if (!canEdit) {
    throw new Error("Not authorized to update this flight");
  }

  // Verify the flight belongs to this trip
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    select: { id: true, tripId: true },
  });

  if (!flight || flight.tripId !== tripId) {
    throw new Error("Flight not found or doesn't belong to this trip");
  }

  const airline = formData.get("airline")?.toString();
  const flightNumber = formData.get("flightNumber")?.toString();
  const departureAirport = formData.get("departureAirport")?.toString();
  const arrivalAirport = formData.get("arrivalAirport")?.toString();
  const departureTime = formData.get("departureTime")?.toString();
  const arrivalTime = formData.get("arrivalTime")?.toString();
  const timezoneOffsetStr = formData.get("timezoneOffset")?.toString();
  const bookingReference = formData.get("bookingReference")?.toString();
  const costStr = formData.get("cost")?.toString();
  const seatNumber = formData.get("seatNumber")?.toString();
  const notes = formData.get("notes")?.toString();

  if (
    !airline ||
    !flightNumber ||
    !departureAirport ||
    !arrivalAirport ||
    !departureTime ||
    !arrivalTime
  ) {
    throw new Error("Airline, flight number, airports, and times are required");
  }

  // Parse timezone offset (in minutes, negative for ahead of UTC)
  const timezoneOffset = timezoneOffsetStr ? parseInt(timezoneOffsetStr) : 0;

  // Validate arrival time is after departure time
  // Adjust for timezone: subtract the offset to get the correct UTC time
  const departureLocal = new Date(departureTime);
  const arrivalLocal = new Date(arrivalTime);
  const departure = new Date(departureLocal.getTime() - timezoneOffset * 60 * 1000);
  const arrival = new Date(arrivalLocal.getTime() - timezoneOffset * 60 * 1000);
  
  if (arrival <= departure) {
    throw new Error("Arrival time must be after departure time");
  }

  const cost = costStr ? parseFloat(costStr) : null;

  await prisma.flight.update({
    where: { id: flightId },
    data: {
      airline,
      flightNumber,
      departureAirport,
      arrivalAirport,
      departureTime: departure,
      arrivalTime: arrival,
      bookingReference: bookingReference || null,
      cost,
      seatNumber: seatNumber || null,
      notes: notes || null,
    },
  });

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
