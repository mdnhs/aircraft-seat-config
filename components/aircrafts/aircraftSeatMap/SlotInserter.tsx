"use client";
import { DoorOpen, Plus } from "lucide-react";
import { AddCabinDialog } from "../dialogs/AddCabinDialog";
import { CabinConfig } from "../types";
import { LavSlotDropZone } from "./LavSlotDropZone";

interface SlotInserterProps {
  position: number;
  cabins: CabinConfig[];
  onAddCabin: (cabin: CabinConfig) => void;
  lavCountAtPosition: number;
  exitMode: boolean;
  exitCountAtPosition: number;
  onAddExitSection: (position: number) => void;
}

export const SlotInserter = ({
  position,
  cabins,
  onAddCabin,
  lavCountAtPosition,
  exitMode,
  exitCountAtPosition,
  onAddExitSection,
}: SlotInserterProps) => (
  <div className="flex flex-col items-center gap-2">
    <AddCabinDialog
      onAddCabin={onAddCabin}
      index={position}
      cabins={cabins}
      trigger={
        <div
          title="Add Cabin"
          className="border-border text-muted-foreground group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-2 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-500 hover:shadow-md"
        >
          <Plus className="h-6 w-6 transition-transform group-hover:scale-110" />
        </div>
      }
    />
    {lavCountAtPosition < 2 && (
      <LavSlotDropZone position={position} lavCount={lavCountAtPosition} />
    )}
    {exitMode && exitCountAtPosition < 2 && (
      <button
        type="button"
        title="Add Exit"
        onClick={() => onAddExitSection(position)}
        className="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-2 border-red-300 bg-red-50/40 text-red-500 shadow-sm transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600 hover:shadow-md"
      >
        <DoorOpen className="h-5 w-5 transition-transform group-hover:scale-110" />
      </button>
    )}
  </div>
);
