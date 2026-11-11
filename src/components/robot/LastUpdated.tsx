import { useEffect, useState } from "react";

import { useRobot } from "@/lib/robot/RobotProvider";

export function LastUpdated() {
  const { lastUpdate, settings } = useRobot();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ago = lastUpdate ? Math.max(0, Math.round((now - lastUpdate) / 1000)) : null;
  return (
    <span className="text-xs text-muted-foreground">
      {ago === null ? "Waiting for data" : ago <= 1 ? "Live" : `Updated ${ago}s ago`} · every {(settings.pollMs / 1000).toFixed(1)}s
    </span>
  );
}
