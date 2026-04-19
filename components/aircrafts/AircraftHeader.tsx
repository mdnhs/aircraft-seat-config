import React from "react";
import { Plane } from "lucide-react";
import { TOTAL_SEATS, AIRCRAFT_TYPE, REG_NO } from "./constants";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface AircraftHeaderProps {
  availableSeats: number;
}

export const AircraftHeader = ({ availableSeats }: AircraftHeaderProps) => {
  return (
    <Card className="shadow-sm border-gray-100 mb-4 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-primary-foreground">
              <Plane className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold">Aircraft Details</h1>
          </div>
          <div className="flex gap-12">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                Total Seats
              </p>
              <p className="text-2xl font-black text-primary leading-none">
                {TOTAL_SEATS}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                Available Seats
              </p>
              <p className="text-2xl font-black text-emerald-500 leading-none">
                {availableSeats}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              Aircraft Type
            </Label>
            <div className="p-3 bg-muted/50 border border-border rounded-lg text-sm font-semibold">
              {AIRCRAFT_TYPE}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              Registration No.
            </Label>
            <div className="p-3 bg-muted/50 border border-border rounded-lg text-sm font-semibold">
              {REG_NO}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              Aircraft Status
            </Label>
            <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-lg text-sm font-semibold">
              <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-50 pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                Active
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              Jump Seats
            </Label>
            <div className="p-3 bg-muted/50 border border-border rounded-lg text-sm font-semibold">
              4
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
