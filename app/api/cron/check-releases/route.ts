import { NextRequest, NextResponse } from "next/server";
import { checkForNewReleases } from "@/lib/notifications/check-releases";
import { supabase } from "@/lib/db/client";
import { logger } from "@/lib/logger";
import { sendAlert } from "@/lib/alerts";
import { getNotificationPreferencesMap } from "@/lib/db/notification-preferences";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const alerts = await checkForNewReleases();
    const prefsMap = await getNotificationPreferencesMap(
      alerts.map((a) => a.userId)
    );

    for (const alert of alerts) {
      const prefs = prefsMap.get(alert.userId);
      if (prefs && !prefs.new_season) {
        continue;
      }
      await supabase.from("user_notifications").insert({
        user_id: alert.userId,
        type: "new_season",
        external_id: alert.externalId,
        title: alert.showTitle,
        message: `${alert.showTitle} has a new season (Season ${alert.newSeasonCount})!`,
      });
    }

    logger.info("Cron: check-releases completed", {
      alerts: alerts.length,
    });

    return NextResponse.json({
      success: true,
      alertsCreated: alerts.length,
    });
  } catch (err) {
    logger.error("Cron: check-releases failed", { error: String(err) });
    await sendAlert({
      source: "api/cron/check-releases",
      message: "Release check cron failed",
      severity: "critical",
      meta: {
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
