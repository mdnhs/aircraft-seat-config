"use client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDraggable } from "@dnd-kit/core";
import { Tool } from "./types";

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
              className={`bg-background border-border hover:bg-accent hover:text-accent-foreground mb-2 flex cursor-grab flex-col items-center justify-center rounded-md border p-2 shadow-sm transition-colors active:cursor-grabbing ${
                isDragging ? "border-primary opacity-30" : ""
              }`}
            >
              <div className="text-foreground/70 mb-1">{tool.icon}</div>
              <span className="text-muted-foreground text-[9px] font-bold uppercase">
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
