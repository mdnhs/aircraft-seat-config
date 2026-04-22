"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { ZoneConfig } from "../types";

const ZONE_COLORS = [
  { label: "Red", value: "#EF4444" },
  { label: "Orange", value: "#F97316" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Green", value: "#22C55E" },
  { label: "Teal", value: "#14B8A6" },
  { label: "Blue", value: "#3B82F6" },
  { label: "Violet", value: "#8B5CF6" },
  { label: "Pink", value: "#EC4899" },
];

interface AddZoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSeats: string[];
  onAddZone: (zone: ZoneConfig) => void;
}

export const AddZoneDialog = ({
  open,
  onOpenChange,
  selectedSeats,
  onAddZone,
}: AddZoneDialogProps) => {
  const [zoneName, setZoneName] = useState("");
  const [zoneColor, setZoneColor] = useState(ZONE_COLORS[5].value);
  const [nameError, setNameError] = useState("");

  const handleSave = () => {
    if (!zoneName.trim()) {
      setNameError("Zone name is required");
      return;
    }

    onAddZone({
      id: crypto.randomUUID(),
      name: zoneName.trim(),
      color: zoneColor,
      seatIds: selectedSeats,
    });

    setZoneName("");
    setZoneColor(ZONE_COLORS[5].value);
    setNameError("");
    onOpenChange(false);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setZoneName("");
      setZoneColor(ZONE_COLORS[5].value);
      setNameError("");
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader className="gap-1">
          <DialogTitle>Add Zone</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-3">
          <div className="grid grid-cols-4 items-center gap-3">
            <Label
              htmlFor="zone-name"
              className="text-muted-foreground text-right text-xs font-semibold uppercase tracking-wider"
            >
              Name
            </Label>
            <div className="col-span-3">
              <Input
                id="zone-name"
                value={zoneName}
                onChange={(e) => {
                  setZoneName(e.target.value);
                  if (nameError) setNameError("");
                }}
                placeholder="e.g. Emergency Exit Zone"
                className={nameError ? "border-destructive" : ""}
                autoFocus
              />
              {nameError && (
                <p className="text-destructive mt-1 text-[10px] leading-tight">
                  {nameError}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-3">
            <Label className="text-muted-foreground text-right text-xs font-semibold uppercase tracking-wider">
              Color
            </Label>
            <div className="col-span-3">
              <div className="flex flex-wrap gap-2">
                {ZONE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setZoneColor(c.value)}
                    className="h-6 w-6 cursor-pointer rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{
                      backgroundColor: c.value,
                      boxShadow:
                        zoneColor === c.value
                          ? `0 0 0 2px white, 0 0 0 4px ${c.value}`
                          : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-3">
            <div className="col-start-2 col-span-3">
              <p className="text-muted-foreground text-[10px]">
                {selectedSeats.length} seat
                {selectedSeats.length !== 1 ? "s" : ""} will be added to this
                zone.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Add Zone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
