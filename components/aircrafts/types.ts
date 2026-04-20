import React from "react";

export interface Tool {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface SeatConfig {
  [key: string]: string;
}

export interface CabinConfig {
  id: string;
  label: string;
  startRow: number;
  endRow: number;
  seatFormat: string; // e.g., "2-2-2", "3-3", "2-4-2"
  seatSize: "lg" | "md" | "sm";
  customLabels?: string[];
}

export interface ZoneConfig {
  id: string;
  name: string;
  color: string;
  seatIds: string[];
}
