"use client";

import { useState, useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { deleteFlight } from "@/lib/actions/delete-flight";

interface DeleteFlightDialogProps {
  flightId: string;
  flightNumber: string;
  airline: string;
  tripId: string;
}

export default function DeleteFlightDialog({
  flightId,
  flightNumber,
  airline,
  tripId,
}: DeleteFlightDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteFlight(flightId, tripId);
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
        type="button"
      >
        <Trash2 className="h-4 w-4 text-red-600" />
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
              Delete Flight
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete flight{" "}
              <strong>{airline} {flightNumber}</strong>? This action cannot be
              undone.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isPending ? "Deleting..." : "Delete Flight"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
