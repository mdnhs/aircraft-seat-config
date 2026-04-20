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
import { ZoneConfig } from "./types";

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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Zone</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="grid gap-1.5">
            <Label htmlFor="zone-name">Zone Name</Label>
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
              <p className="text-destructive text-xs">{nameError}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Zone Color</Label>
            <div className="flex flex-wrap gap-2">
              {ZONE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setZoneColor(c.value)}
                  className="h-7 w-7 cursor-pointer rounded-full transition-transform hover:scale-110 focus:outline-none"
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

          <p className="text-muted-foreground text-xs">
            {selectedSeats.length} seat
            {selectedSeats.length !== 1 ? "s" : ""} will be added to this zone.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Add Zone</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
