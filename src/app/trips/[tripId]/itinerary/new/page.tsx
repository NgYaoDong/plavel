import { auth } from "@/auth";
import NewLocationClient from "@/components/trips/NewLocation";
import InvalidSession from "@/lib/invalidSession";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const revalidate = 60;

export default async function NewLocation({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const session = await auth();
  if (!session || !session?.user || !session.user?.id) {
    return <InvalidSession />;
  }
  const { tripId } = await params;

  // Fetch trip to get trip duration
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, userId: session.user.id },
  });

  if (!trip) {
    redirect("/trips");
  }

  const tripDays = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return <NewLocationClient tripId={tripId} tripDays={tripDays} />;
}
