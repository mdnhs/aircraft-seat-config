"use client";
import React, { useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Tool } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const DraggableTool = ({ tool }: { tool: Tool }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: tool.id,
  });

  return (
    <Tooltip>
      <TooltipTrigger
        nativeButton={false}
        render={(triggerProps) => {
          const { nativeButton, ...props } = triggerProps as any;
          
          // Merge the refs from TooltipTrigger and useDraggable
          const mergedRef = (node: HTMLDivElement) => {
            setNodeRef(node);
            if (typeof props.ref === "function") {
              props.ref(node);
            } else if (props.ref) {
              props.ref.current = node;
            }
          };

          return (
            <div
              {...props}
              ref={mergedRef}
              {...listeners}
              {...attributes}
              className={`flex flex-col items-center justify-center p-2 mb-2 bg-background border border-border rounded-md cursor-grab active:cursor-grabbing hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm ${
                isDragging ? "opacity-30 border-primary" : ""
              }`}
            >
              <div className="text-foreground/70 mb-1">{tool.icon}</div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                {tool.label}
              </span>
            </div>
          );
        }}
      />
      <TooltipContent side="right">
        <p>{tool.label}</p>
      </TooltipContent>
    </Tooltip>
  );
};
