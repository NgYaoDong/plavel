"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { canEditTrip } from "@/lib/trip-permissions";

export async function addExpense(
  formData: FormData,
  tripId: string,
  paidBy?: string // Optional: user who paid for this expense
) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Check if user has permission to edit this trip (editor, admin, or owner)
  const canEdit = await canEditTrip(tripId, session.user.id);
  if (!canEdit) {
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

  // If paidBy is provided, create payment with linked expense
  if (paidBy) {
    // Get trip with collaborators to create splits
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        shares: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!trip) {
      throw new Error("Trip not found");
    }

    // Build list of all trip members (owner + collaborators)
    const tripMemberIds = [
      trip.userId,
      ...trip.shares.map((share) => share.userId),
    ];

    // Validate paidBy is a trip member
    if (!tripMemberIds.includes(paidBy)) {
      throw new Error("Payer must be a trip member");
    }

    // Calculate equal split among all members
    const splitAmount = Math.round((amount / tripMemberIds.length) * 100) / 100;

    // Create expense with linked payment in a transaction
    await prisma.$transaction(async (tx) => {
      // Create expense first
      const expense = await tx.expense.create({
        data: {
          description,
          amount,
          category,
          tripId,
        },
      });

      // Create payment linked to expense
      await tx.payment.create({
        data: {
          tripId,
          paidBy,
          amount,
          currency: "SGD",
          description,
          category,
          expenseId: expense.id,
          splitType: "equal",
          splits: {
            create: tripMemberIds.map((userId) => ({
              userId,
              amount: splitAmount,
              settled: userId === paidBy, // Payer's share is auto-settled
            })),
          },
        },
      });
    });
  } else {
    // No payer specified, just create expense without payment
    await prisma.expense.create({
      data: {
        description,
        amount,
        category,
        tripId,
      },
    });
  }

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
