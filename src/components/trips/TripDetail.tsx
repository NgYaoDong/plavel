"use client";

import { Trip } from "@/generated/prisma";
import Image from "next/image";
import { Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useState } from "react";
import { TabsContent } from "@radix-ui/react-tabs";

interface TripDetailClientProps {
  trip: Trip;
}

export default function TripDetailClient({ trip }: TripDetailClientProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {trip.imageUrl && (
        <div className="relative w-full h-72 md:h-96 rounded-xl overflow-hidden shadow-lg">
          <Image
            src={trip.imageUrl}
            alt={trip.title}
            className="object-cover"
            fill
            priority
          />
        </div>
      )}

      <div className="bg-white p-6 shadow rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">{trip.title}</h1>
          {trip.description && (
            <p className="text-gray-600 text-sm">{trip.description}</p>
          )}
          <div className="flex items-center text-gray-500 mt-2">
            <Calendar className="h-5 w-5 mr-1" />
            <span>
              {new Date(trip.startDate).toLocaleDateString("en-SG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              -{" "}
              {new Date(trip.endDate).toLocaleDateString("en-SG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href={`/trips/${trip.id}/itinerary/new`}>
            <Button>
              <Plus /> Add Location
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 shadow rounded-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="text-lg">
              Overview
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="text-lg">
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="map" className="text-lg">
              Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Trip Summary</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="h-10 text-gray-500 mt-1 mr-2" />
                    <div>
                      <p className="font-medium text-gray-700">Dates</p>
                      <p className="text-sm text-gray-500">
                        {new Date(trip.startDate).toLocaleDateString("en-SG", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        -{" "}
                        {new Date(trip.endDate).toLocaleDateString("en-SG", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        [
                        {Math.ceil(
                          (new Date(trip.endDate).getTime() -
                            new Date(trip.startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        day(s)]
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">

                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
