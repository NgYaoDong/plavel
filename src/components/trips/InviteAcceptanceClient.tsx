"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite } from "@/lib/actions/accept-invite";
import { Calendar, User } from "lucide-react";
import Image from "next/image";

interface InviteAcceptanceClientProps {
  token: string;
  invite: {
    trip: {
      id: string;
      title: string;
      description: string | null;
      imageUrl: string | null;
      startDate: Date;
      endDate: Date;
      user: {
        name: string | null;
        email: string;
      };
    };
    inviter: {
      name: string | null;
      email: string;
    };
    role: string;
    expiresAt: Date;
  };
}

export default function InviteAcceptanceClient({
  token,
  invite,
}: InviteAcceptanceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAccept = () => {
    setError(null);

    startTransition(async () => {
      const result = await acceptInvite(token);

      if (result.success) {
        // Redirect to the trip
        router.push(`/trips/${result.tripId}`);
      } else {
        setError(result.error || "Failed to accept invite");
      }
    });
  };

  const handleDecline = () => {
    router.push("/");
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTripDuration = () => {
    const days = Math.ceil(
      (new Date(invite.trip.endDate).getTime() -
        new Date(invite.trip.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return `${days} ${days === 1 ? "day" : "days"}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Trip Image */}
        {invite.trip.imageUrl && (
          <div className="relative h-48 w-full">
            <Image
              src={invite.trip.imageUrl}
              alt={invite.trip.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-blue-600 text-4xl mb-3">✉️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              You&apos;re Invited!
            </h1>
            <p className="text-gray-600">
              <strong>{invite.inviter.name || invite.inviter.email}</strong> has
              invited you to collaborate on their trip
            </p>
          </div>

          {/* Trip Details */}
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {invite.trip.title}
            </h2>

            {invite.trip.description && (
              <p className="text-gray-600 mb-4">{invite.trip.description}</p>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Dates</p>
                  <p className="text-sm">
                    {formatDate(invite.trip.startDate)} -{" "}
                    {formatDate(invite.trip.endDate)}
                  </p>
                  <p className="text-xs text-gray-500">({getTripDuration()})</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Organized by</p>
                  <p className="text-sm">
                    {invite.trip.user.name || invite.trip.user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Role Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              Your Role:{" "}
              {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
            </h3>
            <p className="text-sm text-blue-800">
              {invite.role === "viewer" &&
                "You'll be able to view all trip details but won't be able to make changes."}
              {invite.role === "editor" &&
                "You'll be able to add, edit, and delete locations, accommodations, flights, and expenses."}
              {invite.role === "admin" &&
                "You'll have full access to manage the trip, including sharing with others."}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleDecline}
              disabled={isPending}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={isPending}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {isPending ? "Accepting..." : "Accept Invitation"}
            </button>
          </div>

          {/* Expiry Notice */}
          <p className="text-center text-xs text-gray-500 mt-4">
            This invitation expires on{" "}
            {new Date(invite.expiresAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
