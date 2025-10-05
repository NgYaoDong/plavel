"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function reorderItinerary(tripId: string, newOrder: string[]) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  await prisma.$transaction(
    newOrder.map((locationId: string, index: number) =>
      prisma.location.updateMany({
        where: {
          id: locationId,
          tripId: tripId,
        },
        data: {
          order: index,
        },
      })
    )
  );
}
