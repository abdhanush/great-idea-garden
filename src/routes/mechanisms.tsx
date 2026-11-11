import { createFileRoute } from "@tanstack/react-router";

import { MechanismCard } from "@/components/robot/MechanismCard";
import { useRobot } from "@/lib/robot/RobotProvider";
import { MECHANISM_KEYS } from "@/lib/robot/types";

export const Route = createFileRoute("/mechanisms")({
  head: () => ({
    meta: [
      { title: "Agricultural Tools — AgriBot Control" },
      { name: "description", content: "Switch grass cutting, spraying, cultivation and digging on or off." },
      { property: "og:title", content: "Agricultural Tools — AgriBot Control" },
      { property: "og:description", content: "Switch grass cutting, spraying, cultivation and digging on or off." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MechanismsPage,
});

function MechanismsPage() {
  const { isOnline } = useRobot();
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Agricultural tools</h1>
        <p className="text-sm text-muted-foreground">
          {isOnline ? "A tool shows ON only after the robot confirms it." : "Connect to the robot to use these controls."}
        </p>
      </div>
      <div className="space-y-4">
        {MECHANISM_KEYS.map((k) => (
          <MechanismCard key={k} id={k} />
        ))}
      </div>
    </>
  );
}
