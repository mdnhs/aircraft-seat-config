import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plane } from "lucide-react";
import { AIRCRAFT_TYPE, REG_NO, TOTAL_SEATS } from "./constants";

interface AircraftHeaderProps {
  availableSeats: number;
}

export const AircraftHeader = ({ availableSeats }: AircraftHeaderProps) => {
  return (
    <Card className="mb-4 overflow-hidden border-gray-100 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground rounded-lg p-2">
              <Plane className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold">Aircraft Details</h1>
          </div>
          <div className="flex gap-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-1 text-[10px] font-bold tracking-wider uppercase">
                Total Seats
              </p>
              <p className="text-primary text-2xl leading-none font-black">
                {TOTAL_SEATS}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground mb-1 text-[10px] font-bold tracking-wider uppercase">
                Available Seats
              </p>
              <p className="text-2xl leading-none font-black text-emerald-500">
                {availableSeats}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-[10px] font-bold uppercase">
              Aircraft Type
            </Label>
            <div className="bg-muted/50 border-border rounded-lg border p-3 text-sm font-semibold">
              {AIRCRAFT_TYPE}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-[10px] font-bold uppercase">
              Registration No.
            </Label>
            <div className="bg-muted/50 border-border rounded-lg border p-3 text-sm font-semibold">
              {REG_NO}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-[10px] font-bold uppercase">
              Aircraft Status
            </Label>
            <div className="bg-muted/50 border-border flex items-center gap-2 rounded-lg border p-3 text-sm font-semibold">
              <Badge
                variant="outline"
                className="pointer-events-none border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-50"
              >
                <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-[10px] font-bold uppercase">
              Jump Seats
            </Label>
            <div className="bg-muted/50 border-border rounded-lg border p-3 text-sm font-semibold">
              4
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
