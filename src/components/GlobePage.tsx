"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GlobeMethods } from "react-globe.gl";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export interface TransformedLocation {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
}

export default function GlobePage() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visitedCountries, setVisitedCountries] = useState<Set<string>>(
    new Set()
  );
  const [locations, setLocations] = useState<TransformedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globeLoaded, setGlobeLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const pointsData = useMemo(() => {
    if (!locations?.length) return [];
    const mapped = locations
      .map((l) => ({
        lat: l.latitude,
        lng: l.longitude,
        name: l.name,
        country: l.country,
      }))
      .filter(
        (p) =>
          typeof p.lat === "number" &&
          typeof p.lng === "number" &&
          !Number.isNaN(p.lat) &&
          !Number.isNaN(p.lng)
      );
    return mapped;
  }, [locations]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/trips/");
        if (!response.ok) {
          throw new Error("Failed to fetch locations");
        }
        const data = await response.json();
        setLocations(data);
        const countries = new Set<string>(
          data.map((loc: TransformedLocation) => loc.country)
        );
        setVisitedCountries(countries);
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (globeLoaded && globeRef.current) {
      try {
        globeRef.current.controls().autoRotate = true;
        globeRef.current.controls().autoRotateSpeed = 2;
      } catch {
        // ignore if methods unavailable
      }
    }
  }, [globeLoaded]);

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = Math.min(width * 0.75, 600); // Maintain aspect ratio, max 600px
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-center text-2xl md:text-4xl font-bold mb-6 md:mb-12">
            Your Travel Journey
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 md:p-6">
                <h2 className="text-xl md:text-2xl font-semibold mb-4">
                  See where you&apos;ve been...
                </h2>
                <div 
                  ref={containerRef}
                  className="w-full relative"
                  style={{ height: `${dimensions.height}px` }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <Globe
                      ref={globeRef}
                      onGlobeReady={() => setGlobeLoaded(true)}
                      globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                      backgroundColor="rgba(0,0,0,0)"
                      pointColor={() => "#FF5733"}
                      pointLabel="name"
                      pointsData={pointsData}
                      pointRadius={0.5}
                      pointAltitude={0.1}
                      pointsMerge={true}
                      width={dimensions.width}
                      height={dimensions.height}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-8">
                <CardHeader className="text-xl md:text-2xl font-semibold">
                  <h2>Your Travel Stats</h2>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          You&apos;ve visited{" "}
                          <span className="font-bold">
                            {visitedCountries.size}
                          </span>{" "}
                          countries.
                        </p>
                      </div>
                      <div className="space-y-2 max-h-[400px] md:max-h-[500px] overflow-y-auto pr-2">
                        {Array.from(visitedCountries)
                          .sort()
                          .map((country) => (
                            <div
                              key={country}
                              className="p-3 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors border border-gray-100"
                            >
                              <MapPin className="text-red-600" />
                              <span className="font-md">{country}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
