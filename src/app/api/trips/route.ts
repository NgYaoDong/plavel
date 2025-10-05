import { auth } from "@/auth";
import { getCountryFromCoordinates } from "@/lib/actions/geocode";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const locations = await prisma.location.findMany({
      where: {
        trip: {
          userId: session.user?.id,
        },
      },
      select: {
        locationTitle: true,
        latitude: true,
        longitude: true,
        trip: {
          select: {
            title: true,
          },
        },
      },
    });
    const transformedLocations = await Promise.all(
      locations.map(async (location) => {
        const geocodeResult = await getCountryFromCoordinates(
          location.latitude,
          location.longitude
        );
        return {
            name: `${location.trip.title} - ${geocodeResult.formattedAddress}`,
            latitude: location.latitude,
            longitude: location.longitude,
            country: geocodeResult.country,
          };
      })
    );
    return NextResponse.json(transformedLocations);
  } catch (error) {
    console.error("Error fetching trips:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
