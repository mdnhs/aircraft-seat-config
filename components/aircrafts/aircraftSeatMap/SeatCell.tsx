"use client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Settings2, Trash2 } from "lucide-react";
import React from "react";
import { Seat } from "./Seat";

interface SeatCellProps {
  id: string;
  row: number;
  col: string;
  size: number;
  equipment: string | undefined;
  selected: boolean;
  onDeleteSeat: (id: string) => void;
  onCustomizeLavSize?: () => void;
  style?: React.CSSProperties;
}

export const SeatCell = ({
  id,
  row,
  col,
  size,
  equipment,
  selected,
  onDeleteSeat,
  onCustomizeLavSize,
  style,
}: SeatCellProps) => {
  const borderRadius = Math.max(4, Math.floor(size * 0.18));
  const isRemoved = equipment === "removed";
  const isLav = equipment === "lav";

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            className="group transition-transform"
            style={{
              borderRadius: `${borderRadius}px`,
              width: `${size}px`,
              height: `${size}px`,
              ...(style?.position === "absolute"
                ? {
                    position: "absolute",
                    top: style.top,
                    left: style.left,
                    height: style.height,
                    width: style.width || `${size}px`,
                    zIndex: style.zIndex,
                  }
                : {}),
            }}
          />
        }
      >
        <Seat
          id={id}
          row={row}
          col={col}
          equipment={equipment}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: `${borderRadius}px`,
          }}
          className={`border-2 ${isLav ? "flex items-center justify-center" : ""}`}
          selected={selected}
        />
      </ContextMenuTrigger>
      <ContextMenuContent>
        {isLav && (
          <>
            <ContextMenuItem
              onClick={() => onCustomizeLavSize?.()}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
              Customize Size
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          disabled={isRemoved}
          onClick={() => onDeleteSeat(id)}
          className="text-destructive focus:text-destructive gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {isLav ? "Delete LAV" : "Delete Seat"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
