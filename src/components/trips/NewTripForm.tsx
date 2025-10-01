"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createTrip } from "@/lib/actions/create-trip";
import { UploadButton } from "@/lib/upload-thing";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState, useTransition } from "react";

export default function NewTripForm() {
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  return (
    <main className="max-w-lg mx-auto mt-10">
      <Card>
        <CardHeader>New Trip</CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            action={(formData: FormData) => {
              if (imageUrl) {
                formData.append("imageUrl", imageUrl);
              }
              startTransition(() => {
                createTrip(formData);
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
                placeholder="Trip Name"
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
                  className={cn(
                    "w-full border border-gray-300 rounded-md px-3 py-2",
                    "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  )}
                  required
                />
              </div>
            </div>

            <div>
              <label>Trip Image</label>
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt="Uploaded Trip Image"
                  width={1080}
                  height={192}
                  className="mt-2 mb-2 rounded-md max-w-full max-h-48 object-contain"
                  style={{ display: "block" }}
                />
              )}
              <UploadButton
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
              {isPending ? "Creating..." : "Create Trip"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
