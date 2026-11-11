import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { createHttpClient, type RobotClient } from "./client";
import { createDemoClient } from "./demo";
import {
  ALL_OFF,
  COMMAND_COOLDOWN_MS,
  confirmAction,
  confirmMechanism,
  DEFAULT_SETTINGS,
  DISCONNECT_AFTER_FAILURES,
  nextPollDelay,
  parseSensors,
  parseStatus,
  sanitizeSettings,
} from "./logic";
import {
  GRIPPER_ACTIONS,
  LIFT_ACTIONS,
  MOVE_DIRECTIONS,
  type ConnectionState,
  type GripperAction,
  type LiftAction,
  type MechanismKey,
  type MoveDirection,
  type RobotSettings,
  type RobotStatus,
  type SensorReadings,
} from "./types";

const STORAGE_KEY = "agribot.settings.v1";

interface RobotContextValue {
  settings: RobotSettings;
  settingsReady: boolean;
  updateSettings: (next: RobotSettings) => void;
  connection: ConnectionState;
  isOnline: boolean;
  baseUrl: string | null;
  status: RobotStatus | null;
  sensors: SensorReadings | null;
  lastUpdate: number | null;
  lastError: string | null;
  pending: PendingMap;
  reconnect: () => void;
  setMechanism: (key: MechanismKey, on: boolean) => Promise<void>;
  gripper: (action: GripperAction) => Promise<void>;
  lift: (action: LiftAction) => Promise<void>;
  move: (direction: MoveDirection) => Promise<void>;
  emergencyStop: () => Promise<void>;
}

export type PendingKey = "estop" | "gripper" | "lift" | "move" | "move:stop" | `mech:${MechanismKey}`;
type PendingMap = Partial<Record<PendingKey, boolean>>;

const RobotContext = createContext<RobotContextValue | null>(null);

export function useRobot() {
  const ctx = useContext(RobotContext);
  if (!ctx) throw new Error("useRobot must be used inside RobotProvider");
  return ctx;
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Unknown error");

export function RobotProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<RobotSettings>(DEFAULT_SETTINGS);
  const [settingsReady, setSettingsReady] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [status, setStatus] = useState<RobotStatus | null>(null);
  const [sensors, setSensors] = useState<SensorReadings | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingMap>({});
  const [nonce, setNonce] = useState(0);
  const pendingRef = useRef(new Set<PendingKey>());
  const lastSentRef = useRef<Partial<Record<PendingKey, number>>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings(sanitizeSettings(JSON.parse(raw)));
    } catch {
      /* keep defaults */
    }
    setSettingsReady(true);
  }, []);

  const updateSettings = useCallback((next: RobotSettings) => {
    const clean = sanitizeSettings(next);
    setSettings(clean);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  }, []);

  const client: RobotClient | null = useMemo(() => {
    if (!settingsReady) return null;
    return settings.demoMode ? createDemoClient() : createHttpClient(settings.host);
  }, [settingsReady, settings.demoMode, settings.host]);

  const isOnline = connection === "connected" || connection === "demo";

  // Poll status + sensors; back off while unreachable and keep retrying (auto-reconnect).
  useEffect(() => {
    if (!settingsReady) return;
    if (!client) {
      setConnection("unconfigured");
      setStatus(null);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    const demo = settings.demoMode;
    setConnection(demo ? "demo" : "connecting");
    setStatus(null);
    setSensors(null);
    setLastUpdate(null);

    const tick = async () => {
      try {
        const [s, se] = await Promise.all([client.getStatus(), client.getSensors()]);
        if (cancelled) return;
        failures = 0;
        setStatus(parseStatus(s));
        setSensors(parseSensors(se));
        setLastUpdate(Date.now());
        setLastError(null);
        setConnection(demo ? "demo" : "connected");
      } catch (e) {
        if (cancelled) return;
        failures += 1;
        setLastError(errMsg(e));
        if (failures >= DISCONNECT_AFTER_FAILURES) {
          setConnection("disconnected");
          // Safe default: never keep showing anything as running once the link is lost.
          setStatus(null);
        }
      }
      if (!cancelled) timer = setTimeout(tick, nextPollDelay(failures, settings.pollMs));
    };
    void tick();

    const wake = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        void tick();
      }
    };
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [client, settingsReady, settings.pollMs, settings.demoMode, nonce]);

  const run = useCallback(
    async (key: PendingKey, label: string, fn: (c: RobotClient) => Promise<unknown>, onReply: (json: unknown) => void, opts?: { force?: boolean }) => {
      if (!client) {
        toast.error("Set the robot's IP address first");
        return;
      }
      if (!opts?.force && !isOnline) {
        toast.error("Robot disconnected", { description: "Command not sent. Reconnect and try again." });
        return;
      }
      if (pendingRef.current.has(key)) return;
      const last = lastSentRef.current[key] ?? 0;
      if (!opts?.force && Date.now() - last < COMMAND_COOLDOWN_MS) return;
      lastSentRef.current[key] = Date.now();
      pendingRef.current.add(key);
      setPending((p) => ({ ...p, [key]: true }));
      try {
        const json = await fn(client);
        onReply(json);
      } catch (e) {
        toast.error(`${label} failed`, { description: errMsg(e) });
      } finally {
        pendingRef.current.delete(key);
        setPending((p) => {
          const { [key]: _omit, ...rest } = p;
          return rest;
        });
      }
    },
    [client, isOnline],
  );

  const unconfirmed = (label: string) =>
    toast.warning(`${label}: no confirmation`, { description: "The robot did not confirm. State unchanged." });

  const setMechanism = useCallback(
    (key: MechanismKey, on: boolean) =>
      run(`mech:${key}`, `${key} ${on ? "ON" : "OFF"}`, (c) => c.setMechanism(key, on), (json) => {
        const confirmed = confirmMechanism(json, key);
        if (confirmed === null) {
          unconfirmed(key);
          return;
        }
        setStatus((s) => (s ? { ...s, mechanisms: { ...s.mechanisms, [key]: confirmed } } : s));
      }),
    [run],
  );

  const gripper = useCallback(
    (action: GripperAction) =>
      run("gripper", `Gripper ${action}`, (c) => c.gripper(action), (json) => {
        const confirmed = confirmAction(json, GRIPPER_ACTIONS);
        if (!confirmed) {
          unconfirmed("Gripper");
          return;
        }
        setStatus((s) => (s ? { ...s, gripper: confirmed } : s));
      }),
    [run],
  );

  const lift = useCallback(
    (action: LiftAction) =>
      run("lift", `Lift ${action}`, (c) => c.lift(action), (json) => {
        const confirmed = confirmAction(json, LIFT_ACTIONS);
        if (!confirmed) {
          unconfirmed("Lift");
          return;
        }
        setStatus((s) => (s ? { ...s, lift: confirmed } : s));
      }),
    [run],
  );

  const move = useCallback(
    (direction: MoveDirection) =>
      run(direction === "stop" ? "move:stop" : "move", `Move ${direction}`, (c) => c.move(direction), (json) => {
        const confirmed = confirmAction(json, MOVE_DIRECTIONS);
        if (!confirmed) {
          unconfirmed("Movement");
          return;
        }
        setStatus((s) => (s ? { ...s, move: confirmed } : s));
      }, { force: direction === "stop" && isOnline }),
    [run, isOnline],
  );

  // Always attempted, even while the link looks down — it is the safety control.
  const emergencyStop = useCallback(
    () =>
      run("estop", "Emergency stop", (c) => c.emergencyStop(), (json) => {
        const ok = typeof json === "object" && json !== null && (json as { ok?: unknown }).ok === true;
        if (!ok) {
          unconfirmed("Emergency stop");
          return;
        }
        setStatus((s) =>
          s ? { ...s, robot: "stopped", mechanisms: { ...ALL_OFF }, gripper: "stop", lift: "stop", move: "stop" } : s,
        );
        toast.success("Emergency stop confirmed", { description: "All motors and mechanisms stopped." });
      }, { force: true }),
    [run],
  );

  const value: RobotContextValue = {
    settings,
    settingsReady,
    updateSettings,
    connection,
    isOnline,
    baseUrl: client?.baseUrl ?? null,
    status,
    sensors,
    lastUpdate,
    lastError,
    pending,
    reconnect: () => setNonce((n) => n + 1),
    setMechanism,
    gripper,
    lift,
    move,
    emergencyStop,
  };

  return <RobotContext.Provider value={value}>{children}</RobotContext.Provider>;
}
