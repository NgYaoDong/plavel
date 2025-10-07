"use client";

import {
  Location,
  Trip,
  Accommodation,
  Flight,
  Expense,
} from "@/generated/prisma";
import Image from "next/image";
import { ArrowLeft, Calendar, Edit2, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { TabsContent } from "@radix-ui/react-tabs";
import Map from "@/components/trips/Map";
import SortableItinerary from "@/components/trips/SortableItinerary";
import DeleteTripDialog from "@/components/trips/DeleteTripDialog";
import AccommodationsList from "@/components/trips/AccommodationsList";
import FlightsList from "@/components/trips/FlightsList";
import { BudgetOverview } from "@/components/trips/BudgetOverview";
import ShareTripDialog from "@/components/trips/ShareTripDialog";
import { TripRole } from "@/lib/trip-permissions";
import { useTripPolling } from "@/hooks/useTripPolling";

type TripWithLocation = Trip & {
  locations: Location[];
  accommodations: Accommodation[];
  flights: Flight[];
  expenses: Expense[];
};

interface Collaborator {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  shareId: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
}

interface TripDetailClientProps {
  trip: TripWithLocation;
  currentUserId: string;
  userRole: TripRole;
  isOwner: boolean;
  collaborators: Collaborator[];
  pendingInvites: PendingInvite[];
}

function getTripDays(trip: TripWithLocation) {
  return Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}
export default function TripDetailClient({
  trip,
  currentUserId,
  userRole,
  isOwner,
  collaborators,
  pendingInvites,
}: TripDetailClientProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Enable polling to auto-refresh and see collaborator changes
  // Only poll if there are collaborators (shared trip)
  const hasCollaborators =
    collaborators.length > 1 || pendingInvites.length > 0;
  // Poll every 10 seconds if shared, don't poll if not shared
  useTripPolling(trip.id, hasCollaborators ? 10000 : 0);

  // Check if user can edit (editor, admin, or owner)
  const canEdit =
    userRole === "editor" || userRole === "admin" || userRole === "owner";

  // Check if user can manage sharing (admin or owner)
  const canManageSharing = userRole === "admin" || userRole === "owner";

  // Derived ordered locations by day, then by order within each day
  const orderedLocations = useMemo(() => {
    return [...trip.locations].sort((a, b) => {
      // First sort by day
      const dayDiff = (a.day ?? 1) - (b.day ?? 1);
      if (dayDiff !== 0) return dayDiff;
      // Then sort by order within the same day
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [trip.locations]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="mt-4 md:mt-0">
        <Link href={`/trips`}>
          <Button className="transition-shadow">
            <ArrowLeft /> Back
          </Button>
        </Link>
        <div className="flex float-right items-center gap-2">
          {/* Share Button - visible to admin and owner */}
          {canManageSharing && (
            <ShareTripDialog
              tripId={trip.id}
              collaborators={collaborators}
              pendingInvites={pendingInvites}
              currentUserId={currentUserId}
              isOwner={isOwner}
              canManageSharing={canManageSharing}
            />
          )}

          {/* Edit Trip Button - visible to editors and above */}
          {canEdit && (
            <Link href={`/trips/${trip.id}/edit`}>
              <Button className="transition-shadow bg-sky-600 hover:bg-sky-700">
                <Edit2 /> <span className="hidden sm:inline">Edit Trip</span>
              </Button>
            </Link>
          )}

          {/* Delete Button - visible to owner only */}
          {isOwner && (
            <DeleteTripDialog tripId={trip.id} tripTitle={trip.title} />
          )}
        </div>
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
            <Calendar className="h-5 w-5 mr-2" />
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
      </div>

      <div className="bg-white p-4 md:p-6 shadow rounded-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-2">
            <TabsTrigger value="overview" className="text-sm md:text-lg">
              Overview
            </TabsTrigger>
            <TabsTrigger value="flights" className="text-sm md:text-lg">
              Flights
            </TabsTrigger>
            <TabsTrigger value="accommodations" className="text-sm md:text-lg">
              Accommodations
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="text-sm md:text-lg">
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="budget" className="text-sm md:text-lg">
              Budget
            </TabsTrigger>
            <TabsTrigger value="map" className="text-sm md:text-lg">
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
                      <div className="text-sm text-gray-500">
                        <ul className="text-sm text-gray-500 list-disc ml-5">
                          {orderedLocations.map((loc) => (
                            <li key={loc.id}>{loc.locationTitle}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-72 rounded-lg overflow-hidden shadow">
                {orderedLocations.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-4 text-center border border-dashed border-gray-300 rounded-lg">
                    <div>
                      <p className="text-gray-600">
                        No locations added yet. Start adding locations to go on
                        your trip!
                      </p>
                      {canEdit && (
                        <div className="mt-2">
                          <Link href={`/trips/${trip.id}/itinerary/new`}>
                            <Button>
                              <Plus /> Add Location
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Map itineraries={orderedLocations} zoom={8} />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="itinerary" className="space-y-6">
            <div className="flex md:flex-row justify-between gap-4">
              <h2 className="text-2xl font-semibold">Itinerary</h2>
              {canEdit && (
                <div className="w-auto">
                  <Link href={`/trips/${trip.id}/itinerary/new`}>
                    <Button>
                      <Plus /> Add Location
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            {orderedLocations.length === 0 ? (
              <div className="p-4 text-center text-gray-600 border border-dashed border-gray-300 rounded-lg py-12">
                No locations added yet.
                {canEdit ? " Start adding locations to go on your trip!" : ""}
                {canEdit && (
                  <div className="mt-4">
                    <Link href={`/trips/${trip.id}/itinerary/new`}>
                      <Button>
                        <Plus /> Add Location
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <SortableItinerary
                locations={orderedLocations}
                tripId={trip.id}
                tripDays={getTripDays(trip)}
                tripStartDate={trip.startDate}
              />
            )}
          </TabsContent>

          <TabsContent value="accommodations" className="space-y-6">
            <AccommodationsList
              accommodations={trip.accommodations}
              tripId={trip.id}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="flights" className="space-y-6">
            <FlightsList
              flights={trip.flights}
              tripId={trip.id}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <BudgetOverview trip={trip} canEdit={canEdit} />
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <div className="h-144 rounded-lg overflow-hidden shadow">
              {orderedLocations.length === 0 ? (
                <Map itineraries={[]} zoom={4} />
              ) : (
                <Map itineraries={orderedLocations} zoom={10} />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
