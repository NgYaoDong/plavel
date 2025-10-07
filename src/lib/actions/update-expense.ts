"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function updateExpense(
  formData: FormData,
  expenseId: string,
  tripId: string
) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Verify the expense belongs to a trip owned by this user
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { trip: true },
  });

  if (!expense || expense.trip.userId !== session.user.id) {
    throw new Error("Not authorized to update this expense");
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
