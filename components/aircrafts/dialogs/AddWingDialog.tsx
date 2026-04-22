"use client";
import { Button } from "@/components/ui/button";
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
import { useEffect, useState } from "react";
import { CabinConfig, WingsConfig } from "../types";

interface AddWingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabins: CabinConfig[];
  wings: WingsConfig | null;
  onSave: (wings: WingsConfig | null) => void;
  selectedRows?: number[];
}

export const AddWingDialog = ({
  open,
  onOpenChange,
  cabins,
  wings,
  onSave,
  selectedRows = [],
}: AddWingDialogProps) => {
  const [leftFrom, setLeftFrom] = useState("");
  const [leftTo, setLeftTo] = useState("");
  const [rightFrom, setRightFrom] = useState("");
  const [rightTo, setRightTo] = useState("");
  const [height, setHeight] = useState("24");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const minRow = cabins[0]?.startRow ?? 1;
  const maxRow = cabins[cabins.length - 1]?.endRow ?? 1;

  useEffect(() => {
    if (open) {
      const defaultFromRow = selectedRows.length > 0 ? Math.min(...selectedRows) : Math.max(minRow, Math.floor((minRow + maxRow) / 2) - 1);
      const defaultToRow = selectedRows.length > 0 ? Math.max(...selectedRows) : Math.min(maxRow, defaultFromRow + 2);

      const defaultFrom = defaultFromRow.toString();
      const defaultTo = defaultToRow.toString();

      setLeftFrom(wings?.leftFromRow?.toString() ?? defaultFrom);
      setLeftTo(wings?.leftToRow?.toString() ?? defaultTo);
      setRightFrom(wings?.rightFromRow?.toString() ?? defaultFrom);
      setRightTo(wings?.rightToRow?.toString() ?? defaultTo);
      setHeight(wings?.height?.toString() ?? "24");
      setErrors({});
    }
  }, [open, wings, minRow, maxRow, selectedRows]);

  const validate = () => {
    const next: Record<string, string> = {};
    const lf = parseInt(leftFrom);
    const lt = parseInt(leftTo);
    const rf = parseInt(rightFrom);
    const rt = parseInt(rightTo);
    const h = parseInt(height);

    if (!Number.isFinite(lf) || lf < minRow || lf > maxRow) next.leftFrom = `Row must be ${minRow}–${maxRow}`;
    if (!Number.isFinite(lt) || lt < minRow || lt > maxRow) next.leftTo = `Row must be ${minRow}–${maxRow}`;
    if (!next.leftFrom && !next.leftTo && lt < lf) next.leftTo = "To Row must be ≥ From Row";
    if (!Number.isFinite(rf) || rf < minRow || rf > maxRow) next.rightFrom = `Row must be ${minRow}–${maxRow}`;
    if (!Number.isFinite(rt) || rt < minRow || rt > maxRow) next.rightTo = `Row must be ${minRow}–${maxRow}`;
    if (!next.rightFrom && !next.rightTo && rt < rf) next.rightTo = "To Row must be ≥ From Row";
    if (!Number.isFinite(h) || h < 10 || h > 100) next.height = "Height must be 10–100";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (cabins.length === 0) {
      setErrors({ leftFrom: "Add a cabin first" });
      return;
    }
    if (!validate()) return;
    onSave({
      leftFromRow: parseInt(leftFrom),
      leftToRow: parseInt(leftTo),
      rightFromRow: parseInt(rightFrom),
      rightToRow: parseInt(rightTo),
      height: parseInt(height),
    });
    onOpenChange(false);
  };

  const handleRemove = () => {
    onSave(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Configure Wings</DialogTitle>
          <DialogDescription>
            Set the row range each wing spans and their height. Right wing sits above the cabin; left wing sits below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div>
            <Label htmlFor="wing-height" className="mb-2 block text-xs font-bold uppercase text-muted-foreground tracking-widest">
              Wing Height (px)
            </Label>
            <Input
              id="wing-height"
              type="number"
              value={height}
              onChange={(e) => { setHeight(e.target.value); setErrors((p) => ({ ...p, height: "" })); }}
              className={errors.height ? "border-destructive" : ""}
            />
            {errors.height && <p className="text-destructive mt-1 text-xs">{errors.height}</p>}
          </div>

          <div>
            <p className="text-muted-foreground mb-2 text-[10px] font-bold tracking-widest uppercase">
              Right Wing (top)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="right-from" className="mb-1 block text-xs">From Row</Label>
                <Input
                  id="right-from"
                  type="number"
                  value={rightFrom}
                  onChange={(e) => { setRightFrom(e.target.value); setErrors((p) => ({ ...p, rightFrom: "" })); }}
                  className={errors.rightFrom ? "border-destructive" : ""}
                />
                {errors.rightFrom && <p className="text-destructive mt-1 text-xs">{errors.rightFrom}</p>}
              </div>
              <div>
                <Label htmlFor="right-to" className="mb-1 block text-xs">To Row</Label>
                <Input
                  id="right-to"
                  type="number"
                  value={rightTo}
                  onChange={(e) => { setRightTo(e.target.value); setErrors((p) => ({ ...p, rightTo: "" })); }}
                  className={errors.rightTo ? "border-destructive" : ""}
                />
                {errors.rightTo && <p className="text-destructive mt-1 text-xs">{errors.rightTo}</p>}
              </div>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-2 text-[10px] font-bold tracking-widest uppercase">
              Left Wing (bottom)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="left-from" className="mb-1 block text-xs">From Row</Label>
                <Input
                  id="left-from"
                  type="number"
                  value={leftFrom}
                  onChange={(e) => { setLeftFrom(e.target.value); setErrors((p) => ({ ...p, leftFrom: "" })); }}
                  className={errors.leftFrom ? "border-destructive" : ""}
                />
                {errors.leftFrom && <p className="text-destructive mt-1 text-xs">{errors.leftFrom}</p>}
              </div>
              <div>
                <Label htmlFor="left-to" className="mb-1 block text-xs">To Row</Label>
                <Input
                  id="left-to"
                  type="number"
                  value={leftTo}
                  onChange={(e) => { setLeftTo(e.target.value); setErrors((p) => ({ ...p, leftTo: "" })); }}
                  className={errors.leftTo ? "border-destructive" : ""}
                />
                {errors.leftTo && <p className="text-destructive mt-1 text-xs">{errors.leftTo}</p>}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {wings ? (
            <Button variant="outline" onClick={handleRemove} className="text-destructive">
              Remove Wings
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
