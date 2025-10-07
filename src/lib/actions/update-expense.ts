"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { canEditTrip } from "@/lib/trip-permissions";

export async function updateExpense(
  formData: FormData,
  expenseId: string,
  tripId: string
) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Check if user has permission to edit this trip (editor, admin, or owner)
  const canEdit = await canEditTrip(tripId, session.user.id);
  if (!canEdit) {
    throw new Error("Not authorized to update this expense");
  }

  // Verify the expense belongs to this trip
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { id: true, tripId: true },
  });

  if (!expense || expense.tripId !== tripId) {
    throw new Error("Expense not found or doesn't belong to this trip");
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

  // Update the expense
  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      description,
      amount,
      category,
    },
  });

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
