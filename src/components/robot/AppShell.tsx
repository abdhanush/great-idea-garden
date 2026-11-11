import { Link } from "@tanstack/react-router";
import { Gamepad2, Gauge, LayoutDashboard, Settings, Tractor } from "lucide-react";
import type { ReactNode } from "react";

import { ConnectionPill } from "./ConnectionPill";
import { EmergencyStop } from "./EmergencyStop";
import { StatusBanners } from "./StatusBanners";

const TABS = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/arm", label: "Drive & Arm", icon: Gamepad2 },
  { to: "/mechanisms", label: "Tools", icon: Tractor },
  { to: "/sensors", label: "Sensors", icon: Gauge },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Tractor className="size-5" />
            </span>
            <span className="font-display text-lg font-bold leading-none">AgriBot</span>
          </Link>
          <ConnectionPill className="ml-auto" />
          <Link
            to="/settings"
            aria-label="Settings"
            className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <Settings className="size-5" />
          </Link>
          <EmergencyStop compact />
        </div>
      </header>

      <main className="flex-1 space-y-5 px-4 pb-32 pt-4">
        <StatusBanners />
        {children}
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-border bg-background/90 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl"
      >
        <ul className="grid grid-cols-4">
          {TABS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: true }}
                className="group flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-semibold text-muted-foreground"
                activeProps={{ className: "text-primary", "aria-current": "page" }}
              >
                <span className="grid h-8 w-14 place-items-center rounded-full transition-colors group-aria-[current=page]:bg-primary/15">
                  <Icon className="size-5" />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
