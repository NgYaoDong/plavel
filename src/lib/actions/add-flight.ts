"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function addFlight(formData: FormData, tripId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Verify the trip belongs to the user
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { userId: true },
  });

  if (!trip || trip.userId !== session.user.id) {
    throw new Error("Not authorized to add flight to this trip");
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

  await prisma.flight.create({
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
      tripId,
    },
  });

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
