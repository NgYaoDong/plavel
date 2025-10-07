"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function deleteAccommodation(
  accommodationId: string,
  tripId: string
) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Verify the accommodation belongs to a trip owned by the user
  const accommodation = await prisma.accommodation.findUnique({
    where: { id: accommodationId },
    include: { trip: true },
  });

  if (!accommodation || accommodation.trip.userId !== session.user.id) {
    throw new Error("Not authorized to delete this accommodation");
  }

  await prisma.accommodation.delete({
    where: { id: accommodationId },
  });

  revalidatePath(`/trips/${tripId}`);
}
