"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trip } from "@/generated/prisma/wasm";
import { editTrip } from "@/lib/actions/edit-trip";
import { UploadDropzone } from "@/lib/upload-thing";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function EditTripForm({ trip }: { trip: Trip }) {
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const router = useRouter();

  return (
    <main className="max-w-lg mx-auto mt-10">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <Card>
        <CardHeader className="text-3xl font-bold">Edit Trip</CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            action={(formData: FormData) => {
              if (imageUrl) {
                formData.append("imageUrl", imageUrl);
              }
              startTransition(() => {
                editTrip(trip.id, formData);
              });
            }}
          >
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title<span className="text-red-500 px-0.5">*</span>
              </label>
              <input
                type="text"
                name="title"
                defaultValue={trip.title}
                className={cn(
                  "w-full border border-gray-300 rounded-md px-3 py-2",
                  "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                )}
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                name="description"
                placeholder="Trip Description"
                defaultValue={trip.description || ""}
                className={cn(
                  "w-full border border-gray-300 rounded-md px-3 py-2",
                  "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date<span className="text-red-500 px-0.5">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={
                    new Date(trip.startDate).toISOString().split("T")[0]
                  }
                  className={cn(
                    "w-full border border-gray-300 rounded-md px-3 py-2",
                    "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  )}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Date<span className="text-red-500 px-0.5">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  defaultValue={
                    new Date(trip.endDate).toISOString().split("T")[0]
                  }
                  className={cn(
                    "w-full border border-gray-300 rounded-md px-3 py-2",
                    "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  )}
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="budget"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Budget (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  name="budget"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  defaultValue={trip.budget || ""}
                  className={cn(
                    "w-full border border-gray-300 rounded-md pl-8 pr-3 py-2",
                    "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  )}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Set a budget to track expenses throughout your trip
              </p>
            </div>

            <div>
              <label>Trip Image</label>
              {(imageUrl || trip.imageUrl) && (
                <Image
                  src={imageUrl || trip.imageUrl!}
                  alt="Trip Image"
                  width={1080}
                  height={192}
                  className="mt-2 mb-2 rounded-md max-w-full max-h-48 object-contain"
                  style={{ display: "block" }}
                />
              )}
              <UploadDropzone
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (res && res[0].ufsUrl) {
                    setImageUrl(res[0].ufsUrl);
                  }
                }}
                onUploadError={(error: Error) => {
                  console.error("Upload failed:", error);
                }}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Editing..." : "Edit Trip"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
