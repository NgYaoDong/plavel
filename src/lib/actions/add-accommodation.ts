"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { canEditTrip } from "@/lib/trip-permissions";

export async function addAccommodation(formData: FormData, tripId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Check if user has permission to edit this trip (editor, admin, or owner)
  const canEdit = await canEditTrip(tripId, session.user.id);
  if (!canEdit) {
    throw new Error("Not authorized to add accommodation to this trip");
  }

  const name = formData.get("name")?.toString();
  const address = formData.get("address")?.toString();
  const checkInDate = formData.get("checkInDate")?.toString();
  const checkOutDate = formData.get("checkOutDate")?.toString();
  const confirmationNumber = formData.get("confirmationNumber")?.toString();
  const bookingLink = formData.get("bookingLink")?.toString();
  const costStr = formData.get("cost")?.toString();
  const notes = formData.get("notes")?.toString();

  if (!name || !checkInDate || !checkOutDate) {
    throw new Error("Name, check-in date, and check-out date are required");
  }

  // Validate check-out date is after check-in date
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  if (checkOut <= checkIn) {
    throw new Error("Check-out date must be after check-in date");
  }

  const cost = costStr ? parseFloat(costStr) : null;

  await prisma.accommodation.create({
    data: {
      name,
      address: address || null,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      confirmationNumber: confirmationNumber || null,
      bookingLink: bookingLink || null,
      cost,
      notes: notes || null,
      tripId,
    },
  });

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
