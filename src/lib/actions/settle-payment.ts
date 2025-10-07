"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

interface SettlePaymentInput {
  paymentSplitId: string;
}

export async function settlePaymentSplit(input: SettlePaymentInput) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  const { paymentSplitId } = input;

  // Get the payment split
  const split = await prisma.paymentSplit.findUnique({
    where: { id: paymentSplitId },
    include: {
      payment: {
        include: {
          trip: true,
        },
      },
    },
  });

  if (!split) {
    throw new Error("Payment split not found");
  }

  // Only the person who owes the money or the trip owner can settle
  if (
    split.userId !== session.user.id &&
    split.payment.trip.userId !== session.user.id
  ) {
    throw new Error("Not authorized to settle this payment");
  }

  // Mark as settled
  await prisma.paymentSplit.update({
    where: { id: paymentSplitId },
    data: {
      settled: true,
      settledAt: new Date(),
    },
  });

  revalidatePath(`/trips/${split.payment.tripId}`);
  return { success: true };
}

// Helper function to settle all splits between two users
export async function settleAllDebts(
  tripId: string,
  fromUserId: string,
  toUserId: string
) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Verify user is part of the trip
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      shares: true,
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  const userId = session.user.id;
  const isPartOfTrip =
    trip.userId === userId ||
    trip.shares.some((share) => share.userId === userId);

  if (!isPartOfTrip) {
    throw new Error("Not authorized to access this trip");
  }

  // Only the person paying, receiving, or trip owner can settle
  if (userId !== fromUserId && userId !== toUserId && userId !== trip.userId) {
    throw new Error("Not authorized to settle these payments");
  }

  // Find all unsettled splits where fromUser owes toUser
  const unsettledSplits = await prisma.paymentSplit.findMany({
    where: {
      payment: {
        tripId,
        paidBy: toUserId,
      },
      userId: fromUserId,
      settled: false,
    },
  });

  // Settle all of them
  await prisma.paymentSplit.updateMany({
    where: {
      id: {
        in: unsettledSplits.map((s) => s.id),
      },
    },
    data: {
      settled: true,
      settledAt: new Date(),
    },
  });

  revalidatePath(`/trips/${tripId}`);
  return { success: true, settledCount: unsettledSplits.length };
}
