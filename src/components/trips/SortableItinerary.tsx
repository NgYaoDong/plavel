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
import { GripVertical, Clock } from "lucide-react";

// Helper function to format time
function formatTime(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-US", {
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
      className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-3"
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
      <div className="flex-1">
        <h4 className="font-medium text-gray-800">{item.locationTitle}</h4>
        <p className="text-sm text-gray-500">
          {item.address ||
            `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
        </p>
        
        {/* Time Display */}
        {(item.startTime || item.endTime) && (
          <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
            <Clock className="h-4 w-4" />
            <span>
              {item.startTime && formatTime(item.startTime)}
              {item.startTime && item.endTime && " - "}
              {item.endTime && formatTime(item.endTime)}
              {item.duration && (
                <span className="text-gray-500 ml-2">
                  ({formatDuration(item.duration)})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex gap-1">
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
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); // Sort by order within day
    return {
      day,
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
        {locationsByDay.map(({ day, locations: dayLocations, itemIds }) => (
          <div
            key={day}
            className="bg-gray-50 rounded-xl p-4 border border-gray-200"
          >
            {/* Day Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Day {day}
              </div>
              <div className="text-sm text-gray-500">
                {dayLocations.length}{" "}
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
        ))}
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
              <p className="text-sm text-gray-500">
                {activeLocation.address ||
                  `${activeLocation.latitude.toFixed(
                    4
                  )}, ${activeLocation.longitude.toFixed(4)}`}
              </p>
              {/* Time Display in Overlay */}
              {(activeLocation.startTime || activeLocation.endTime) && (
                <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    {activeLocation.startTime && formatTime(activeLocation.startTime)}
                    {activeLocation.startTime && activeLocation.endTime && " - "}
                    {activeLocation.endTime && formatTime(activeLocation.endTime)}
                    {activeLocation.duration && (
                      <span className="text-gray-500 ml-2">
                        ({formatDuration(activeLocation.duration)})
                      </span>
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
    }))
  );
  return prevSerialized === nextSerialized;
});
