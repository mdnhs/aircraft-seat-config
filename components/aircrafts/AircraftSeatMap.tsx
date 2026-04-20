"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
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
import SelectionArea from "@viselect/vanilla";
import { Edit2, Plus, Settings2, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { AddCabinDialog } from "./AddCabinDialog";
import { DraggableTool } from "./DraggableTool";
import { Seat } from "./Seat";
import { TOOLS } from "./constants";
import { CabinConfig, SeatConfig } from "./types";
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
              ...(style?.position === "absolute" ? { 
                position: "absolute", 
                top: style.top, 
                left: style.left, 
                height: style.height, 
                width: style.width || `${size}px`,
                zIndex: style.zIndex 
              } : {})
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
  onDelete: (id: string) => void;
  onEditLabels: (id: string) => void;
  onEditCabin: (cabin: CabinConfig) => void;
  onDeleteSeat: (id: string) => void;
}

const CabinSection = ({
  cabin,
  seatConfig,
  selectedSeats,
  onDelete,
  onEditLabels,
  onEditCabin,
  onDeleteSeat,
}: CabinSectionProps) => {
  const rows = Array.from(
    { length: cabin.endRow - cabin.startRow + 1 },
    (_, i) => cabin.startRow + i,
  );

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
          <div className="flex flex-col" style={{ gap: `${verticalGap}px` }}>
            <div
              className="flex items-center gap-2"
              style={{ marginBottom: `${verticalGap}px` }}
            >
              <div className="w-8 flex-shrink-0" />
              {rows.map((row) => (
                <span
                  key={row}
                  style={{ width: `${seatSize + 8}px` }}
                  className="text-muted-foreground/40 flex-shrink-0 text-center text-[10px] font-bold select-none"
                >
                  {String(row).padStart(2, "0")}
                </span>
              ))}
            </div>

            {colGroups.map((group, groupIdx) => (
              <React.Fragment key={groupIdx}>
                {group.map((col, idx) => (
                  <div key={col} className="flex items-center gap-2" style={{ height: `${seatSize}px` }}>
                    <span className="text-muted-foreground/40 w-8 flex-shrink-0 text-center text-[11px] font-bold select-none">
                      {col}
                    </span>
                    {rows.map((row) => {
                      const id = `${row}-${col}`;
                      const equipment = seatConfig[id];

                      if (equipment === "lav-occupied") {
                        return (
                          <div
                            key={id}
                            style={{ width: `${seatSize + 8}px`, height: `${seatSize}px` }}
                            className="flex flex-shrink-0 justify-center"
                          />
                        );
                      }

                      const isLav = equipment === "lav";
                      const isLastInGroup = idx === group.length - 1;
                      const hasAisleBelow = isLastInGroup && groupIdx < colGroups.length - 1;
                      
                      const lavHeight = isLav 
                        ? (seatSize * 2 + verticalGap + (hasAisleBelow ? spacerHeight + verticalGap : 0))
                        : seatSize;

                      return (
                        <div
                          key={id}
                          style={{ width: `${seatSize + 8}px`, height: `${seatSize}px` }}
                          className="flex flex-shrink-0 justify-center relative items-center"
                        >
                          <SeatCell
                            id={id}
                            row={row}
                            col={col}
                            size={seatSize}
                            equipment={equipment}
                            selected={selectedSeats.includes(id)}
                            onDeleteSeat={onDeleteSeat}
                            style={isLav ? {
                              height: `${lavHeight}px`,
                              width: `${seatSize}px`,
                              zIndex: 10,
                              position: "absolute",
                              top: 0,
                              left: "4px"
                            } : undefined}
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
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onEditCabin(cabin)} className="gap-2">
          <Settings2 className="h-4 w-4" />
          Edit Cabin
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onEditLabels(cabin.id)}
          className="gap-2"
        >
          <Edit2 className="h-4 w-4" />
          Edit Column Labels
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

// ─── AircraftSeatMap ──────────────────────────────────────────────────────────

interface AircraftSeatMapProps {
  seatConfig: SeatConfig;
  cabins: CabinConfig[];
  onAddCabin: (cabin: CabinConfig) => void;
  onDeleteCabin: (id: string) => void;
  onUpdateCabin: (id: string, updates: Partial<CabinConfig>) => void;
  onDeleteSeat: (id: string) => void;
  selectedSeats: string[];
  onSelectedSeatsChange: (seats: string[]) => void;
}

export const AircraftSeatMap = ({
  seatConfig,
  cabins,
  onAddCabin,
  onDeleteCabin,
  onUpdateCabin,
  onDeleteSeat,
  selectedSeats,
  onSelectedSeatsChange,
}: AircraftSeatMapProps) => {
  const [editingLabelsCabinId, setEditingLabelsCabinId] = useState<
    string | null
  >(null);
  const [newLabels, setNewLabels] = useState("");

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

  const handleEditLabels = (id: string) => {
    setEditingLabelsCabinId(id);
    const cabin = cabins.find((c) => c.id === id);
    if (cabin && cabin.customLabels) {
      setNewLabels(cabin.customLabels.join(", "));
    } else {
      setNewLabels("");
    }
  };

  const handleSaveLabels = () => {
    if (editingLabelsCabinId) {
      const labelsArray = newLabels
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l !== "");
      onUpdateCabin(editingLabelsCabinId, {
        customLabels: labelsArray.length > 0 ? labelsArray : undefined,
      });
      setEditingLabelsCabinId(null);
    }
  };

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

  return (
    <div className="bg-background flex min-h-150 overflow-hidden">
      <div className="border-border bg-muted/30 z-10 flex w-20 flex-col gap-2 border-r p-3 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
        {TOOLS.map((tool) => (
          <DraggableTool key={tool.id} tool={tool} />
        ))}
      </div>

      <div className="bg-muted/5 scrollbar-thin scrollbar-thumb-muted-foreground/10 selection-boundary flex flex-1 overflow-auto p-12 select-none">
        <div className="flex h-114 items-stretch">
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
          <Card className="bg-background -ml-px w-fit max-w-full overflow-hidden rounded-l-none rounded-r-[12px] border border-[#DCDCDC]">
            <CardContent
              className={`min-h-106 min-w-150 ${cabins.length > 0 || "flex items-center justify-center"} h-full p-3`}
            >
              <div
                ref={containerRef}
                className="scrollbar-thin scrollbar-thumb-muted-foreground/10 flex h-full items-center gap-8 overflow-x-auto"
              >
                {cabins.map((cabin, idx) => (
                  <React.Fragment key={cabin.id}>
                    <div className="flex items-center">
                      <AddCabinDialog
                        onAddCabin={onAddCabin}
                        index={idx}
                        cabins={cabins}
                        trigger={
                          <div className="border-border text-muted-foreground group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-2 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-500 hover:shadow-md">
                            <Plus className="h-6 w-6 transition-transform group-hover:scale-110" />
                          </div>
                        }
                      />
                    </div>
                    <CabinSection
                      cabin={cabin}
                      seatConfig={seatConfig}
                      onDelete={onDeleteCabin}
                      onEditLabels={handleEditLabels}
                      onEditCabin={setEditingCabin}
                      onDeleteSeat={onDeleteSeat}
                      selectedSeats={selectedSeats}
                    />
                  </React.Fragment>
                ))}

                <div className="flex items-center">
                  <AddCabinDialog
                    onAddCabin={onAddCabin}
                    index={cabins.length}
                    cabins={cabins}
                    trigger={
                      <div className="border-border text-muted-foreground group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-2 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-500 hover:shadow-md">
                        <Plus className="h-6 w-6 transition-transform group-hover:scale-110" />
                      </div>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!editingLabelsCabinId}
        onOpenChange={() => setEditingLabelsCabinId(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Column Labels</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="labels" className="text-right">
                Labels
              </Label>
              <Input
                id="labels"
                value={newLabels}
                onChange={(e) => setNewLabels(e.target.value)}
                placeholder="e.g. A, B, C, D"
                className="col-span-3"
              />
            </div>
            <p className="text-muted-foreground px-4 text-xs">
              Enter labels separated by commas. Leave empty to use default A, B,
              C...
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingLabelsCabinId(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveLabels}>Save</Button>
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
    </div>
  );
};
