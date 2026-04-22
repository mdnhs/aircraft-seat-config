"use client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Settings2, Trash2 } from "lucide-react";
import React from "react";
import {
  CabinConfig,
  EmergencyExitConfig,
  SeatConfig,
  ZoneConfig,
} from "../types";
import { SeatCell } from "./SeatCell";

interface CabinSectionProps {
  cabin: CabinConfig;
  seatConfig: SeatConfig;
  selectedSeats: string[];
  seatZoneMap: Record<string, { id: string; name: string; color: string }>;
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
  onDeleteZone: (id: string) => void;
  onRenameZone: (id: string, currentName: string) => void;
}

type ZoneSpan = {
  id: string;
  name: string;
  color: string;
  startIdx: number;
  length: number;
};

export const CabinSection = ({
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
  onDeleteZone,
  onRenameZone,
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

  const rowZones = rows.map((row) => {
    for (const col of allLabels) {
      const z = seatZoneMap[`${row}-${col}`];
      if (z) return z;
    }
    return null;
  });

  const zoneSpans = rowZones.reduce<ZoneSpan[]>((spans, rz, idx) => {
    const last = spans[spans.length - 1];
    if (rz && last && last.id === rz.id) {
      last.length += 1;
    } else if (rz) {
      spans.push({
        id: rz.id,
        name: rz.name,
        color: rz.color,
        startIdx: idx,
        length: 1,
      });
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
                  key={`zone-bg-${span.id}-${span.startIdx}`}
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
                      <ContextMenu key={`${span.id}-${span.startIdx}`}>
                        <ContextMenuTrigger
                          render={
                            <div
                              className="absolute inset-y-0 flex cursor-context-menu items-center justify-center overflow-hidden rounded"
                              style={{
                                left: `${left}px`,
                                width: `${width}px`,
                                backgroundColor: span.color,
                              }}
                            />
                          }
                        >
                          <span className="truncate px-2 text-[9px] font-bold text-white select-none">
                            {span.name}
                          </span>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem
                            onClick={() => onRenameZone(span.id, span.name)}
                            className="gap-2"
                          >
                            <Settings2 className="h-4 w-4" />
                            Rename Zone
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            onClick={() => onDeleteZone(span.id)}
                            className="text-destructive focus:text-destructive gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Zone
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
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
                {group.map((col) => (
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
