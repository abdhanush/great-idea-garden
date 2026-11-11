import { cn } from "@/lib/utils";
import { useRobot } from "@/lib/robot/RobotProvider";

const LABELS = {
  connected: "Connected",
  demo: "Demo",
  connecting: "Connecting…",
  disconnected: "Disconnected",
  unconfigured: "No IP set",
} as const;

export function ConnectionPill({ className }: { className?: string }) {
  const { connection } = useRobot();
  const tone =
    connection === "connected"
      ? "text-primary bg-primary/10 border-primary/30"
      : connection === "demo"
        ? "text-info bg-info/10 border-info/30"
        : connection === "connecting"
          ? "text-warning bg-warning/10 border-warning/30"
          : "text-destructive bg-destructive/10 border-destructive/30";
  return (
    <span
      className={cn("inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold", tone, className)}
      role="status"
      aria-live="polite"
    >
      <span className={cn("size-2 rounded-full bg-current", (connection === "connected" || connection === "demo") && "live-dot")} />
      {LABELS[connection]}
    </span>
  );
}
