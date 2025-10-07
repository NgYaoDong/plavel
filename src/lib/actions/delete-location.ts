"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function deleteLocation(locationId: string, tripId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify the trip belongs to the user
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { userId: true },
  });

  if (!trip || trip.userId !== session.user.id) {
    throw new Error("Not authorized to delete this location");
  }

  // Delete the location
  await prisma.location.delete({
    where: { id: locationId },
  });

  // Revalidate the trip page to reflect changes
  revalidatePath(`/trips/${tripId}`);
}
