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
import { AddZoneDialog } from "./AddZoneDialog";
import { AddEmergencyExitDialog } from "./AddEmergencyExitDialog";
import { AddWingDialog } from "./AddWingDialog";
import { TOOLS, TOTAL_SEATS } from "./constants";
import { CabinConfig, EmergencyExitConfig, ExitAlignment, ExitSectionConfig, LavAlignment, LavSectionConfig, SeatConfig, WingsConfig, ZoneConfig } from "./types";

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
  const [zones, setZones] = useQueryState<ZoneConfig[]>(
    "zones",
    parseAsArrayOf(
      parseAsJson<ZoneConfig>((v) => v as ZoneConfig),
    ).withDefault([]),
  );
  const [emergencyExits, setEmergencyExits] = useQueryState<EmergencyExitConfig[]>(
    "exits",
    parseAsArrayOf(
      parseAsJson<EmergencyExitConfig>((v) => v as EmergencyExitConfig),
    ).withDefault([]),
  );
  const [lavSections, setLavSections] = useQueryState<LavSectionConfig[]>(
    "lavs",
    parseAsArrayOf(
      parseAsJson<LavSectionConfig>((v) => v as LavSectionConfig),
    ).withDefault([]),
  );
  const [exitSections, setExitSections] = useQueryState<ExitSectionConfig[]>(
    "exitSections",
    parseAsArrayOf(
      parseAsJson<ExitSectionConfig>((v) => v as ExitSectionConfig),
    ).withDefault([]),
  );
  const [exitMode, setExitMode] = useState(false);
  const [wings, setWings] = useQueryState<WingsConfig | null>(
    "wings",
    parseAsJson<WingsConfig | null>((v) => v as WingsConfig | null).withDefault(null),
  );
  const [showAddWingDialog, setShowAddWingDialog] = useState(false);
  const [showAddZoneDialog, setShowAddZoneDialog] = useState(false);
  const [showAddEmergencyExitDialog, setShowAddEmergencyExitDialog] = useState(false);
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
            const currentTool = newConfig[id];
            if (currentTool === "lav" || currentTool === "lav-occupied") {
              const [rowStr, col] = id.split("-");
              const row = parseInt(rowStr);
              const cabin = cabins?.find((c) => row >= c.startRow && row <= c.endRow);
              if (cabin) {
                const groups = cabin.seatFormat.split("-").map(Number);
                const totalCols = groups.reduce((a, b) => a + b, 0);
                const labels = cabin.customLabels && cabin.customLabels.length === totalCols
                  ? cabin.customLabels
                  : Array.from({ length: totalCols }, (_, i) => String.fromCharCode(65 + i));
                
                const colIndex = labels.indexOf(col);
                if (currentTool === "lav") {
                  if (colIndex > 0) {
                    const prevId = `${row}-${labels[colIndex - 1]}`;
                    if (newConfig[prevId] === "lav-occupied") {
                      delete newConfig[prevId];
                    }
                  }
                } else {
                  if (colIndex < labels.length - 1) {
                    const nextId = `${row}-${labels[colIndex + 1]}`;
                    if (newConfig[nextId] === "lav") {
                      delete newConfig[nextId];
                    }
                  }
                }
              }
            }
            delete newConfig[id];
          } else if (toolId === "seat") {
            const currentTool = newConfig[id];
            // If dropping a seat tool on a lavatory, clear both halves
            if (currentTool === "lav" || currentTool === "lav-occupied") {
              const [rowStr, col] = id.split("-");
              const row = parseInt(rowStr);
              const cabin = cabins?.find((c) => row >= c.startRow && row <= c.endRow);
              if (cabin) {
                const groups = cabin.seatFormat.split("-").map(Number);
                const totalCols = groups.reduce((a, b) => a + b, 0);
                const labels = cabin.customLabels && cabin.customLabels.length === totalCols
                  ? cabin.customLabels
                  : Array.from({ length: totalCols }, (_, i) => String.fromCharCode(65 + i));
                
                const colIndex = labels.indexOf(col);
                if (currentTool === "lav" && colIndex > 0) {
                  const lowerId = `${row}-${labels[colIndex - 1]}`;
                  if (newConfig[lowerId] === "lav-occupied") delete newConfig[lowerId];
                } else if (currentTool === "lav-occupied" && colIndex < labels.length - 1) {
                  const upperId = `${row}-${labels[colIndex + 1]}`;
                  if (newConfig[upperId] === "lav") delete newConfig[upperId];
                }
              }
            }
            // Clear the "removed" or any equipment status to restore the seat
            delete newConfig[id];
          } else if (toolId === "lav") {
            const [rowStr, col] = id.split("-");
            const row = parseInt(rowStr);
            
            const cabin = cabins?.find((c) => row >= c.startRow && row <= c.endRow);
            if (cabin) {
              const groups = cabin.seatFormat.split("-").map(Number);
              const totalCols = groups.reduce((a, b) => a + b, 0);
              const labels = cabin.customLabels && cabin.customLabels.length === totalCols
                ? cabin.customLabels
                : Array.from({ length: totalCols }, (_, i) => String.fromCharCode(65 + i));
              
              const colIndex = labels.indexOf(col);
              
              // Spanning DOWN in UI means current seat and the one with LOWER index in labels array
              if (colIndex > 0) {
                const lowerCol = labels[colIndex - 1];
                const lowerId = `${row}-${lowerCol}`;
                newConfig[id] = "lav";
                newConfig[lowerId] = "lav-occupied";
              } else if (colIndex < labels.length - 1) {
                // If we are at the very bottom (A), span UP by making the one above us the Primary
                const upperCol = labels[colIndex + 1];
                const upperId = `${row}-${upperCol}`;
                newConfig[upperId] = "lav";
                newConfig[id] = "lav-occupied";
              } else {
                newConfig[id] = "lav";
              }
            }
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

  const availableSeats = TOTAL_SEATS - Object.keys(seatConfig || {}).length;
  const activeTool = TOOLS.find((t) => t.id === activeId);

  const handleAddCabin = (newCabin: CabinConfig, index?: number) => {
    const currentCabins = cabins || [];
    const nextCabins = [...currentCabins];
    const insertAt = index ?? nextCabins.length;
    nextCabins.splice(insertAt, 0, newCabin);

    const result = recalculateRows(nextCabins, seatConfig || {});
    setCabins(result.cabins);
    setSeatConfig(result.seatConfig);
    setLavSections((prev) =>
      (prev || []).map((l) =>
        l.position > insertAt ? { ...l, position: l.position + 1 } : l,
      ),
    );
    setExitSections((prev) =>
      (prev || []).map((e) =>
        e.position > insertAt ? { ...e, position: e.position + 1 } : e,
      ),
    );
  };

  const handleDeleteCabin = (id: string) => {
    const currentCabins = cabins || [];
    const removedIdx = currentCabins.findIndex((c) => c.id === id);
    const nextCabins = currentCabins.filter((c) => c.id !== id);

    const result = recalculateRows(nextCabins, seatConfig || {});
    setCabins(result.cabins);
    setSeatConfig(result.seatConfig);
    if (removedIdx !== -1) {
      setLavSections((prev) =>
        (prev || []).map((l) => {
          if (l.position === removedIdx) {
            // Was before the deleted cabin — move to end of previous slot (or stay at 0)
            return { ...l, position: Math.max(0, removedIdx - 1) };
          }
          if (l.position > removedIdx) return { ...l, position: l.position - 1 };
          return l;
        }),
      );
      setExitSections((prev) =>
        (prev || []).map((e) => {
          if (e.position === removedIdx) {
            return { ...e, position: Math.max(0, removedIdx - 1) };
          }
          if (e.position > removedIdx) return { ...e, position: e.position - 1 };
          return e;
        }),
      );
    }
  };

  const handleAddLavSection = (lav: LavSectionConfig) => {
    setLavSections((prev) => {
      const current = prev || [];
      const existing = current.filter((l) => l.position === lav.position);
      if (existing.length >= 2) return current;
      if (existing.length === 1) {
        const existingAlign = existing[0].alignment ?? "center";
        // Ensure first LAV gets a side; new LAV gets the opposite
        const firstAlignment: LavAlignment = existingAlign === "left" ? "left" : "right";
        const secondAlignment: LavAlignment = firstAlignment === "right" ? "left" : "right";
        return current
          .map((l) => l.id === existing[0].id ? { ...l, alignment: firstAlignment } : l)
          .concat({ ...lav, alignment: secondAlignment });
      }
      return [...current, lav];
    });
  };

  const handleDeleteLavSection = (id: string) => {
    setLavSections((prev) => (prev || []).filter((l) => l.id !== id));
  };

  const handleSetLavSectionSize = (id: string, size: number) => {
    setLavSections((prev) =>
      (prev || []).map((l) => (l.id === id ? { ...l, size } : l)),
    );
  };

  const handleSetLavSectionAlignment = (id: string, alignment: LavAlignment) => {
    setLavSections((prev) =>
      (prev || []).map((l) => (l.id === id ? { ...l, alignment } : l)),
    );
  };

  const handleAddExitSection = (position: number) => {
    setExitSections((prev) => {
      const current = prev || [];
      const existing = current.filter((e) => e.position === position);
      if (existing.length >= 2) return current;
      const existingAlignment = existing[0]?.alignment ?? "right";
      const newAlignment: ExitAlignment =
        existing.length === 0
          ? "right"
          : existingAlignment === "right"
            ? "left"
            : "right";
      return [
        ...current,
        { id: Math.random().toString(36).substring(7), position, alignment: newAlignment },
      ];
    });
  };

  const handleDeleteExitSection = (id: string) => {
    setExitSections((prev) => (prev || []).filter((e) => e.id !== id));
  };

  const handleSetExitSectionAlignment = (id: string, alignment: ExitAlignment) => {
    setExitSections((prev) =>
      (prev || []).map((e) => (e.id === id ? { ...e, alignment } : e)),
    );
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

  const handleSetLavSize = (seatId: string, size: number) => {
    const [rowStr, col] = seatId.split("-");
    const row = parseInt(rowStr);
    const cabin = (cabins || []).find(
      (c) => row >= c.startRow && row <= c.endRow,
    );
    if (!cabin) return;
    const groups = cabin.seatFormat.split("-").map(Number);
    const totalCols = groups.reduce((a, b) => a + b, 0);
    const labels =
      cabin.customLabels && cabin.customLabels.length === totalCols
        ? cabin.customLabels
        : Array.from({ length: totalCols }, (_, i) =>
            String.fromCharCode(65 + i),
          );
    const colIndex = labels.indexOf(col);
    setSeatConfig((prev) => {
      const current = { ...(prev || {}) };
      // Clear existing lav-occupied cells below this lav
      for (let i = colIndex - 1; i >= 0; i--) {
        if (current[`${row}-${labels[i]}`] === "lav-occupied")
          delete current[`${row}-${labels[i]}`];
        else break;
      }
      // Place new occupied cells
      for (let i = 1; i < size; i++) {
        const idx = colIndex - i;
        if (idx >= 0) current[`${row}-${labels[idx]}`] = "lav-occupied";
      }
      return current;
    });
  };

  const handleAddZone = (zone: ZoneConfig) => {
    setZones((prev) => [...(prev || []), zone]);
    setSelectedSeats([]);
  };

  const handleDeleteEmergencyExit = (id: string) => {
    setEmergencyExits((prev) => (prev || []).filter((e) => e.id !== id));
  };

  const handleAddEmergencyExit = (exit: EmergencyExitConfig) => {
    const row = exit.row;
    const cabin = (cabins || []).find(
      (c) => row >= c.startRow && row <= c.endRow,
    );
    if (cabin) {
      const groups = cabin.seatFormat.split("-").map(Number);
      const totalCols = groups.reduce((a, b) => a + b, 0);
      const labels =
        cabin.customLabels && cabin.customLabels.length === totalCols
          ? cabin.customLabels
          : Array.from({ length: totalCols }, (_, i) =>
              String.fromCharCode(65 + i),
            );
      setSeatConfig((prev) => {
        const next = { ...(prev || {}) };
        labels.forEach((col) => {
          delete next[`${row}-${col}`];
        });
        return next;
      });
    }
    setEmergencyExits((prev) => [...(prev || []), { id: exit.id, row: exit.row }]);
  };

  const handleDeleteSeat = (seatId: string) => {
    setSeatConfig((prev) => {
      const newConfig = { ...(prev || {}) };
      const currentTool = newConfig[seatId];

      if (currentTool === "lav" || currentTool === "lav-occupied") {
        const [rowStr, col] = seatId.split("-");
        const row = parseInt(rowStr);
        const cabin = cabins?.find((c) => row >= c.startRow && row <= c.endRow);
        if (cabin) {
          const groups = cabin.seatFormat.split("-").map(Number);
          const totalCols = groups.reduce((a, b) => a + b, 0);
          const labels = cabin.customLabels && cabin.customLabels.length === totalCols
            ? cabin.customLabels
            : Array.from({ length: totalCols }, (_, i) => String.fromCharCode(65 + i));
          
          const colIndex = labels.indexOf(col);
          if (currentTool === "lav") {
            if (colIndex > 0) {
              const lowerId = `${row}-${labels[colIndex - 1]}`;
              if (newConfig[lowerId] === "lav-occupied") {
                newConfig[lowerId] = "removed";
              }
            }
          } else {
            if (colIndex < labels.length - 1) {
              const upperId = `${row}-${labels[colIndex + 1]}`;
              if (newConfig[upperId] === "lav") {
                newConfig[upperId] = "removed";
              }
            }
          }
        }
      }

      newConfig[seatId] = "removed";
      return newConfig;
    });
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
          <AircraftToolbar
            selectedSeats={selectedSeats}
            onZoneClick={() => setShowAddZoneDialog(true)}
            onEmergencyExitClick={() => setShowAddEmergencyExitDialog(true)}
            onWingClick={() => setShowAddWingDialog(true)}
            exitMode={exitMode}
            onExitModeToggle={() => setExitMode((v) => !v)}
          />
          <AircraftSeatMap
            seatConfig={seatConfig || {}}
            cabins={cabins || INITIAL_CABINS}
            zones={zones || []}
            emergencyExits={emergencyExits || []}
            lavSections={lavSections || []}
            onDeleteEmergencyExit={handleDeleteEmergencyExit}
            onAddCabin={handleAddCabin}
            onDeleteCabin={handleDeleteCabin}
            onUpdateCabin={handleUpdateCabin}
            onDeleteSeat={handleDeleteSeat}
            onSetLavSize={handleSetLavSize}
            onAddLavSection={handleAddLavSection}
            onDeleteLavSection={handleDeleteLavSection}
            onSetLavSectionSize={handleSetLavSectionSize}
            onSetLavSectionAlignment={handleSetLavSectionAlignment}
            exitSections={exitSections || []}
            exitMode={exitMode}
            onAddExitSection={handleAddExitSection}
            onDeleteExitSection={handleDeleteExitSection}
            onSetExitSectionAlignment={handleSetExitSectionAlignment}
            wings={wings || null}
            selectedSeats={selectedSeats}
            onSelectedSeatsChange={setSelectedSeats}
          />
          <AddZoneDialog
            open={showAddZoneDialog}
            onOpenChange={setShowAddZoneDialog}
            selectedSeats={selectedSeats}
            onAddZone={handleAddZone}
          />
          <AddEmergencyExitDialog
            open={showAddEmergencyExitDialog}
            onOpenChange={setShowAddEmergencyExitDialog}
            cabins={cabins || INITIAL_CABINS}
            onAddEmergencyExit={handleAddEmergencyExit}
          />
          <AddWingDialog
            open={showAddWingDialog}
            onOpenChange={setShowAddWingDialog}
            cabins={cabins || INITIAL_CABINS}
            wings={wings || null}
            onSave={(newWings) => setWings(newWings)}
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
