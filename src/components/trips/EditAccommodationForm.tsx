"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateAccommodation } from "@/lib/actions/update-accommodation";
import { Accommodation } from "@/generated/prisma";
import { Edit2, X } from "lucide-react";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";

interface EditAccommodationFormProps {
  accommodation: Accommodation;
  tripId: string;
}

export default function EditAccommodationForm({
  accommodation,
  tripId,
}: EditAccommodationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState(accommodation.address || "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    // Client-side date validation
    const checkInDate = formData.get("checkInDate")?.toString();
    const checkOutDate = formData.get("checkOutDate")?.toString();

    if (
      checkInDate &&
      checkOutDate &&
      new Date(checkOutDate) <= new Date(checkInDate)
    ) {
      setError("Check-out date must be after check-in date");
      setIsSubmitting(false);
      return;
    }

    const result = await updateAccommodation(
      accommodation.id,
      formData,
      tripId
    );

    if (result.success) {
      setIsOpen(false);
    } else {
      setError("Failed to update accommodation. Please try again.");
    }

    setIsSubmitting(false);
  };

  if (!isOpen) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        <Edit2 className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Accommodation</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                defaultValue={accommodation.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Hotel name or Airbnb"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Address
              </label>
              <AddressAutocomplete
                id="address"
                name="address"
                value={address}
                onChange={setAddress}
                placeholder="Search for hotel address..."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="checkInDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Check-in Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="checkInDate"
                name="checkInDate"
                required
                defaultValue={
                  new Date(accommodation.checkInDate)
                    .toISOString()
                    .split("T")[0]
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="checkOutDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Check-out Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="checkOutDate"
                name="checkOutDate"
                required
                defaultValue={
                  new Date(accommodation.checkOutDate)
                    .toISOString()
                    .split("T")[0]
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="confirmationNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirmation Number
              </label>
              <input
                type="text"
                id="confirmationNumber"
                name="confirmationNumber"
                defaultValue={accommodation.confirmationNumber || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABC123456"
              />
            </div>

            <div>
              <label
                htmlFor="cost"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cost ($)
              </label>
              <input
                type="number"
                id="cost"
                name="cost"
                step="0.01"
                min="0"
                defaultValue={accommodation.cost || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="bookingLink"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Booking Link
            </label>
            <input
              type="url"
              id="bookingLink"
              name="bookingLink"
              defaultValue={accommodation.bookingLink || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://booking.com/..."
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={accommodation.notes || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional information..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
