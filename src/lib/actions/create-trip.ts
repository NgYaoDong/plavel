"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createTrip(formData: FormData) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
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

  const trip = await prisma.trip.create({
    data: {
      title,
      description: description || null,
      startDate,
      endDate,
      imageUrl: imageUrl || null,
      budget,
      user: {
        connect: {
          id: session.user.id,
        },
      },
    },
  });

  redirect(`/trips/${trip.id}`);
}
