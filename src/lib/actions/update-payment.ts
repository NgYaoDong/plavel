"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { canEditTrip } from "@/lib/trip-permissions";

interface PaymentSplitInput {
  userId: string;
  amount?: number;
  percentage?: number;
}

interface UpdatePaymentInput {
  paymentId: string;
  description?: string;
  amount?: number;
  currency?: string;
  category?: string;
  splitType?: "equal" | "custom" | "percentage";
  splits?: PaymentSplitInput[];
}

export async function updatePayment(input: UpdatePaymentInput) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  const {
    paymentId,
    description,
    amount,
    currency,
    category,
    splitType,
    splits,
  } = input;

  // Get the existing payment
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      trip: {
        include: {
          shares: {
            include: {
              user: true,
            },
          },
        },
      },
      splits: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Check if user has permission to edit this trip
  const canEdit = await canEditTrip(payment.tripId, session.user.id);
  if (!canEdit) {
    throw new Error("Not authorized to update payments in this trip");
  }

  // Build update data
  const updateData: {
    description?: string;
    currency?: string;
    category?: string | null;
  } = {};
  if (description !== undefined) updateData.description = description;
  if (currency !== undefined) updateData.currency = currency;
  if (category !== undefined) updateData.category = category;

  // If amount or splits are being updated, recalculate splits
  if (amount !== undefined || splitType !== undefined || splits !== undefined) {
    const finalAmount = amount ?? payment.amount;
    const finalSplitType = splitType ?? payment.splitType;
    const finalSplits: PaymentSplitInput[] =
      splits ??
      payment.splits.map((s) => ({
        userId: s.userId,
        amount: s.amount,
      }));

    if (finalAmount <= 0) {
      throw new Error("Invalid payment amount");
    }

    if (finalSplits.length === 0) {
      throw new Error("At least one person must be included in the split");
    }

    // Build list of all trip members
    const tripMemberIds = new Set([
      payment.trip.userId,
      ...payment.trip.shares.map((share) => share.userId),
    ]);

    // Validate that all split users are trip members
    for (const split of finalSplits) {
      if (!tripMemberIds.has(split.userId)) {
        throw new Error("Split includes users who are not trip members");
      }
    }

    // Calculate split amounts based on split type
    let calculatedSplits: { userId: string; amount: number }[] = [];

    switch (finalSplitType) {
      case "equal": {
        const splitAmount = finalAmount / finalSplits.length;
        calculatedSplits = finalSplits.map((split) => ({
          userId: split.userId,
          amount: Math.round(splitAmount * 100) / 100,
        }));
        break;
      }

      case "custom": {
        calculatedSplits = finalSplits.map((split) => ({
          userId: split.userId,
          amount: split.amount || 0,
        }));

        const totalSplit = calculatedSplits.reduce(
          (sum, s) => sum + s.amount,
          0
        );
        if (Math.abs(totalSplit - finalAmount) > 0.01) {
          throw new Error(
            `Split amounts (${totalSplit}) must equal total amount (${finalAmount})`
          );
        }
        break;
      }

      case "percentage": {
        calculatedSplits = finalSplits.map((split) => ({
          userId: split.userId,
          amount:
            Math.round(((finalAmount * (split.percentage || 0)) / 100) * 100) /
            100,
        }));

        const totalPercentage = finalSplits.reduce(
          (sum, s) => sum + (s.percentage || 0),
          0
        );
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw new Error(
            `Split percentages must equal 100% (current: ${totalPercentage}%)`
          );
        }
        break;
      }

      default:
        throw new Error("Invalid split type");
    }

    // Update payment and replace splits
    await prisma.$transaction([
      // Delete old splits
      prisma.paymentSplit.deleteMany({
        where: { paymentId },
      }),
      // Update payment
      prisma.payment.update({
        where: { id: paymentId },
        data: {
          ...updateData,
          amount: finalAmount,
          splitType: finalSplitType,
        },
      }),
      // Create new splits
      ...calculatedSplits.map((split) =>
        prisma.paymentSplit.create({
          data: {
            paymentId,
            userId: split.userId,
            amount: split.amount,
            settled: split.userId === payment.paidBy, // Maintain payer's settled status
          },
        })
      ),
    ]);
  } else {
    // Only updating description/currency/category, no split recalculation
    await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
    });
  }

  revalidatePath(`/trips/${payment.tripId}`);
  return { success: true };
}
