"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSharing } from "@/lib/trip-permissions";
import { revalidatePath } from "next/cache";

export async function removeShare(shareId: string, tripId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user has permission to manage sharing
  const canManage = await canManageSharing(tripId, session.user.id);
  if (!canManage) {
    return {
      success: false,
      error: "You don't have permission to remove users from this trip",
    };
  }

  // Verify the share belongs to this trip
  const share = await prisma.tripShare.findUnique({
    where: { id: shareId },
    select: { tripId: true, role: true },
  });

  if (!share || share.tripId !== tripId) {
    return { success: false, error: "Share not found" };
  }

  // Prevent removing admin if user is not owner (only owner can remove admins)
  if (share.role === "admin") {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true },
    });

    if (trip?.userId !== session.user.id) {
      return {
        success: false,
        error: "Only the trip owner can remove admins",
      };
    }
  }

  // Delete the share
  await prisma.tripShare.delete({
    where: { id: shareId },
  });

  revalidatePath(`/trips/${tripId}`);

  return { success: true };
}
