"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { canEditTrip } from "@/lib/trip-permissions";

export async function deleteLocation(locationId: string, tripId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Check if user has permission to edit this trip (editor, admin, or owner)
  const canEdit = await canEditTrip(tripId, session.user.id);
  if (!canEdit) {
    throw new Error("Not authorized to delete this location");
  }

  // Delete the location
  await prisma.location.delete({
    where: { id: locationId },
  });

  // Revalidate the trip page to reflect changes
  revalidatePath(`/trips/${tripId}`);
}
