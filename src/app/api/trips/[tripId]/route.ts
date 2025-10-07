import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId } = await params;

    // OPTIMIZATION: Single query to fetch everything we need
    // This replaces 3 separate queries (checkTripAccess, trip data, getTripCollaborators)
    const [trip, payments] = await Promise.all([
      prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          locations: true,
          accommodations: true,
          flights: true,
          expenses: {
            include: {
              payment: {
                include: {
                  payer: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
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
      }),
      prisma.payment.findMany({
        where: { tripId },
        include: {
          payer: true,
          splits: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Check access inline (instead of separate query)
    const isOwner = trip.userId === session.user.id;
    const userShare = trip.shares.find((s) => s.user.id === session.user!.id);
    const hasAccess = isOwner || !!userShare;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const userRole = isOwner ? "owner" : (userShare?.role as "admin" | "editor" | "viewer");

    // Build collaborators list inline (instead of separate query)
    const collaborators = [
      {
        ...trip.user,
        role: "owner" as const,
        shareId: null,
      },
      ...trip.shares.map((share) => ({
        ...share.user,
        role: share.role,
        shareId: share.id,
      })),
    ];

    return NextResponse.json(
      {
        trip,
        payments,
        collaborators,
        currentUserId: session.user.id,
        userRole,
        isOwner,
        pendingInvites: trip.invites,
      },
      {
        headers: {
          // Cache for 10 seconds, allow stale content for 30 seconds while revalidating
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching trip:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip" },
      { status: 500 }
    );
  }
}
