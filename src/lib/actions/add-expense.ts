"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function addExpense(formData: FormData, tripId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Verify the trip belongs to the user
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip || trip.userId !== session.user.id) {
    throw new Error("Not authorized to add expenses to this trip");
  }

  const description = formData.get("description")?.toString();
  const amountStr = formData.get("amount")?.toString();
  const category = formData.get("category")?.toString();

  if (!description || !amountStr || !category) {
    throw new Error("Missing required fields");
  }

  // Parse and validate amount
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid amount");
  }

  // Create the expense
  await prisma.expense.create({
    data: {
      description,
      amount,
      category,
      tripId,
    },
  });

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
