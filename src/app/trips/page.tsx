import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import InvalidSession from "@/lib/invalidSession";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const revalidate = 60;

export default async function TripsPage() {
  const session = await auth();
  if (!session || !session?.user || !session.user?.id) {
    return <InvalidSession />;
  }

  // Fetch trips owned by user and trips shared with user
  const [ownedTrips, sharedTrips] = await Promise.all([
    prisma.trip.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        startDate: "desc",
      },
    }),
    prisma.trip.findMany({
      where: {
        shares: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        shares: {
          where: {
            userId: session.user.id,
          },
          select: {
            role: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    }),
  ]);

  const allTrips = [
    ...ownedTrips.map((trip) => ({
      ...trip,
      isOwner: true,
      sharedBy: null,
      role: "owner" as const,
    })),
    ...sharedTrips.map((trip) => ({
      ...trip,
      isOwner: false,
      sharedBy: trip.user.name,
      role: trip.shares[0]?.role || "viewer",
    })),
  ].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingTrips = allTrips.filter(
    (trip) => new Date(trip.startDate) >= today
  );

  return (
    <main className="space-y-6 container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/trips/new" className="mt-4 inline-block">
          <Button>New Trip</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="text-2xl font-bold">
          <CardTitle>Welcome back, {session.user?.name}!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-md text-gray-600">
            You have {allTrips.length} trip
            {allTrips.length === 1 ? "" : "s"} planned.{" "}
            {upcomingTrips.length > 0
              ? `${upcomingTrips.length} upcoming trip${
                  upcomingTrips.length === 1 ? "" : "s"
                }.`
              : "No upcoming trips."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-2xl font-bold">
          <CardTitle>Your Trips</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-1">
          {allTrips.length === 0 ? (
            <>
              <p className="-mt-2 mb-4 text-gray-600">
                You haven&apos;t created any trips yet. Start planning your next
                adventure!
              </p>
              <Link href="/trips/new">
                <Button>Create your first trip</Button>
              </Link>
            </>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allTrips.map((trip) => (
                <div key={trip.id} className="h-full">
                  <Link href={`/trips/${trip.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="truncate">{trip.title}</span>
                          {!trip.isOwner && (
                            <span className="text-xs font-normal bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2 shrink-0">
                              Shared
                            </span>
                          )}
                        </CardTitle>
                        {!trip.isOwner && trip.sharedBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            by {trip.sharedBy}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm line-clamp-2">
                          {trip.description}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <div className="text-sm text-gray-500">
                          {new Date(trip.startDate).toLocaleDateString(
                            "en-SG",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}{" "}
                          -{" "}
                          {new Date(trip.endDate).toLocaleDateString("en-SG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
