"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { canEditTrip } from "@/lib/trip-permissions";

export async function editTrip(tripId: string, formData: FormData) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Check if user has permission to edit (editor, admin, or owner)
  const canEdit = await canEditTrip(tripId, session.user.id);
  if (!canEdit) {
    throw new Error("You don't have permission to edit this trip");
  }

  const title = formData.get("title")?.toString();
  const description = formData.get("description")?.toString();
  const startDateStr = formData.get("startDate")?.toString();
  const endDateStr = formData.get("endDate")?.toString();
  const imageUrl = formData.get("imageUrl")?.toString();
  const budgetStr = formData.get("budget")?.toString();

  if (!title || !startDateStr || !endDateStr) {
    throw new Error("Missing required fields");
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("Invalid date");
  }
  if (startDate > endDate) {
    throw new Error("Start date must be before end date");
  }

  // Parse budget if provided
  const budget =
    budgetStr && budgetStr.trim() !== "" ? parseFloat(budgetStr) : null;
  if (budget !== null && (isNaN(budget) || budget < 0)) {
    throw new Error("Invalid budget amount");
  }

  // Update trip without userId check since we use permission system
  await prisma.trip.update({
    where: {
      id: tripId,
    },
    data: {
      title,
      description,
      startDate,
      endDate,
      imageUrl,
      budget,
    },
  });

  redirect(`/trips/${tripId}`);
}
