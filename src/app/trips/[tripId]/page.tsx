import { auth } from "@/auth";
import TripDetailClient from "@/components/trips/TripDetail";
import InvalidSession from "@/lib/invalidSession";
import { prisma } from "@/lib/prisma";
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
  // Fetch trip details from your database using the tripId
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, userId: session.user?.id },
    include: { locations: true, accommodations: true, flights: true },
  });

  if (!trip) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">Trip not found...</h1>
        <Image src="/crying_penguin.svg" alt="Error" width={400} height={400} />
      </main>
    );
  }

  return <TripDetailClient trip={trip} />;
}
