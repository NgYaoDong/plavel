"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { canEditTrip } from "@/lib/trip-permissions";

export async function addFlight(formData: FormData, tripId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Check if user has permission to edit this trip (editor, admin, or owner)
  const canEdit = await canEditTrip(tripId, session.user.id);
  if (!canEdit) {
    throw new Error("Not authorized to add flight to this trip");
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
  // For Singapore: offset = -480 (480 minutes ahead of UTC)
  const timezoneOffset = timezoneOffsetStr ? parseInt(timezoneOffsetStr) : 0;

  // Parse and validate times if provided
  // The datetime-local input sends time in the user's local timezone (e.g., "2024-10-08T10:00")
  // but new Date() on the server interprets it in the SERVER's timezone
  // We need to convert: user's local time → UTC
  const departureLocal = departureTime.split("T");
  const arrivalLocal = arrivalTime.split("T");

  const departure = new Date(
    `${departureLocal[0]}T${departureLocal[1] || "00:00"}:00Z`
  );
  const arrival = new Date(
    `${arrivalLocal[0]}T${arrivalLocal[1] || "00:00"}:00Z`
  );

  // Now adjust for user's timezone: add the offset back
  // If user is GMT+8 (offset=-480), we subtract 8 hours to get UTC
  const departureUTC = new Date(
    departure.getTime() + timezoneOffset * 60 * 1000
  );
  const arrivalUTC = new Date(arrival.getTime() + timezoneOffset * 60 * 1000);

  if (arrivalUTC <= departureUTC) {
    throw new Error("Arrival time must be after departure time");
  }

  const cost = costStr ? parseFloat(costStr) : null;

  await prisma.flight.create({
    data: {
      airline,
      flightNumber,
      departureAirport,
      arrivalAirport,
      departureTime: departureUTC,
      arrivalTime: arrivalUTC,
      bookingReference: bookingReference || null,
      cost,
      seatNumber: seatNumber || null,
      notes: notes || null,
      tripId,
    },
  });

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
