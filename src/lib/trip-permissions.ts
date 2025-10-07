import { prisma } from "@/lib/prisma";

export type TripRole = "owner" | "admin" | "editor" | "viewer" | null;

export interface TripAccessResult {
  hasAccess: boolean;
  role: TripRole;
  isOwner: boolean;
}

const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
};

/**
 * Check if a user has access to a trip and their role
 * @param tripId - The trip ID to check access for
 * @param userId - The user ID to check
 * @param requiredRole - The minimum role required (default: "viewer")
 * @returns Object with hasAccess, role, and isOwner flags
 */
export async function checkTripAccess(
  tripId: string,
  userId: string,
  requiredRole: TripRole = "viewer"
): Promise<TripAccessResult> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      shares: {
        where: { userId },
      },
    },
  });

  if (!trip) {
    return { hasAccess: false, role: null, isOwner: false };
  }

  // Owner has all permissions
  if (trip.userId === userId) {
    return { hasAccess: true, role: "owner", isOwner: true };
  }

  // Check shared access
  const share = trip.shares[0];
  if (!share) {
    return { hasAccess: false, role: null, isOwner: false };
  }

  // Check if user's role meets the required role
  const userRoleLevel = ROLE_HIERARCHY[share.role] || 0;
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole || "viewer"] || 0;
  const hasAccess = userRoleLevel >= requiredRoleLevel;

  return {
    hasAccess,
    role: share.role as TripRole,
    isOwner: false,
  };
}

/**
 * Check if a user can edit a trip (editor, admin, or owner)
 */
export async function canEditTrip(
  tripId: string,
  userId: string
): Promise<boolean> {
  const { hasAccess } = await checkTripAccess(tripId, userId, "editor");
  return hasAccess;
}

/**
 * Check if a user can manage sharing (admin or owner)
 */
export async function canManageSharing(
  tripId: string,
  userId: string
): Promise<boolean> {
  const { hasAccess } = await checkTripAccess(tripId, userId, "admin");
  return hasAccess;
}

/**
 * Check if a user is the owner of a trip
 */
export async function isTripOwner(
  tripId: string,
  userId: string
): Promise<boolean> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { userId: true },
  });

  return trip?.userId === userId;
}

/**
 * Get all collaborators for a trip (including owner)
 */
export async function getTripCollaborators(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
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
    },
  });

  if (!trip) return [];

  // Return owner + all shared users
  return [
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
}

/**
 * Utility to throw an error if user doesn't have required access
 */
export async function requireTripAccess(
  tripId: string,
  userId: string,
  requiredRole: TripRole = "viewer"
): Promise<void> {
  const { hasAccess } = await checkTripAccess(tripId, userId, requiredRole);

  if (!hasAccess) {
    throw new Error(
      `Access denied. Required role: ${requiredRole || "viewer"}`
    );
  }
}
