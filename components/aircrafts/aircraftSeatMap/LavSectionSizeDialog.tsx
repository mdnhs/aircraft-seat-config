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
import { useEffect, useState } from "react";

interface LavSectionSizeDialogProps {
  open: boolean;
  initialSize: number;
  onClose: () => void;
  onApply: (size: number) => void;
}

export const LavSectionSizeDialog = ({
  open,
  initialSize,
  onClose,
  onApply,
}: LavSectionSizeDialogProps) => {
  const [size, setSize] = useState(initialSize);

  useEffect(() => {
    if (open) setSize(initialSize);
  }, [open, initialSize]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle>Customize LAV Section Size</DialogTitle>
          <DialogDescription>
            Adjust how many LAV units this section spans vertically.
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
            Max 6 units
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onApply(size);
              onClose();
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
