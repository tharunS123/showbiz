"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/notifications?unreadOnly=true");
        if (!res.ok) {
          if (!cancelled) setCount(0);
          return;
        }
        const data: { notifications?: unknown } = await res.json();
        const list = Array.isArray(data.notifications) ? data.notifications : [];
        if (!cancelled) setCount(list.length);
      } catch {
        if (!cancelled) setCount(0);
      }
    }

    load();
    const id = setInterval(load, 60_000);
    const onUpdate = () => {
      load();
    };
    window.addEventListener("showbiz-notifications-updated", onUpdate);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("showbiz-notifications-updated", onUpdate);
    };
  }, []);

  const showBadge = count !== null && count > 0;

  return (
    <Link href="/notifications">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative shrink-0"
        aria-label={
          showBadge
            ? `Notifications, ${count} unread`
            : "Notifications"
        }
      >
        <Bell className="h-4 w-4" />
        {showBadge && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
            {count! > 99 ? "99+" : count}
          </span>
        )}
      </Button>
    </Link>
  );
}
