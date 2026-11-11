export const MECHANISM_KEYS = ["grass", "spraying", "cultivation", "digging"] as const;
export type MechanismKey = (typeof MECHANISM_KEYS)[number];

export const GRIPPER_ACTIONS = ["open", "close", "stop"] as const;
export type GripperAction = (typeof GRIPPER_ACTIONS)[number];

export const LIFT_ACTIONS = ["up", "down", "stop"] as const;
export type LiftAction = (typeof LIFT_ACTIONS)[number];

export const MOVE_DIRECTIONS = ["forward", "backward", "left", "right", "stop"] as const;
export type MoveDirection = (typeof MOVE_DIRECTIONS)[number];

export interface SensorReadings {
  soil_moisture: number | null;
  temperature: number | null;
  humidity: number | null;
  smoke: number | null;
  light: number | null;
  fire: boolean | null;
}

export interface RobotStatus {
  robot: string;
  ip: string | null;
  mechanisms: Record<MechanismKey, boolean>;
  gripper: GripperAction | null;
  lift: LiftAction | null;
  move: MoveDirection | null;
}

export type ConnectionState = "unconfigured" | "connecting" | "connected" | "disconnected" | "demo";

export interface RobotSettings {
  /** ESP32 address, e.g. "192.168.4.1" or "192.168.1.50:80". */
  host: string;
  pollMs: number;
  /** Smoke ADC value at or above which an alert is raised. */
  smokeThreshold: number;
  /** Light ADC value that separates bright from dark. */
  lightThreshold: number;
  /** Many LDR modules read higher values in the dark. */
  lightHigherIsDarker: boolean;
  /** Soil moisture % below which the soil is reported dry. */
  soilDryThreshold: number;
  /** Temperature °C at or above which a heat warning is shown. */
  tempHighThreshold: number;
  /** Local-only preview mode. Never used when talking to a real robot. */
  demoMode: boolean;
}
