import { Bell } from "lucide-react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getUserNotifications } from "@/lib/db/notifications";
import { NotificationCard } from "@/components/notification-card";

export const metadata: Metadata = {
  title: "Notifications — Showbiz",
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getUserNotifications(user.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-primary shrink-0" aria-hidden />
        <h1 className="text-3xl font-bold">Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          <Bell className="h-10 w-10 mx-auto mb-3 opacity-50" aria-hidden />
          <p className="font-medium text-foreground">No notifications yet</p>
          <p className="text-sm mt-1">
            When we have updates about shows you follow, they will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3 list-none p-0 m-0">
          {notifications.map((n) => (
            <li key={n.id}>
              <NotificationCard notification={n} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
