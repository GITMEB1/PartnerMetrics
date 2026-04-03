"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, LayoutGrid, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app/today", label: "Today", icon: CalendarDays },
  { href: "/app/history", label: "History", icon: Clock },
  { href: "/app/metrics", label: "Metrics", icon: LayoutGrid },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm safe-bottom md:static md:border-t-0 md:border-r md:w-16">
      <div className="flex items-center justify-around py-2 md:flex-col md:gap-4 md:py-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span className="md:hidden">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
