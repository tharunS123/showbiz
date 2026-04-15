import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/user";
import { getUserPreferences, updateUserPreferences } from "@/lib/db/preferences";
import { z } from "zod/v4";

const UpdateSchema = z.object({
  excluded_genres: z.array(z.number()).optional(),
  max_content_rating: z.string().nullable().optional(),
  hide_spoilers: z.boolean().optional(),
});

async function resolveUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return getUserByClerkId(clerkId);
}

export async function GET() {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await getUserPreferences(user.id);
  return NextResponse.json({ preferences: prefs });
}

export async function PUT(req: NextRequest) {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const prefs = await updateUserPreferences(user.id, parsed.data);
  return NextResponse.json({ preferences: prefs });
}
