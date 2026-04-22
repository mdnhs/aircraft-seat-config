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
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Settings2,
  Toilet,
  Trash2,
} from "lucide-react";
import { LavAlignment, LavSectionConfig } from "../types";

interface StandaloneLavSectionProps {
  lav: LavSectionConfig;
  onDelete: (id: string) => void;
  onCustomizeSize: (id: string, currentSize: number) => void;
  onSetAlignment: (id: string, alignment: LavAlignment) => void;
}

export const StandaloneLavSection = ({
  lav,
  onDelete,
  onCustomizeSize,
  onSetAlignment,
}: StandaloneLavSectionProps) => {
  const cellSize = 40;
  const gap = 6;
  const blockHeight = cellSize * lav.size + gap * (lav.size - 1);
  const alignment: LavAlignment = lav.alignment ?? "center";
  const alignItemsClass =
    alignment === "right"
      ? "items-start"
      : alignment === "left"
        ? "items-end"
        : "items-center";

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={<div className={`group/lav flex h-100 ${alignItemsClass}`} />}
      >
        <div
          className="bg-primary/5 border-primary/30 text-primary flex items-center justify-center rounded-lg border-2"
          style={{ width: `${cellSize}px`, height: `${blockHeight}px` }}
        >
          <Toilet className="h-5 w-5" />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => onCustomizeSize(lav.id, lav.size)}
          className="gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Customize Size
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <AlignCenter className="h-4 w-4" />
            LAV Position
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem
              onClick={() => onSetAlignment(lav.id, "left")}
              className="gap-2"
            >
              <AlignLeft className="h-4 w-4" />
              Left
              {alignment === "left" && (
                <span className="text-muted-foreground ml-auto text-xs">✓</span>
              )}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onSetAlignment(lav.id, "center")}
              className="gap-2"
            >
              <AlignCenter className="h-4 w-4" />
              Center
              {alignment === "center" && (
                <span className="text-muted-foreground ml-auto text-xs">✓</span>
              )}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onSetAlignment(lav.id, "right")}
              className="gap-2"
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
          onClick={() => onDelete(lav.id)}
          className="text-destructive focus:text-destructive gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete LAV Section
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
