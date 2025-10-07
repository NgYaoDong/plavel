import { Location } from "@/generated/prisma";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  rectIntersection,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, useState, memo, useEffect } from "react";
import { reorderItinerary } from "@/lib/actions/reorder-itinerary";
import { updateLocationDay } from "@/lib/actions/update-location-day";
import RemoveLocationDialog from "./RemoveLocationDialog";
import EditLocationForm from "./EditLocationForm";
import {
  GripVertical,
  Clock,
  FileText,
  ExternalLink,
  DollarSign,
} from "lucide-react";

// Helper function to format time
function formatTime(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-SG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Helper function to format duration
function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

interface SortableItineraryProps {
  locations: Location[];
  tripId: string;
  tripDays: number;
  tripStartDate: Date;
}

function DroppableDay({
  day,
  children,
}: {
  day: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 min-h-[100px] rounded-lg p-3 transition-colors ${
        isOver ? "bg-blue-50 border-2 border-blue-300 border-dashed" : ""
      }`}
    >
      {children}
    </div>
  );
}

function SortableItem({
  item,
  tripId,
  onRemove,
}: {
  item: Location;
  tripId: string;
  onRemove?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center gap-3"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-move text-gray-400 hover:text-gray-600 flex-shrink-0"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Location Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-800 break-words">{item.locationTitle}</h4>
        {item.address ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              item.address
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {item.address}
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        ) : (
          <p className="text-sm text-gray-500">
            {`${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
          </p>
        )}

        {/* Time Display */}
        {(item.startTime || item.endTime) && (
          <div className="flex items-center gap-2 mt-2 text-sm text-teal-600">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="break-words">
              {item.startTime && item.endTime ? (
                // Both start and end time
                <>
                  {formatTime(item.startTime)} - {formatTime(item.endTime)}
                  {item.duration && (
                    <span className="text-gray-500 ml-2">
                      ({formatDuration(item.duration)})
                    </span>
                  )}
                </>
              ) : item.startTime ? (
                // Only start time
                <>Starts at {formatTime(item.startTime)}</>
              ) : (
                // Only end time
                <>Ends at {formatTime(item.endTime)}</>
              )}
            </span>
          </div>
        )}

        {/* Notes Display */}
        {item.notes && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-600 whitespace-pre-wrap break-words">{item.notes}</p>
            </div>
          </div>
        )}

        {/* Cost and Category Display */}
        {(item.cost || item.category) && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3 flex-wrap text-sm">
              {item.cost && (
                <div className="flex items-center gap-1 text-gray-700">
                  <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="font-medium">
                    $
                    {item.cost.toLocaleString("en-SG", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              {item.category && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border capitalize min-w-[110px] text-center ${
                    item.category === "food"
                      ? "bg-orange-100 text-orange-700 border-orange-200"
                      : item.category === "transport"
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : item.category === "activity"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : item.category === "shopping"
                      ? "bg-purple-100 text-purple-700 border-purple-200"
                      : item.category === "entertainment"
                      ? "bg-pink-100 text-pink-700 border-pink-200"
                      : "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {item.category.replace("_", " ")}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex gap-1 self-end sm:self-center">
        <EditLocationForm location={item} tripId={tripId} />
        <RemoveLocationDialog
          locationId={item.id}
          locationTitle={item.locationTitle}
          tripId={tripId}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}

function SortableItinerary({
  locations,
  tripId,
  tripDays,
  tripStartDate,
}: SortableItineraryProps) {
  const id = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimisticLocations, setOptimisticLocations] = useState(locations);

  // Sync optimistic state with props when locations change from server
  useEffect(() => {
    setOptimisticLocations(locations);
  }, [locations]);

  // Configure sensors for better drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group locations by day - use optimistic state for immediate UI updates
  const locationsByDay = Array.from({ length: tripDays }, (_, i) => {
    const day = i + 1;
    const dayLocs = optimisticLocations
      .filter((loc) => (loc.day || 1) === day)
      .sort((a, b) => {
        // If both have start times, sort by start time
        if (a.startTime && b.startTime) {
          return (
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
        }
        // If only one has start time, prioritize it
        if (a.startTime) return -1;
        if (b.startTime) return 1;
        // Otherwise sort by manual order
        return (a.order ?? 0) - (b.order ?? 0);
      });

    // Calculate date for this day
    const dayDate = new Date(tripStartDate);
    dayDate.setDate(dayDate.getDate() + (day - 1));

    return {
      day,
      dayDate,
      locations: dayLocs,
      itemIds: dayLocs.map((loc) => loc.id),
    };
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we're dragging over a day container
    if (overId.startsWith("day-")) {
      const targetDay = parseInt(overId.split("-")[1]);
      const activeLocation = locations.find((loc) => loc.id === activeId);

      if (activeLocation && (activeLocation.day || 1) !== targetDay) {
        // Optimistically update on drop, not during drag
        // This prevents constant state updates during dragging
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeLocation = optimisticLocations.find(
      (loc) => loc.id === activeId
    );

    if (!activeLocation) {
      return;
    }

    // If dropped on a day container, update the location's day
    if (overId.startsWith("day-")) {
      const targetDay = parseInt(overId.split("-")[1]);
      const currentDay = activeLocation.day || 1;

      if (currentDay !== targetDay) {
        // Optimistically update UI immediately
        const locationsInTargetDay = optimisticLocations.filter(
          (loc) => loc.day === targetDay
        ).length;

        setOptimisticLocations((prev) =>
          prev.map((loc) =>
            loc.id === activeId
              ? { ...loc, day: targetDay, order: locationsInTargetDay }
              : loc
          )
        );

        // Update server in background
        updateLocationDay(activeId, targetDay, tripId);
      }
      return;
    }

    // If dropped on another location (reordering within day)
    const overLocation = optimisticLocations.find((loc) => loc.id === overId);
    const activeDay = activeLocation.day || 1;
    const overDay = overLocation?.day || 1;

    // If dropped on a location in a DIFFERENT day, move to that day
    if (overLocation && activeDay !== overDay) {
      // Optimistically update UI immediately
      const locationsInTargetDay = optimisticLocations.filter(
        (loc) => loc.day === overDay
      ).length;

      setOptimisticLocations((prev) =>
        prev.map((loc) =>
          loc.id === activeId
            ? { ...loc, day: overDay, order: locationsInTargetDay }
            : loc
        )
      );

      // Update server in background
      updateLocationDay(activeId, overDay, tripId);
      return;
    }

    // If dropped on a location in the SAME day, reorder within the day
    if (overLocation && activeDay === overDay) {
      const dayLocations = optimisticLocations.filter(
        (loc) => (loc.day || 1) === activeDay
      );
      const oldIndex = dayLocations.findIndex((loc) => loc.id === activeId);
      const newIndex = dayLocations.findIndex((loc) => loc.id === overId);

      const reordered = arrayMove(dayLocations, oldIndex, newIndex);
      const otherLocations = optimisticLocations.filter(
        (loc) => (loc.day || 1) !== activeDay
      );

      // Update order within the day (0-indexed per day)
      const reorderedWithOrder = reordered.map((item, index) => ({
        ...item,
        order: index,
      }));

      const newItems = [...otherLocations, ...reorderedWithOrder];

      // Optimistically update UI immediately
      setOptimisticLocations(newItems);

      // Update server in background
      reorderItinerary(
        tripId,
        newItems.map((item) => item.id)
      );
    }
  };

  const activeLocation = locations.find((loc) => loc.id === activeId);

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {locationsByDay.map(
          ({ day, dayDate, locations: dayLocations, itemIds }) => (
            <div
              key={day}
              className="bg-gray-50 rounded-xl p-4 border border-gray-200"
            >
              {/* Day Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Day {day}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {dayDate.toLocaleDateString("en-SG", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  • {dayLocations.length}{" "}
                  {dayLocations.length === 1 ? "location" : "locations"}
                </div>
              </div>

              {/* Drop Zone */}
              <SortableContext
                id={`sortable-day-${day}`}
                strategy={verticalListSortingStrategy}
                items={itemIds}
              >
                <DroppableDay day={day}>
                  {dayLocations.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Drop locations here or add new ones
                    </div>
                  ) : (
                    dayLocations.map((location) => (
                      <SortableItem
                        key={location.id}
                        item={location}
                        tripId={tripId}
                        onRemove={() => {
                          // onRemove is handled by the dialog component
                          // No local state update needed - server action will trigger re-fetch
                        }}
                      />
                    ))
                  )}
                </DroppableDay>
              </SortableContext>
            </div>
          )
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeLocation ? (
          <div className="p-4 bg-white border-2 border-blue-500 rounded-lg shadow-xl flex items-center gap-3 opacity-90">
            <GripVertical className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-800">
                {activeLocation.locationTitle}
              </h4>
              {activeLocation.address ? (
                <span className="text-sm text-blue-600 inline-flex items-center gap-1">
                  {activeLocation.address}
                  <ExternalLink className="h-3 w-3" />
                </span>
              ) : (
                <p className="text-sm text-gray-500">
                  {`${activeLocation.latitude.toFixed(
                    4
                  )}, ${activeLocation.longitude.toFixed(4)}`}
                </p>
              )}
              {/* Time Display in Overlay */}
              {(activeLocation.startTime || activeLocation.endTime) && (
                <div className="flex items-center gap-2 mt-2 text-sm text-teal-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    {activeLocation.startTime && activeLocation.endTime ? (
                      // Both start and end time
                      <>
                        {formatTime(activeLocation.startTime)} -{" "}
                        {formatTime(activeLocation.endTime)}
                        {activeLocation.duration && (
                          <span className="text-gray-500 ml-2">
                            ({formatDuration(activeLocation.duration)})
                          </span>
                        )}
                      </>
                    ) : activeLocation.startTime ? (
                      // Only start time
                      <>Starts at {formatTime(activeLocation.startTime)}</>
                    ) : (
                      // Only end time
                      <>Ends at {formatTime(activeLocation.endTime)}</>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Wrap in memo to prevent unnecessary re-renders
export default memo(SortableItinerary, (prevProps, nextProps) => {
  // Custom comparison: only re-render if the actual location data changes
  const prevSerialized = JSON.stringify(
    prevProps.locations.map((l) => ({
      id: l.id,
      order: l.order,
      day: l.day,
      locationTitle: l.locationTitle,
      startTime: l.startTime,
      endTime: l.endTime,
      duration: l.duration,
      notes: l.notes,
    }))
  );
  const nextSerialized = JSON.stringify(
    nextProps.locations.map((l) => ({
      id: l.id,
      order: l.order,
      day: l.day,
      locationTitle: l.locationTitle,
      startTime: l.startTime,
      endTime: l.endTime,
      duration: l.duration,
      notes: l.notes,
    }))
  );
  return prevSerialized === nextSerialized;
});
