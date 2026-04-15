import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/user";
import {
  getCustomListById,
  addCustomListItem,
  removeCustomListItem,
} from "@/lib/db/custom-lists";
import { listMutationLimiter } from "@/lib/rate-limit";
import { z } from "zod/v4";

interface Props {
  params: Promise<{ listId: string }>;
}

const AddItemSchema = z.object({
  externalId: z.string().min(1),
  mediaType: z.enum(["movie", "tv"]),
  title: z.string().optional(),
  posterPath: z.string().nullable().optional(),
  note: z.string().max(500).optional(),
});

const RemoveItemSchema = z.object({
  externalId: z.string().min(1),
  mediaType: z.enum(["movie", "tv"]),
});

async function resolveUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return getUserByClerkId(clerkId);
}

export async function POST(req: NextRequest, { params }: Props) {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const { listId } = await params;

  const limit = listMutationLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) },
      }
    );
  }

  const list = await getCustomListById(listId);
  if (!list) {
    return NextResponse.json(
      { error: "List not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }
  if (list.user_id !== user.id) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = AddItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input",
        code: "VALIDATION_ERROR",
        details: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const { externalId, mediaType, title, posterPath, note } = parsed.data;
  await addCustomListItem(listId, externalId, mediaType, {
    title,
    posterPath,
    note,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const { listId } = await params;

  const limit = listMutationLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) },
      }
    );
  }

  const list = await getCustomListById(listId);
  if (!list) {
    return NextResponse.json(
      { error: "List not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }
  if (list.user_id !== user.id) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = RemoveItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input",
        code: "VALIDATION_ERROR",
        details: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const { externalId, mediaType } = parsed.data;
  await removeCustomListItem(listId, externalId, mediaType);

  return NextResponse.json({ success: true });
}
