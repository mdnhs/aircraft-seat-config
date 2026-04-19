import AircraftConfig from "@/components/aircrafts/AircraftConfig";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/50 p-6 flex items-center justify-center font-bold text-muted-foreground animate-pulse">Loading Configuration...</div>}>
      <AircraftConfig />
    </Suspense>
  );
}
