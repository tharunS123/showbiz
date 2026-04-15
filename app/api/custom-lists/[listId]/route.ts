import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/user";
import {
  getCustomListById,
  getCustomListItems,
  updateCustomList,
  deleteCustomList,
} from "@/lib/db/custom-lists";
import { listMutationLimiter } from "@/lib/rate-limit";
import { z } from "zod/v4";

interface Props {
  params: Promise<{ listId: string }>;
}

const UpdateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

async function resolveUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return getUserByClerkId(clerkId);
}

export async function GET(_req: NextRequest, { params }: Props) {
  const { listId } = await params;

  const list = await getCustomListById(listId);
  if (!list) {
    return NextResponse.json({ error: "List not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (!list.is_public) {
    const user = await resolveUser();
    if (!user || user.id !== list.user_id) {
      return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
    }
  }

  const items = await getCustomListItems(listId);
  return NextResponse.json({ list, items });
}

export async function PUT(req: NextRequest, { params }: Props) {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { listId } = await params;

  const limit = listMutationLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } },
    );
  }

  const list = await getCustomListById(listId);
  if (!list) {
    return NextResponse.json({ error: "List not found", code: "NOT_FOUND" }, { status: 404 });
  }
  if (list.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { name, description, isPublic } = parsed.data;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (isPublic !== undefined) updates.is_public = isPublic;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No fields to update", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  await updateCustomList(listId, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { listId } = await params;

  const limit = listMutationLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } },
    );
  }

  const list = await getCustomListById(listId);
  if (!list) {
    return NextResponse.json({ error: "List not found", code: "NOT_FOUND" }, { status: 404 });
  }
  if (list.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  await deleteCustomList(listId);
  return NextResponse.json({ success: true });
}
