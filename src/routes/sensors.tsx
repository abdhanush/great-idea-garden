import { createFileRoute, Link } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";

import { LastUpdated } from "@/components/robot/LastUpdated";
import { TONE_CHIP, TONE_TEXT, useSensorViews } from "@/components/robot/useSensorViews";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useRobot } from "@/lib/robot/RobotProvider";

export const Route = createFileRoute("/sensors")({
  head: () => ({
    meta: [
      { title: "Live Sensors — AgriBot Control" },
      { name: "description", content: "Real-time soil moisture, temperature, humidity, smoke, light and fire readings from the robot." },
      { property: "og:title", content: "Live Sensors — AgriBot Control" },
      { property: "og:description", content: "Real-time soil, climate, smoke, light and fire readings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SensorsPage,
});

function SensorsPage() {
  const { connection, settings } = useRobot();
  const views = useSensorViews();
  const stale = connection === "disconnected";
  const hint: Record<string, string> = {
    soil: `Dry below ${settings.soilDryThreshold}%`,
    temperature: `High at ${settings.tempHighThreshold}°C`,
    smoke: `Alert at ${settings.smokeThreshold}`,
    light: `Bright ${settings.lightHigherIsDarker ? "below" : "at/above"} ${settings.lightThreshold}`,
  };

  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Live sensors</h1>
          <LastUpdated />
        </div>
        <Link to="/settings" className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <SlidersHorizontal className="size-4" /> Thresholds
        </Link>
      </div>

      {stale && <p className="text-sm text-warning">Showing last known values — the robot is not responding.</p>}

      <div className="space-y-3">
        {views.map((v) => {
          const Icon = v.icon;
          const isFire = v.id === "fire";
          return (
            <article
              key={v.id}
              className={cn(
                "panel p-4",
                v.tone === "danger" && "fire-flash border-destructive/60",
                isFire && v.tone === "danger" && "bg-gradient-danger text-destructive-foreground",
                stale && "opacity-60",
              )}
            >
              <div className="flex items-center gap-4">
                <span className={cn("grid size-12 place-items-center rounded-2xl bg-surface", TONE_TEXT[v.tone], isFire && v.tone === "danger" && "bg-background/20 text-destructive-foreground")}>
                  <Icon className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm text-muted-foreground", isFire && v.tone === "danger" && "text-destructive-foreground")}>{v.label}</p>
                  <p className="readout text-3xl font-semibold">
                    {v.value}
                    {v.unit && <span className="ml-1.5 text-sm font-normal text-muted-foreground">{v.unit}</span>}
                  </p>
                </div>
                <div className="text-right">
                  <span className={cn("inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide", TONE_CHIP[v.tone], isFire && v.tone === "danger" && "bg-background/25 text-destructive-foreground")}>
                    {v.status}
                  </span>
                  {hint[v.id] && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint[v.id]}</p>}
                </div>
              </div>
              {v.percent !== undefined && <Progress value={v.percent} className="mt-4 h-2.5" aria-label={`${v.label} ${v.value}%`} />}
            </article>
          );
        })}
      </div>
    </>
  );
}
