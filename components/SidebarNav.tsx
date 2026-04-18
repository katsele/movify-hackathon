"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CalendarRange,
  Users,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/forecast", label: "Forecast", icon: CalendarRange },
  { href: "/bench", label: "Bench", icon: Users },
  { href: "/signals", label: "Signals", icon: Radio },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 border-r border-neutral-200 bg-white flex flex-col">
      <div className="h-14 flex items-center px-5 border-b border-neutral-200">
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight text-brand-700 tracking-[-0.005em]">
            Azimuth
          </span>
          <span className="text-[11px] text-neutral-500 leading-tight">
            Skills demand forecaster
          </span>
        </div>
      </div>
      <nav className="flex-1 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                isActive
                  ? "bg-brand-700 text-white"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-neutral-200 text-[11px] text-neutral-500">
        <div>Movify workspace</div>
        <div className="font-medium text-neutral-700">Sebastiaan</div>
      </div>
    </aside>
  );
}
