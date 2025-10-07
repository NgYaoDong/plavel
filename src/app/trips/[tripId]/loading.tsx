import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TripDetailLoading() {
  return (
    <main className="container mx-auto p-4 md:p-8">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-10 w-3/4 max-w-md" />
            <Skeleton className="h-5 w-1/2 max-w-xs" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-4 border-b">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {/* Map Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full rounded-lg" />
          </CardContent>
        </Card>

        {/* Itinerary Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((day) => (
            <Card key={day}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2].map((item) => (
                  <div key={item} className="flex gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
