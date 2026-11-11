import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Save, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createHttpClient } from "@/lib/robot/client";
import { POLL_OPTIONS_MS } from "@/lib/robot/logic";
import { useRobot } from "@/lib/robot/RobotProvider";
import type { RobotSettings } from "@/lib/robot/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AgriBot Control" },
      { name: "description", content: "Set the ESP32 IP address, refresh rate and sensor alert thresholds." },
      { property: "og:title", content: "Settings — AgriBot Control" },
      { property: "og:description", content: "Set the ESP32 IP address, refresh rate and sensor alert thresholds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const ENDPOINTS = [
  ["GET", "/api/status", "—"],
  ["GET", "/api/sensors", "—"],
  ["POST", "/api/control/grass", '{"state":"on|off"}'],
  ["POST", "/api/control/spraying", '{"state":"on|off"}'],
  ["POST", "/api/control/cultivation", '{"state":"on|off"}'],
  ["POST", "/api/control/digging", '{"state":"on|off"}'],
  ["POST", "/api/control/gripper", '{"action":"open|close|stop"}'],
  ["POST", "/api/control/lift", '{"action":"up|down|stop"}'],
  ["POST", "/api/control/move", '{"direction":"forward|backward|left|right|stop"}'],
  ["POST", "/api/control/stop", "emergency stop"],
];

function SettingsPage() {
  const { settings, settingsReady, updateSettings } = useRobot();
  const [draft, setDraft] = useState<RobotSettings>(settings);
  const [testing, setTesting] = useState(false);
  useEffect(() => setDraft(settings), [settings, settingsReady]);

  const set = <K extends keyof RobotSettings>(k: K, v: RobotSettings[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const numField = (k: keyof RobotSettings) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);

  const test = async () => {
    const c = createHttpClient(draft.host);
    if (!c) {
      toast.error("That IP address doesn't look right");
      return;
    }
    setTesting(true);
    try {
      await c.getStatus();
      toast.success("Robot reachable", { description: c.baseUrl });
    } catch (e) {
      toast.error("Robot not reachable", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setTesting(false);
    }
  };

  const save = () => {
    updateSettings(draft);
    toast.success("Settings saved");
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="panel space-y-4 p-5">
        <h2 className="font-semibold">Robot connection</h2>
        <div className="space-y-2">
          <Label htmlFor="host">ESP32 IP address</Label>
          <Input id="host" inputMode="url" className="readout h-12 rounded-xl text-base" placeholder="192.168.4.1" value={draft.host} onChange={(e) => set("host", e.target.value)} />
          <p className="text-xs text-muted-foreground">Join the robot's Wi-Fi first. Default access-point address is 192.168.4.1.</p>
        </div>
        <div className="space-y-2">
          <Label>Refresh rate</Label>
          <div className="grid grid-cols-3 gap-2">
            {POLL_OPTIONS_MS.map((ms) => (
              <Button key={ms} variant="pad" className="h-11 rounded-xl" data-active={draft.pollMs === ms} onClick={() => set("pollMs", ms)}>
                {(ms / 1000).toFixed(1)}s
              </Button>
            ))}
          </div>
        </div>
        <Button variant="soft" size="xl" className="w-full" onClick={test} disabled={testing || draft.demoMode}>
          {testing ? <Loader2 className="animate-spin" /> : <Wifi />} Test connection
        </Button>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="font-semibold">Sensor thresholds</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field id="smoke" label="Smoke alert at (ADC)" value={draft.smokeThreshold} onChange={numField("smokeThreshold")} />
          <Field id="light" label="Bright / dark at (ADC)" value={draft.lightThreshold} onChange={numField("lightThreshold")} />
          <Field id="soil" label="Soil dry below (%)" value={draft.soilDryThreshold} onChange={numField("soilDryThreshold")} />
          <Field id="temp" label="Heat warning at (°C)" value={draft.tempHighThreshold} onChange={numField("tempHighThreshold")} />
        </div>
        <ToggleRow
          id="ldr"
          label="Higher light reading means darker"
          sub="Turn on if your light module reads high values at night."
          checked={draft.lightHigherIsDarker}
          onChange={(v) => set("lightHigherIsDarker", v)}
        />
      </section>

      <section className={cn("panel space-y-3 p-5", draft.demoMode && "border-info/50")}>
        <ToggleRow
          id="demo"
          label="Demo mode"
          sub="Explore the app without hardware. Readings are made up and no commands reach a robot. Turn off to use your real robot."
          checked={draft.demoMode}
          onChange={(v) => set("demoMode", v)}
        />
      </section>

      <Button variant="power" size="xl" className="w-full" onClick={save}>
        <Save /> Save settings
      </Button>

      <details className="panel p-5 text-sm">
        <summary className="cursor-pointer font-semibold">ESP32 commands used by this app</summary>
        <ul className="mt-3 space-y-2">
          {ENDPOINTS.map(([m, path, body]) => (
            <li key={path} className="readout text-xs">
              <span className={cn("mr-2 font-bold", m === "GET" ? "text-info" : "text-primary")}>{m}</span>
              {path}
              <span className="block text-muted-foreground">{body}</span>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}

function Field({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Input id={id} type="number" inputMode="decimal" className="readout h-11 rounded-xl" value={Number.isFinite(value) ? value : ""} onChange={onChange} />
    </div>
  );
}

function ToggleRow({ id, label, sub, checked, onChange }: { id: string; label: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor={id} className="font-semibold">{label}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
