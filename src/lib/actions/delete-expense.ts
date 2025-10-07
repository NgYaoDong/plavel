"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { canEditTrip } from "@/lib/trip-permissions";

export async function deleteExpense(expenseId: string, tripId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Check if user has permission to edit this trip (editor, admin, or owner)
  const canEdit = await canEditTrip(tripId, session.user.id);
  if (!canEdit) {
    throw new Error("Not authorized to delete this expense");
  }

  // Delete the expense
  await prisma.expense.delete({
    where: { id: expenseId },
  });

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
