"use client";

import { Accommodation } from "@/generated/prisma";
import AccommodationCard from "./AccommodationCard";
import NewAccommodationForm from "./NewAccommodationForm";

interface AccommodationsListProps {
  accommodations: Accommodation[];
  tripId: string;
  canEdit: boolean;
}

export default function AccommodationsList({
  accommodations,
  tripId,
  canEdit,
}: AccommodationsListProps) {
  // Sort accommodations by check-in date
  const sortedAccommodations = [...accommodations].sort(
    (a, b) =>
      new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex sm:flex-row justify-between gap-2 sm:gap-4 items-start sm:items-center">
        <h2 className="text-xl sm:text-2xl font-semibold">Accommodations</h2>
        {canEdit && <NewAccommodationForm tripId={tripId} />}
      </div>

      {sortedAccommodations.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-600 mb-4">
            {canEdit
              ? "No accommodations added yet. Add your first hotel or Airbnb!"
              : "No accommodations have been added to this trip yet."}
          </p>
          {canEdit && <NewAccommodationForm tripId={tripId} />}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedAccommodations.map((accommodation) => (
            <AccommodationCard
              key={accommodation.id}
              accommodation={accommodation}
              tripId={tripId}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
