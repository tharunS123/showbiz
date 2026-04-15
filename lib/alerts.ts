import { logger } from "@/lib/logger";

interface AlertPayload {
  source: string;
  message: string;
  severity?: "warning" | "error" | "critical";
  meta?: Record<string, unknown>;
}

function getAlertWebhook(): string | null {
  return process.env.ALERT_WEBHOOK_URL ?? null;
}

export async function sendAlert(payload: AlertPayload): Promise<void> {
  const webhook = getAlertWebhook();
  if (!webhook) return;

  const body = {
    source: payload.source,
    message: payload.message,
    severity: payload.severity ?? "error",
    timestamp: new Date().toISOString(),
    meta: payload.meta ?? {},
  };

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      logger.warn("Alert webhook returned non-2xx", {
        source: payload.source,
        status: res.status,
      });
    }
  } catch (err) {
    logger.warn("Alert webhook request failed", {
      source: payload.source,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
