import {
  GRIPPER_ACTIONS,
  LIFT_ACTIONS,
  MECHANISM_KEYS,
  MOVE_DIRECTIONS,
  type MechanismKey,
  type RobotSettings,
  type RobotStatus,
  type SensorReadings,
} from "./types";

export const DEFAULT_SETTINGS: RobotSettings = {
  host: "192.168.4.1",
  pollMs: 1500,
  smokeThreshold: 300,
  lightThreshold: 500,
  lightHigherIsDarker: false,
  soilDryThreshold: 30,
  tempHighThreshold: 40,
  demoMode: false,
};

export const POLL_OPTIONS_MS = [1000, 1500, 2000] as const;
/** Consecutive failed polls before the robot is shown as disconnected. */
export const DISCONNECT_AFTER_FAILURES = 2;
/** Longest wait between reconnect attempts. */
export const MAX_RETRY_DELAY_MS = 5000;
/** Same command is ignored if re-sent within this window. */
export const COMMAND_COOLDOWN_MS = 400;
export const REQUEST_TIMEOUT_MS = 3000;

export const ALL_OFF: Record<MechanismKey, boolean> = {
  grass: false,
  spraying: false,
  cultivation: false,
  digging: false,
};

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function bool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1" || v === "on" || v === "true") return true;
  if (v === 0 || v === "0" || v === "off" || v === "false") return false;
  return null;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  return typeof v === "string" && (allowed as readonly string[]).includes(v.toLowerCase())
    ? (v.toLowerCase() as T)
    : null;
}

export function parseSensors(json: unknown): SensorReadings {
  const o = isObj(json) ? json : {};
  return {
    soil_moisture: num(o.soil_moisture),
    temperature: num(o.temperature),
    humidity: num(o.humidity),
    smoke: num(o.smoke),
    light: num(o.light),
    fire: bool(o.fire),
  };
}

/** Mechanisms are only ON when the ESP32 explicitly reports true; anything else is OFF. */
export function parseStatus(json: unknown): RobotStatus {
  const o = isObj(json) ? json : {};
  const m = isObj(o.mechanisms) ? o.mechanisms : o;
  const mechanisms = { ...ALL_OFF };
  for (const key of MECHANISM_KEYS) mechanisms[key] = bool(m[key]) === true;
  return {
    robot: typeof o.robot === "string" && o.robot ? o.robot : "online",
    ip: typeof o.ip === "string" && o.ip ? o.ip : null,
    mechanisms,
    gripper: oneOf(o.gripper, GRIPPER_ACTIONS),
    lift: oneOf(o.lift, LIFT_ACTIONS),
    move: oneOf(o.move, MOVE_DIRECTIONS),
  };
}

/**
 * Reads the ESP32's reply to an ON/OFF command. Returns the confirmed state, or null when the
 * reply does not confirm anything (in which case the UI must not change).
 */
export function confirmMechanism(json: unknown, key: MechanismKey): boolean | null {
  if (!isObj(json) || json.ok !== true) return null;
  const direct = bool(json.state);
  if (direct !== null) return direct;
  if (isObj(json.mechanisms)) return bool(json.mechanisms[key]);
  return null;
}

/** Reads the ESP32's reply to a gripper/lift/move command. */
export function confirmAction<T extends string>(json: unknown, allowed: readonly T[]): T | null {
  if (!isObj(json) || json.ok !== true) return null;
  return oneOf(json.state, allowed) ?? oneOf(json.action, allowed);
}

export type SmokeLevel = "normal" | "alert" | "unknown";
export function smokeLevel(value: number | null, threshold: number): SmokeLevel {
  if (value === null) return "unknown";
  return value >= threshold ? "alert" : "normal";
}

export type LightLevel = "bright" | "dark" | "unknown";
export function lightLevel(value: number | null, threshold: number, higherIsDarker: boolean): LightLevel {
  if (value === null) return "unknown";
  const above = value >= threshold;
  return above !== higherIsDarker ? "bright" : "dark";
}

export type SoilLevel = "dry" | "moist" | "unknown";
export function soilLevel(value: number | null, dryThreshold: number): SoilLevel {
  if (value === null) return "unknown";
  return value < dryThreshold ? "dry" : "moist";
}

export function clampPercent(value: number | null): number {
  if (value === null) return 0;
  return Math.max(0, Math.min(100, value));
}

/** Normalises "192.168.4.1" / "http://192.168.4.1/" into "http://192.168.4.1". */
export function buildBaseUrl(host: string): string | null {
  const trimmed = host.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  try {
    const url = new URL(withProto);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export function isPrivateHost(hostname: string): boolean {
  return (
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    hostname.endsWith(".local")
  );
}

/** Normal polling rate while healthy; backs off (capped) while the robot is unreachable. */
export function nextPollDelay(failures: number, baseMs: number): number {
  if (failures <= 0) return baseMs;
  return Math.min(baseMs * 2 ** (failures - 1), MAX_RETRY_DELAY_MS);
}

export function sanitizeSettings(input: unknown): RobotSettings {
  const o = isObj(input) ? input : {};
  const n = (v: unknown, d: number) => num(v) ?? d;
  const pollMs = n(o.pollMs, DEFAULT_SETTINGS.pollMs);
  return {
    host: typeof o.host === "string" ? o.host : DEFAULT_SETTINGS.host,
    pollMs: Math.max(1000, Math.min(2000, pollMs)),
    smokeThreshold: n(o.smokeThreshold, DEFAULT_SETTINGS.smokeThreshold),
    lightThreshold: n(o.lightThreshold, DEFAULT_SETTINGS.lightThreshold),
    lightHigherIsDarker: o.lightHigherIsDarker === true,
    soilDryThreshold: n(o.soilDryThreshold, DEFAULT_SETTINGS.soilDryThreshold),
    tempHighThreshold: n(o.tempHighThreshold, DEFAULT_SETTINGS.tempHighThreshold),
    demoMode: o.demoMode === true,
  };
}
