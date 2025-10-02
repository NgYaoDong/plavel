"use client";

import { Location, Trip } from "@/generated/prisma";
import Image from "next/image";
import { ArrowLeft, Calendar, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { TabsContent } from "@radix-ui/react-tabs";
import Map from "@/components/trips/Map";

type TripWithLocation = Trip & {
  locations: Location[];
};

interface TripDetailClientProps {
  trip: TripWithLocation;
}

function getTripDays(trip: TripWithLocation) {
  return Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}
export default function TripDetailClient({ trip }: TripDetailClientProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="mt-4 md:mt-0">
        <Link href={`/trips`}>
          <Button className="transition-shadow">
            <ArrowLeft />
            Back
          </Button>
        </Link>
      </div>
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
                    <Calendar className="h-10 text-gray-500 mt-1 mr-3" />
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
                        ({getTripDays(trip)}{" "}
                        {getTripDays(trip) === 1 ? "day" : "days"})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="h-10 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-700">Destinations</p>
                      <p className="text-sm text-gray-500">
                        {trip.locations.length}{" "}
                        {trip.locations.length === 1 ? "location" : "locations"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-72 rounded-lg overflow-hidden shadow">
                {trip.locations.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-4 text-center">
                    <div>
                      <p className="text-gray-600">
                        No locations added yet. Start adding locations to go on your trip!
                      </p>
                      <div className="mt-2">
                        <Link href={`/trips/${trip.id}/itinerary/new`}>
                          <Button>
                            <Plus /> Add Location
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Map itineraries={trip.locations} />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
