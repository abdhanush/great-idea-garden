import { Loader2, Power, PowerOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRobot } from "@/lib/robot/RobotProvider";
import type { MechanismKey } from "@/lib/robot/types";

import { MECHANISMS } from "./meta";

export function MechanismCard({ id }: { id: MechanismKey }) {
  const { status, isOnline, pending, setMechanism } = useRobot();
  const meta = MECHANISMS[id];
  const Icon = meta.icon;
  const on = status?.mechanisms[id] === true;
  const busy = !!pending[`mech:${id}`];
  const disabled = !isOnline || busy;

  return (
    <article className={cn("panel p-4 transition-shadow", on && "shadow-glow")} aria-label={meta.title}>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-12 place-items-center rounded-2xl",
            on ? "bg-gradient-primary text-primary-foreground" : "bg-surface text-muted-foreground",
          )}
        >
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">{meta.title}</h3>
          <p className="text-xs text-muted-foreground">{meta.blurb}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold tracking-wide",
            busy ? "bg-warning/15 text-warning" : on ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {busy ? "SENDING" : on ? "ON" : "OFF"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button variant={on ? "power" : "soft"} size="xl" disabled={disabled || on} onClick={() => setMechanism(id, true)} aria-label={`${meta.title} on`}>
          {busy && !on ? <Loader2 className="animate-spin" /> : <Power />} ON
        </Button>
        <Button variant="soft" size="xl" disabled={disabled || !on} onClick={() => setMechanism(id, false)} aria-label={`${meta.title} off`}>
          {busy && on ? <Loader2 className="animate-spin" /> : <PowerOff />} OFF
        </Button>
      </div>
    </article>
  );
}
