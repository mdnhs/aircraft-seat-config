"use client";
import { useDroppable } from "@dnd-kit/core";
import React from "react";
import { TOOLS } from "../constants";

const SeatSvg = ({
  bgColor = "#F8FAFC",
  borderColor = "#E2E8F0",
  armrestColor = "#CAD5E2",
  armrestAccentColor = "#62748E",
  detailColor = "#E2E8F0",
}: {
  bgColor?: string;
  borderColor?: string;
  armrestColor?: string;
  armrestAccentColor?: string;
  detailColor?: string;
}) => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <mask id="path-1-inside-1_1_4888" fill="white">
      <path d="M44 38C44 41.3137 41.3137 44 38 44H6C2.68629 44 0 41.3137 0 38V6C0 2.68629 2.68629 0 6 0H38C41.3137 0 44 2.68629 44 6V38Z" />
    </mask>
    <path
      d="M44 38C44 41.3137 41.3137 44 38 44H6C2.68629 44 0 41.3137 0 38V6C0 2.68629 2.68629 0 6 0H38C41.3137 0 44 2.68629 44 6V38Z"
      fill={bgColor}
    />
    <path
      d="M38 44V43H6V44V45H38V44ZM0 38H1V6H0H-1V38H0ZM6 0V1H38V0V-1H6V0ZM44 6H43V38H44H45V6H44ZM38 0V1C40.7614 1 43 3.23857 43 6H44H45C45 2.13401 41.866 -1 38 -1V0ZM0 6H1C1 3.23857 3.23857 1 6 1V0V-1C2.13401 -1 -1 2.13401 -1 6H0ZM6 44V43C3.23857 43 1 40.7614 1 38H0H-1C-1 41.866 2.13401 45 6 45V44ZM38 44V45C41.866 45 45 41.866 45 38H44H43C43 40.7614 40.7614 43 38 43V44Z"
      fill={borderColor}
      mask="url(#path-1-inside-1_1_4888)"
    />
    <path
      d="M40 36C37.7909 36 36 34.2091 36 32V12C36 9.79086 37.7909 8 40 8V36Z"
      fill={armrestColor}
    />
    <path
      d="M43 31C41.3431 31 40 29.6569 40 28V16C40 14.3431 41.3431 13 43 13V31Z"
      fill={armrestAccentColor}
    />
    <path
      d="M37 4C37 5.10457 36.1046 6 35 6H9C7.89543 6 7 5.10457 7 4C7 2.89543 7.89543 2 9 2H35C36.1046 2 37 2.89543 37 4Z"
      fill={detailColor}
    />
    <path
      d="M37 40C37 41.1046 36.1046 42 35 42H9C7.89543 42 7 41.1046 7 40C7 38.8954 7.89543 38 9 38H35C36.1046 38 37 38.8954 37 40Z"
      fill={detailColor}
    />
  </svg>
);

export const Seat = ({
  id,
  equipment,
  className,
  style,
  selected,
  reversed,
}: {
  id: string;
  row: number;
  col: string;
  equipment?: string;
  className?: string;
  style?: React.CSSProperties;
  selected?: boolean;
  reversed?: boolean;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isRemoved = equipment === "removed";
  const isLav = equipment === "lav";
  const svgTransform = reversed ? "scaleX(-1)" : undefined;
  const hasEquipment = !!equipment && !isRemoved && !isLav;

  const getToolIcon = (type: string) => {
    const tool = TOOLS.find((t) => t.id === type);
    return tool ? tool.icon : null;
  };

  const bgColor = isOver
    ? "#DBEAFE"
    : selected
      ? "#EFF6FF"
      : hasEquipment
        ? "#F0FDF4"
        : "#F8FAFC";

  const borderColor = isOver
    ? "#3B82F6"
    : selected
      ? "#93C5FD"
      : hasEquipment
        ? "#86EFAC"
        : "#E2E8F0";

  if (isRemoved) {
    return (
      <div
        ref={setNodeRef}
        data-key={id}
        style={style}
        className={`seat-selectable relative flex shrink-0 items-center justify-center rounded-lg border-2 border-transparent bg-transparent transition-all ${className || ""}`}
      />
    );
  }

  if (isLav) {
    return (
      <div
        ref={setNodeRef}
        data-key={id}
        style={style}
        className={`seat-selectable relative flex shrink-0 items-center justify-center rounded-lg border-2 border-primary/30 bg-primary/5 transition-all
          ${isOver ? "border-primary z-20 scale-110 shadow-md" : ""}
          ${selected ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-offset-2" : ""}
          ${className || ""}`}
      >
        <div className={`scale-150 ${selected ? "text-blue-600" : "text-primary"}`}>
          {getToolIcon("lav")}
        </div>
        {isOver && (
          <div className="pointer-events-none absolute inset-0 animate-pulse rounded-lg border border-primary/20 bg-primary/10" />
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      data-key={id}
      style={style}
      className={`seat-selectable relative flex shrink-0 items-center justify-center transition-all
        ${isOver ? "z-20 scale-110 shadow-md" : ""}
        ${selected ? "ring-2 ring-blue-500 ring-offset-1" : ""}
        ${className || ""}`}
    >
      <div className="h-full w-full" style={{ transform: svgTransform }}>
        <SeatSvg
          bgColor={bgColor}
          borderColor={borderColor}
          armrestColor={selected ? "#93C5FD" : isOver ? "#60A5FA" : "#CAD5E2"}
          armrestAccentColor={selected ? "#3B82F6" : isOver ? "#2563EB" : "#62748E"}
          detailColor={selected ? "#BFDBFE" : isOver ? "#93C5FD" : "#E2E8F0"}
        />
      </div>
      {hasEquipment && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className={`animate-in fade-in zoom-in duration-200 ${selected ? "text-blue-600" : "text-primary"}`}>
            {getToolIcon(equipment!)}
          </div>
        </div>
      )}
      {isOver && (
        <div className="pointer-events-none absolute inset-0 animate-pulse rounded-lg border border-primary/20 bg-primary/10" />
      )}
    </div>
  );
};
