"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bell, CheckCircle2 } from "lucide-react";

type Prefs = {
  new_season: boolean;
  marketing: boolean;
};

export function NotificationPreferencesForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({ new_season: true, marketing: false });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/notification-preferences", { cache: "no-store" });
        if (!res.ok) throw new Error(`Load failed (${res.status})`);
        const json = await res.json();
        setPrefs({
          new_season: Boolean(json?.preferences?.new_season ?? true),
          marketing: Boolean(json?.preferences?.marketing ?? false),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load preferences");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      setSuccess("Notification preferences saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Control what updates you receive from Showbiz.
      </p>

      <label className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 max-w-md hover:bg-muted/40">
        <input
          type="checkbox"
          checked={prefs.new_season}
          onChange={(e) => {
            setPrefs((prev) => ({ ...prev, new_season: e.target.checked }));
            setSuccess(null);
          }}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <span className="text-sm font-medium">New season alerts</span>
      </label>

      <label className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 max-w-md hover:bg-muted/40">
        <input
          type="checkbox"
          checked={prefs.marketing}
          onChange={(e) => {
            setPrefs((prev) => ({ ...prev, marketing: e.target.checked }));
            setSuccess(null);
          }}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <span className="text-sm font-medium">Product updates and announcements</span>
      </label>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{success}</span>
        </div>
      )}

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save Notification Preferences"}
      </Button>
    </section>
  );
}
