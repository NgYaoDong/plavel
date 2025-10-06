"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function deleteTrip(tripId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Verify the trip belongs to the user before deleting
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { userId: true },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.userId !== session.user.id) {
    throw new Error("Unauthorized to delete this trip");
  }

  // Delete the trip (cascade will handle related locations)
  await prisma.trip.delete({
    where: { id: tripId },
  });

  redirect("/trips");
}
