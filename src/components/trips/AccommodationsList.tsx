"use client";

import { Accommodation } from "@/generated/prisma";
import AccommodationCard from "./AccommodationCard";
import NewAccommodationForm from "./NewAccommodationForm";

interface AccommodationsListProps {
  accommodations: Accommodation[];
  tripId: string;
}

export default function AccommodationsList({
  accommodations,
  tripId,
}: AccommodationsListProps) {
  // Sort accommodations by check-in date
  const sortedAccommodations = [...accommodations].sort(
    (a, b) =>
      new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between gap-4">
        <h2 className="text-2xl font-semibold">Accommodations</h2>
        <NewAccommodationForm tripId={tripId} />
      </div>

      {sortedAccommodations.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-600 mb-4">
            No accommodations added yet. Add your first hotel or Airbnb!
          </p>
          <NewAccommodationForm tripId={tripId} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedAccommodations.map((accommodation) => (
            <AccommodationCard
              key={accommodation.id}
              accommodation={accommodation}
              tripId={tripId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
