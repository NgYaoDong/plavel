import { auth } from "@/auth";
import TripDetailClient from "@/components/trips/TripDetail";
import InvalidSession from "@/lib/invalidSession";
import { prisma } from "@/lib/prisma";
import { checkTripAccess, getTripCollaborators } from "@/lib/trip-permissions";
import Image from "next/image";

export default async function TripDetail({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const session = await auth();
  if (!session || !session?.user || !session.user?.id) {
    return <InvalidSession />;
  }

  const { tripId } = await params;

  // Check if user has access to this trip
  const accessCheck = await checkTripAccess(tripId, session.user.id, "viewer");

  if (!accessCheck.hasAccess) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">Access Denied</h1>
        <p className="text-gray-600 mt-4">You don&apos;t have permission to view this trip.</p>
        <Image src="/crying_penguin.svg" alt="Error" width={400} height={400} />
      </main>
    );
  }

  // Fetch trip details with all related data
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      locations: true,
      accommodations: true,
      flights: true,
      expenses: true,
      shares: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      invites: {
        where: {
          accepted: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!trip) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">Trip not found...</h1>
        <Image src="/crying_penguin.svg" alt="Error" width={400} height={400} />
      </main>
    );
  }

  // Get all collaborators
  const collaborators = await getTripCollaborators(tripId);

  return (
    <TripDetailClient
      trip={trip}
      currentUserId={session.user.id}
      userRole={accessCheck.role}
      isOwner={accessCheck.isOwner}
      collaborators={collaborators}
      pendingInvites={trip.invites}
    />
  );
}
