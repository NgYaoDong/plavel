"use client";

import { Flight } from "@/generated/prisma";
import FlightCard from "./FlightCard";
import NewFlightForm from "./NewFlightForm";

interface FlightsListProps {
  flights: Flight[];
  tripId: string;
  canEdit: boolean;
}

export default function FlightsList({
  flights,
  tripId,
  canEdit,
}: FlightsListProps) {
  // Sort flights by departure time
  const sortedFlights = [...flights].sort(
    (a, b) =>
      new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex md:flex-row justify-between gap-4">
        <h2 className="text-2xl font-semibold">Flights</h2>
        {canEdit && <NewFlightForm tripId={tripId} />}
      </div>

      {sortedFlights.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-600 mb-4">
            {canEdit
              ? "No flights added yet. Add your first flight!"
              : "No flights have been added to this trip yet."}
          </p>
          {canEdit && <NewFlightForm tripId={tripId} />}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedFlights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              tripId={tripId}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
