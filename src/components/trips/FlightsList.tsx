"use client";

import { Flight } from "@/generated/prisma";
import FlightCard from "./FlightCard";
import NewFlightForm from "./NewFlightForm";

interface FlightsListProps {
  flights: Flight[];
  tripId: string;
}

export default function FlightsList({ flights, tripId }: FlightsListProps) {
  // Sort flights by departure time
  const sortedFlights = [...flights].sort(
    (a, b) =>
      new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex md:flex-row justify-between gap-4">
        <h2 className="text-2xl font-semibold">Flights</h2>
        <NewFlightForm tripId={tripId} />
      </div>

      {sortedFlights.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-600 mb-4">
            No flights added yet. Add your first flight!
          </p>
          <NewFlightForm tripId={tripId} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedFlights.map((flight) => (
            <FlightCard key={flight.id} flight={flight} tripId={tripId} />
          ))}
        </div>
      )}
    </div>
  );
}
