import { Scissors, Shovel, SprayCan, Sprout, type LucideIcon } from "lucide-react";

import type { MechanismKey } from "@/lib/robot/types";

export const MECHANISMS: Record<MechanismKey, { title: string; blurb: string; icon: LucideIcon }> = {
  grass: { title: "Grass cutting", blurb: "Cutter blade motor", icon: Scissors },
  spraying: { title: "Spraying", blurb: "Pump & nozzles", icon: SprayCan },
  cultivation: { title: "Cultivation", blurb: "Tiller mechanism", icon: Sprout },
  digging: { title: "Digging", blurb: "Digger actuator", icon: Shovel },
};
