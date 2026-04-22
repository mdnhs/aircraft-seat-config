"use client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Settings2, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { CabinConfig, WingsConfig } from "../types";

interface WingsProps {
  wings: WingsConfig | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  cabins: CabinConfig[];
  onEdit?: () => void;
  onDelete?: () => void;
}

const WingContent = ({
  type,
  pos,
  wingHeight,
  onEdit,
  onDelete,
}: {
  type: "left" | "right";
  pos: { left: number; width: number; top: number; bottom: number };
  wingHeight: number;
  onEdit?: () => void;
  onDelete?: () => void;
}) => (
  <ContextMenu>
    <ContextMenuTrigger
      render={
        <div
          className="absolute bg-[#D9D9D9] transition-all duration-300 cursor-context-menu hover:bg-gray-300"
          style={{
            left: `${pos.left}px`,
            width: `${pos.width}px`,
            top:
              type === "right"
                ? `${Math.max(0, pos.top - wingHeight)}px`
                : `${pos.bottom}px`,
            height: `${wingHeight}px`,
            zIndex: 50,
            clipPath:
              type === "right"
                ? "polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)"
                : "polygon(0% 0%, 97% 0%, 100% 100%, 3% 100%)",
          }}
        />
      }
    />
    <ContextMenuContent>
      <ContextMenuItem onClick={onEdit} className="gap-2">
        <Settings2 className="h-4 w-4" />
        Edit Configure Wings
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        onClick={onDelete}
        className="text-destructive focus:text-destructive gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Delete Wings
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
);

export const Wings = ({
  wings,
  containerRef,
  cabins,
  onEdit,
  onDelete,
}: WingsProps) => {
  const [positions, setPositions] = useState<{
    left: { left: number; width: number; top: number; bottom: number } | null;
    right: { left: number; width: number; top: number; bottom: number } | null;
  }>({ left: null, right: null });

  useEffect(() => {
    if (!wings || !containerRef.current) {
      setPositions({ left: null, right: null });
      return;
    }

    const updatePositions = () => {
      const getRangeBounds = (from: number, to: number) => {
        const fromEls = containerRef.current?.querySelectorAll(
          `[data-row="${from}"]`,
        );
        const toEls = containerRef.current?.querySelectorAll(
          `[data-row="${to}"]`,
        );

        if (!fromEls?.length || !toEls?.length) return null;

        let minLeft = Infinity;
        let maxRight = -Infinity;
        let minTop = Infinity;
        let maxBottom = -Infinity;

        const containerRect = containerRef.current!.getBoundingClientRect();
        const allEls = [...Array.from(fromEls), ...Array.from(toEls)];

        allEls.forEach((el) => {
          const rect = (el as HTMLElement).getBoundingClientRect();
          const relativeLeft =
            rect.left - containerRect.left + containerRef.current!.scrollLeft;
          const relativeRight =
            rect.right - containerRect.left + containerRef.current!.scrollLeft;
          const relativeTop = rect.top - containerRect.top;
          const relativeBottom = rect.bottom - containerRect.top;

          minLeft = Math.min(minLeft, relativeLeft);
          maxRight = Math.max(maxRight, relativeRight);
          minTop = Math.min(minTop, relativeTop);
          maxBottom = Math.max(maxBottom, relativeBottom);
        });

        const seatEl = allEls[0] as HTMLElement;
        const cabinEl = seatEl.closest(".rounded-3xl");

        let cabinTop = minTop;
        let cabinBottom = maxBottom;

        if (cabinEl) {
          const rect = cabinEl.getBoundingClientRect();
          cabinTop = rect.top - containerRect.top;
          cabinBottom = rect.bottom - containerRect.top;
        }

        return {
          left: minLeft,
          width: maxRight - minLeft,
          top: cabinTop,
          bottom: cabinBottom,
        };
      };

      setPositions({
        left: getRangeBounds(wings.leftFromRow, wings.leftToRow),
        right: getRangeBounds(wings.rightFromRow, wings.rightToRow),
      });
    };

    updatePositions();
    const observer = new MutationObserver(updatePositions);
    observer.observe(containerRef.current, { childList: true, subtree: true });
    window.addEventListener("resize", updatePositions);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePositions);
    };
  }, [wings, containerRef, cabins]);

  if (!wings) return null;

  const wingHeight = wings.height || 24;

  return (
    <>
      {positions.right && (
        <WingContent
          type="right"
          pos={positions.right}
          wingHeight={wingHeight}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      {positions.left && (
        <WingContent
          type="left"
          pos={positions.left}
          wingHeight={wingHeight}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  );
};
