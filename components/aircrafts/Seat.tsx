"use client";
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { TOOLS } from "./constants";

export const Seat = ({
  id,
  equipment,
  className,
  selected,
}: {
  id: string;
  row: number;
  col: string;
  equipment?: string;
  className?: string;
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
      className={`border-2 rounded-lg flex items-center justify-center transition-all flex-shrink-0 relative seat-selectable
        ${isOver ? "bg-accent border-primary scale-110 shadow-md z-20" : "bg-background border-border"}
        ${selected ? "ring-2 ring-blue-500 ring-offset-2 border-blue-500 bg-blue-50" : ""}
        ${equipment ? "bg-primary/5 border-primary/30" : ""}
        ${className || "w-10 h-10"}
      `}
    >
      {equipment ? (
        <div className={`animate-in fade-in zoom-in duration-200 ${selected ? "text-blue-600" : "text-primary"}`}>
          {getToolIcon(equipment)}
        </div>
      ) : (
        <div className={`w-full h-full rounded-md transition-colors ${selected ? "bg-blue-200/50" : "bg-muted/10 group-hover:bg-muted/20"}`} />
      )}

      {/* Drop indicator overlay for better visual feedback */}
      {isOver && (
        <div className="absolute inset-0 bg-primary/10 rounded-lg pointer-events-none border border-primary/20 animate-pulse" />
      )}
    </div>
  );
};
