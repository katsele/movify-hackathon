"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, CalendarRange, Users, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/forecast", label: "Forecast", icon: CalendarRange },
  { href: "/bench", label: "Bench", icon: Users },
  { href: "/signals", label: "Signals", icon: Radio },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 border-r bg-white flex flex-col">
      <div className="h-14 flex items-center px-5 border-b">
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">
            Movify
          </span>
          <span className="text-[11px] text-muted-foreground leading-tight">
            Skills Forecaster
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
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t text-[11px] text-muted-foreground">
        <div>Signed in as</div>
        <div className="font-medium text-foreground">Sebastiaan</div>
      </div>
    </aside>
  );
}
