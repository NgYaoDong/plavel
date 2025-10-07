import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function GlobeLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <Skeleton className="h-10 w-64 mx-auto mb-12" />

          {/* Main Grid: Globe + Stats Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Globe Section (2/3 width on large screens) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
              <Skeleton className="h-6 w-48 mb-6" />

              {/* Globe Placeholder */}
              <div className="relative w-full aspect-square max-h-[600px] bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                <div className="relative">
                  {/* Globe skeleton - circular */}
                  <div className="w-64 h-64 md:w-96 md:h-96 lg:w-[450px] lg:h-[450px] rounded-full bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400 animate-pulse" />

                  {/* Dots to simulate locations */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-ping"
                      style={{ animationDelay: "0s" }}
                    />
                  </div>
                  <div className="absolute top-1/4 left-1/3">
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-ping"
                      style={{ animationDelay: "0.5s" }}
                    />
                  </div>
                  <div className="absolute bottom-1/3 right-1/4">
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-ping"
                      style={{ animationDelay: "1s" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Sidebar (1/3 width on large screens) */}
            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-8">
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Country Count Box */}
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-6 text-center">
                    <Skeleton className="h-8 w-32 mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>

                  {/* Countries List */}
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-50"
                      >
                        <div className="text-gray-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
