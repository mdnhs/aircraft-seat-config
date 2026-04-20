import AircraftConfig from "@/components/aircrafts/AircraftConfig";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="bg-muted/50 text-muted-foreground flex min-h-screen animate-pulse items-center justify-center p-6 font-bold">
          Loading Configuration...
        </div>
      }
    >
      <AircraftConfig />
    </Suspense>
  );
}
