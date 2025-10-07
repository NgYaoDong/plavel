"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { canEditTrip } from "@/lib/trip-permissions";

export async function deletePayment(paymentId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated");
  }

  // Get the payment to verify trip ownership
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      trip: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Check if user has permission to edit this trip
  const canEdit = await canEditTrip(payment.tripId, session.user.id);
  if (!canEdit) {
    throw new Error("Not authorized to delete payments in this trip");
  }

  // Delete the payment (splits will be cascade deleted)
  await prisma.payment.delete({
    where: { id: paymentId },
  });

  revalidatePath(`/trips/${payment.tripId}`);
  return { success: true };
}
