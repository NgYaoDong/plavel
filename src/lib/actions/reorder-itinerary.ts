"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditTrip } from "@/lib/trip-permissions";

export async function reorderItinerary(tripId: string, newOrder: string[]) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Check if user has permission to edit this trip (editor, admin, or owner)
  const canEdit = await canEditTrip(tripId, session.user.id);
  if (!canEdit) {
    throw new Error("Not authorized to reorder locations");
  }

  // Get all locations with their days
  const locations = await prisma.location.findMany({
    where: { tripId },
    select: { id: true, day: true },
  });

  // Create a map of locationId -> day
  const locationDayMap = new Map(locations.map((loc) => [loc.id, loc.day]));

  // Group newOrder by day and assign order within each day
  const updatesByDay = new Map<number, string[]>();

  for (const locationId of newOrder) {
    const day = locationDayMap.get(locationId) ?? 1;
    if (!updatesByDay.has(day)) {
      updatesByDay.set(day, []);
    }
    updatesByDay.get(day)!.push(locationId);
  }

  // Create update operations for each location with order within its day
  const updates = Array.from(updatesByDay.values()).flatMap((locationIds) =>
    locationIds.map((locationId, orderInDay) =>
      prisma.location.updateMany({
        where: {
          id: locationId,
          tripId: tripId,
        },
        data: {
          order: orderInDay, // Order within the day
        },
      })
    )
  );

  await prisma.$transaction(updates);
}
