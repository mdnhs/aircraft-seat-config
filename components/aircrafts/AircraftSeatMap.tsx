"use client";
import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit2, Settings2 } from "lucide-react";
import Selection from "@viselect/vanilla";
import { Seat } from "./Seat";
import { DraggableTool } from "./DraggableTool";
import { TOOLS } from "./constants";
import { SeatConfig, CabinConfig } from "./types";
import { AddCabinDialog } from "./AddCabinDialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Constants ───────────────────────────────────────────────────────────────

const SEAT_SIZES = {
  lg: { seat: "w-9 h-9", headrest: "h-2 top-1.5" },
  md: { seat: "w-8 h-8", headrest: "h-[6px] top-1.5" },
  sm: { seat: "w-7 h-7", headrest: "h-[5px] top-1" },
};

// ─── SeatCell ─────────────────────────────────────────────────────────────────

interface SeatCellProps {
  id: string;
  row: number;
  col: string;
  size: "lg" | "md" | "sm";
  equipment: string | undefined;
  selected: boolean;
}

const SeatCell = ({
  id,
  row,
  col,
  size,
  equipment,
  selected,
}: SeatCellProps) => {
  const s = SEAT_SIZES[size];

  return (
    <div className="rounded-[7px] transition-transform group">
      <Seat
        id={id}
        row={row}
        col={col}
        equipment={equipment}
        className={s.seat}
        selected={selected}
      />
    </div>
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
}

const CabinSection = ({
  cabin,
  seatConfig,
  selectedSeats,
  onDelete,
  onEditLabels,
  onEditCabin,
}: CabinSectionProps) => {
  const rows = Array.from(
    { length: cabin.endRow - cabin.startRow + 1 },
    (_, i) => cabin.startRow + i,
  );

  const groups = cabin.seatFormat.split("-").map(Number);
  const totalCols = groups.reduce((a, b) => a + b, 0);

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
          <div className="flex items-stretch gap-3 group/cabin" />
        }
      >
        <div className="w-8 flex items-center justify-center border-l-2 border-border/30 rounded-l-lg bg-muted/10 transition-colors group-hover/cabin:bg-muted/20">
          <span
            className="text-[10px] font-black tracking-[0.4em] uppercase text-muted-foreground/20 select-none whitespace-nowrap py-4"
            style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
          >
            {cabin.label}
          </span>
        </div>

        <div className="border border-border/60 rounded-2xl p-5 bg-background shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 flex-shrink-0" />
              {rows.map((row) => (
                <span
                  key={row}
                  className="text-[10px] font-black text-muted-foreground/20 w-10 text-center select-none flex-shrink-0"
                >
                  {String(row).padStart(2, "0")}
                </span>
              ))}
            </div>

            {colGroups.map((group, groupIdx) => (
              <React.Fragment key={groupIdx}>
                {group.map((col) => (
                  <div key={col} className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-muted-foreground/20 w-8 text-center select-none flex-shrink-0">
                      {col}
                    </span>
                    {rows.map((row) => {
                      const id = `${row}-${col}`;
                      return (
                        <div
                          key={id}
                          className="w-10 flex justify-center flex-shrink-0"
                        >
                          <SeatCell
                            id={id}
                            row={row}
                            col={col}
                            size={cabin.seatSize}
                            equipment={seatConfig[id]}
                            selected={selectedSeats.includes(id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
                {groupIdx < colGroups.length - 1 && (
                  <div className="h-6 flex items-center px-8">
                    <div className="w-full h-px bg-muted/30 border-t border-dashed border-muted/50" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onEditCabin(cabin)} className="gap-2">
          <Settings2 className="w-4 h-4" />
          Edit Cabin
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onEditLabels(cabin.id)}
          className="gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Edit Column Labels
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(cabin.id)}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
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
  selectedSeats: string[];
  onSelectedSeatsChange: (seats: string[]) => void;
}

export const AircraftSeatMap = ({
  seatConfig,
  cabins,
  onAddCabin,
  onDeleteCabin,
  onUpdateCabin,
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

  const containerRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Selection | null>(null);

  // ✅ Stable ref for the callback — avoids putting it in the effect dep array,
  //    which would destroy and recreate the Selection instance on every render.
  const onChangeRef = useRef(onSelectedSeatsChange);
  useEffect(() => {
    onChangeRef.current = onSelectedSeatsChange;
  }, [onSelectedSeatsChange]);

  // ✅ Stable ref for current selection — lets move/stop callbacks read the
  //    latest value without ever closing over stale state.
  const selectedSeatsRef = useRef<string[]>(selectedSeats);
  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
  }, [selectedSeats]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy any leftover instance (StrictMode double-invoke safety)
    selectionRef.current?.destroy();

    selectionRef.current = new Selection({
      class: "selection-area",
      selectables: [".seat-selectable"],
      // ✅ Boundaries limit where the selection can start and what can be selected.
      boundaries: [".selection-boundary"],
      // ✅ Omitting `container` appends the marquee to the body, which works
      //    best with `position: fixed` to avoid drift or clipping issues.
    });

    selectionRef.current.on("beforestart", ({ event }) => {
      const target = event?.target as HTMLElement | null;
      if (
        target?.closest('[draggable="true"]') ||
        target?.closest("button") ||
        target?.closest('[role="dialog"]') ||
        // Also block Radix dropdowns / popovers that may float over the map
        target?.closest("[data-radix-popper-content-wrapper]")
      ) {
        return false;
      }
      return true;
    });

    // ✅ Drive all state from `move` so every incremental change is reflected
    //    immediately (smooth rubber-band highlight as you drag).
    selectionRef.current.on(
      "move",
      ({
        store: {
          changed: { added, removed },
        },
      }) => {
        const addedKeys = added
          .map((el) => el.getAttribute("data-key"))
          .filter((k): k is string => k !== null);
        const removedKeys = removed
          .map((el) => el.getAttribute("data-key"))
          .filter((k): k is string => k !== null);

        if (addedKeys.length === 0 && removedKeys.length === 0) return;

        const next = [
          ...selectedSeatsRef.current.filter((id) => !removedKeys.includes(id)),
          ...addedKeys,
        ];
        onChangeRef.current([...new Set(next)]);
      },
    );

    // ✅ `stop` syncs the final authoritative set from viselect.
    //    This also handles a plain click (no drag = no `move` events fired),
    //    so clicking a single seat correctly selects / deselects it.
    //    We skip the update when the sets are identical to avoid a redundant render.
    selectionRef.current.on("stop", ({ store: { selected } }) => {
      const selectedKeys = selected
        .map((el) => el.getAttribute("data-key"))
        .filter((k): k is string => k !== null);

      const prev = selectedSeatsRef.current;
      const same =
        selectedKeys.length === prev.length &&
        selectedKeys.every((k) => prev.includes(k));

      if (!same) {
        onChangeRef.current([...new Set(selectedKeys)]);
      }
    });

    return () => {
      selectionRef.current?.destroy();
      selectionRef.current = null;
    };
    // ✅ Empty dep array — Selection is created once and uses refs for all
    //    live values. Adding dependencies here would destroy the instance
    //    mid-drag every time cabins or selectedSeats change.
  }, []);

  useEffect(() => {
    if (editingCabin) {
      setCabinType(editingCabin.label);
      setRowFrom(editingCabin.startRow.toString());
      setRowTo(editingCabin.endRow.toString());
      setSeatFormat(editingCabin.seatFormat);
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
      onUpdateCabin(editingCabin.id, {
        label: cabinType,
        startRow: parseInt(rowFrom),
        endRow: parseInt(rowTo),
        seatFormat: seatFormat,
        seatSize:
          cabinType === "Business"
            ? "lg"
            : cabinType === "Premium Economy"
              ? "md"
              : "sm",
      });
      setEditingCabin(null);
    }
  };

  return (
    <div className="flex bg-background rounded-b-xl border border-border shadow-sm min-h-[600px] overflow-hidden">
      <div className="w-20 border-r border-border p-3 bg-muted/30 flex flex-col gap-2 z-10 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
        {TOOLS.map((tool) => (
          <DraggableTool key={tool.id} tool={tool} />
        ))}
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/5 p-12 relative scrollbar-thin scrollbar-thumb-muted-foreground/10 selection-boundary select-none"
      >
        <Card className="min-w-max bg-background border-border/50 shadow-lg rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-10 pb-12">
            <div className="flex items-start gap-8">
              {cabins.map((cabin) => (
                <CabinSection
                  key={cabin.id}
                  cabin={cabin}
                  seatConfig={seatConfig}
                  onDelete={onDeleteCabin}
                  onEditLabels={handleEditLabels}
                  onEditCabin={setEditingCabin}
                  selectedSeats={selectedSeats}
                />
              ))}

              <div className="flex items-center pt-10 pr-4">
                <AddCabinDialog
                  onAddCabin={onAddCabin}
                  trigger={
                    <div className="h-48 w-14 flex items-center justify-center border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:border-blue-400 hover:text-blue-500 transition-all hover:bg-blue-50/50 cursor-pointer group shadow-sm hover:shadow-md">
                      <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </div>
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-bold px-6 py-2.5 rounded-full uppercase tracking-[0.2em] shadow-2xl pointer-events-none z-50 backdrop-blur-sm border border-white/10">
          Drag tools from sidebar or drag on map to select multiple seats
        </div>
      </div>

      {/* ── Edit Column Labels Dialog ───────────────────────────────────── */}
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
            <p className="text-xs text-muted-foreground px-4">
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

      {/* ── Edit Cabin Dialog ───────────────────────────────────────────── */}
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
                  onValueChange={(value) => setCabinType(value ?? "Economy")}
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
              <Input
                id="edit-row-from"
                type="number"
                value={rowFrom}
                onChange={(e) => setRowFrom(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-row-to" className="text-right">
                Row To
              </Label>
              <Input
                id="edit-row-to"
                type="number"
                value={rowTo}
                onChange={(e) => setRowTo(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-seat-format" className="text-right">
                Seat Format
              </Label>
              <Input
                id="edit-seat-format"
                value={seatFormat}
                onChange={(e) => setSeatFormat(e.target.value)}
                placeholder="e.g. 2-4-2"
                className="col-span-3"
              />
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
