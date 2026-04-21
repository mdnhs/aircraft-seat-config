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
import { Toilet } from "lucide-react";
import React, { useState } from "react";
import { LavSectionConfig } from "./types";

interface AddLavSectionDialogProps {
  onAddLavSection: (lav: LavSectionConfig, position: number) => void;
  position: number;
  trigger?: React.ReactNode;
}

export function AddLavSectionDialog({
  onAddLavSection,
  position,
  trigger,
}: AddLavSectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(2);

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
        nativeButton={false}
        render={(triggerProps) => {
          const { nativeButton, ...props } = triggerProps as any;
          if (trigger) {
            return React.cloneElement(trigger as React.ReactElement, props);
          }
          return (
            <Button variant="outline" size="sm" className="gap-2" {...props}>
              <Toilet className="h-4 w-4" />
              Add LAV
            </Button>
          );
        }}
      />
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Add LAV Section</DialogTitle>
          <DialogDescription>
            Place a standalone LAV block in the aircraft body. Choose how many
            LAV units to stack vertically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setSize((s) => Math.max(1, s - 1))}
              disabled={size <= 1}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-gray-200 text-lg font-bold text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
            >
              −
            </button>

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl font-bold text-blue-600">
              {size}
            </div>

            <button
              type="button"
              onClick={() => setSize((s) => Math.min(6, s + 1))}
              disabled={size >= 6}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-gray-200 text-lg font-bold text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
            >
              +
            </button>
          </div>

          <p className="text-muted-foreground text-center text-xs">
            {size} LAV unit{size !== 1 ? "s" : ""} (max 6)
          </p>
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
