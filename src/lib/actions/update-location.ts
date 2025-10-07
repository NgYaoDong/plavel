"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { canEditTrip } from "@/lib/trip-permissions";

export async function updateLocation(
  formData: FormData,
  locationId: string,
  tripId: string
) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Check if user has permission to edit this trip (editor, admin, or owner)
  const canEdit = await canEditTrip(tripId, session.user.id);
  if (!canEdit) {
    throw new Error("Not authorized to update this location");
  }

  // Verify the location belongs to this trip
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { id: true, tripId: true },
  });

  if (!location || location.tripId !== tripId) {
    throw new Error("Location not found or doesn't belong to this trip");
  }

  const locationTitle = formData.get("locationTitle")?.toString();
  if (!locationTitle) {
    throw new Error("Location title is required");
  }

  // Get optional time fields
  const startTimeStr = formData.get("startTime")?.toString();
  const endTimeStr = formData.get("endTime")?.toString();

  let startTime: Date | null = null;
  let endTime: Date | null = null;
  let duration: number | null = null;

  // Parse and validate times if provided
  if (startTimeStr) {
    startTime = new Date(startTimeStr);
  }
  if (endTimeStr) {
    endTime = new Date(endTimeStr);
  }

  // Validate time order if both are provided
  if (startTime && endTime && endTime <= startTime) {
    throw new Error("End time must be after start time");
  }

  // Calculate duration in minutes if both times are provided
  if (startTime && endTime) {
    duration = Math.round(
      (endTime.getTime() - startTime.getTime()) / (1000 * 60)
    );
  }

  // Get optional notes field
  const notes = formData.get("notes")?.toString() || null;

  // Get optional cost and category fields
  const costStr = formData.get("cost")?.toString();
  const category = formData.get("category")?.toString() || null;

  // Parse cost if provided
  const cost = costStr && costStr.trim() !== "" ? parseFloat(costStr) : null;
  if (cost !== null && (isNaN(cost) || cost < 0)) {
    throw new Error("Invalid cost amount");
  }

  // Update the location
  await prisma.location.update({
    where: { id: locationId },
    data: {
      locationTitle,
      startTime,
      endTime,
      duration,
      notes,
      cost,
      category,
    },
  });

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
