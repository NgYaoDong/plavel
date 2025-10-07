"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TripDetailClient from "@/components/trips/TripDetail";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import type {
  Trip,
  Location,
  Accommodation,
  Flight,
  Expense,
  Payment,
  PaymentSplit,
  User,
} from "@/generated/prisma";
import type { TripRole } from "@/lib/trip-permissions";

type TripWithLocation = Trip & {
  locations: Location[];
  accommodations: Accommodation[];
  flights: Flight[];
  expenses: Expense[];
};

type PaymentWithRelations = Payment & {
  payer: User;
  splits: (PaymentSplit & {
    user: User;
  })[];
};

interface Collaborator {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  shareId: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
}

// Type for the API response
type TripDataResponse = {
  trip: TripWithLocation;
  payments: PaymentWithRelations[];
  collaborators: Collaborator[];
  currentUserId: string;
  userRole: TripRole;
  isOwner: boolean;
  pendingInvites: PendingInvite[];
};

export default function TripDetail() {
  const params = useParams();
  const tripId = params.tripId as string;

  const [tripData, setTripData] = useState<TripDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/trips/${tripId}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            setError("unauthorized");
          } else if (response.status === 403) {
            setError("access_denied");
          } else if (response.status === 404) {
            setError("not_found");
          } else {
            setError("unknown");
          }
          return;
        }

        const data = await response.json();
        setTripData(data);
      } catch (err) {
        console.error("Error fetching trip:", err);
        setError("unknown");
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId]);

  // Show loading state while fetching trip data
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="text-gray-600 mt-4">Loading trip details...</p>
      </main>
    );
  }

  // Handle unauthorized - redirect to sign in
  if (error === "unauthorized") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">Authentication Required</h1>
        <p className="text-gray-600 mt-4">
          Please sign in to view this trip.
        </p>
        <Image src="/crying_penguin.svg" alt="Error" width={400} height={400} />
      </main>
    );
  }

  // Handle errors
  if (error === "access_denied") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">Access Denied</h1>
        <p className="text-gray-600 mt-4">
          You don&apos;t have permission to view this trip.
        </p>
        <Image src="/crying_penguin.svg" alt="Error" width={400} height={400} />
      </main>
    );
  }

  if (error === "not_found" || !tripData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">Trip not found...</h1>
        <Image src="/crying_penguin.svg" alt="Error" width={400} height={400} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">Something went wrong</h1>
        <p className="text-gray-600 mt-4">Failed to load trip details.</p>
        <Image src="/crying_penguin.svg" alt="Error" width={400} height={400} />
      </main>
    );
  }

  // Render the trip detail component with fetched data
  return (
    <TripDetailClient
      trip={tripData.trip}
      currentUserId={tripData.currentUserId}
      userRole={tripData.userRole}
      isOwner={tripData.isOwner}
      collaborators={tripData.collaborators}
      pendingInvites={tripData.pendingInvites}
      payments={tripData.payments}
    />
  );
}
