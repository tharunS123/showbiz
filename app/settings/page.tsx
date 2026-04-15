import { requireUser } from "@/lib/auth";
import { PreferencesForm } from "@/components/preferences-form";
import { NotificationPreferencesForm } from "@/components/notification-preferences-form";
import { Settings } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — Showbiz",
};

export default async function SettingsPage() {
  await requireUser();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header className="flex items-center gap-3 min-w-0">
        <Settings className="h-8 w-8 text-primary shrink-0" aria-hidden />
        <h1 className="text-3xl font-bold truncate">Settings</h1>
      </header>
      <PreferencesForm />
      <NotificationPreferencesForm />
    </div>
  );
}
