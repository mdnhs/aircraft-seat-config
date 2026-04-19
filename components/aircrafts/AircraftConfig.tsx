"use client";
import React, { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  rectIntersection,
} from "@dnd-kit/core";
import { TOTAL_SEATS, TOOLS } from "./constants";
import { SeatConfig, CabinConfig } from "./types";
import { AircraftHeader } from "./AircraftHeader";
import { AircraftToolbar } from "./AircraftToolbar";
import { AircraftSeatMap } from "./AircraftSeatMap";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQueryState, parseAsJson, parseAsArrayOf } from "nuqs";

const INITIAL_CABINS: CabinConfig[] = [];

export default function AircraftConfig() {
  const [mounted, setMounted] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatConfig, setSeatConfig] = useQueryState<SeatConfig>(
    "config",
    parseAsJson<SeatConfig>((v) => v as SeatConfig).withDefault({}),
  );
  const [cabins, setCabins] = useQueryState<CabinConfig[]>(
    "cabins",
    parseAsArrayOf(
      parseAsJson<CabinConfig>((v) => v as CabinConfig),
    ).withDefault(INITIAL_CABINS),
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over) {
      const toolId = active.id as string;
      const seatId = over.id as string;

      setSeatConfig((prev) => {
        const current = prev || {};
        const newConfig = { ...current };

        // If the dropped seat is part of a selection, apply to all selected seats
        // Otherwise, just apply to the dropped seat
        const targetSeats = selectedSeats.includes(seatId)
          ? selectedSeats
          : [seatId];

        targetSeats.forEach((id) => {
          if (toolId === "delete") {
            delete newConfig[id];
          } else {
            newConfig[id] = toolId;
          }
        });

        return newConfig;
      });
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-muted/50 p-6 font-sans text-slate-800 opacity-0 transition-opacity duration-300" />
    );
  }

  const availableSeats = TOTAL_SEATS - Object.keys(seatConfig).length;
  const activeTool = TOOLS.find((t) => t.id === activeId);

  const handleAddCabin = (newCabin: CabinConfig) => {
    // Explicitly using the label provided by the dialog (which is the cabin type)
    setCabins((prev) => [...(prev || []), newCabin]);
  };

  const handleDeleteCabin = (id: string) => {
    setCabins((prev) => (prev || []).filter((c) => c.id !== id));
  };

  const handleUpdateCabin = (id: string, updates: Partial<CabinConfig>) => {
    setCabins((prev) =>
      (prev || []).map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-muted/50 p-6 font-sans text-slate-800">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          collisionDetection={rectIntersection}
        >
          <AircraftHeader availableSeats={availableSeats} />
          <AircraftToolbar />
          <AircraftSeatMap
            seatConfig={seatConfig}
            cabins={cabins || INITIAL_CABINS}
            onAddCabin={handleAddCabin}
            onDeleteCabin={handleDeleteCabin}
            onUpdateCabin={handleUpdateCabin}
            selectedSeats={selectedSeats}
            onSelectedSeatsChange={setSelectedSeats}
          />

          <DragOverlay dropAnimation={null} zIndex={1000}>
            {activeTool ? (
              <div className="flex flex-col items-center justify-center p-2 bg-background border-2 border-primary rounded-md shadow-2xl cursor-grabbing w-16 h-16 opacity-90 scale-110 pointer-events-none">
                <div className="text-primary mb-1">{activeTool.icon}</div>
                <span className="text-[9px] font-bold text-primary uppercase">
                  {activeTool.label}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </TooltipProvider>
  );
}
