"use client";

import { Accommodation } from "@/generated/prisma";
import {
  Building2,
  Calendar,
  MapPin,
  FileText,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import EditAccommodationForm from "./EditAccommodationForm";
import DeleteAccommodationDialog from "./DeleteAccommodationDialog";

interface AccommodationCardProps {
  accommodation: Accommodation;
  tripId: string;
  canEdit: boolean;
}

export default function AccommodationCard({
  accommodation,
  tripId,
  canEdit,
}: AccommodationCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-SG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const nights = Math.ceil(
    (new Date(accommodation.checkOutDate).getTime() -
      new Date(accommodation.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{accommodation.name}</h3>
            {accommodation.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  accommodation.address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-1"
              >
                <MapPin className="h-3 w-3" />
                {accommodation.address}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-1">
            <EditAccommodationForm
              accommodation={accommodation}
              tripId={tripId}
            />
            <DeleteAccommodationDialog
              accommodationId={accommodation.id}
              accommodationName={accommodation.name}
              tripId={tripId}
            />
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(accommodation.checkInDate)} -{" "}
            {formatDate(accommodation.checkOutDate)}
          </span>
          <span className="text-gray-500">
            ({nights} night{nights !== 1 ? "s" : ""})
          </span>
        </div>

        {accommodation.confirmationNumber && (
          <div className="flex items-center gap-2 text-gray-700">
            <FileText className="h-4 w-4" />
            <span>Confirmation: {accommodation.confirmationNumber}</span>
          </div>
        )}

        {accommodation.cost && (
          <div className="flex items-center gap-2 font-medium text-gray-900">
            <span>
              $
              {accommodation.cost.toLocaleString("en-SG", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-gray-500 text-xs font-normal">
              (${(accommodation.cost / nights).toFixed(2)}/night)
            </span>
          </div>
        )}

        {accommodation.bookingLink && (
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-gray-500" />
            <a
              href={accommodation.bookingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              View Booking
            </a>
          </div>
        )}

        {accommodation.notes && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-gray-600 text-sm">{accommodation.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
