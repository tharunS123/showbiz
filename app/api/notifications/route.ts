import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/user";
import {
  dismissNotification,
  getUserNotifications,
  markNotificationRead,
} from "@/lib/db/notifications";
import { z } from "zod/v4";

const PatchSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["read", "dismiss"]),
});

async function resolveUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return getUserByClerkId(clerkId);
}

export async function GET(req: NextRequest) {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const unreadOnly = req.nextUrl.searchParams.get("unreadOnly") === "true";
  const notifications = await getUserNotifications(user.id, { unreadOnly });
  return NextResponse.json({ notifications });
}

export async function PATCH(req: NextRequest) {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const { id, action } = parsed.data;

  try {
    if (action === "read") {
      const ok = await markNotificationRead(user.id, id);
      if (!ok) {
        return NextResponse.json(
          { error: "Notification not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    const ok = await dismissNotification(user.id, id);
    if (!ok) {
      return NextResponse.json(
        { error: "Notification not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
