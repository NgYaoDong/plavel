"use client";

import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface TimeSlotPickerProps {
  startTime?: string; // datetime-local format
  endTime?: string; // datetime-local format
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  tripStartDate?: Date; // Optional: to set min date
  tripEndDate?: Date; // Optional: to set max date
}

export default function TimeSlotPicker({
  startTime = "",
  endTime = "",
  onStartTimeChange,
  onEndTimeChange,
  tripStartDate,
  tripEndDate,
}: TimeSlotPickerProps) {
  const [duration, setDuration] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Calculate duration whenever times change
  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (end <= start) {
        setError("End time must be after start time");
        setDuration("");
      } else {
        setError("");
        const durationMs = end.getTime() - start.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor(
          (durationMs % (1000 * 60 * 60)) / (1000 * 60)
        );

        if (hours > 0) {
          setDuration(`${hours}h ${minutes}m`);
        } else {
          setDuration(`${minutes}m`);
        }
      }
    } else {
      setDuration("");
      setError("");
    }
  }, [startTime, endTime]);

  // Format date for datetime-local input min/max attributes
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T00:00`;
  };

  const minDate = tripStartDate ? formatDateForInput(tripStartDate) : undefined;
  const maxDate = tripEndDate ? formatDateForInput(tripEndDate) : undefined;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Time */}
        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Start Time (Optional)</span>
            </div>
          </label>
          <input
            type="datetime-local"
            id="startTime"
            name="startTime"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            min={minDate}
            max={maxDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* End Time */}
        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>End Time (Optional)</span>
            </div>
          </label>
          <input
            type="datetime-local"
            id="endTime"
            name="endTime"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            min={startTime || minDate}
            max={maxDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Duration Display */}
      {duration && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
          <Clock className="h-4 w-4 text-blue-600" />
          <span>
            Duration:{" "}
            <span className="font-medium text-blue-700">{duration}</span>
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Helper Text */}
      {!startTime && !endTime && (
        <p className="text-xs text-gray-500">
          Add time slots to plan when you&apos;ll visit this location. Both
          times are optional.
        </p>
      )}
    </div>
  );
}
