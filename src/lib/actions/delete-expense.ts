"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function deleteExpense(expenseId: string, tripId: string) {
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
    throw new Error("Not authorized to delete this expense");
  }

  // Delete the expense
  await prisma.expense.delete({
    where: { id: expenseId },
  });

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
