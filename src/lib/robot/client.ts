import { buildBaseUrl, isPrivateHost, REQUEST_TIMEOUT_MS } from "./logic";
import type { GripperAction, LiftAction, MechanismKey, MoveDirection } from "./types";

export interface RobotClient {
  baseUrl: string;
  getStatus(): Promise<unknown>;
  getSensors(): Promise<unknown>;
  setMechanism(key: MechanismKey, on: boolean): Promise<unknown>;
  gripper(action: GripperAction): Promise<unknown>;
  lift(action: LiftAction): Promise<unknown>;
  move(direction: MoveDirection): Promise<unknown>;
  emergencyStop(): Promise<unknown>;
}

export class RobotRequestError extends Error {
  constructor(
    message: string,
    public kind: "timeout" | "network" | "http" | "parse",
  ) {
    super(message);
  }
}

export function createHttpClient(host: string): RobotClient | null {
  const baseUrl = buildBaseUrl(host);
  if (!baseUrl) return null;
  const hostname = new URL(baseUrl).hostname;
  const local = isPrivateHost(hostname);

  async function call(path: string, body?: Record<string, string>): Promise<unknown> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const init: RequestInit & { targetAddressSpace?: string } = {
        method: body ? "POST" : "GET",
        signal: ctrl.signal,
        cache: "no-store",
        // text/plain keeps this a "simple" CORS request (no preflight) — the ESP32 parses the JSON body.
        headers: body ? { "Content-Type": "text/plain;charset=UTF-8" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      };
      // Lets secure pages reach a robot on the local Wi-Fi (Chrome Local Network Access).
      if (local) init.targetAddressSpace = "local";
      let res: Response;
      try {
        res = await fetch(`${baseUrl}${path}`, init);
      } catch {
        if (ctrl.signal.aborted) throw new RobotRequestError("Robot did not respond in time", "timeout");
        throw new RobotRequestError("Cannot reach the robot on this network", "network");
      }
      if (!res.ok) throw new RobotRequestError(`Robot replied with error ${res.status}`, "http");
      try {
        return await res.json();
      } catch {
        throw new RobotRequestError("Robot sent an unreadable reply", "parse");
      }
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    baseUrl,
    getStatus: () => call("/api/status"),
    getSensors: () => call("/api/sensors"),
    setMechanism: (key, on) => call(`/api/control/${key}`, { state: on ? "on" : "off" }),
    gripper: (action) => call("/api/control/gripper", { action }),
    lift: (action) => call("/api/control/lift", { action }),
    move: (direction) => call("/api/control/move", { direction }),
    emergencyStop: () => call("/api/control/stop", { action: "stop" }),
  };
}
