import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronsDown, ChevronsUp, Grab, Hand, Loader2, Square, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRobot } from "@/lib/robot/RobotProvider";
import type { GripperAction, LiftAction, MoveDirection } from "@/lib/robot/types";

export const Route = createFileRoute("/arm")({
  head: () => ({
    meta: [
      { title: "Drive & Arm — AgriBot Control" },
      { name: "description", content: "Drive the robot and control the gripper and lifting mechanism." },
      { property: "og:title", content: "Drive & Arm — AgriBot Control" },
      { property: "og:description", content: "Drive the robot and control the gripper and lifting mechanism." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArmPage,
});

function ArmPage() {
  const { status, isOnline, pending, move, gripper, lift } = useRobot();
  const moving = pending.move || pending["move:stop"];

  const pad = (dir: MoveDirection, Icon: LucideIcon, label: string) => (
    <Button
      variant="pad"
      className="aspect-square h-auto w-full [&_svg]:size-8"
      data-active={status?.move === dir}
      disabled={!isOnline || (dir !== "stop" && !!pending.move)}
      onClick={() => move(dir)}
      aria-label={label}
    >
      <Icon />
    </Button>
  );

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Drive & robotic arm</h1>
        <p className="text-sm text-muted-foreground">Tap a direction to drive. Tap the centre to stop.</p>
      </div>

      <section className="panel p-5" aria-label="Movement">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Movement</h2>
          <StateChip value={status?.move} busy={!!moving} />
        </div>
        <div className="mx-auto grid max-w-[17rem] grid-cols-3 gap-3">
          <span />
          {pad("forward", ArrowUp, "Move forward")}
          <span />
          {pad("left", ArrowLeft, "Turn left")}
          <Button
            variant="emergency"
            className="aspect-square h-auto w-full rounded-2xl [&_svg]:size-7"
            disabled={!isOnline || !!pending["move:stop"]}
            onClick={() => move("stop")}
            aria-label="Stop driving"
          >
            {pending["move:stop"] ? <Loader2 className="animate-spin" /> : <Square />}
          </Button>
          {pad("right", ArrowRight, "Turn right")}
          <span />
          {pad("backward", ArrowDown, "Move backward")}
          <span />
        </div>
      </section>

      <ActionGroup<GripperAction>
        title="Gripper"
        current={status?.gripper}
        busy={!!pending.gripper}
        disabled={!isOnline}
        onAction={gripper}
        actions={[
          { id: "open", label: "Open", icon: Hand },
          { id: "close", label: "Close", icon: Grab },
          { id: "stop", label: "Stop", icon: Square },
        ]}
      />

      <ActionGroup<LiftAction>
        title="Lifting mechanism"
        current={status?.lift}
        busy={!!pending.lift}
        disabled={!isOnline}
        onAction={lift}
        actions={[
          { id: "up", label: "Up", icon: ChevronsUp },
          { id: "down", label: "Down", icon: ChevronsDown },
          { id: "stop", label: "Stop", icon: Square },
        ]}
      />
    </>
  );
}

function StateChip({ value, busy }: { value?: string | null | undefined; busy: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
        busy ? "bg-warning/15 text-warning" : value && value !== "stop" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {busy ? "Sending" : (value ?? "Unknown")}
    </span>
  );
}

function ActionGroup<T extends string>({
  title,
  current,
  busy,
  disabled,
  onAction,
  actions,
}: {
  title: string;
  current?: T | null | undefined;
  busy: boolean;
  disabled: boolean;
  onAction: (a: T) => void;
  actions: { id: T; label: string; icon: LucideIcon }[];
}) {
  return (
    <section className="panel p-5" aria-label={title}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <StateChip value={current} busy={busy} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {actions.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={id === "stop" ? "soft" : "pad"}
            data-active={current === id && id !== "stop"}
            className="h-20 flex-col gap-1.5 [&_svg]:size-6"
            disabled={disabled || busy}
            onClick={() => onAction(id)}
            aria-label={`${title} ${label}`}
          >
            <Icon />
            <span className="text-sm font-semibold">{label}</span>
          </Button>
        ))}
      </div>
    </section>
  );
}
