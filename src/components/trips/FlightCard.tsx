"use client";

import { Flight } from "@/generated/prisma";
import {
  Plane,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Tag,
  StickyNote,
  ExternalLink,
} from "lucide-react";
import EditFlightForm from "./EditFlightForm";
import DeleteFlightDialog from "./DeleteFlightDialog";

interface FlightCardProps {
  flight: Flight;
  tripId: string;
  canEdit: boolean;
}

export default function FlightCard({ flight, tripId, canEdit }: FlightCardProps) {
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("en-SG", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = () => {
    const departure = new Date(flight.departureTime);
    const arrival = new Date(flight.arrivalTime);
    const durationMs = arrival.getTime() - departure.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-lg">{flight.airline}</h3>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(
                `${flight.airline} ${flight.flightNumber} flight status`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
            >
              Flight {flight.flightNumber}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-1">
            <EditFlightForm flight={flight} tripId={tripId} />
            <DeleteFlightDialog
              flightId={flight.id}
              flightNumber={flight.flightNumber}
              airline={flight.airline}
              tripId={tripId}
            />
          </div>
        )}
      </div>

      {/* Route */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">
              {flight.departureAirport}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{formatDateTime(flight.departureTime)}</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <Plane className="h-4 w-4 text-gray-400 rotate-90" />
          <span className="text-xs text-gray-500 mt-1">
            {calculateDuration()}
          </span>
        </div>

        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-2 mb-1">
            <span className="text-sm font-medium">{flight.arrivalAirport}</span>
            <MapPin className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
            <span>{formatDateTime(flight.arrivalTime)}</span>
            <Calendar className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="space-y-2">
        {flight.bookingReference && (
          <div className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Booking:</span>
            <span className="font-medium">{flight.bookingReference}</span>
          </div>
        )}

        {flight.seatNumber && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Seat:</span>
            <span className="font-medium">{flight.seatNumber}</span>
          </div>
        )}

        {flight.cost && (
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Cost:</span>
            <span className="font-medium text-gray-900">
              $
              {flight.cost.toLocaleString("en-SG", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        )}

        {flight.notes && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-start gap-2 text-sm">
              <StickyNote className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-600 font-medium">Notes:</span>
                <p className="text-gray-700 mt-1">{flight.notes}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
