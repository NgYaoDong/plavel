"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function updateLocationDay(
  locationId: string,
  newDay: number,
  tripId: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify the trip belongs to the user
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { userId: true, locations: true },
  });

  if (!trip || trip.userId !== session.user.id) {
    throw new Error("Not authorized to update this location");
  }

  // Count how many locations are already in the target day
  const locationsInTargetDay = trip.locations.filter(
    (loc) => loc.day === newDay
  ).length;

  // Update the location's day and set order to be at the end of the target day
  await prisma.location.update({
    where: { id: locationId },
    data: {
      day: newDay,
      order: locationsInTargetDay, // Place at end of target day
    },
  });

  revalidatePath(`/trips/${tripId}`);
}
