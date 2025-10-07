"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addAccommodation } from "@/lib/actions/add-accommodation";
import { Plus, X } from "lucide-react";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";

interface NewAccommodationFormProps {
  tripId: string;
}

export default function NewAccommodationForm({
  tripId,
}: NewAccommodationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

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

    const result = await addAccommodation(formData, tripId);

    if (result.success) {
      setIsOpen(false);
      form.reset();
      setAddress(""); // Clear address state
    } else {
      setError("Failed to add accommodation. Please try again.");
    }

    setIsSubmitting(false);
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-auto">
        <Plus className="h-4 w-4" />
        Add Accommodation
      </Button>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Add Accommodation</h3>
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ABC123456"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://booking.com/..."
            />
          </div>
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
            {isSubmitting ? "Adding..." : "Add Accommodation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
