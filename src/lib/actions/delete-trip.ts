"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { isTripOwner } from "@/lib/trip-permissions";

export async function deleteTrip(tripId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Only the owner can delete a trip
  const isOwner = await isTripOwner(tripId, session.user.id);
  if (!isOwner) {
    throw new Error("Only the trip owner can delete this trip");
  }

  // Delete the trip (cascade will handle related locations, shares, invites, etc.)
  await prisma.trip.delete({
    where: { id: tripId },
  });

  redirect("/trips");
}
