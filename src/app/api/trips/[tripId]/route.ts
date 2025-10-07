import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkTripAccess, getTripCollaborators } from "@/lib/trip-permissions";
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

    // Check access
    const accessCheck = await checkTripAccess(tripId, session.user.id, "viewer");
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch trip data in parallel for speed
    const [trip, payments, collaborators] = await Promise.all([
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
      getTripCollaborators(tripId),
    ]);

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({
      trip,
      payments,
      collaborators,
      currentUserId: session.user.id,
      userRole: accessCheck.role,
      isOwner: trip.userId === session.user.id,
      pendingInvites: trip.invites,
    });
  } catch (error) {
    console.error("Error fetching trip:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip" },
      { status: 500 }
    );
  }
}
