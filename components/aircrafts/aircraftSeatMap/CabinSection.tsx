"use client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Settings2, Trash2 } from "lucide-react";
import React, { useMemo } from "react";
import { CabinConfig, EmergencyExitConfig, SeatConfig } from "../types";
import { SeatCell } from "./SeatCell";

interface CabinSectionProps {
  cabin: CabinConfig;
  seatConfig: SeatConfig;
  selectedSet: Set<string>;
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
  reversedSet: Set<string>;
  onReverseSeat: (seatId: string) => void;
  showLabel?: boolean;
}

type ZoneSpan = {
  id: string;
  name: string;
  color: string;
  startIdx: number;
  length: number;
};

const CabinSectionComponent = ({
  cabin,
  seatConfig,
  selectedSet,
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
  reversedSet,
  onReverseSeat,
  showLabel = true,
}: CabinSectionProps) => {
  const rows = useMemo(
    () =>
      Array.from(
        { length: cabin.endRow - cabin.startRow + 1 },
        (_, i) => cabin.startRow + i,
      ),
    [cabin.startRow, cabin.endRow],
  );

  const exitRowMap = useMemo(
    () =>
      emergencyExits.reduce<Record<number, EmergencyExitConfig>>((acc, e) => {
        acc[e.row] = e;
        return acc;
      }, {}),
    [emergencyExits],
  );

  const rowLabels = useMemo(() => {
    let labelCount = 0;
    return rows.map((row, idx) => {
      if (exitRowMap[row] !== undefined) return "";
      if (cabin.customRowLabels && cabin.customRowLabels[idx]) {
        return cabin.customRowLabels[idx];
      }
      const label = String(cabin.startRow + labelCount).padStart(2, "0");
      labelCount++;
      return label;
    });
  }, [rows, exitRowMap, cabin.customRowLabels, cabin.startRow]);

  const groups = useMemo(
    () => cabin.seatFormat.split("-").map(Number),
    [cabin.seatFormat],
  );
  const totalCols = useMemo(
    () => groups.reduce((a, b) => a + b, 0),
    [groups],
  );

  const { seatSize, verticalGap, spacerHeight } = useMemo(() => {
    const containerPadding = 48;
    const labelHeight = 20;
    const numSpacers = groups.length - 1;

    const availableHeight = 400 - containerPadding - labelHeight;
    const multiplier = 1.2 * totalCols + 0.7 * numSpacers;
    const calculatedSeatSize = Math.floor(availableHeight / multiplier);

    const seatSize = Math.min(40, Math.max(20, calculatedSeatSize));
    const verticalGap = Math.max(4, Math.floor(seatSize * 0.2));
    const spacerHeight = Math.max(8, Math.floor(seatSize * 0.5));
    return { seatSize, verticalGap, spacerHeight };
  }, [groups, totalCols]);

  const EXIT_COL_WIDTH = 20;
  const { rowColWidths, rowLeftEdges } = useMemo(() => {
    const widths = rows.map((row) =>
      exitRowMap[row] !== undefined ? EXIT_COL_WIDTH : seatSize + 8,
    );
    const edges = widths.reduce<number[]>((acc, _, idx) => {
      acc.push(idx === 0 ? 0 : acc[idx - 1] + widths[idx - 1] + 8);
      return acc;
    }, []);
    return { rowColWidths: widths, rowLeftEdges: edges };
  }, [rows, exitRowMap, seatSize]);

  const allLabels = useMemo(
    () =>
      cabin.customLabels && cabin.customLabels.length === totalCols
        ? cabin.customLabels
        : Array.from({ length: totalCols }, (_, i) =>
            String.fromCharCode(65 + i),
          ),
    [cabin.customLabels, totalCols],
  );

  const hasExitRows = useMemo(
    () => rows.some((r) => exitRowMap[r] !== undefined),
    [rows, exitRowMap],
  );

  const colGroups = useMemo(() => {
    const reversedLabels = [...allLabels].reverse();
    return [...groups].reverse().reduce(
      (acc, groupSize) => {
        const start = acc.nextIndex;
        const groupLabels = reversedLabels.slice(start, start + groupSize);
        acc.groups.push(groupLabels);
        acc.nextIndex += groupSize;
        return acc;
      },
      { groups: [] as string[][], nextIndex: 0 },
    ).groups;
  }, [allLabels, groups]);

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

  const zoneSpans = useMemo(() => {
    const rowZones = rows.map((row) => {
      for (const col of allLabels) {
        const z = seatZoneMap[`${row}-${col}`];
        if (z) return z;
      }
      return null;
    });
    return rowZones.reduce<ZoneSpan[]>((spans, rz, idx) => {
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
  }, [rows, allLabels, seatZoneMap]);

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={<div className="group/cabin flex h-100 items-stretch" />}
      >
        {showLabel && (
          <div className="flex w-8 items-center justify-center rounded-l-xl border-l-2 border-blue-400/40 bg-blue-500/10 transition-colors group-hover/cabin:bg-blue-500/15">
            <span
              className="text-[9px] font-black tracking-[0.35em] whitespace-nowrap text-blue-600/80 uppercase select-none"
              style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
            >
              {cabin.label}
            </span>
          </div>
        )}

        <div
          data-cabin-card
          className={`border-border/60 bg-background flex flex-col justify-center rounded-r-3xl border p-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] ${showLabel ? "rounded-l-none border-l-0" : "rounded-l-3xl"}`}
        >
          <div
            className="relative flex flex-col"
            style={{ gap: `${verticalGap}px` }}
          >
            {zoneSpans.map((span) => {
              const endIdx = span.startIdx + span.length - 1;
              const left = 40 + rowLeftEdges[span.startIdx] - 4;
              const width =
                rowLeftEdges[endIdx] +
                rowColWidths[endIdx] -
                rowLeftEdges[span.startIdx] +
                8;
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

            {zoneSpans.length > 0 && (
              <div
                className="relative flex items-center gap-2"
                style={{ height: "20px", marginBottom: "2px" }}
              >
                <div className="w-8 shrink-0" />
                <div className="relative flex-1" style={{ height: "20px" }}>
                  {zoneSpans.map((span) => {
                    const endIdx = span.startIdx + span.length - 1;
                    const left = rowLeftEdges[span.startIdx];
                    const width =
                      rowLeftEdges[endIdx] +
                      rowColWidths[endIdx] -
                      rowLeftEdges[span.startIdx];
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
              <div className="w-8 shrink-0" />
              {rows.map((row, idx) => (
                <ContextMenu key={row}>
                  <ContextMenuTrigger
                    render={
                      <div
                        data-row={row}
                        className="shrink-0 cursor-context-menu"
                        style={{ width: `${rowColWidths[idx]}px` }}
                      />
                    }
                  >
                    {exitRowMap[row] !== undefined ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-[8px] font-black tracking-widest text-red-500 uppercase select-none">
                          EXIT
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/40 block text-center text-[10px] font-bold transition-colors select-none hover:text-blue-500">
                        {rowLabels[idx]}
                      </span>
                    )}
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => onRenameRow(cabin.id, idx, rowLabels[idx])}
                      className="gap-2"
                    >
                      <Settings2 className="h-4 w-4" />
                      Rename Row
                    </ContextMenuItem>
                    {exitRowMap[row] !== undefined && (
                      <>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() =>
                            onDeleteEmergencyExit(exitRowMap[row].id)
                          }
                          className="text-destructive focus:text-destructive gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Emergency Exit
                        </ContextMenuItem>
                      </>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>

            <div
              className="relative flex flex-col"
              style={{ gap: `${verticalGap}px` }}
            >
              {rows.map((row, rowIdx) => {
                if (exitRowMap[row] === undefined) return null;
                const left = 40 + rowLeftEdges[rowIdx] - 4;
                const width = EXIT_COL_WIDTH + 8;
                return (
                  <div
                    key={`exit-bg-${row}`}
                    className="pointer-events-none absolute inset-y-0 rounded-md"
                    style={{
                      left: `${left}px`,
                      width: `${width}px`,
                      backgroundColor: "rgb(239 68 68 / 0.08)",
                      borderLeft: "1px dashed rgb(239 68 68 / 0.5)",
                      borderRight: "1px dashed rgb(239 68 68 / 0.5)",
                    }}
                  />
                );
              })}

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
                            <div className="flex w-8 shrink-0 cursor-context-menu items-center justify-center" />
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
                      {rows.map((row, rowIdx) => {
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
                                      width: `${rowColWidths[rowIdx]}px`,
                                      height: `${seatSize}px`,
                                    }}
                                    className="flex shrink-0 cursor-context-menu items-center justify-center"
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
                              className="flex shrink-0 justify-center"
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
                            className="relative flex shrink-0 items-center justify-center"
                          >
                            <SeatCell
                              id={id}
                              row={row}
                              col={col}
                              size={seatSize}
                              equipment={equipment}
                              selected={selectedSet.has(id)}
                              reversed={reversedSet.has(id)}
                              onDeleteSeat={onDeleteSeat}
                              onReverseSeat={isLav ? undefined : onReverseSeat}
                              onCustomizeLavSize={
                                isLav ? onCustomizeLavSize : undefined
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
            </div>

            {hasExitRows && (
              <div
                className="flex items-center gap-2"
                style={{ marginTop: `${verticalGap}px` }}
              >
                <div className="w-8 shrink-0" />
                {rows.map((row, idx) => (
                  <div
                    key={row}
                    className="shrink-0"
                    style={{ width: `${rowColWidths[idx]}px` }}
                  >
                    {exitRowMap[row] !== undefined && (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-[8px] font-black tracking-widest text-red-500 uppercase select-none">
                          EXIT
                        </span>
                      </div>
                    )}
                  </div>
                ))}
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

export const CabinSection = React.memo(CabinSectionComponent);
