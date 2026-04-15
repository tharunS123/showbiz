import { supabase } from "@/lib/db/client";
import { getTv } from "@/lib/catalog/tv";
import { logger } from "@/lib/logger";

export interface ReleaseAlert {
  userId: string;
  externalId: string;
  showTitle: string;
  newSeasonCount: number;
  lastKnownSeasons: number;
}

export async function checkForNewReleases(): Promise<ReleaseAlert[]> {
  const { data: watchedShows, error } = await supabase
    .from("list_items")
    .select("user_id, external_id, title")
    .eq("media_type", "tv")
    .in("list_type", ["watchlist", "favorite"]);

  if (error) {
    logger.error("Failed to fetch watched shows", { error: error.message });
    return [];
  }

  const showMap = new Map<string, { userIds: Set<string>; title: string }>();
  for (const item of watchedShows ?? []) {
    const existing = showMap.get(item.external_id);
    if (existing) {
      existing.userIds.add(item.user_id);
    } else {
      showMap.set(item.external_id, {
        userIds: new Set([item.user_id]),
        title: item.title,
      });
    }
  }

  const alerts: ReleaseAlert[] = [];

  for (const [externalId, { userIds, title }] of showMap) {
    try {
      const show = await getTv(externalId);
      if (!show || !show.seasonCount) continue;

      const { data: cached } = await supabase
        .from("release_checks")
        .select("season_count")
        .eq("external_id", externalId)
        .maybeSingle();

      const lastKnown = cached?.season_count ?? 0;

      if (show.seasonCount > lastKnown) {
        for (const userId of userIds) {
          alerts.push({
            userId,
            externalId,
            showTitle: title || show.title,
            newSeasonCount: show.seasonCount,
            lastKnownSeasons: lastKnown,
          });
        }

        await supabase.from("release_checks").upsert(
          {
            external_id: externalId,
            season_count: show.seasonCount,
            last_checked: new Date().toISOString(),
          },
          { onConflict: "external_id" }
        );
      }
    } catch (err) {
      logger.warn("Failed to check release for show", {
        externalId,
        error: String(err),
      });
    }
  }

  logger.info("Release check complete", {
    showsChecked: showMap.size,
    alertsGenerated: alerts.length,
  });

  return alerts;
}
