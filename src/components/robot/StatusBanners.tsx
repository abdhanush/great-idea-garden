import { Link } from "@tanstack/react-router";
import { Flame, RefreshCw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRobot } from "@/lib/robot/RobotProvider";

export function StatusBanners() {
  const { connection, lastError, reconnect, sensors, baseUrl } = useRobot();
  return (
    <div className="space-y-3">
      {sensors?.fire === true && (
        <div role="alert" className="fire-flash flex items-center gap-3 rounded-2xl bg-gradient-danger p-4 text-destructive-foreground">
          <Flame className="size-8 shrink-0" />
          <div>
            <p className="font-display text-lg font-bold leading-tight">FIRE DETECTED</p>
            <p className="text-sm opacity-90">Use Emergency stop and check the robot immediately.</p>
          </div>
        </div>
      )}
      {connection === "disconnected" && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <WifiOff className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">Robot disconnected</p>
            <p className="text-sm text-muted-foreground">
              {lastError ?? "No reply"} · retrying {baseUrl ?? ""}. All mechanisms shown OFF until confirmed.
            </p>
          </div>
          <Button variant="soft" size="sm" onClick={reconnect} aria-label="Retry connection">
            <RefreshCw /> Retry
          </Button>
        </div>
      )}
      {connection === "unconfigured" && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <p className="text-sm text-foreground">Enter your ESP32 IP address to connect.</p>
          <Button variant="soft" size="sm" asChild>
            <Link to="/settings">Settings</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
