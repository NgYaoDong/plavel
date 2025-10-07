"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { canEditTrip } from "@/lib/trip-permissions";

export async function updateExpense(
  formData: FormData,
  expenseId: string,
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
    throw new Error("Not authorized to update this expense");
  }

  // Verify the expense belongs to this trip and get existing payment
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: {
      id: true,
      tripId: true,
      payment: {
        include: {
          splits: true,
        },
      },
    },
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

  // Handle payment updates
  if (paidBy) {
    // Get trip with collaborators
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

    // Build list of all trip members
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

    // Update expense and handle payment in transaction
    await prisma.$transaction(async (tx) => {
      // Update expense
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          description,
          amount,
          category,
        },
      });

      // If payment exists, update it
      if (expense.payment) {
        // Delete old splits
        await tx.paymentSplit.deleteMany({
          where: { paymentId: expense.payment.id },
        });

        // Update payment
        await tx.payment.update({
          where: { id: expense.payment.id },
          data: {
            paidBy,
            amount,
            description,
            category,
            splits: {
              create: tripMemberIds.map((userId) => ({
                userId,
                amount: splitAmount,
                settled: userId === paidBy,
              })),
            },
          },
        });
      } else {
        // Create new payment if it didn't exist
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
                settled: userId === paidBy,
              })),
            },
          },
        });
      }
    });
  } else {
    // No paidBy provided, just update expense and delete payment if it exists
    await prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          description,
          amount,
          category,
        },
      });

      // If there was a payment, delete it
      if (expense.payment) {
        await tx.payment.delete({
          where: { id: expense.payment.id },
        });
      }
    });
  }

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
