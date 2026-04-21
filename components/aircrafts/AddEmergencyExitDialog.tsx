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
import { CabinConfig, EmergencyExitConfig } from "./types";

interface AddEmergencyExitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabins: CabinConfig[];
  onAddEmergencyExit: (exit: EmergencyExitConfig) => void;
}

export const AddEmergencyExitDialog = ({
  open,
  onOpenChange,
  cabins,
  onAddEmergencyExit,
}: AddEmergencyExitDialogProps) => {
  const [row, setRow] = useState("");
  const [rowError, setRowError] = useState("");

  const validate = () => {
    const rowNum = parseInt(row);
    if (!row || isNaN(rowNum) || rowNum < 1) {
      setRowError("Enter a valid row number");
      return false;
    }
    const inCabin = cabins.some(
      (c) => rowNum >= c.startRow && rowNum <= c.endRow,
    );
    if (!inCabin) {
      setRowError("Row does not exist in any cabin");
      return false;
    }
    setRowError("");
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    onAddEmergencyExit({
      id: crypto.randomUUID(),
      row: parseInt(row),
    });
    setRow("");
    setRowError("");
    onOpenChange(false);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setRow("");
      setRowError("");
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Add Emergency Exit</DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="grid gap-1.5">
            <Label htmlFor="exit-row">Row</Label>
            <Input
              id="exit-row"
              type="number"
              min={1}
              value={row}
              onChange={(e) => {
                setRow(e.target.value);
                if (rowError) setRowError("");
              }}
              placeholder="e.g. 5"
              className={rowError ? "border-destructive" : ""}
              autoFocus
            />
            {rowError && (
              <p className="text-destructive text-xs">{rowError}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Add Exit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
