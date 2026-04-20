import { Accessibility, Baby, Lock, Trash2, Users, Wind } from "lucide-react";
import { Tool } from "./types";

export const AIRCRAFT_TYPE = "B737-800";
export const REG_NO = "N123AA";
export const TOTAL_SEATS = 96;

export const TOOLS: Tool[] = [
  { id: "lav", label: "LAV", icon: <Wind className="h-4 w-4" /> },
  { id: "baby-cot", label: "Baby Cot", icon: <Baby className="h-4 w-4" /> },
  { id: "whchr", label: "WHCHR", icon: <Accessibility className="h-4 w-4" /> },
  { id: "strchr", label: "STRCHR", icon: <Users className="h-4 w-4" /> },
  { id: "block", label: "BLOCK", icon: <Lock className="h-4 w-4" /> },
  { id: "delete", label: "DELETE", icon: <Trash2 className="h-4 w-4" /> },
];
