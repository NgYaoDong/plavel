import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import InviteAcceptanceClient from "@/components/trips/InviteAcceptanceClient";
import Link from "next/link";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await auth();

  // Find the invite
  const invite = await prisma.tripInvite.findUnique({
    where: { token },
    include: {
      trip: {
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          startDate: true,
          endDate: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!invite) {
    notFound();
  }

  // Check if invite has expired
  if (new Date() > invite.expiresAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Expired</h1>
          <p className="text-gray-600 mb-6">
            This invitation has expired. Please ask the trip owner to send you a new invite.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Check if invite has already been accepted
  if (invite.accepted) {
    // If user is logged in and already accepted, redirect to trip
    if (session?.user?.email === invite.email) {
      redirect(`/trips/${invite.tripId}`);
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Accepted</h1>
          <p className="text-gray-600 mb-6">
            This invitation has already been accepted.
          </p>
          {session ? (
            <a
              href={`/trips/${invite.tripId}`}
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              View Trip
            </a>
          ) : (
            <Link
              href="/api/auth/signin"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    );
  }

  // If not logged in, show sign in prompt
  if (!session || !session.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-blue-600 text-5xl mb-4">✉️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Trip Invitation</h1>
            <p className="text-gray-600">
              You&apos;ve been invited to collaborate on <strong>{invite.trip.title}</strong>
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>{invite.inviter.name || invite.inviter.email}</strong> has invited you to join this trip as a <strong>{invite.role}</strong>.
            </p>
          </div>

          <p className="text-gray-600 text-sm mb-6 text-center">
            Please sign in to accept this invitation.
          </p>

          <a
            href={`/api/auth/signin?callbackUrl=/invites/${token}`}
            className="block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Sign In to Accept
          </a>
        </div>
      </div>
    );
  }

  // Check if email matches
  if (session.user.email !== invite.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-yellow-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Mismatch</h1>
          <p className="text-gray-600 mb-4">
            This invitation was sent to <strong>{invite.email}</strong>, but you&apos;re signed in as <strong>{session.user.email}</strong>.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Please sign in with the correct email address or ask for a new invitation.
          </p>
          <div className="flex gap-3">
            <Link
              href="/api/auth/signout"
              className="flex-1 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition text-center"
            >
              Sign Out
            </Link>
            <Link
              href="/"
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-center"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // User is logged in with correct email, show acceptance UI
  return (
    <InviteAcceptanceClient
      token={token}
      invite={{
        trip: invite.trip,
        inviter: invite.inviter,
        role: invite.role,
        expiresAt: invite.expiresAt,
      }}
    />
  );
}
