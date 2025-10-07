"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { canEditTrip } from "@/lib/trip-permissions";

interface PaymentSplitInput {
  userId: string;
  amount?: number; // For custom splits
  percentage?: number; // For percentage splits
}

interface AddPaymentInput {
  tripId: string;
  description: string;
  amount: number;
  currency?: string;
  category?: string;
  splitType: "equal" | "custom" | "percentage";
  splits: PaymentSplitInput[];
  // Optional: link to existing trip items
  expenseId?: string;
  accommodationId?: string;
  flightId?: string;
  locationId?: string;
}

export async function addPayment(input: AddPaymentInput) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  const {
    tripId,
    description,
    amount,
    currency = "SGD",
    category,
    splitType,
    splits,
    expenseId,
    accommodationId,
    flightId,
    locationId,
  } = input;

  // Validate required fields
  if (!description || !amount || amount <= 0) {
    throw new Error("Invalid payment details");
  }

  if (!splits || splits.length === 0) {
    throw new Error("At least one person must be included in the split");
  }

  // Check if user has permission to edit this trip
  const canEdit = await canEditTrip(tripId, session.user.id);
  if (!canEdit) {
    throw new Error("Not authorized to add payments to this trip");
  }

  // Verify the trip exists and get collaborators
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
  const tripMemberIds = new Set([
    trip.userId,
    ...trip.shares.map((share) => share.userId),
  ]);

  // Validate that all split users are trip members
  for (const split of splits) {
    if (!tripMemberIds.has(split.userId)) {
      throw new Error("Split includes users who are not trip members");
    }
  }

  // Calculate split amounts based on split type
  let calculatedSplits: { userId: string; amount: number }[] = [];

  switch (splitType) {
    case "equal": {
      // Divide equally among all participants
      const splitAmount = amount / splits.length;
      calculatedSplits = splits.map((split) => ({
        userId: split.userId,
        amount: Math.round(splitAmount * 100) / 100, // Round to 2 decimals
      }));
      break;
    }

    case "custom": {
      // Use provided amounts
      calculatedSplits = splits.map((split) => ({
        userId: split.userId,
        amount: split.amount || 0,
      }));

      // Validate that custom amounts add up to total
      const totalSplit = calculatedSplits.reduce((sum, s) => sum + s.amount, 0);
      if (Math.abs(totalSplit - amount) > 0.01) {
        throw new Error(
          `Split amounts (${totalSplit}) must equal total amount (${amount})`
        );
      }
      break;
    }

    case "percentage": {
      // Calculate amounts from percentages
      calculatedSplits = splits.map((split) => ({
        userId: split.userId,
        amount:
          Math.round(((amount * (split.percentage || 0)) / 100) * 100) / 100,
      }));

      // Validate that percentages add up to 100
      const totalPercentage = splits.reduce(
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

  // Create the payment with splits in a transaction
  const payerId = session.user.id;
  await prisma.payment.create({
    data: {
      tripId,
      paidBy: payerId,
      amount,
      currency,
      description,
      category,
      splitType,
      expenseId,
      accommodationId,
      flightId,
      locationId,
      splits: {
        create: calculatedSplits.map((split) => ({
          userId: split.userId,
          amount: split.amount,
          settled: split.userId === payerId, // Automatically settle payer's own share
        })),
      },
    },
  });

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
