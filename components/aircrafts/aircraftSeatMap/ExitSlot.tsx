"use client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { AlignCenter, AlignLeft, AlignRight, DoorOpen, Trash2 } from "lucide-react";
import { ExitAlignment, ExitSectionConfig } from "../types";

const ExitIcon = () => (
  <div
    className="flex items-center justify-center rounded-lg border-2 border-red-400 bg-white text-red-500"
    style={{ width: 40, height: 40 }}
  >
    <DoorOpen className="h-5 w-5" />
  </div>
);

interface ExitSlotProps {
  exits: ExitSectionConfig[];
  onDelete: (id: string) => void;
  onSetAlignment: (id: string, alignment: ExitAlignment) => void;
}

export const ExitSlot = ({ exits, onDelete, onSetAlignment }: ExitSlotProps) => {
  const hasTop = exits.some((e) => (e.alignment ?? "right") === "right");
  const hasBottom = exits.some((e) => (e.alignment ?? "right") === "left");
  const topExit = exits.find((e) => (e.alignment ?? "right") === "right");
  const bottomExit = exits.find((e) => (e.alignment ?? "right") === "left");

  const renderExitBlock = (exit: ExitSectionConfig) => {
    const alignment: ExitAlignment = exit.alignment ?? "right";
    return (
      <ContextMenu key={exit.id}>
        <ContextMenuTrigger render={<div />}>
          <div className="flex flex-col items-center rounded-2xl border-2 border-red-300 bg-red-50/60 p-3 shadow-[0_4px_20px_-4px_rgba(239,68,68,0.15)] transition-shadow hover:shadow-[0_8px_30px_-4px_rgba(239,68,68,0.2)]">
            <ExitIcon />
            <span className="mt-2 text-[9px] font-bold tracking-widest text-red-500 uppercase select-none">
              EXIT
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2">
              <AlignCenter className="h-4 w-4" />
              Exit Position
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem
                onClick={() => onSetAlignment(exit.id, "left")}
                className="gap-2"
                disabled={hasBottom && alignment === "right"}
              >
                <AlignLeft className="h-4 w-4" />
                Left
                {alignment === "left" && (
                  <span className="text-muted-foreground ml-auto text-xs">✓</span>
                )}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onSetAlignment(exit.id, "right")}
                className="gap-2"
                disabled={hasTop && alignment === "left"}
              >
                <AlignRight className="h-4 w-4" />
                Right
                {alignment === "right" && (
                  <span className="text-muted-foreground ml-auto text-xs">✓</span>
                )}
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => onDelete(exit.id)}
            className="text-destructive focus:text-destructive gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Exit
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <div className="flex h-[400px] flex-col justify-between">
      {hasTop && topExit ? (
        renderExitBlock(topExit)
      ) : (
        <div style={{ width: 40, height: 40 }} />
      )}
      {hasBottom && bottomExit ? (
        renderExitBlock(bottomExit)
      ) : (
        <div style={{ width: 40, height: 40 }} />
      )}
    </div>
  );
};
