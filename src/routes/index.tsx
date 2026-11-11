import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Cpu, Gamepad2, Gauge, Tractor } from "lucide-react";

import robotImg from "@/assets/robot-field.jpg";
import { EmergencyStop } from "@/components/robot/EmergencyStop";
import { LastUpdated } from "@/components/robot/LastUpdated";
import { MECHANISMS } from "@/components/robot/meta";
import { SensorTile } from "@/components/robot/SensorTile";
import { useSensorViews } from "@/components/robot/useSensorViews";
import { cn } from "@/lib/utils";
import { useRobot } from "@/lib/robot/RobotProvider";
import { MECHANISM_KEYS } from "@/lib/robot/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AgriBot Control" },
      { name: "description", content: "Live robot status, ESP32 connection, sensors and quick controls for your agricultural robot." },
      { property: "og:title", content: "Dashboard — AgriBot Control" },
      { property: "og:description", content: "Live robot status, ESP32 connection, sensors and quick controls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { connection, status, baseUrl, isOnline } = useRobot();
  const views = useSensorViews();
  const activeCount = status ? MECHANISM_KEYS.filter((k) => status.mechanisms[k]).length : 0;
  const operating = !isOnline ? "Offline" : (status?.robot ?? "—");

  return (
    <>
      <section className="panel relative overflow-hidden">
        <img src={robotImg} alt="Agricultural robot in crop rows" width={1280} height={768} className="absolute inset-0 h-full w-full object-cover object-[70%_50%]" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative space-y-4 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Field unit 01</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight">Smart Agri Robot</h1>
          </div>
          <dl className="grid max-w-[15rem] grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className={cn("font-semibold capitalize", isOnline ? "text-primary" : "text-destructive")}>{operating}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Active tools</dt>
              <dd className="font-semibold">{isOnline ? `${activeCount} / 4` : "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">ESP32 address</dt>
              <dd className="readout flex items-center gap-1.5 font-semibold">
                <Cpu className="size-3.5 text-muted-foreground" />
                {connection === "demo" ? "Demo robot" : (status?.ip ?? baseUrl?.replace(/^https?:\/\//, "") ?? "Not set")}
              </dd>
            </div>
          </dl>
          <LastUpdated />
        </div>
      </section>

      <EmergencyStop />

      <section aria-labelledby="tools-h">
        <SectionHead id="tools-h" title="Mechanisms" to="/mechanisms" />
        <div className="grid grid-cols-2 gap-3">
          {MECHANISM_KEYS.map((k) => {
            const m = MECHANISMS[k];
            const on = status?.mechanisms[k] === true;
            const Icon = m.icon;
            return (
              <Link key={k} to="/mechanisms" className={cn("panel flex items-center gap-3 p-3.5", on && "shadow-glow")}>
                <Icon className={cn("size-5", on ? "text-primary" : "text-muted-foreground")} />
                <span className="flex-1 text-sm font-semibold">{m.title}</span>
                <span className={cn("text-[10px] font-bold", on ? "text-primary" : "text-muted-foreground")}>{on ? "ON" : "OFF"}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="sensors-h">
        <SectionHead id="sensors-h" title="Live sensors" to="/sensors" />
        <div className="grid grid-cols-2 gap-3">
          {views.map((v) => (
            <SensorTile key={v.id} view={v} stale={connection === "disconnected"} />
          ))}
        </div>
      </section>

      <section aria-labelledby="quick-h" className="space-y-3">
        <h2 id="quick-h" className="text-lg font-semibold">Quick access</h2>
        <QuickLink to="/arm" icon={Gamepad2} title="Drive & robotic arm" sub="Movement, gripper and lift" />
        <QuickLink to="/mechanisms" icon={Tractor} title="Agricultural tools" sub="Cutting, spraying, cultivation, digging" />
        <QuickLink to="/sensors" icon={Gauge} title="Sensor monitor" sub="Soil, climate, smoke, light, fire" />
      </section>
    </>
  );
}

function SectionHead({ id, title, to }: { id: string; title: string; to: "/mechanisms" | "/sensors" }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 id={id} className="text-lg font-semibold">{title}</h2>
      <Link to={to} className="flex items-center text-xs font-semibold text-primary">
        Open <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, sub }: { to: "/arm" | "/mechanisms" | "/sensors"; icon: typeof Gauge; title: string; sub: string }) {
  return (
    <Link to={to} className="panel flex items-center gap-4 p-4 transition-colors hover:border-primary/40">
      <span className="grid size-11 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{sub}</span>
      </span>
      <ChevronRight className="size-5 text-muted-foreground" />
    </Link>
  );
}
