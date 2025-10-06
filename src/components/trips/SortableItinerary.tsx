import { Location } from "@/generated/prisma";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useId, useState } from "react";
import { Button } from "../ui/button";
import { reorderItinerary } from "@/lib/actions/reorder-itinerary";

interface SortableItineraryProps {
  locations: Location[];
  tripId: string;
  onReorder?: (newLocations: Location[]) => void;
}

// TODO: implement things like Day 1, Day 2 based on the number of days in the trip, and allow users to drag the locations between days

function SortableItem({ item }: { item: Location }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
      className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm cursor-move hover:shadow-md transition flex items-center justify-between"
    >
      <div>
        <h4 className="font-medium text-gray-800">{item.locationTitle}</h4>
        <p className="text-sm text-gray-500">
          {item.address || `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
        </p>
      </div>
      <div>
        {/* TODO: implement remove functionality */}
        <Button className="text-sm bg-red-700 hover:bg-red-800">Remove</Button>
      </div>
    </div>
  );
}

export default function SortableItinerary({
  locations,
  tripId,
  onReorder,
}: SortableItineraryProps) {
  const id = useId();
  const [localLocation, setLocalLocation] = useState(locations);

  // Keep local state in sync if parent updates locations
  useEffect(() => {
    setLocalLocation(locations);
  }, [locations]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = localLocation.findIndex((item) => item.id === active.id);
      const newIndex = localLocation.findIndex((item) => item.id === over!.id);
      const newItems = arrayMove(localLocation, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          order: index, // Update order based on new position
        })
      );
      setLocalLocation(newItems);
      onReorder?.(newItems);
      await reorderItinerary(
        tripId,
        newItems.map((item) => item.id)
      );
    }
  };

  return (
    // TODO: make the dragging smoother by adding some animation or easing (right now the boxes keep jumping when i drag them)
    <DndContext
      id={id}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        strategy={verticalListSortingStrategy}
        items={localLocation.map((loc) => loc.id)}
      >
        <div className="space-y-4">
          {localLocation.map((location, key) => (
            <SortableItem key={key} item={location} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
