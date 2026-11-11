import { Loader2, OctagonX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRobot } from "@/lib/robot/RobotProvider";

export function EmergencyStop({ compact = false }: { compact?: boolean }) {
  const { emergencyStop, pending } = useRobot();
  const busy = !!pending.estop;
  if (compact) {
    return (
      <Button variant="emergency" size="sm" className="h-9 rounded-full px-3" onClick={emergencyStop} disabled={busy} aria-label="Emergency stop">
        {busy ? <Loader2 className="animate-spin" /> : <OctagonX />}
        Stop
      </Button>
    );
  }
  return (
    <Button variant="emergency" size="hero" onClick={emergencyStop} disabled={busy} aria-label="Emergency stop all motors">
      {busy ? <Loader2 className="animate-spin" /> : <OctagonX />}
      Emergency stop
    </Button>
  );
}
