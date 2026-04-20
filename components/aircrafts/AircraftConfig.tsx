"use client";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { parseAsArrayOf, parseAsJson, useQueryState } from "nuqs";
import React, { useEffect, useState } from "react";
import { AircraftHeader } from "./AircraftHeader";
import { AircraftSeatMap } from "./AircraftSeatMap";
import { AircraftToolbar } from "./AircraftToolbar";
import { TOOLS, TOTAL_SEATS } from "./constants";
import { CabinConfig, SeatConfig } from "./types";

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
      <div className="bg-muted/50 min-h-screen p-6 font-sans text-slate-800 opacity-0 transition-opacity duration-300" />
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
      <div className="bg-muted/50 min-h-screen p-6 font-sans text-slate-800">
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
              <div className="bg-background border-primary pointer-events-none flex h-16 w-16 scale-110 cursor-grabbing flex-col items-center justify-center rounded-md border-2 p-2 opacity-90 shadow-2xl">
                <div className="text-primary mb-1">{activeTool.icon}</div>
                <span className="text-primary text-[9px] font-bold uppercase">
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
