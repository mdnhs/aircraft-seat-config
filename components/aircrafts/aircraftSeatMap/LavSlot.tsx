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
import { StandaloneLavSection } from "./StandaloneLavSection";

interface LavSlotProps {
  lavs: LavSectionConfig[];
  onDelete: (id: string) => void;
  onSetAlignment: (id: string, alignment: LavAlignment) => void;
  onOpenSizeDialog: (id: string, size: number) => void;
}

export const LavSlot = ({
  lavs,
  onDelete,
  onSetAlignment,
  onOpenSizeDialog,
}: LavSlotProps) => {
  if (lavs.length === 1) {
    const lav = lavs[0];
    return (
      <StandaloneLavSection
        lav={lav}
        onDelete={onDelete}
        onCustomizeSize={(id, size) => onOpenSizeDialog(id, size)}
        onSetAlignment={onSetAlignment}
      />
    );
  }

  const topLav = lavs.find((l) => (l.alignment ?? "center") === "right");
  const bottomLav = lavs.find((l) => (l.alignment ?? "center") === "left");
  const hasTop = !!topLav;
  const hasBottom = !!bottomLav;

  const renderLavBlock = (lav: LavSectionConfig) => {
    const cellSize = 40;
    const gap = 6;
    const blockHeight = cellSize * lav.size + gap * (lav.size - 1);
    const alignment: LavAlignment = lav.alignment ?? "center";

    return (
      <ContextMenu key={lav.id}>
        <ContextMenuTrigger render={<div />}>
          <div
            className="bg-primary/5 border-primary/30 text-primary flex items-center justify-center rounded-lg border-2"
            style={{ width: `${cellSize}px`, height: `${blockHeight}px` }}
          >
            <Toilet className="h-5 w-5" />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => onOpenSizeDialog(lav.id, lav.size)}
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
                disabled={hasBottom && alignment === "right"}
              >
                <AlignLeft className="h-4 w-4" />
                Left
                {alignment === "left" && (
                  <span className="text-muted-foreground ml-auto text-xs">✓</span>
                )}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onSetAlignment(lav.id, "right")}
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

  return (
    <div className="flex h-100 flex-col justify-between">
      {hasTop && topLav ? (
        renderLavBlock(topLav)
      ) : (
        <div style={{ width: 40, height: 40 }} />
      )}
      {hasBottom && bottomLav ? (
        renderLavBlock(bottomLav)
      ) : (
        <div style={{ width: 40, height: 40 }} />
      )}
    </div>
  );
};
