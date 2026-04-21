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
  customRowLabels?: string[];
}

export interface ZoneConfig {
  id: string;
  name: string;
  color: string;
  seatIds: string[];
}

export interface EmergencyExitConfig {
  id: string;
  row: number;
}

export type LavAlignment = "left" | "center" | "right";

export interface LavSectionConfig {
  id: string;
  position: number;
  size: number;
  alignment?: LavAlignment;
}

export type ExitAlignment = "left" | "right";

export interface ExitSectionConfig {
  id: string;
  position: number;
  alignment?: ExitAlignment;
}

export interface WingsConfig {
  leftFromRow: number;
  leftToRow: number;
  rightFromRow: number;
  rightToRow: number;
  height: number;
}
