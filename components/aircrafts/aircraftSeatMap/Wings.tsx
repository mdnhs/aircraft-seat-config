"use client";
import React, { useEffect, useState } from "react";
import { CabinConfig, WingsConfig } from "../types";

interface WingsProps {
  wings: WingsConfig | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  cabins: CabinConfig[];
}

export const Wings = ({ wings, containerRef, cabins }: WingsProps) => {
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
        <div
          className="pointer-events-none absolute bg-[#D9D9D9] transition-all duration-300"
          style={{
            left: `${positions.right.left}px`,
            width: `${positions.right.width}px`,
            top: `${Math.max(0, positions.right.top - wingHeight)}px`,
            height: `${wingHeight}px`,
            zIndex: 50,
            clipPath: "polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)",
          }}
        />
      )}
      {positions.left && (
        <div
          className="pointer-events-none absolute bg-[#D9D9D9] transition-all duration-300"
          style={{
            left: `${positions.left.left}px`,
            width: `${positions.left.width}px`,
            top: `${positions.left.bottom}px`,
            height: `${wingHeight}px`,
            zIndex: 50,
            clipPath: "polygon(0% 0%, 97% 0%, 100% 100%, 3% 100%)",
          }}
        />
      )}
    </>
  );
};
