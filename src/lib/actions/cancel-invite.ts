"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSharing } from "@/lib/trip-permissions";
import { revalidatePath } from "next/cache";

export async function cancelInvite(inviteId: string, tripId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user has permission to manage sharing
  const canManage = await canManageSharing(tripId, session.user.id);
  if (!canManage) {
    return {
      success: false,
      error: "You don't have permission to cancel invites for this trip",
    };
  }

  // Verify the invite belongs to this trip
  const invite = await prisma.tripInvite.findUnique({
    where: { id: inviteId },
    select: { tripId: true },
  });

  if (!invite || invite.tripId !== tripId) {
    return { success: false, error: "Invite not found" };
  }

  // Delete the invite
  await prisma.tripInvite.delete({
    where: { id: inviteId },
  });

  revalidatePath(`/trips/${tripId}`);

  return { success: true };
}
