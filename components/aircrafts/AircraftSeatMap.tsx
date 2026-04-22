"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import SelectionArea from "@viselect/vanilla";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  DoorOpen,
  Plus,
  Settings2,
  Toilet,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { AddCabinDialog } from "./AddCabinDialog";
import { DraggableTool } from "./DraggableTool";
import { Seat } from "./Seat";
import { TOOLS } from "./constants";
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
} from "./types";
import Image from "next/image";
import { z } from "zod";

const cabinSchema = z
  .object({
    cabinType: z.string().min(1, "Cabin type is required"),
    rowFrom: z.number().min(1, "Row From must be at least 1"),
    rowTo: z.number().min(1, "Row To must be at least 1"),
    seatFormat: z
      .string()
      .regex(/^\d+(-\d+)*$/, "Invalid format (e.g., 3-3, 2-4-2)"),
  })
  .refine((data) => data.rowTo >= data.rowFrom, {
    message: "Row To must be greater than or equal to Row From",
    path: ["rowTo"],
  });

// ─── SeatCell ─────────────────────────────────────────────────────────────────

interface SeatCellProps {
  id: string;
  row: number;
  col: string;
  size: number;
  equipment: string | undefined;
  selected: boolean;
  onDeleteSeat: (id: string) => void;
  onCustomizeLavSize?: () => void;
  style?: React.CSSProperties;
}

const SeatCell = ({
  id,
  row,
  col,
  size,
  equipment,
  selected,
  onDeleteSeat,
  onCustomizeLavSize,
  style,
}: SeatCellProps) => {
  const borderRadius = Math.max(4, Math.floor(size * 0.18));
  const isRemoved = equipment === "removed";
  const isLav = equipment === "lav";

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            className="group transition-transform"
            style={{
              borderRadius: `${borderRadius}px`,
              width: `${size}px`,
              height: `${size}px`,
              ...(style?.position === "absolute"
                ? {
                    position: "absolute",
                    top: style.top,
                    left: style.left,
                    height: style.height,
                    width: style.width || `${size}px`,
                    zIndex: style.zIndex,
                  }
                : {}),
            }}
          />
        }
      >
        <Seat
          id={id}
          row={row}
          col={col}
          equipment={equipment}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: `${borderRadius}px`,
          }}
          className={`border-2 ${isLav ? "flex items-center justify-center" : ""}`}
          selected={selected}
        />
      </ContextMenuTrigger>
      <ContextMenuContent>
        {isLav && (
          <>
            <ContextMenuItem
              onClick={() => onCustomizeLavSize?.()}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
              Customize Size
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          disabled={isRemoved}
          onClick={() => onDeleteSeat(id)}
          className="text-destructive focus:text-destructive gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {isLav ? "Delete LAV" : "Delete Seat"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

// ─── CabinSection ─────────────────────────────────────────────────────────────

interface CabinSectionProps {
  cabin: CabinConfig;
  seatConfig: SeatConfig;
  selectedSeats: string[];
  seatZoneMap: Record<string, { name: string; color: string }>;
  emergencyExits: EmergencyExitConfig[];
  onDeleteEmergencyExit: (id: string) => void;
  onDelete: (id: string) => void;
  onEditCabin: (cabin: CabinConfig) => void;
  onDeleteSeat: (id: string) => void;
  onCustomizeLavSize: (seatId: string) => void;
  onRenameColumn: (
    cabinId: string,
    colIndex: number,
    currentLabel: string,
  ) => void;
  onRenameRow: (
    cabinId: string,
    rowIndex: number,
    currentLabel: string,
  ) => void;
}

const CabinSection = ({
  cabin,
  seatConfig,
  selectedSeats,
  seatZoneMap,
  emergencyExits,
  onDeleteEmergencyExit,
  onDelete,
  onEditCabin,
  onDeleteSeat,
  onCustomizeLavSize,
  onRenameColumn,
  onRenameRow,
}: CabinSectionProps) => {
  const rows = Array.from(
    { length: cabin.endRow - cabin.startRow + 1 },
    (_, i) => cabin.startRow + i,
  );

  const rowLabels = rows.map((row, idx) => {
    if (cabin.customRowLabels && cabin.customRowLabels[idx]) {
      return cabin.customRowLabels[idx];
    }
    return String(row).padStart(2, "0");
  });

  const groups = cabin.seatFormat.split("-").map(Number);
  const totalCols = groups.reduce((a, b) => a + b, 0);

  const containerPadding = 48;
  const labelHeight = 20;
  const numSpacers = groups.length - 1;

  const availableHeight = 400 - containerPadding - labelHeight;
  const multiplier = 1.2 * totalCols + 0.7 * numSpacers;
  const calculatedSeatSize = Math.floor(availableHeight / multiplier);

  const seatSize = Math.min(40, Math.max(20, calculatedSeatSize));
  const verticalGap = Math.max(4, Math.floor(seatSize * 0.2));
  const spacerHeight = Math.max(8, Math.floor(seatSize * 0.5));

  const allLabels =
    cabin.customLabels && cabin.customLabels.length === totalCols
      ? cabin.customLabels
      : Array.from({ length: totalCols }, (_, i) =>
          String.fromCharCode(65 + i),
        );

  const reversedLabels = [...allLabels].reverse();

  const exitRowMap = emergencyExits.reduce<Record<number, EmergencyExitConfig>>(
    (acc, e) => {
      acc[e.row] = e;
      return acc;
    },
    {},
  );

  const hasExitRows = rows.some((r) => exitRowMap[r] !== undefined);

  const colGroups = [...groups].reverse().reduce(
    (acc, groupSize) => {
      const start = acc.nextIndex;
      const groupLabels = reversedLabels.slice(start, start + groupSize);
      acc.groups.push(groupLabels);
      acc.nextIndex += groupSize;
      return acc;
    },
    { groups: [] as string[][], nextIndex: 0 },
  ).groups;

  const getLavHeight = (mainCol: string, lavSize: number): number => {
    let gi = -1,
      ci = -1;
    for (let g = 0; g < colGroups.length; g++) {
      const c = colGroups[g].indexOf(mainCol);
      if (c !== -1) {
        gi = g;
        ci = c;
        break;
      }
    }
    if (gi === -1) return seatSize;
    let totalHeight = 0;
    let remaining = lavSize;
    let crossedAisle = false;
    while (remaining > 0 && gi < colGroups.length) {
      if (crossedAisle) {
        totalHeight += spacerHeight + verticalGap;
        crossedAisle = false;
      }
      const inGroup = colGroups[gi].length - ci;
      const take = Math.min(inGroup, remaining);
      totalHeight += take * seatSize + (take - 1) * verticalGap;
      remaining -= take;
      if (remaining > 0 && gi < colGroups.length - 1) {
        totalHeight += verticalGap;
        gi++;
        ci = 0;
        crossedAisle = true;
      } else break;
    }
    return totalHeight;
  };

  type ZoneSpan = {
    name: string;
    color: string;
    startIdx: number;
    length: number;
  };
  const rowZones = rows.map((row) => {
    for (const col of allLabels) {
      const z = seatZoneMap[`${row}-${col}`];
      if (z) return z;
    }
    return null;
  });
  const zoneSpans = rowZones.reduce<ZoneSpan[]>((spans, rz, idx) => {
    const last = spans[spans.length - 1];
    if (rz && last && last.name === rz.name) {
      last.length += 1;
    } else if (rz) {
      spans.push({ name: rz.name, color: rz.color, startIdx: idx, length: 1 });
    }
    return spans;
  }, []);

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div className="group/cabin flex h-[400px] items-stretch gap-3" />
        }
      >
        <div className="border-border/30 bg-muted/10 group-hover/cabin:bg-muted/20 flex w-8 items-center justify-center rounded-l-xl border-l-2 transition-colors">
          <span
            className="text-muted-foreground/30 text-[10px] font-black tracking-[0.4em] whitespace-nowrap uppercase select-none"
            style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
          >
            {cabin.label}
          </span>
        </div>

        <div className="border-border/60 bg-background flex flex-col justify-center rounded-3xl border p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <div
            className="relative flex flex-col"
            style={{ gap: `${verticalGap}px` }}
          >
            {zoneSpans.map((span) => {
              const cellWidth = seatSize + 8;
              const gapWidth = 8;
              const left = 40 + span.startIdx * (cellWidth + gapWidth) - 4;
              const width =
                span.length * cellWidth + (span.length - 1) * gapWidth + 8;
              return (
                <div
                  key={`zone-bg-${span.name}-${span.startIdx}`}
                  className="pointer-events-none absolute inset-y-0 rounded-xl"
                  style={{
                    left: `${left}px`,
                    width: `${width}px`,
                    backgroundColor: `${span.color}15`,
                  }}
                />
              );
            })}

            {rows.map((row, rowIdx) => {
              if (exitRowMap[row] === undefined) return null;
              const cellWidth = seatSize + 8;
              const gapWidth = 8;
              const left = 40 + rowIdx * (cellWidth + gapWidth) - 4;
              const width = cellWidth + 8;
              return (
                <div
                  key={`exit-bg-${row}`}
                  className="pointer-events-none absolute inset-y-0 rounded-xl"
                  style={{
                    left: `${left}px`,
                    width: `${width}px`,
                    backgroundColor: "rgb(239 68 68 / 0.08)",
                  }}
                />
              );
            })}

            {zoneSpans.length > 0 && (
              <div
                className="relative flex items-center gap-2"
                style={{ height: "20px", marginBottom: "2px" }}
              >
                <div className="w-8 flex-shrink-0" />
                <div className="relative flex-1" style={{ height: "20px" }}>
                  {zoneSpans.map((span) => {
                    const cellWidth = seatSize + 8;
                    const gapWidth = 8;
                    const left = span.startIdx * (cellWidth + gapWidth);
                    const width =
                      span.length * cellWidth + (span.length - 1) * gapWidth;
                    return (
                      <div
                        key={`${span.name}-${span.startIdx}`}
                        className="absolute inset-y-0 flex items-center justify-center overflow-hidden rounded"
                        style={{
                          left: `${left}px`,
                          width: `${width}px`,
                          backgroundColor: span.color,
                        }}
                      >
                        <span className="truncate px-2 text-[9px] font-bold text-white select-none">
                          {span.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div
              className="flex items-center gap-2"
              style={{ marginBottom: `${verticalGap}px` }}
            >
              <div className="w-8 flex-shrink-0" />
              {rows.map((row, idx) => {
                const exitConfig = exitRowMap[row];
                if (exitConfig !== undefined) {
                  return (
                    <ContextMenu key={row}>
                      <ContextMenuTrigger
                        render={
                          <div
                            data-row={row}
                            className="flex flex-shrink-0 cursor-context-menu items-center justify-center"
                            style={{ width: `${seatSize + 8}px` }}
                          />
                        }
                      >
                        <span className="block max-w-full truncate text-center text-[9px] font-bold tracking-tight text-red-500 uppercase select-none">
                          EXIT
                        </span>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={() => onDeleteEmergencyExit(exitConfig.id)}
                          className="text-destructive focus:text-destructive gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Emergency Exit
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                }
                return (
                  <ContextMenu key={row}>
                    <ContextMenuTrigger
                      render={
                        <div
                          data-row={row}
                          className="flex-shrink-0 cursor-context-menu"
                          style={{ width: `${seatSize + 8}px` }}
                        />
                      }
                    >
                      <span className="text-muted-foreground/40 block text-center text-[10px] font-bold transition-colors select-none hover:text-blue-500">
                        {rowLabels[idx]}
                      </span>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={() =>
                          onRenameRow(cabin.id, idx, rowLabels[idx])
                        }
                        className="gap-2"
                      >
                        <Settings2 className="h-4 w-4" />
                        Rename Row
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>

            {colGroups.map((group, groupIdx) => (
              <React.Fragment key={groupIdx}>
                {group.map((col, idx) => (
                  <div
                    key={col}
                    className="flex items-center gap-2"
                    style={{ height: `${seatSize}px` }}
                  >
                    <ContextMenu>
                      <ContextMenuTrigger
                        render={
                          <div className="flex w-8 flex-shrink-0 cursor-context-menu items-center justify-center" />
                        }
                      >
                        <span className="text-muted-foreground/40 text-[11px] font-bold transition-colors select-none hover:text-blue-500">
                          {col}
                        </span>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={() => {
                            const colIndex = allLabels.indexOf(col);
                            onRenameColumn(cabin.id, colIndex, col);
                          }}
                          className="gap-2"
                        >
                          <Settings2 className="h-4 w-4" />
                          Rename Label
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                    {rows.map((row) => {
                      const id = `${row}-${col}`;
                      const equipment = seatConfig[id];

                      if (exitRowMap[row] !== undefined) {
                        return (
                          <ContextMenu key={id}>
                            <ContextMenuTrigger
                              render={
                                <div
                                  data-row={row}
                                  style={{
                                    width: `${seatSize + 8}px`,
                                    height: `${seatSize}px`,
                                  }}
                                  className="flex-shrink-0 cursor-context-menu"
                                />
                              }
                            />
                            <ContextMenuContent>
                              <ContextMenuItem
                                onClick={() =>
                                  onDeleteEmergencyExit(exitRowMap[row]!.id)
                                }
                                className="text-destructive focus:text-destructive gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Emergency Exit
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        );
                      }

                      if (equipment === "lav-occupied") {
                        return (
                          <div
                            key={id}
                            data-row={row}
                            style={{
                              width: `${seatSize + 8}px`,
                              height: `${seatSize}px`,
                            }}
                            className="flex flex-shrink-0 justify-center"
                          />
                        );
                      }

                      const isLav = equipment === "lav";

                      let lavSize = 1;
                      if (isLav) {
                        const colIdx = allLabels.indexOf(col);
                        for (let i = colIdx - 1; i >= 0; i--) {
                          if (
                            seatConfig[`${row}-${allLabels[i]}`] ===
                            "lav-occupied"
                          )
                            lavSize++;
                          else break;
                        }
                      }
                      const lavHeight = isLav
                        ? getLavHeight(col, lavSize)
                        : seatSize;

                      return (
                        <div
                          key={id}
                          data-row={row}
                          style={{
                            width: `${seatSize + 8}px`,
                            height: `${seatSize}px`,
                          }}
                          className="relative flex flex-shrink-0 items-center justify-center"
                        >
                          <SeatCell
                            id={id}
                            row={row}
                            col={col}
                            size={seatSize}
                            equipment={equipment}
                            selected={selectedSeats.includes(id)}
                            onDeleteSeat={onDeleteSeat}
                            onCustomizeLavSize={
                              isLav ? () => onCustomizeLavSize(id) : undefined
                            }
                            style={
                              isLav
                                ? {
                                    height: `${lavHeight}px`,
                                    width: `${seatSize}px`,
                                    zIndex: 10,
                                    position: "absolute",
                                    top: 0,
                                    left: "4px",
                                  }
                                : undefined
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
                {groupIdx < colGroups.length - 1 && (
                  <div
                    className="flex items-center px-8"
                    style={{ height: `${spacerHeight}px` }}
                  >
                    <div className="bg-muted/30 border-muted/50 h-px w-full border-t border-dashed" />
                  </div>
                )}
              </React.Fragment>
            ))}

            {hasExitRows && (
              <div
                className="flex items-center gap-2"
                style={{ marginTop: `${verticalGap}px` }}
              >
                <div className="w-8 flex-shrink-0" />
                {rows.map((row) => {
                  const exitConfig = exitRowMap[row];
                  if (exitConfig !== undefined) {
                    return (
                      <ContextMenu key={row}>
                        <ContextMenuTrigger
                          render={
                            <div
                              data-row={row}
                              className="flex flex-shrink-0 cursor-context-menu items-center justify-center"
                              style={{ width: `${seatSize + 8}px` }}
                            />
                          }
                        >
                          <span className="block max-w-full truncate text-center text-[9px] font-bold tracking-tight text-red-500 uppercase select-none">
                            EXIT
                          </span>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem
                            onClick={() => onDeleteEmergencyExit(exitConfig.id)}
                            className="text-destructive focus:text-destructive gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Emergency Exit
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  }
                  return (
                    <div
                      key={row}
                      data-row={row}
                      className="flex-shrink-0"
                      style={{ width: `${seatSize + 8}px` }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onEditCabin(cabin)} className="gap-2">
          <Settings2 className="h-4 w-4" />
          Edit Cabin
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(cabin.id)}
          className="text-destructive focus:text-destructive gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Cabin
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

// ─── Wings ────────────────────────────────────────────────────────────────────

interface WingsProps {
  wings: WingsConfig | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  cabins: CabinConfig[];
}

const Wings = ({ wings, containerRef, cabins }: WingsProps) => {
  const [positions, setPositions] = useState<{
    left: { left: number; width: number; top: number; bottom: number } | null;
    right: { left: number; width: number; top: number; bottom: number } | null;
  }>({ left: null, right: null });

  useEffect(() => {
    if (!wings || !containerRef.current) {
      setPositions({ left: null, right: null });
      return;
    }

    const updatePositions = () => {
      const getRangeBounds = (from: number, to: number) => {
        const fromEls = containerRef.current?.querySelectorAll(
          `[data-row="${from}"]`,
        );
        const toEls = containerRef.current?.querySelectorAll(
          `[data-row="${to}"]`,
        );

        if (!fromEls?.length || !toEls?.length) return null;

        let minLeft = Infinity;
        let maxRight = -Infinity;
        let minTop = Infinity;
        let maxBottom = -Infinity;

        const containerRect = containerRef.current!.getBoundingClientRect();
        const allEls = [...Array.from(fromEls), ...Array.from(toEls)];

        allEls.forEach((el) => {
          const rect = (el as HTMLElement).getBoundingClientRect();
          const relativeLeft =
            rect.left - containerRect.left + containerRef.current!.scrollLeft;
          const relativeRight =
            rect.right - containerRect.left + containerRef.current!.scrollLeft;
          const relativeTop = rect.top - containerRect.top;
          const relativeBottom = rect.bottom - containerRect.top;

          minLeft = Math.min(minLeft, relativeLeft);
          maxRight = Math.max(maxRight, relativeRight);
          minTop = Math.min(minTop, relativeTop);
          maxBottom = Math.max(maxBottom, relativeBottom);
        });

        // Find the cabin container to get the vertical border
        const seatEl = allEls[0] as HTMLElement;
        const cabinEl = seatEl.closest(".rounded-3xl");

        let cabinTop = minTop;
        let cabinBottom = maxBottom;

        if (cabinEl) {
          const rect = cabinEl.getBoundingClientRect();
          cabinTop = rect.top - containerRect.top;
          cabinBottom = rect.bottom - containerRect.top;
        }

        return {
          left: minLeft,
          width: maxRight - minLeft,
          top: cabinTop,
          bottom: cabinBottom,
        };
      };

      setPositions({
        left: getRangeBounds(wings.leftFromRow, wings.leftToRow),
        right: getRangeBounds(wings.rightFromRow, wings.rightToRow),
      });
    };

    updatePositions();
    const observer = new MutationObserver(updatePositions);
    observer.observe(containerRef.current, { childList: true, subtree: true });
    window.addEventListener("resize", updatePositions);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePositions);
    };
  }, [wings, containerRef, cabins]);

  if (!wings) return null;

  const wingHeight = wings.height || 24;

  return (
    <>
      {positions.right && (
        <div
          className="pointer-events-none absolute bg-[#D9D9D9] transition-all duration-300"
          style={{
            left: `${positions.right.left}px`,
            width: `${positions.right.width}px`,
            top: `${Math.max(0, positions.right.top - wingHeight)}px`,
            height: `${wingHeight}px`,
            zIndex: 50,
            clipPath: "polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)",
          }}
        />
      )}
      {positions.left && (
        <div
          className="pointer-events-none absolute bg-[#D9D9D9] transition-all duration-300"
          style={{
            left: `${positions.left.left}px`,
            width: `${positions.left.width}px`,
            top: `${positions.left.bottom}px`,
            height: `${wingHeight}px`,
            zIndex: 50,
            clipPath: "polygon(0% 0%, 97% 0%, 100% 100%, 3% 100%)",
          }}
        />
      )}
    </>
  );
};

const LavSlotDropZone = ({
  position,
  lavCount,
}: {
  position: number;
  lavCount: number;
}) => {
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

// ─── AircraftSeatMap ──────────────────────────────────────────────────────────

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
  selectedSeats: string[];
  onSelectedSeatsChange: (seats: string[]) => void;
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
  selectedSeats,
  onSelectedSeatsChange,
}: AircraftSeatMapProps) => {
  const seatZoneMap = zones.reduce<
    Record<string, { name: string; color: string }>
  >((map, zone) => {
    zone.seatIds.forEach((id) => {
      map[id] = { name: zone.name, color: zone.color };
    });
    return map;
  }, {});

  const [lavSizeDialog, setLavSizeDialog] = useState<{
    id: string;
    size: number;
    maxSize: number;
  } | null>(null);

  const [lavSectionSizeDialog, setLavSectionSizeDialog] = useState<{
    id: string;
    size: number;
  } | null>(null);

  const [renamingColumn, setRenamingColumn] = useState<{
    cabinId: string;
    colIndex: number;
    currentLabel: string;
  } | null>(null);
  const [newColLabel, setNewColLabel] = useState("");

  const [renamingRow, setRenamingRow] = useState<{
    cabinId: string;
    rowIndex: number;
    currentLabel: string;
  } | null>(null);
  const [newRowLabel, setNewRowLabel] = useState("");

  const handleRenameColumn = () => {
    if (renamingColumn && newColLabel.trim()) {
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

        currentLabels[renamingColumn.colIndex] = newColLabel.trim();
        onUpdateCabin(cabin.id, { customLabels: currentLabels });
      }
      setRenamingColumn(null);
      setNewColLabel("");
    }
  };

  const handleRenameRow = () => {
    if (renamingRow && newRowLabel.trim()) {
      const cabin = cabins.find((c) => c.id === renamingRow.cabinId);
      if (cabin) {
        const numRows = cabin.endRow - cabin.startRow + 1;
        const currentLabels =
          cabin.customRowLabels && cabin.customRowLabels.length === numRows
            ? [...cabin.customRowLabels]
            : Array.from({ length: numRows }, (_, i) =>
                String(cabin.startRow + i).padStart(2, "0"),
              );

        currentLabels[renamingRow.rowIndex] = newRowLabel.trim();
        onUpdateCabin(cabin.id, { customRowLabels: currentLabels });
      }
      setRenamingRow(null);
      setNewRowLabel("");
    }
  };

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
    setLavSizeDialog({ id: seatId, size: currentSize, maxSize: colIndex + 1 });
  };

  const [editingCabin, setEditingCabin] = useState<CabinConfig | null>(null);
  const [cabinType, setCabinType] = useState("Economy");
  const [rowFrom, setRowFrom] = useState("");
  const [rowTo, setRowTo] = useState("");
  const [seatFormat, setSeatFormat] = useState("3-3");
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    if (editingCabin) {
      setCabinType(editingCabin.label);
      setRowFrom(editingCabin.startRow.toString());
      setRowTo(editingCabin.endRow.toString());
      setSeatFormat(editingCabin.seatFormat);
      setErrors({});
    }
  }, [editingCabin]);

  const handleSaveCabinEdit = () => {
    if (editingCabin) {
      const result = cabinSchema.safeParse({
        cabinType,
        rowFrom: parseInt(rowFrom),
        rowTo: parseInt(rowTo),
        seatFormat,
      });

      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          newErrors[issue.path[0]] = issue.message;
        });
        setErrors(newErrors);
        return;
      }

      onUpdateCabin(editingCabin.id, {
        label: cabinType,
        startRow: result.data.rowFrom,
        endRow: result.data.rowTo,
        seatFormat: result.data.seatFormat,
        seatSize:
          cabinType === "Business"
            ? "lg"
            : cabinType === "Premium Economy"
              ? "md"
              : "sm",
      });
      setEditingCabin(null);
      setErrors({});
    }
  };

  const StandaloneLavSection = ({
    lav,
    onDelete,
    onCustomizeSize,
    onSetAlignment,
  }: {
    lav: LavSectionConfig;
    onDelete: (id: string) => void;
    onCustomizeSize: (id: string, currentSize: number) => void;
    onSetAlignment: (id: string, alignment: LavAlignment) => void;
  }) => {
    const cellSize = 40;
    const gap = 6;
    const blockHeight = cellSize * lav.size + gap * (lav.size - 1);
    const alignment: LavAlignment = lav.alignment ?? "center";
    const alignItemsClass =
      alignment === "right"
        ? "items-start"
        : alignment === "left"
          ? "items-end"
          : "items-center";

    return (
      <ContextMenu>
        <ContextMenuTrigger
          render={<div className={`group/lav flex h-100 ${alignItemsClass}`} />}
        >
          <div
            className="bg-primary/5 border-primary/30 text-primary flex items-center justify-center rounded-lg border-2"
            style={{ width: `${cellSize}px`, height: `${blockHeight}px` }}
          >
            <Toilet className="h-5 w-5" />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => onCustomizeSize(lav.id, lav.size)}
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" />
            Customize Size
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2">
              <AlignCenter className="h-4 w-4" />
              LAV Position
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem
                onClick={() => onSetAlignment(lav.id, "left")}
                className="gap-2"
              >
                <AlignLeft className="h-4 w-4" />
                Left
                {alignment === "left" && (
                  <span className="text-muted-foreground ml-auto text-xs">
                    ✓
                  </span>
                )}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onSetAlignment(lav.id, "center")}
                className="gap-2"
              >
                <AlignCenter className="h-4 w-4" />
                Center
                {alignment === "center" && (
                  <span className="text-muted-foreground ml-auto text-xs">
                    ✓
                  </span>
                )}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onSetAlignment(lav.id, "right")}
                className="gap-2"
              >
                <AlignRight className="h-4 w-4" />
                Right
                {alignment === "right" && (
                  <span className="text-muted-foreground ml-auto text-xs">
                    ✓
                  </span>
                )}
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => onDelete(lav.id)}
            className="text-destructive focus:text-destructive gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete LAV Section
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  const ExitIcon = () => (
    <div
      className="flex items-center justify-center rounded-lg border-2 border-red-400 bg-white text-red-500"
      style={{ width: 40, height: 40 }}
    >
      <DoorOpen className="h-5 w-5" />
    </div>
  );

  const ExitSlot = ({
    exits,
    onDelete,
    onSetAlignment,
  }: {
    exits: ExitSectionConfig[];
    onDelete: (id: string) => void;
    onSetAlignment: (id: string, alignment: ExitAlignment) => void;
  }) => {
    const hasTop = exits.some((e) => (e.alignment ?? "right") === "right");
    const hasBottom = exits.some((e) => (e.alignment ?? "right") === "left");
    const topExit = exits.find((e) => (e.alignment ?? "right") === "right");
    const bottomExit = exits.find((e) => (e.alignment ?? "right") === "left");

    const renderExitBlock = (exit: ExitSectionConfig) => {
      const alignment: ExitAlignment = exit.alignment ?? "right";
      return (
        <ContextMenu key={exit.id}>
          <ContextMenuTrigger render={<div />}>
            <div className="flex flex-col items-center rounded-2xl border-2 border-red-300 bg-red-50/60 p-3 shadow-[0_4px_20px_-4px_rgba(239,68,68,0.15)] transition-shadow hover:shadow-[0_8px_30px_-4px_rgba(239,68,68,0.2)]">
              <ExitIcon />
              <span className="mt-2 text-[9px] font-bold tracking-widest text-red-500 uppercase select-none">
                EXIT
              </span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="gap-2">
                <AlignCenter className="h-4 w-4" />
                Exit Position
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem
                  onClick={() => onSetAlignment(exit.id, "left")}
                  className="gap-2"
                  disabled={hasBottom && alignment === "right"}
                >
                  <AlignLeft className="h-4 w-4" />
                  Left
                  {alignment === "left" && (
                    <span className="text-muted-foreground ml-auto text-xs">
                      ✓
                    </span>
                  )}
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => onSetAlignment(exit.id, "right")}
                  className="gap-2"
                  disabled={hasTop && alignment === "left"}
                >
                  <AlignRight className="h-4 w-4" />
                  Right
                  {alignment === "right" && (
                    <span className="text-muted-foreground ml-auto text-xs">
                      ✓
                    </span>
                  )}
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onDelete(exit.id)}
              className="text-destructive focus:text-destructive gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Exit
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    };

    return (
      <div className="flex h-[400px] flex-col justify-between">
        {hasTop && topExit ? (
          renderExitBlock(topExit)
        ) : (
          <div style={{ width: 40, height: 40 }} />
        )}
        {hasBottom && bottomExit ? (
          renderExitBlock(bottomExit)
        ) : (
          <div style={{ width: 40, height: 40 }} />
        )}
      </div>
    );
  };

  const LavSlot = ({
    lavs,
    onDelete,
    onSetAlignment,
    onOpenSizeDialog,
  }: {
    lavs: LavSectionConfig[];
    onDelete: (id: string) => void;
    onSetAlignment: (id: string, alignment: LavAlignment) => void;
    onOpenSizeDialog: (id: string, size: number) => void;
  }) => {
    if (lavs.length === 1) {
      const lav = lavs[0];
      return (
        <StandaloneLavSection
          lav={lav}
          onDelete={onDelete}
          onCustomizeSize={(id, size) => onOpenSizeDialog(id, size)}
          onSetAlignment={onSetAlignment}
        />
      );
    }

    const topLav = lavs.find((l) => (l.alignment ?? "center") === "right");
    const bottomLav = lavs.find((l) => (l.alignment ?? "center") === "left");
    const hasTop = !!topLav;
    const hasBottom = !!bottomLav;

    const renderLavBlock = (lav: LavSectionConfig) => {
      const cellSize = 40;
      const gap = 6;
      const blockHeight = cellSize * lav.size + gap * (lav.size - 1);
      const alignment: LavAlignment = lav.alignment ?? "center";

      return (
        <ContextMenu key={lav.id}>
          <ContextMenuTrigger render={<div />}>
            <div
              className="bg-primary/5 border-primary/30 text-primary flex items-center justify-center rounded-lg border-2"
              style={{ width: `${cellSize}px`, height: `${blockHeight}px` }}
            >
              <Toilet className="h-5 w-5" />
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => onOpenSizeDialog(lav.id, lav.size)}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
              Customize Size
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="gap-2">
                <AlignCenter className="h-4 w-4" />
                LAV Position
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem
                  onClick={() => onSetAlignment(lav.id, "left")}
                  className="gap-2"
                  disabled={hasBottom && alignment === "right"}
                >
                  <AlignLeft className="h-4 w-4" />
                  Left
                  {alignment === "left" && (
                    <span className="text-muted-foreground ml-auto text-xs">
                      ✓
                    </span>
                  )}
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => onSetAlignment(lav.id, "right")}
                  className="gap-2"
                  disabled={hasTop && alignment === "left"}
                >
                  <AlignRight className="h-4 w-4" />
                  Right
                  {alignment === "right" && (
                    <span className="text-muted-foreground ml-auto text-xs">
                      ✓
                    </span>
                  )}
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onDelete(lav.id)}
              className="text-destructive focus:text-destructive gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete LAV Section
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    };

    return (
      <div className="flex h-100 flex-col justify-between">
        {hasTop && topLav ? (
          renderLavBlock(topLav)
        ) : (
          <div style={{ width: 40, height: 40 }} />
        )}
        {hasBottom && bottomLav ? (
          renderLavBlock(bottomLav)
        ) : (
          <div style={{ width: 40, height: 40 }} />
        )}
      </div>
    );
  };

  const SlotInserter = ({
    position,
    cabins,
    onAddCabin,
    lavCountAtPosition,
    exitMode,
    exitCountAtPosition,
    onAddExitSection,
  }: {
    position: number;
    cabins: CabinConfig[];
    onAddCabin: (cabin: CabinConfig) => void;
    lavCountAtPosition: number;
    exitMode: boolean;
    exitCountAtPosition: number;
    onAddExitSection: (position: number) => void;
  }) => (
    <div className="flex flex-col items-center gap-2">
      <AddCabinDialog
        onAddCabin={onAddCabin}
        index={position}
        cabins={cabins}
        trigger={
          <div
            title="Add Cabin"
            className="border-border text-muted-foreground group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-2 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-500 hover:shadow-md"
          >
            <Plus className="h-6 w-6 transition-transform group-hover:scale-110" />
          </div>
        }
      />
      {lavCountAtPosition < 2 && (
        <LavSlotDropZone position={position} lavCount={lavCountAtPosition} />
      )}
      {exitMode && exitCountAtPosition < 2 && (
        <button
          type="button"
          title="Add Exit"
          onClick={() => onAddExitSection(position)}
          className="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-2 border-red-300 bg-red-50/40 text-red-500 shadow-sm transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600 hover:shadow-md"
        >
          <DoorOpen className="h-5 w-5 transition-transform group-hover:scale-110" />
        </button>
      )}
    </div>
  );

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
                className="scrollbar-thin scrollbar-thumb-muted-foreground/10 relative flex h-full items-center gap-8 overflow-x-auto"
              >
                <Wings
                  wings={wings}
                  containerRef={containerRef}
                  cabins={cabins}
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
                            setLavSectionSizeDialog({ id, size })
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
                        onRenameColumn={(cabinId, colIndex, currentLabel) => {
                          setRenamingColumn({
                            cabinId,
                            colIndex,
                            currentLabel,
                          });
                          setNewColLabel(currentLabel);
                        }}
                        onRenameRow={(cabinId, rowIndex, currentLabel) => {
                          setRenamingRow({ cabinId, rowIndex, currentLabel });
                          setNewRowLabel(currentLabel);
                        }}
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
                            setLavSectionSizeDialog({ id, size })
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

      <Dialog
        open={!!renamingColumn}
        onOpenChange={(open) => !open && setRenamingColumn(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Column Label</DialogTitle>
            <DialogDescription>
              Enter a new label for this column.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="col-label" className="text-right">
                Label
              </Label>
              <Input
                id="col-label"
                value={newColLabel}
                onChange={(e) => setNewColLabel(e.target.value)}
                className="col-span-3"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameColumn();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingColumn(null)}>
              Cancel
            </Button>
            <Button onClick={handleRenameColumn}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!renamingRow}
        onOpenChange={(open) => !open && setRenamingRow(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Row Label</DialogTitle>
            <DialogDescription>
              Enter a new label for this row.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="row-label" className="text-right">
                Label
              </Label>
              <Input
                id="row-label"
                value={newRowLabel}
                onChange={(e) => setNewRowLabel(e.target.value)}
                className="col-span-3"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameRow();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingRow(null)}>
              Cancel
            </Button>
            <Button onClick={handleRenameRow}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCabin} onOpenChange={() => setEditingCabin(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Cabin</DialogTitle>
            <DialogDescription>
              Update the cabin layout details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-cabin-type" className="text-right">
                Cabin Type
              </Label>
              <div className="col-span-3">
                <Select
                  value={cabinType}
                  onValueChange={(val) => setCabinType(val ?? "Economy")}
                >
                  <SelectTrigger id="edit-cabin-type" className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Premium Economy">
                      Premium Economy
                    </SelectItem>
                    <SelectItem value="Economy">Economy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-row-from" className="text-right">
                Row From
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-row-from"
                  type="number"
                  value={rowFrom}
                  onChange={(e) => {
                    setRowFrom(e.target.value);
                    setErrors((prev) => ({ ...prev, rowFrom: "" }));
                  }}
                  className={errors.rowFrom ? "border-destructive" : ""}
                />
                {errors.rowFrom && (
                  <p className="text-destructive mt-1 text-xs">
                    {errors.rowFrom}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-row-to" className="text-right">
                Row To
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-row-to"
                  type="number"
                  value={rowTo}
                  onChange={(e) => {
                    setRowTo(e.target.value);
                    setErrors((prev) => ({ ...prev, rowTo: "" }));
                  }}
                  className={errors.rowTo ? "border-destructive" : ""}
                />
                {errors.rowTo && (
                  <p className="text-destructive mt-1 text-xs">
                    {errors.rowTo}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-seat-format" className="text-right">
                Seat Format
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-seat-format"
                  value={seatFormat}
                  onChange={(e) => {
                    setSeatFormat(e.target.value);
                    setErrors((prev) => ({ ...prev, seatFormat: "" }));
                  }}
                  placeholder="e.g. 2-4-2"
                  className={errors.seatFormat ? "border-destructive" : ""}
                />
                {errors.seatFormat && (
                  <p className="text-destructive mt-1 text-xs">
                    {errors.seatFormat}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCabin(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCabinEdit}>Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!lavSectionSizeDialog}
        onOpenChange={(open) => {
          if (!open) setLavSectionSizeDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-[320px]">
          <DialogHeader>
            <DialogTitle>Customize LAV Section Size</DialogTitle>
            <DialogDescription>
              Adjust how many LAV units this section spans vertically.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() =>
                  setLavSectionSizeDialog((d) =>
                    d ? { ...d, size: Math.max(1, d.size - 1) } : null,
                  )
                }
                disabled={
                  !lavSectionSizeDialog || lavSectionSizeDialog.size <= 1
                }
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-gray-200 text-lg font-bold text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                −
              </button>

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl font-bold text-blue-600">
                {lavSectionSizeDialog?.size ?? 1}
              </div>

              <button
                type="button"
                onClick={() =>
                  setLavSectionSizeDialog((d) =>
                    d ? { ...d, size: Math.min(6, d.size + 1) } : null,
                  )
                }
                disabled={
                  !lavSectionSizeDialog || lavSectionSizeDialog.size >= 6
                }
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-gray-200 text-lg font-bold text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                +
              </button>
            </div>

            <p className="text-muted-foreground text-center text-xs">
              Max 6 units
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLavSectionSizeDialog(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (lavSectionSizeDialog) {
                  onSetLavSectionSize(
                    lavSectionSizeDialog.id,
                    lavSectionSizeDialog.size,
                  );
                  setLavSectionSizeDialog(null);
                }
              }}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!lavSizeDialog}
        onOpenChange={(open) => {
          if (!open) setLavSizeDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-[320px]">
          <DialogHeader>
            <DialogTitle>Customize LAV Size</DialogTitle>
            <DialogDescription>
              Set how many seat spaces this LAV covers.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() =>
                  setLavSizeDialog((d) =>
                    d ? { ...d, size: Math.max(1, d.size - 1) } : null,
                  )
                }
                disabled={!lavSizeDialog || lavSizeDialog.size <= 1}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-gray-200 text-lg font-bold text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                −
              </button>

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl font-bold text-blue-600">
                {lavSizeDialog?.size ?? 1}
              </div>

              <button
                type="button"
                onClick={() =>
                  setLavSizeDialog((d) =>
                    d ? { ...d, size: Math.min(d.maxSize, d.size + 1) } : null,
                  )
                }
                disabled={
                  !lavSizeDialog || lavSizeDialog.size >= lavSizeDialog.maxSize
                }
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-gray-200 text-lg font-bold text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                +
              </button>
            </div>

            <p className="text-muted-foreground text-center text-xs">
              Max {lavSizeDialog?.maxSize ?? 1} seat
              {(lavSizeDialog?.maxSize ?? 1) !== 1 ? "s" : ""} available in this
              column
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLavSizeDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (lavSizeDialog) {
                  onSetLavSize(lavSizeDialog.id, lavSizeDialog.size);
                  setLavSizeDialog(null);
                }
              }}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
