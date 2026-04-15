"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Bell, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserNotification } from "@/lib/db/notifications";

function formatTimeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.floor((now - then) / 1000);
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function notificationIcon(type: string) {
  if (type === "new_season") {
    return Sparkles;
  }
  return Bell;
}

export function NotificationCard({
  notification: initial,
}: {
  notification: UserNotification;
}) {
  const router = useRouter();
  const [notification, setNotification] = useState(initial);
  const [dismissed, setDismissed] = useState(false);
  const [pending, setPending] = useState<"read" | "dismiss" | null>(null);

  const Icon = notificationIcon(notification.type);

  async function patch(action: "read" | "dismiss") {
    setPending(action);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notification.id, action }),
      });
      if (!res.ok) return;
      if (action === "dismiss") {
        setDismissed(true);
      } else {
        setNotification((n) => ({ ...n, read: true }));
      }
      router.refresh();
      window.dispatchEvent(new CustomEvent("showbiz-notifications-updated"));
    } finally {
      setPending(null);
    }
  }

  if (dismissed) {
    return null;
  }

  const titleContent = (
    <span className="font-medium leading-tight">
      {notification.title ?? notification.type}
    </span>
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-border p-4 flex gap-3 transition-colors",
        !notification.read && "bg-muted/40 border-primary/20"
      )}
    >
      <div className="shrink-0 mt-0.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-start gap-2">
          {notification.external_id ? (
            <Link
              href={`/tv/${notification.external_id}`}
              className="text-primary hover:underline"
            >
              {titleContent}
            </Link>
          ) : (
            titleContent
          )}
          {!notification.read && (
            <Badge variant="secondary" className="text-xs">
              Unread
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground">
          {formatTimeAgo(notification.created_at)}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {!notification.read && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={pending !== null}
              onClick={() => patch("read")}
            >
              <Check className="h-3.5 w-3.5" />
              Mark as read
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            disabled={pending !== null}
            onClick={() => patch("dismiss")}
          >
            <X className="h-3.5 w-3.5" />
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
