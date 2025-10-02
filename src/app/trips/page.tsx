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

export default async function TripsPage() {
  const session = await auth();
  if (!session || !session?.user || !session.user?.id) {
    return <InvalidSession />;
  }

  const trips = await prisma.trip.findMany({
    where: {
      userId: session?.user?.id,
    },
  });

  const sortedTrips = [...trips].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to the start of today
  const upcomingTrips = sortedTrips.filter(
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
            You have {trips.length} trip
            {trips.length === 1 ? "" : "s"} planned.{" "}
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
          {trips.length === 0 ? (
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
              {sortedTrips.map((trip) => (
                <div key={trip.id} className="h-full">
                  <Link href={`/trips/${trip.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <CardTitle>{trip.title}</CardTitle>
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
