import { requireUser } from "@/lib/auth";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ForYouRecsGrid } from "@/components/for-you-recs-grid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For You — Showbiz",
};

async function getRecsData(userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/recs?userId=${userId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ForYouPage() {
  const user = await requireUser();
  const data = await getRecsData(user.id);

  const items = data?.items ?? [];
  const recsVersion = data?.recsVersion ?? "v1-unknown";

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Sparkles className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-bold">For You</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">
            We don&apos;t have enough data yet
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start by adding movies and TV shows to your favorites or marking
            them as seen. We&apos;ll use your taste to recommend titles you&apos;ll love.
          </p>
          <Link href="/">
            <Button className="gap-1.5 mt-2">
              Browse Titles <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <ForYouRecsGrid items={items} recsVersion={recsVersion} />
      )}
    </div>
  );
}
