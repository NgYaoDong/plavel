"use client";

import { Location } from "@/generated/prisma";
import { useState, useTransition } from "react";
import { Button } from "../ui/button";
import { Pencil, X, FileText, DollarSign } from "lucide-react";
import { updateLocation } from "@/lib/actions/update-location";
import TimeSlotPicker from "./TimeSlotPicker";

// Helper to convert Date to local datetime-local input format
function toLocalDateTimeString(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

interface EditLocationFormProps {
  location: Location;
  tripId: string;
}

export default function EditLocationForm({
  location,
  tripId,
}: EditLocationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [locationTitle, setLocationTitle] = useState(location.locationTitle);
  const [startTime, setStartTime] = useState<string>(
    toLocalDateTimeString(location.startTime)
  );
  const [endTime, setEndTime] = useState<string>(
    toLocalDateTimeString(location.endTime)
  );
  const [notes, setNotes] = useState<string>(location.notes || "");
  const [cost, setCost] = useState<string>(
    location.cost ? location.cost.toString() : ""
  );
  const [category, setCategory] = useState<string>(location.category || "");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      startTransition(async () => {
        await updateLocation(formData, location.id, tripId);
        setIsOpen(false);
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update location"
      );
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Location</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Title */}
            <div>
              <label
                htmlFor="locationTitle"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Location Name
              </label>
              <input
                type="text"
                id="locationTitle"
                name="locationTitle"
                value={locationTitle}
                onChange={(e) => setLocationTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Marina Bay Sands"
              />
            </div>

            {/* Time Slot Picker */}
            <TimeSlotPicker
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>Notes (Optional)</span>
                </div>
              </label>
              <textarea
                id="notes"
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add notes about this location (e.g., activities to do, tips, reservations, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Cost and Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="cost"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Cost (Optional)</span>
                  </div>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Category (Optional)
                </label>
                <select
                  id="category"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  <option value="food">Food & Dining</option>
                  <option value="transport">Transport</option>
                  <option value="activity">Activity</option>
                  <option value="shopping">Shopping</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Hidden field for timezone offset */}
            <input
              type="hidden"
              name="timezoneOffset"
              value={new Date().getTimezoneOffset()}
            />

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
