"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CabinConfig } from "./types";
import { Plus } from "lucide-react";

interface AddCabinDialogProps {
  onAddCabin: (cabin: CabinConfig) => void;
  trigger?: React.ReactNode;
}

export function AddCabinDialog({ onAddCabin, trigger }: AddCabinDialogProps) {
  const [open, setOpen] = useState(false);
  const [cabinType, setCabinType] = useState("Economy");
  const [rowFrom, setRowFrom] = useState("");
  const [rowTo, setRowTo] = useState("");
  const [seatFormat, setSeatFormat] = useState("3-3");

  const handleApply = () => {
    const newCabin: CabinConfig = {
      id: Math.random().toString(36).substring(7),
      label: cabinType,
      startRow: parseInt(rowFrom),
      endRow: parseInt(rowTo),
      seatFormat: seatFormat,
      seatSize: cabinType === "Business" ? "lg" : cabinType === "Premium Economy" ? "md" : "sm",
    };
    onAddCabin(newCabin);
    setOpen(false);
    // Reset fields
    setRowFrom("");
    setRowTo("");
    setSeatFormat("3-3");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={(triggerProps) => {
          // Destructure nativeButton to prevent it from reaching the DOM element
          const { nativeButton, ...props } = triggerProps as any;
          if (trigger) {
            return React.cloneElement(trigger as React.ReactElement, props);
          }
          return (
            <Button variant="outline" size="sm" className="gap-2" {...props}>
              <Plus className="w-4 h-4" />
              Add Cabin
            </Button>
          );
        }}
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Cabin</DialogTitle>
          <DialogDescription>
            Create a cabin layout for your aircraft.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cabin-type" className="text-right">
              Cabin Type
            </Label>
            <div className="col-span-3">
              <Select value={cabinType} onValueChange={setCabinType}>
                <SelectTrigger id="cabin-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Premium Economy">Premium Economy</SelectItem>
                  <SelectItem value="Economy">Economy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="row-from" className="text-right">
              Row From
            </Label>
            <Input
              id="row-from"
              type="number"
              value={rowFrom}
              onChange={(e) => setRowFrom(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="row-to" className="text-right">
              Row To
            </Label>
            <Input
              id="row-to"
              type="number"
              value={rowTo}
              onChange={(e) => setRowTo(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="seat-format" className="text-right">
              Seat Format
            </Label>
            <Input
              id="seat-format"
              value={seatFormat}
              onChange={(e) => setSeatFormat(e.target.value)}
              placeholder="e.g. 2-4-2"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
