import React from "react";
import { Trash2, Baby, Accessibility, Lock, Wind, Users } from "lucide-react";
import { Tool } from "./types";

export const AIRCRAFT_TYPE = "B737-800";
export const REG_NO = "N123AA";
export const TOTAL_SEATS = 96;

export const TOOLS: Tool[] = [
  { id: "lav", label: "LAV", icon: <Wind className="w-4 h-4" /> },
  { id: "baby-cot", label: "Baby Cot", icon: <Baby className="w-4 h-4" /> },
  { id: "whchr", label: "WHCHR", icon: <Accessibility className="w-4 h-4" /> },
  { id: "strchr", label: "STRCHR", icon: <Users className="w-4 h-4" /> },
  { id: "block", label: "BLOCK", icon: <Lock className="w-4 h-4" /> },
  { id: "delete", label: "DELETE", icon: <Trash2 className="w-4 h-4" /> },
];
