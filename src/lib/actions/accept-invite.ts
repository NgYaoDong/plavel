"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function acceptInvite(token: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id || !session.user.email) {
    return { success: false, error: "Not authenticated" };
  }

  // Find the invite
  const invite = await prisma.tripInvite.findUnique({
    where: { token },
    include: {
      trip: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!invite) {
    return { success: false, error: "Invite not found" };
  }

  // Check if invite has expired
  if (new Date() > invite.expiresAt) {
    return { success: false, error: "This invite has expired" };
  }

  // Check if invite has already been accepted
  if (invite.accepted) {
    return { success: false, error: "This invite has already been accepted" };
  }

  // Check if invite email matches user's email
  if (invite.email !== session.user.email) {
    return {
      success: false,
      error: "This invite was sent to a different email address",
    };
  }

  // Check if user already has access
  const existingShare = await prisma.tripShare.findUnique({
    where: {
      tripId_userId: {
        tripId: invite.tripId,
        userId: session.user.id,
      },
    },
  });

  if (existingShare) {
    return { success: false, error: "You already have access to this trip" };
  }

  // Create the share and mark invite as accepted
  await prisma.$transaction([
    prisma.tripShare.create({
      data: {
        tripId: invite.tripId,
        userId: session.user.id,
        role: invite.role,
        invitedBy: invite.invitedBy,
      },
    }),
    prisma.tripInvite.update({
      where: { id: invite.id },
      data: { accepted: true },
    }),
  ]);

  revalidatePath(`/trips/${invite.tripId}`);
  revalidatePath("/trips");

  return {
    success: true,
    tripId: invite.tripId,
    tripTitle: invite.trip.title,
  };
}
