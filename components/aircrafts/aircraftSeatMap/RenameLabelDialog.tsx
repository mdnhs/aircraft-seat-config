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

interface RenameLabelDialogProps {
  open: boolean;
  title: string;
  description: string;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
}

export const RenameLabelDialog = ({
  open,
  title,
  description,
  initialValue,
  onClose,
  onSave,
}: RenameLabelDialogProps) => {
  const [inputValue, setInputValue] = useState(initialValue);

  useEffect(() => {
    if (open) setInputValue(initialValue);
  }, [open, initialValue]);

  const handleSave = () => {
    if (inputValue.trim()) {
      onSave(inputValue.trim());
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rename-label" className="text-right">
              Label
            </Label>
            <Input
              id="rename-label"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="col-span-3"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
