import { CloudFog, Droplets, Flame, Moon, Sprout, Sun, Thermometer, type LucideIcon } from "lucide-react";

import { clampPercent, lightLevel, smokeLevel, soilLevel } from "@/lib/robot/logic";
import { useRobot } from "@/lib/robot/RobotProvider";

export type Tone = "ok" | "warn" | "danger" | "info" | "idle";

export interface SensorView {
  id: string;
  label: string;
  value: string;
  unit: string;
  status: string;
  tone: Tone;
  icon: LucideIcon;
  percent?: number;
}

const fmt = (v: number | null, digits = 0) => (v === null ? "--" : v.toFixed(digits));

export function useSensorViews(): SensorView[] {
  const { sensors: s, settings } = useRobot();
  const soil = soilLevel(s?.soil_moisture ?? null, settings.soilDryThreshold);
  const smoke = smokeLevel(s?.smoke ?? null, settings.smokeThreshold);
  const light = lightLevel(s?.light ?? null, settings.lightThreshold, settings.lightHigherIsDarker);
  const temp = s?.temperature ?? null;
  const fire = s?.fire ?? null;

  return [
    {
      id: "soil",
      label: "Soil moisture",
      value: fmt(s?.soil_moisture ?? null),
      unit: "%",
      status: soil === "unknown" ? "No reading" : soil === "dry" ? "Dry" : "Moist",
      tone: soil === "unknown" ? "idle" : soil === "dry" ? "warn" : "ok",
      icon: Sprout,
      percent: clampPercent(s?.soil_moisture ?? null),
    },
    {
      id: "temperature",
      label: "Temperature",
      value: fmt(temp, 1),
      unit: "°C",
      status: temp === null ? "No reading" : temp >= settings.tempHighThreshold ? "High" : "Normal",
      tone: temp === null ? "idle" : temp >= settings.tempHighThreshold ? "warn" : "ok",
      icon: Thermometer,
    },
    {
      id: "humidity",
      label: "Humidity",
      value: fmt(s?.humidity ?? null),
      unit: "% RH",
      status: s?.humidity == null ? "No reading" : "Relative",
      tone: s?.humidity == null ? "idle" : "info",
      icon: Droplets,
      percent: clampPercent(s?.humidity ?? null),
    },
    {
      id: "smoke",
      label: "Smoke / gas",
      value: fmt(s?.smoke ?? null),
      unit: "ADC",
      status: smoke === "unknown" ? "No reading" : smoke === "alert" ? "ALERT" : "Normal",
      tone: smoke === "unknown" ? "idle" : smoke === "alert" ? "danger" : "ok",
      icon: CloudFog,
    },
    {
      id: "light",
      label: "Light",
      value: fmt(s?.light ?? null),
      unit: "ADC",
      status: light === "unknown" ? "No reading" : light === "bright" ? "Day · bright" : "Night · dark",
      tone: light === "unknown" ? "idle" : light === "bright" ? "warn" : "info",
      icon: light === "dark" ? Moon : Sun,
    },
    {
      id: "fire",
      label: "Fire",
      value: fire === null ? "--" : fire ? "FIRE" : "Clear",
      unit: "",
      status: fire === null ? "No reading" : fire ? "Fire detected" : "No fire detected",
      tone: fire === null ? "idle" : fire ? "danger" : "ok",
      icon: Flame,
    },
  ];
}

export const TONE_TEXT: Record<Tone, string> = {
  ok: "text-primary",
  warn: "text-warning",
  danger: "text-destructive",
  info: "text-info",
  idle: "text-muted-foreground",
};

export const TONE_CHIP: Record<Tone, string> = {
  ok: "bg-primary/15 text-primary",
  warn: "bg-warning/15 text-warning",
  danger: "bg-destructive/20 text-destructive",
  info: "bg-info/15 text-info",
  idle: "bg-muted text-muted-foreground",
};
