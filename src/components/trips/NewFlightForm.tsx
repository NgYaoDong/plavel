"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addFlight } from "@/lib/actions/add-flight";
import { Plane, X } from "lucide-react";

interface NewFlightFormProps {
  tripId: string;
}

export default function NewFlightForm({ tripId }: NewFlightFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Client-side time validation
    const departureTime = formData.get("departureTime")?.toString();
    const arrivalTime = formData.get("arrivalTime")?.toString();

    if (
      departureTime &&
      arrivalTime &&
      new Date(arrivalTime) <= new Date(departureTime)
    ) {
      setError("Arrival time must be after departure time");
      setIsSubmitting(false);
      return;
    }

    const result = await addFlight(formData, tripId);

    if (result.success) {
      setIsOpen(false);
      form.reset();
    } else {
      setError("Failed to add flight. Please try again.");
    }

    setIsSubmitting(false);
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plane className="h-4 w-4" />
        Add Flight
      </Button>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Add Flight</h3>
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
              htmlFor="airline"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Airline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="airline"
              name="airline"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Singapore Airlines"
            />
          </div>

          <div>
            <label
              htmlFor="flightNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Flight Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="flightNumber"
              name="flightNumber"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="SQ123"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="departureAirport"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Departure Airport <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="departureAirport"
              name="departureAirport"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="SIN - Singapore Changi"
            />
          </div>

          <div>
            <label
              htmlFor="arrivalAirport"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Arrival Airport <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="arrivalAirport"
              name="arrivalAirport"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="NRT - Tokyo Narita"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="departureTime"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Departure Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="departureTime"
              name="departureTime"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="arrivalTime"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Arrival Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="arrivalTime"
              name="arrivalTime"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="bookingReference"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Booking Reference
            </label>
            <input
              type="text"
              id="bookingReference"
              name="bookingReference"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ABC123"
            />
          </div>

          <div>
            <label
              htmlFor="seatNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Seat Number
            </label>
            <input
              type="text"
              id="seatNumber"
              name="seatNumber"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="12A"
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

        {/* Hidden field for timezone offset */}
        <input
          type="hidden"
          name="timezoneOffset"
          value={new Date().getTimezoneOffset()}
        />

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
            {isSubmitting ? "Adding..." : "Add Flight"}
          </Button>
        </div>
      </form>
    </div>
  );
}
