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
import { Label } from "@/components/ui/label";
import { Toilet } from "lucide-react";
import React, { useState } from "react";
import { LavSectionConfig } from "../types";

interface AddLavSectionDialogProps {
  onAddLavSection: (lav: LavSectionConfig, position: number) => void;
  position: number;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddLavSectionDialog({
  onAddLavSection,
  position,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddLavSectionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (controlledOnOpenChange ?? setInternalOpen)
    : setInternalOpen;
  const [size, setSize] = useState(2);

  React.useEffect(() => {
    if (open) setSize(2);
  }, [open]);

  const handleApply = () => {
    onAddLavSection(
      {
        id: Math.random().toString(36).substring(7),
        position,
        size,
      },
      position,
    );
    setOpen(false);
    setSize(2);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={true}
        render={(triggerProps) => {
          if (trigger) {
            return React.cloneElement(
              trigger as React.ReactElement,
              triggerProps,
            );
          }
          return (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              {...triggerProps}
            >
              <Toilet className="h-4 w-4" />
              Add LAV
            </Button>
          );
        }}
      />
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader className="gap-1">
          <DialogTitle>Add LAV Section</DialogTitle>
          <DialogDescription className="text-xs">
            Place a standalone LAV block in the aircraft body.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-3">
          <div className="grid grid-cols-4 items-center gap-3">
            <Label className="text-muted-foreground text-right text-xs font-semibold tracking-wider uppercase">
              Size
            </Label>
            <div className="col-span-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSize((s) => Math.max(1, s - 1))}
                  disabled={size <= 1}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-gray-200 text-sm font-bold text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  −
                </button>

                <div className="flex h-8 w-10 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">
                  {size}
                </div>

                <button
                  type="button"
                  onClick={() => setSize((s) => Math.min(6, s + 1))}
                  disabled={size >= 6}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-gray-200 text-sm font-bold text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  +
                </button>
              </div>
              <p className="text-muted-foreground text-[10px]">
                LAV units (max 6)
              </p>
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
