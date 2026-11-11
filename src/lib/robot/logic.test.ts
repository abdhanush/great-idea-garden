import { describe, expect, it } from "vitest";

import {
  buildBaseUrl,
  confirmAction,
  confirmMechanism,
  DISCONNECT_AFTER_FAILURES,
  lightLevel,
  MAX_RETRY_DELAY_MS,
  nextPollDelay,
  parseSensors,
  parseStatus,
  sanitizeSettings,
  smokeLevel,
  soilLevel,
} from "./logic";
import { GRIPPER_ACTIONS } from "./types";

describe("ESP32 confirmation rules", () => {
  it("only shows a mechanism ON when the ESP32 confirms state on", () => {
    expect(confirmMechanism({ ok: true, state: "on" }, "grass")).toBe(true);
    expect(confirmMechanism({ ok: true, state: "off" }, "grass")).toBe(false);
  });

  it("treats a reply without ok:true as unconfirmed", () => {
    expect(confirmMechanism({ ok: false, state: "on" }, "spraying")).toBeNull();
    expect(confirmMechanism({ state: "on" }, "spraying")).toBeNull();
    expect(confirmMechanism({ ok: true }, "spraying")).toBeNull();
  });

  it("reports mechanisms OFF unless status says exactly true", () => {
    const s = parseStatus({ mechanisms: { grass: true, spraying: "maybe", digging: 0 } });
    expect(s.mechanisms).toEqual({ grass: true, spraying: false, cultivation: false, digging: false });
  });

  it("confirms gripper actions only from allowed values", () => {
    expect(confirmAction({ ok: true, state: "open" }, GRIPPER_ACTIONS)).toBe("open");
    expect(confirmAction({ ok: true, state: "spin" }, GRIPPER_ACTIONS)).toBeNull();
  });
});

describe("sensor thresholds", () => {
  it("raises a smoke alert at or above the threshold", () => {
    expect(smokeLevel(299, 300)).toBe("normal");
    expect(smokeLevel(300, 300)).toBe("alert");
  });

  it("classifies light bright/dark, honouring inverted modules", () => {
    expect(lightLevel(850, 500, false)).toBe("bright");
    expect(lightLevel(200, 500, false)).toBe("dark");
    expect(lightLevel(850, 500, true)).toBe("dark");
  });

  it("marks soil dry below the dry threshold", () => {
    expect(soilLevel(29, 30)).toBe("dry");
    expect(soilLevel(30, 30)).toBe("moist");
  });

  it("parses the documented sensor payload", () => {
    expect(parseSensors({ soil_moisture: 65, temperature: 29.5, humidity: 72, smoke: 120, light: 850, fire: false })).toEqual({
      soil_moisture: 65,
      temperature: 29.5,
      humidity: 72,
      smoke: 120,
      light: 850,
      fire: false,
    });
  });
});

describe("polling and connection", () => {
  it("polls between 1 and 2 seconds", () => {
    expect(sanitizeSettings({ pollMs: 200 }).pollMs).toBe(1000);
    expect(sanitizeSettings({ pollMs: 9000 }).pollMs).toBe(2000);
    expect(sanitizeSettings({}).pollMs).toBe(1500);
  });

  it("backs off while unreachable but never waits longer than the cap", () => {
    expect(nextPollDelay(0, 1500)).toBe(1500);
    expect(nextPollDelay(2, 1500)).toBe(3000);
    expect(nextPollDelay(10, 1500)).toBe(MAX_RETRY_DELAY_MS);
  });

  it("declares disconnection after two failed polls", () => {
    expect(DISCONNECT_AFTER_FAILURES).toBe(2);
  });

  it("normalises the ESP32 address", () => {
    expect(buildBaseUrl("192.168.4.1")).toBe("http://192.168.4.1");
    expect(buildBaseUrl(" http://192.168.1.50:80/ ")).toBe("http://192.168.1.50");
    expect(buildBaseUrl("")).toBeNull();
  });
});
