"use client";
import { useDroppable } from "@dnd-kit/core";
import React from "react";
import { TOOLS } from "./constants";

export const Seat = ({
  id,
  equipment,
  className,
  style,
  selected,
}: {
  id: string;
  row: number;
  col: string;
  equipment?: string;
  className?: string;
  style?: React.CSSProperties;
  selected?: boolean;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const getToolIcon = (type: string) => {
    const tool = TOOLS.find((t) => t.id === type);
    return tool ? tool.icon : null;
  };

  return (
    <div
      ref={setNodeRef}
      data-key={id}
      style={style}
      className={`seat-selectable relative flex flex-shrink-0 items-center justify-center rounded-lg border-2 transition-all ${isOver ? "bg-accent border-primary z-20 scale-110 shadow-md" : "bg-background border-border"} ${selected ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-offset-2" : ""} ${equipment ? "bg-primary/5 border-primary/30" : ""} ${className || ""} `}
    >
      {equipment ? (
        <div
          className={`animate-in fade-in zoom-in duration-200 ${selected ? "text-blue-600" : "text-primary"}`}
        >
          {getToolIcon(equipment)}
        </div>
      ) : (
        <div
          className={`h-full w-full rounded-md transition-colors ${selected ? "bg-blue-200/50" : "bg-muted/10 group-hover:bg-muted/20"}`}
        />
      )}

      {/* Drop indicator overlay for better visual feedback */}
      {isOver && (
        <div className="bg-primary/10 border-primary/20 pointer-events-none absolute inset-0 animate-pulse rounded-lg border" />
      )}
    </div>
  );
};
