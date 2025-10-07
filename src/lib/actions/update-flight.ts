"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function updateFlight(
  flightId: string,
  formData: FormData,
  tripId: string
) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Verify the flight belongs to a trip owned by the user
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: { trip: true },
  });

  if (!flight || flight.trip.userId !== session.user.id) {
    throw new Error("Not authorized to update this flight");
  }

  const airline = formData.get("airline")?.toString();
  const flightNumber = formData.get("flightNumber")?.toString();
  const departureAirport = formData.get("departureAirport")?.toString();
  const arrivalAirport = formData.get("arrivalAirport")?.toString();
  const departureTime = formData.get("departureTime")?.toString();
  const arrivalTime = formData.get("arrivalTime")?.toString();
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

  // Validate arrival time is after departure time
  const departure = new Date(departureTime);
  const arrival = new Date(arrivalTime);
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
