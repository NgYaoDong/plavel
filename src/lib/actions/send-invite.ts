"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSharing } from "@/lib/trip-permissions";
import { revalidatePath } from "next/cache";
import { brevoClient } from "@/lib/brevo";
import { TripInviteEmail } from "@/components/emails/TripInviteEmail";
import { render } from "@react-email/render";
import * as brevo from "@getbrevo/brevo";

export async function sendInvite(
  tripId: string,
  email: string,
  role: "viewer" | "editor"
) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user has permission to manage sharing (admin or owner)
  const canManage = await canManageSharing(tripId, session.user.id);
  if (!canManage) {
    return {
      success: false,
      error: "You don't have permission to invite users to this trip",
    };
  }

  // Validate email
  if (!email || !email.includes("@")) {
    return { success: false, error: "Invalid email address" };
  }

  // Check if trip exists
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      startDate: true,
      endDate: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!trip) {
    return { success: false, error: "Trip not found" };
  }

  // Check if user is trying to invite themselves
  if (session.user.email === email) {
    return { success: false, error: "You cannot invite yourself" };
  }

  // Check if user is trying to invite the owner
  const owner = await prisma.user.findUnique({
    where: { id: trip.userId },
    select: { email: true },
  });

  if (owner?.email === email) {
    return { success: false, error: "Cannot invite the trip owner" };
  }

  // Check if user with this email exists and already has access
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const existingShare = await prisma.tripShare.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId: existingUser.id,
        },
      },
    });

    if (existingShare) {
      return { success: false, error: "User already has access to this trip" };
    }
  }

  // Check if there's already a pending invite for this email
  const existingInvite = await prisma.tripInvite.findFirst({
    where: {
      tripId,
      email,
      accepted: false,
    },
  });

  if (existingInvite) {
    return {
      success: false,
      error: "An invite has already been sent to this email",
    };
  }

  // Create the invite (expires in 7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.tripInvite.create({
    data: {
      tripId,
      email,
      role,
      invitedBy: session.user.id,
      expiresAt,
    },
  });

  // Send email notification with invite link
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/invites/${invite.token}`;

    // Format trip dates
    const startDate = new Date(trip.startDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const endDate = new Date(trip.endDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const tripDates = `${startDate} - ${endDate}`;

    const expiryDate = expiresAt.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Extract invitee name from email (before @)
    const inviteeName = email.split("@")[0];
    const inviterName = trip.user.name || trip.user.email || "Someone";

    const emailHtml = await render(
      TripInviteEmail({
        inviteeName,
        inviterName,
        tripTitle: trip.title,
        tripDescription: trip.description,
        tripDates,
        role,
        inviteLink,
        expiresAt: expiryDate,
      })
    );

    // Email sender - MUST be set to your verified Brevo account email
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || "Plavel";

    if (!senderEmail) {
      throw new Error(
        "BREVO_SENDER_EMAIL is not set. Please add your Brevo signup email to .env.local"
      );
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: senderEmail, name: senderName };
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.subject = `${inviterName} invited you to join "${trip.title}" on Plavel`;
    sendSmtpEmail.htmlContent = emailHtml;

    await brevoClient.sendTransacEmail(sendSmtpEmail);
  } catch (emailError) {
    console.error("Failed to send invitation email:", emailError);
    // Don't fail the entire operation if email sending fails
    // The invite is still created and can be accessed manually
  }

  revalidatePath(`/trips/${tripId}`);

  return {
    success: true,
    token: invite.token,
    message: "Invite sent successfully",
  };
}
