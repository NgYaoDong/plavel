"use client";

import { useState, useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { deleteLocation } from "@/lib/actions/delete-location";

interface RemoveLocationDialogProps {
  locationId: string;
  locationTitle: string;
  tripId: string;
  onRemove?: () => void;
}

export default function RemoveLocationDialog({
  locationId,
  locationTitle,
  tripId,
  onRemove,
}: RemoveLocationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      await deleteLocation(locationId, tripId);
      onRemove?.();
      setIsOpen(false);
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        type="button"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
              disabled={isPending}
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Remove Location
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove <strong>{locationTitle}</strong>{" "}
              from this trip? This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRemove}
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isPending ? "Removing..." : "Remove Location"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
