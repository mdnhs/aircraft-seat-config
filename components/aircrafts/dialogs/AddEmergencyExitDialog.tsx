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
import { useEffect, useState } from "react";
import { CabinConfig, EmergencyExitConfig } from "../types";

interface AddEmergencyExitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabins: CabinConfig[];
  onAddEmergencyExit: (exit: EmergencyExitConfig) => void;
  defaultRow?: string;
}

export const AddEmergencyExitDialog = ({
  open,
  onOpenChange,
  cabins,
  onAddEmergencyExit,
  defaultRow = "",
}: AddEmergencyExitDialogProps) => {
  const [row, setRow] = useState(defaultRow);
  const [rowError, setRowError] = useState("");

  useEffect(() => {
    if (open && defaultRow) {
      setRow(defaultRow);
    }
  }, [open, defaultRow]);

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
        <DialogHeader className="gap-1">
          <DialogTitle>Add Emergency Exit</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-3">
          <div className="grid grid-cols-4 items-center gap-3">
            <Label
              htmlFor="exit-row"
              className="text-muted-foreground text-right text-xs font-semibold tracking-wider uppercase"
            >
              Row
            </Label>
            <div className="col-span-3">
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
                <p className="text-destructive mt-1 text-[10px] leading-tight">
                  {rowError}
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Add Exit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
