"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function deleteFlight(flightId: string, tripId: string) {
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
    throw new Error("Not authorized to delete this flight");
  }

  await prisma.flight.delete({
    where: { id: flightId },
  });

  revalidatePath(`/trips/${tripId}`);
}
