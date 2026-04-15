import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/user";
import {
  getUserNotificationPreferences,
  upsertUserNotificationPreferences,
} from "@/lib/db/notification-preferences";
import { z } from "zod/v4";

const UpdateSchema = z.object({
  new_season: z.boolean().optional(),
  marketing: z.boolean().optional(),
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

  const preferences = await getUserNotificationPreferences(user.id);
  return NextResponse.json({ preferences });
}

export async function PUT(req: NextRequest) {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const preferences = await upsertUserNotificationPreferences(user.id, parsed.data);
  return NextResponse.json({ preferences });
}
