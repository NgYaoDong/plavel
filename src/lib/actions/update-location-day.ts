"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { canEditTrip } from "@/lib/trip-permissions";

export async function updateLocationDay(
  locationId: string,
  newDay: number,
  tripId: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Check if user has permission to edit this trip (editor, admin, or owner)
  const canEdit = await canEditTrip(tripId, session.user.id);
  if (!canEdit) {
    throw new Error("Not authorized to update this location");
  }

  // Get the trip and its locations to calculate new order
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, locations: true },
  });

  if (!trip) {
    throw new Error("Trip not found");
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
