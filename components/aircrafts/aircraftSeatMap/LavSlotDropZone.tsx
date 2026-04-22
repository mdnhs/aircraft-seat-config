"use client";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { Toilet } from "lucide-react";

interface LavSlotDropZoneProps {
  position: number;
  lavCount: number;
}

export const LavSlotDropZone = ({
  position,
  lavCount,
}: LavSlotDropZoneProps) => {
  const { active } = useDndContext();
  const isLavDragging = active?.id === "lav";
  const { setNodeRef, isOver } = useDroppable({
    id: `lav-slot-${position}`,
    disabled: !isLavDragging || lavCount >= 2,
  });

  if (!isLavDragging || lavCount >= 2) return null;

  return (
    <div
      ref={setNodeRef}
      title="Drop LAV here"
      className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-dashed transition-all ${
        isOver
          ? "scale-110 border-emerald-500 bg-emerald-100 text-emerald-600 shadow-md"
          : "border-emerald-300 bg-emerald-50/60 text-emerald-400"
      }`}
    >
      <Toilet className="h-5 w-5" />
    </div>
  );
};
