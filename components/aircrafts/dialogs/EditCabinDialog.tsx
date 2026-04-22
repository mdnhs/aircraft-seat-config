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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { CabinConfig } from "../types";
import { cabinSchema } from "../aircraftSeatMap/schemas";

interface EditCabinDialogProps {
  cabin: CabinConfig | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<CabinConfig>) => void;
}

export const EditCabinDialog = ({
  cabin,
  onClose,
  onUpdate,
}: EditCabinDialogProps) => {
  const [cabinType, setCabinType] = useState("Economy");
  const [rowFrom, setRowFrom] = useState("");
  const [rowTo, setRowTo] = useState("");
  const [seatFormat, setSeatFormat] = useState("3-3");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cabin) {
      setCabinType(cabin.label);
      setRowFrom(cabin.startRow.toString());
      setRowTo(cabin.endRow.toString());
      setSeatFormat(cabin.seatFormat);
      setErrors({});
    }
  }, [cabin]);

  const handleSave = () => {
    if (!cabin) return;

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

    onUpdate(cabin.id, {
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
    onClose();
    setErrors({});
  };

  return (
    <Dialog open={!!cabin} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-95">
        <DialogHeader className="gap-1">
          <DialogTitle>Edit Cabin</DialogTitle>
          <DialogDescription className="text-xs">
            Update the cabin layout details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-3">
          <div className="grid grid-cols-4 items-center gap-3">
            <Label
              htmlFor="edit-cabin-type"
              className="text-muted-foreground text-right text-xs font-semibold tracking-wider uppercase"
            >
              Type
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
          <div className="grid grid-cols-4 items-start gap-3">
            <Label className="text-muted-foreground mt-2 text-right text-xs font-semibold tracking-wider uppercase">
              Rows
            </Label>
            <div className="col-span-3">
              <div className="flex items-center gap-2">
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
                <span className="text-muted-foreground text-xs">to</span>
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
              </div>
              {(errors.rowFrom || errors.rowTo) && (
                <p className="text-destructive mt-1 text-[10px] leading-tight">
                  {errors.rowFrom || errors.rowTo}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label
              htmlFor="edit-seat-format"
              className="text-muted-foreground text-right text-xs font-semibold tracking-wider uppercase"
            >
              Format
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
                <p className="text-destructive mt-1 text-[10px] leading-tight">
                  {errors.seatFormat}
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
