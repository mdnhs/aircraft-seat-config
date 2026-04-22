"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { CabinConfig } from "../types";
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

interface AddCabinDialogProps {
  onAddCabin: (cabin: CabinConfig, index?: number) => void;
  trigger?: React.ReactNode;
  index?: number;
  cabins?: CabinConfig[];
}

export function AddCabinDialog({
  onAddCabin,
  trigger,
  index = 0,
  cabins = [],
}: AddCabinDialogProps) {
  const [open, setOpen] = useState(false);
  const [cabinType, setCabinType] = useState("Economy");
  const [rowFrom, setRowFrom] = useState("");
  const [rowTo, setRowTo] = useState("");
  const [seatFormat, setSeatFormat] = useState("3-3");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isBetween = index < cabins.length;

  useEffect(() => {
    if (open) {
      const prevCabin = cabins[index - 1];
      const startRow = prevCabin ? prevCabin.endRow + 1 : 1;
      setRowFrom(startRow.toString());
      setRowTo((startRow + 9).toString()); // Default 10 rows
    }
  }, [open, index, cabins]);

  const handleApply = () => {
    const rFrom = parseInt(rowFrom);
    const rTo = parseInt(rowTo);

    const result = cabinSchema.safeParse({
      cabinType,
      rowFrom: rFrom,
      rowTo: rTo,
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

    // At-end validation for overlap
    if (!isBetween && cabins.length > 0) {
      const lastCabin = cabins[cabins.length - 1];
      if (rFrom <= lastCabin.endRow) {
        setErrors({
          rowFrom: `Row ${rFrom} already exists in ${lastCabin.label} cabin.`,
        });
        return;
      }
    }

    const newCabin: CabinConfig = {
      id: Math.random().toString(36).substring(7),
      label: cabinType,
      startRow: rFrom,
      endRow: rTo,
      seatFormat,
      seatSize:
        cabinType === "Business"
          ? "lg"
          : cabinType === "Premium Economy"
            ? "md"
            : "sm",
    };
    onAddCabin(newCabin, index);
    setOpen(false);
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={(triggerProps) => {
          const { nativeButton, ...props } = triggerProps as any;
          if (trigger) {
            return React.cloneElement(trigger as React.ReactElement, props);
          }
          return (
            <Button variant="outline" size="sm" className="gap-2" {...props}>
              <Plus className="h-4 w-4" />
              Add Cabin
            </Button>
          );
        }}
      />
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader className="gap-1">
          <DialogTitle>Add Cabin</DialogTitle>
          <DialogDescription className="text-xs">
            {isBetween
              ? "Insert a new cabin. Rows update automatically."
              : "Add a new cabin to the aircraft."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-3">
          <div className="grid grid-cols-4 items-center gap-3">
            <Label
              htmlFor="cabin-type"
              className="text-muted-foreground text-right text-xs font-semibold tracking-wider uppercase"
            >
              Type
            </Label>
            <div className="col-span-3">
              <Select
                value={cabinType}
                onValueChange={(val) => setCabinType(val ?? "Economy")}
              >
                <SelectTrigger id="cabin-type" className="w-full">
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
                  id="row-from"
                  type="number"
                  value={rowFrom}
                  disabled={isBetween}
                  onChange={(e) => {
                    setRowFrom(e.target.value);
                    setErrors((prev) => ({ ...prev, rowFrom: "" }));
                  }}
                  className={errors.rowFrom ? "border-destructive" : ""}
                />
                <span className="text-muted-foreground text-xs">to</span>
                <Input
                  id="row-to"
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
              htmlFor="seat-format"
              className="text-muted-foreground text-right text-xs font-semibold tracking-wider uppercase"
            >
              Format
            </Label>
            <div className="col-span-3">
              <Input
                id="seat-format"
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
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
