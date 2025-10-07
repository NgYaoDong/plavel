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
  const timezoneOffsetStr = formData.get("timezoneOffset")?.toString();

  let startTime: Date | null = null;
  let endTime: Date | null = null;
  let duration: number | null = null;

  // Parse timezone offset (in minutes, negative for ahead of UTC)
  // For Singapore: offset = -480 (480 minutes ahead of UTC)
  const timezoneOffset = timezoneOffsetStr ? parseInt(timezoneOffsetStr) : 0;

  // Parse and validate times if provided
  // The datetime-local input sends time in the user's local timezone (e.g., "2024-10-08T10:00")
  // but new Date() on the server interprets it in the SERVER's timezone
  // We need to convert: user's local time → UTC
  if (startTimeStr) {
    // Create date treating the input as UTC (to avoid server timezone interpretation)
    const parts = startTimeStr.split("T");
    const datePart = parts[0];
    const timePart = parts[1] || "00:00";
    startTime = new Date(`${datePart}T${timePart}:00Z`); // Parse as UTC
    // Now adjust for user's timezone: add the offset back
    // If user is GMT+8 (offset=-480), we subtract 8 hours to get UTC
    startTime = new Date(startTime.getTime() + timezoneOffset * 60 * 1000);
  }
  if (endTimeStr) {
    const parts = endTimeStr.split("T");
    const datePart = parts[0];
    const timePart = parts[1] || "00:00";
    endTime = new Date(`${datePart}T${timePart}:00Z`);
    endTime = new Date(endTime.getTime() + timezoneOffset * 60 * 1000);
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
