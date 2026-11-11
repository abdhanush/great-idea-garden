import { cn } from "@/lib/utils";

import { TONE_CHIP, TONE_TEXT, type SensorView } from "./useSensorViews";

export function SensorTile({ view, stale }: { view: SensorView; stale?: boolean }) {
  const Icon = view.icon;
  return (
    <div className={cn("panel p-3.5", view.tone === "danger" && "fire-flash border-destructive/50", stale && "opacity-50")}>
      <div className="flex items-center justify-between">
        <Icon className={cn("size-4", TONE_TEXT[view.tone])} />
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", TONE_CHIP[view.tone])}>
          {view.status}
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{view.label}</p>
      <p className="readout text-2xl font-semibold">
        {view.value}
        {view.unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{view.unit}</span>}
      </p>
    </div>
  );
}
