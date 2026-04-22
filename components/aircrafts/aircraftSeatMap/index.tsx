"use client";
import { Card, CardContent } from "@/components/ui/card";
import SelectionArea from "@viselect/vanilla";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { DraggableTool } from "./DraggableTool";
import { TOOLS } from "../constants";
import {
  CabinConfig,
  EmergencyExitConfig,
  ExitAlignment,
  ExitSectionConfig,
  LavAlignment,
  LavSectionConfig,
  SeatConfig,
  WingsConfig,
  ZoneConfig,
} from "../types";
import { CabinSection } from "./CabinSection";
import { EditCabinDialog } from "./EditCabinDialog";
import { ExitSlot } from "./ExitSlot";
import { LavSectionSizeDialog } from "./LavSectionSizeDialog";
import { LavSizeDialog } from "./LavSizeDialog";
import { LavSlot } from "./LavSlot";
import { RenameLabelDialog } from "./RenameLabelDialog";
import { SlotInserter } from "./SlotInserter";
import { Wings } from "./Wings";

interface AircraftSeatMapProps {
  seatConfig: SeatConfig;
  cabins: CabinConfig[];
  zones: ZoneConfig[];
  emergencyExits: EmergencyExitConfig[];
  lavSections: LavSectionConfig[];
  onAddCabin: (cabin: CabinConfig) => void;
  onDeleteCabin: (id: string) => void;
  onDeleteEmergencyExit: (id: string) => void;
  onUpdateCabin: (id: string, updates: Partial<CabinConfig>) => void;
  onDeleteSeat: (id: string) => void;
  onSetLavSize: (seatId: string, size: number) => void;
  onDeleteLavSection: (id: string) => void;
  onSetLavSectionSize: (id: string, size: number) => void;
  onSetLavSectionAlignment: (id: string, alignment: LavAlignment) => void;
  exitSections: ExitSectionConfig[];
  exitMode: boolean;
  onAddExitSection: (position: number) => void;
  onDeleteExitSection: (id: string) => void;
  onSetExitSectionAlignment: (id: string, alignment: ExitAlignment) => void;
  wings: WingsConfig | null;
  onEditWings: () => void;
  onDeleteWings: () => void;
  selectedSeats: string[];
  onSelectedSeatsChange: (seats: string[]) => void;
  onDeleteZone: (id: string) => void;
  onUpdateZone: (id: string, updates: Partial<ZoneConfig>) => void;
  reversedSeats: string[];
  onReverseSeat: (seatId: string) => void;
}

export const AircraftSeatMap = ({
  seatConfig,
  cabins,
  zones,
  emergencyExits,
  lavSections,
  onAddCabin,
  onDeleteCabin,
  onDeleteEmergencyExit,
  onUpdateCabin,
  onDeleteSeat,
  onSetLavSize,
  onDeleteLavSection,
  onSetLavSectionSize,
  onSetLavSectionAlignment,
  exitSections,
  exitMode,
  onAddExitSection,
  onDeleteExitSection,
  onSetExitSectionAlignment,
  wings,
  onEditWings,
  onDeleteWings,
  selectedSeats,
  onSelectedSeatsChange,
  onDeleteZone,
  onUpdateZone,
  reversedSeats,
  onReverseSeat,
}: AircraftSeatMapProps) => {
  const seatZoneMap = zones.reduce<
    Record<string, { id: string; name: string; color: string }>
  >((map, zone) => {
    zone.seatIds.forEach((id) => {
      map[id] = { id: zone.id, name: zone.name, color: zone.color };
    });
    return map;
  }, {});

  const [lavSizeDialog, setLavSizeDialog] = useState<{
    id: string;
    initialSize: number;
    maxSize: number;
  } | null>(null);

  const [lavSectionSizeDialog, setLavSectionSizeDialog] = useState<{
    id: string;
    initialSize: number;
  } | null>(null);

  const [renamingColumn, setRenamingColumn] = useState<{
    cabinId: string;
    colIndex: number;
    currentLabel: string;
  } | null>(null);

  const [renamingRow, setRenamingRow] = useState<{
    cabinId: string;
    rowIndex: number;
    currentLabel: string;
  } | null>(null);

  const [renamingZone, setRenamingZone] = useState<{
    id: string;
    currentName: string;
  } | null>(null);

  const [editingCabin, setEditingCabin] = useState<CabinConfig | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<SelectionArea | null>(null);

  const onChangeRef = useRef(onSelectedSeatsChange);
  useEffect(() => {
    onChangeRef.current = onSelectedSeatsChange;
  }, [onSelectedSeatsChange]);

  const selectedSeatsRef = useRef<string[]>(selectedSeats);
  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
  }, [selectedSeats]);

  useEffect(() => {
    if (!containerRef.current) return;

    selectionRef.current?.destroy();

    selectionRef.current = new SelectionArea({
      selectionAreaClass: "selection-area",
      selectables: [".seat-selectable"],
      boundaries: [containerRef.current],
      container: containerRef.current,
    } as any);

    selectionRef.current.on("beforestart", ({ event }) => {
      const target = event?.target as HTMLElement | null;
      if (
        target?.closest('[draggable="true"]') ||
        target?.closest("button") ||
        target?.closest('[role="dialog"]') ||
        target?.closest("[data-radix-popper-content-wrapper]")
      ) {
        return false;
      }
      return true;
    });

    selectionRef.current.on("move", ({ store: { selected } }) => {
      const keys = selected
        .map((el) => el.getAttribute("data-key"))
        .filter((k): k is string => k !== null);
      onChangeRef.current(keys);
    });

    selectionRef.current.on("stop", ({ store: { selected } }) => {
      const keys = selected
        .map((el) => el.getAttribute("data-key"))
        .filter((k): k is string => k !== null);
      onChangeRef.current(keys);
    });

    return () => {
      selectionRef.current?.destroy();
      selectionRef.current = null;
    };
  }, []);

  const handleCustomizeLavSize = (seatId: string) => {
    const [rowStr, col] = seatId.split("-");
    const row = parseInt(rowStr);
    const cabin = cabins.find((c) => row >= c.startRow && row <= c.endRow);
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
    let currentSize = 1;
    for (let i = colIndex - 1; i >= 0; i--) {
      if (seatConfig[`${row}-${labels[i]}`] === "lav-occupied") currentSize++;
      else break;
    }
    setLavSizeDialog({
      id: seatId,
      initialSize: currentSize,
      maxSize: colIndex + 1,
    });
  };

  const handleRenameColumn = (label: string) => {
    if (!renamingColumn) return;
    const cabin = cabins.find((c) => c.id === renamingColumn.cabinId);
    if (cabin) {
      const groups = cabin.seatFormat.split("-").map(Number);
      const totalCols = groups.reduce((a, b) => a + b, 0);
      const currentLabels =
        cabin.customLabels && cabin.customLabels.length === totalCols
          ? [...cabin.customLabels]
          : Array.from({ length: totalCols }, (_, i) =>
              String.fromCharCode(65 + i),
            );
      currentLabels[renamingColumn.colIndex] = label;
      onUpdateCabin(cabin.id, { customLabels: currentLabels });
    }
  };

  const handleRenameRow = (label: string) => {
    if (!renamingRow) return;
    const cabin = cabins.find((c) => c.id === renamingRow.cabinId);
    if (cabin) {
      const numRows = cabin.endRow - cabin.startRow + 1;
      const currentLabels =
        cabin.customRowLabels && cabin.customRowLabels.length === numRows
          ? [...cabin.customRowLabels]
          : Array.from({ length: numRows }, (_, i) =>
              String(cabin.startRow + i).padStart(2, "0"),
            );
      currentLabels[renamingRow.rowIndex] = label;
      onUpdateCabin(cabin.id, { customRowLabels: currentLabels });
    }
  };

  const handleRenameZone = (name: string) => {
    if (renamingZone) {
      onUpdateZone(renamingZone.id, { name });
    }
  };

  return (
    <div className="bg-background flex min-h-150 overflow-hidden">
      <div className="border-border bg-muted/30 z-10 flex w-20 flex-col gap-2 border-r p-3 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
        {TOOLS.map((tool) => (
          <DraggableTool key={tool.id} tool={tool} />
        ))}
      </div>

      <div className="bg-muted/5 scrollbar-thin scrollbar-thumb-muted-foreground/10 selection-boundary flex flex-1 overflow-auto px-12 py-4 select-none">
        <div className="flex h-112 items-stretch">
          <div
            className="relative shrink-0"
            style={{ aspectRatio: "185 / 312" }}
          >
            <Image
              src="/head.svg"
              alt="Aircraft Silhouette"
              fill
              priority
              className="pointer-events-none select-none"
            />
          </div>
          <Card className="bg-background -ml-px w-fit max-w-full overflow-hidden rounded-l-none rounded-r-[12px] border border-[#DCDCDC] !py-0">
            <CardContent
              className={`min-h-112 min-w-150 ${cabins.length > 0 || "flex items-center justify-center"} h-full px-3 py-0`}
            >
              <div
                ref={containerRef}
                className="scrollbar-thin scrollbar-thumb-muted-foreground/10 relative flex h-full items-center gap-4 overflow-x-auto"
              >
                <Wings
                  wings={wings}
                  containerRef={containerRef}
                  cabins={cabins}
                  onEdit={onEditWings}
                  onDelete={onDeleteWings}
                />
                {cabins.map((cabin, idx) => {
                  const slotExits = exitSections.filter(
                    (e) => e.position === idx,
                  );
                  const slotLavs = lavSections.filter(
                    (l) => l.position === idx,
                  );
                  return (
                    <React.Fragment key={cabin.id}>
                      <SlotInserter
                        position={idx}
                        cabins={cabins}
                        onAddCabin={onAddCabin}
                        lavCountAtPosition={slotLavs.length}
                        exitMode={exitMode}
                        exitCountAtPosition={slotExits.length}
                        onAddExitSection={onAddExitSection}
                      />
                      {slotExits.length > 0 && (
                        <ExitSlot
                          exits={slotExits}
                          onDelete={onDeleteExitSection}
                          onSetAlignment={onSetExitSectionAlignment}
                        />
                      )}
                      {slotLavs.length > 0 && (
                        <LavSlot
                          lavs={slotLavs}
                          onDelete={onDeleteLavSection}
                          onSetAlignment={onSetLavSectionAlignment}
                          onOpenSizeDialog={(id, size) =>
                            setLavSectionSizeDialog({ id, initialSize: size })
                          }
                        />
                      )}
                      <CabinSection
                        cabin={cabin}
                        seatConfig={seatConfig}
                        onDelete={onDeleteCabin}
                        onEditCabin={setEditingCabin}
                        onDeleteSeat={onDeleteSeat}
                        selectedSeats={selectedSeats}
                        seatZoneMap={seatZoneMap}
                        emergencyExits={emergencyExits}
                        onDeleteEmergencyExit={onDeleteEmergencyExit}
                        onCustomizeLavSize={handleCustomizeLavSize}
                        onRenameColumn={(cabinId, colIndex, currentLabel) =>
                          setRenamingColumn({ cabinId, colIndex, currentLabel })
                        }
                        onRenameRow={(cabinId, rowIndex, currentLabel) =>
                          setRenamingRow({ cabinId, rowIndex, currentLabel })
                        }
                        onDeleteZone={onDeleteZone}
                        onRenameZone={(id, currentName) =>
                          setRenamingZone({ id, currentName })
                        }
                        reversedSeats={reversedSeats}
                        onReverseSeat={onReverseSeat}
                      />
                    </React.Fragment>
                  );
                })}

                {(() => {
                  const lastPos = cabins.length;
                  const slotExits = exitSections.filter(
                    (e) => e.position === lastPos,
                  );
                  const slotLavs = lavSections.filter(
                    (l) => l.position === lastPos,
                  );
                  return (
                    <>
                      {slotExits.length > 0 && (
                        <ExitSlot
                          exits={slotExits}
                          onDelete={onDeleteExitSection}
                          onSetAlignment={onSetExitSectionAlignment}
                        />
                      )}
                      {slotLavs.length > 0 && (
                        <LavSlot
                          lavs={slotLavs}
                          onDelete={onDeleteLavSection}
                          onSetAlignment={onSetLavSectionAlignment}
                          onOpenSizeDialog={(id, size) =>
                            setLavSectionSizeDialog({ id, initialSize: size })
                          }
                        />
                      )}
                    </>
                  );
                })()}

                <SlotInserter
                  position={cabins.length}
                  cabins={cabins}
                  onAddCabin={onAddCabin}
                  lavCountAtPosition={
                    lavSections.filter((l) => l.position === cabins.length)
                      .length
                  }
                  exitMode={exitMode}
                  exitCountAtPosition={
                    exitSections.filter((e) => e.position === cabins.length)
                      .length
                  }
                  onAddExitSection={onAddExitSection}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RenameLabelDialog
        open={!!renamingColumn}
        title="Rename Column Label"
        description="Enter a new label for this column."
        initialValue={renamingColumn?.currentLabel ?? ""}
        onClose={() => setRenamingColumn(null)}
        onSave={handleRenameColumn}
      />

      <RenameLabelDialog
        open={!!renamingRow}
        title="Rename Row Label"
        description="Enter a new label for this row."
        initialValue={renamingRow?.currentLabel ?? ""}
        onClose={() => setRenamingRow(null)}
        onSave={handleRenameRow}
      />

      <RenameLabelDialog
        open={!!renamingZone}
        title="Rename Zone"
        description="Enter a new name for this zone."
        initialValue={renamingZone?.currentName ?? ""}
        onClose={() => setRenamingZone(null)}
        onSave={handleRenameZone}
      />

      <EditCabinDialog
        cabin={editingCabin}
        onClose={() => setEditingCabin(null)}
        onUpdate={onUpdateCabin}
      />

      <LavSectionSizeDialog
        open={!!lavSectionSizeDialog}
        initialSize={lavSectionSizeDialog?.initialSize ?? 1}
        onClose={() => setLavSectionSizeDialog(null)}
        onApply={(size) => {
          if (lavSectionSizeDialog) {
            onSetLavSectionSize(lavSectionSizeDialog.id, size);
          }
        }}
      />

      <LavSizeDialog
        open={!!lavSizeDialog}
        initialSize={lavSizeDialog?.initialSize ?? 1}
        maxSize={lavSizeDialog?.maxSize ?? 1}
        onClose={() => setLavSizeDialog(null)}
        onApply={(size) => {
          if (lavSizeDialog) {
            onSetLavSize(lavSizeDialog.id, size);
          }
        }}
      />
    </div>
  );
};
