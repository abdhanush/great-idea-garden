import { ALL_OFF } from "./logic";
import type { RobotClient } from "./client";
import type { GripperAction, LiftAction, MechanismKey, MoveDirection } from "./types";

/**
 * Preview-only robot that lives in the browser. Used only when Demo mode is switched on in
 * Settings, so the screens can be explored without hardware. Never mixed with a real robot.
 */
export function createDemoClient(): RobotClient {
  const state = {
    mechanisms: { ...ALL_OFF },
    gripper: "stop" as GripperAction,
    lift: "stop" as LiftAction,
    move: "stop" as MoveDirection,
  };
  let t = 0;
  const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 220));
  const status = () => ({
    ok: true,
    robot: state.move !== "stop" || Object.values(state.mechanisms).some(Boolean) ? "working" : "idle",
    ip: "demo",
    mechanisms: { ...state.mechanisms },
    gripper: state.gripper,
    lift: state.lift,
    move: state.move,
  });
  return {
    baseUrl: "demo",
    getStatus: () => wait(status()),
    getSensors: () => {
      t += 1;
      return wait({
        soil_moisture: Math.round(58 + 8 * Math.sin(t / 9)),
        temperature: +(29 + Math.sin(t / 14)).toFixed(1),
        humidity: Math.round(70 + 4 * Math.cos(t / 11)),
        smoke: Math.round(140 + 40 * Math.sin(t / 7)),
        light: Math.round(760 + 90 * Math.sin(t / 20)),
        fire: false,
      });
    },
    setMechanism: (key: MechanismKey, on: boolean) => {
      state.mechanisms[key] = on;
      return wait({ ok: true, state: on ? "on" : "off" });
    },
    gripper: (a) => ((state.gripper = a), wait({ ok: true, state: a })),
    lift: (a) => ((state.lift = a), wait({ ok: true, state: a })),
    move: (d) => ((state.move = d), wait({ ok: true, state: d })),
    emergencyStop: () => {
      state.mechanisms = { ...ALL_OFF };
      state.gripper = "stop";
      state.lift = "stop";
      state.move = "stop";
      return wait(status());
    },
  };
}
