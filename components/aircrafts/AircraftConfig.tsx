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

// ─── Utility ──────────────────────────────────────────────────────────────────

function recalculateRows(
  cabins: CabinConfig[],
  seatConfig: SeatConfig,
): { cabins: CabinConfig[]; seatConfig: SeatConfig } {
  let nextRow = 1;
  const newCabins: CabinConfig[] = [];
  const newSeatConfig: SeatConfig = {};

  for (const cabin of cabins) {
    const rowCount = Math.max(1, cabin.endRow - cabin.startRow + 1);
    const oldStart = cabin.startRow;
    const newStart = nextRow;
    const newEnd = nextRow + rowCount - 1;

    newCabins.push({
      ...cabin,
      startRow: newStart,
      endRow: newEnd,
    });

    // Map old row/seat assignments to new row numbers
    const groups = cabin.seatFormat.split("-").map(Number);
    const totalCols = groups.reduce((a, b) => a + b, 0);
    const labels =
      cabin.customLabels && cabin.customLabels.length === totalCols
        ? cabin.customLabels
        : Array.from({ length: totalCols }, (_, i) =>
            String.fromCharCode(65 + i),
          );

    for (let r = 0; r < rowCount; r++) {
      const oldRow = oldStart + r;
      const newRow = newStart + r;
      labels.forEach((col) => {
        const oldKey = `${oldRow}-${col}`;
        const newKey = `${newRow}-${col}`;
        if (seatConfig[oldKey]) {
          newSeatConfig[newKey] = seatConfig[oldKey];
        }
      });
    }

    nextRow = newEnd + 1;
  }

  return { cabins: newCabins, seatConfig: newSeatConfig };
}

// ─── AircraftConfig ───────────────────────────────────────────────────────────

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

  const handleAddCabin = (newCabin: CabinConfig, index?: number) => {
    const currentCabins = cabins || [];
    const nextCabins = [...currentCabins];
    if (index !== undefined) {
      nextCabins.splice(index, 0, newCabin);
    } else {
      nextCabins.push(newCabin);
    }

    const result = recalculateRows(nextCabins, seatConfig || {});
    setCabins(result.cabins);
    setSeatConfig(result.seatConfig);
  };

  const handleDeleteCabin = (id: string) => {
    const currentCabins = cabins || [];
    const nextCabins = currentCabins.filter((c) => c.id !== id);

    const result = recalculateRows(nextCabins, seatConfig || {});
    setCabins(result.cabins);
    setSeatConfig(result.seatConfig);
  };

  const handleUpdateCabin = (id: string, updates: Partial<CabinConfig>) => {
    const currentCabins = cabins || [];
    const nextCabins = currentCabins.map((c) =>
      c.id === id ? { ...c, ...updates } : c,
    );

    const result = recalculateRows(nextCabins, seatConfig || {});
    setCabins(result.cabins);
    setSeatConfig(result.seatConfig);
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
            seatConfig={seatConfig || {}}
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
