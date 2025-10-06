"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteTrip } from "@/lib/actions/delete-trip";

interface DeleteTripDialogProps {
  tripId: string;
  tripTitle: string;
}

export default function DeleteTripDialog({
  tripId,
  tripTitle,
}: DeleteTripDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTrip(tripId);
      // No try/catch needed - redirect() throws a special Next.js navigation error
      // that should propagate to trigger the redirect
    });
  };

  const isConfirmValid = confirmText.toLowerCase() === "delete";

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="transition-shadow bg-red-700 hover:bg-red-800"
        disabled={isPending}
      >
        <Trash2 /> Delete Trip
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isPending && setIsOpen(false)}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Delete Trip</h2>
              <p className="text-gray-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold">&quot;{tripTitle}&quot;</span>?
              </p>
              <p className="text-sm text-red-600 font-medium">
                This action cannot be undone. All locations and data associated
                with this trip will be permanently deleted.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-delete"
                className="block text-sm font-medium text-gray-700"
              >
                Type <span className="font-bold">DELETE</span> to confirm:
              </label>
              <input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                disabled={isPending}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="flex-1"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={!isConfirmValid || isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Deleting..." : "Delete Trip"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
