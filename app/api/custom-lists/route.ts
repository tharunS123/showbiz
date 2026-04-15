import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/user";
import { getUserCustomLists, createCustomList } from "@/lib/db/custom-lists";
import { listMutationLimiter } from "@/lib/rate-limit";
import { z } from "zod/v4";

const CreateListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

async function resolveUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return getUserByClerkId(clerkId);
}

export async function GET() {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const lists = await getUserCustomLists(user.id);
  return NextResponse.json({ lists });
}

export async function POST(req: NextRequest) {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const limit = listMutationLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } },
    );
  }

  const body = await req.json();
  const parsed = CreateListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { name, description, isPublic } = parsed.data;
  const list = await createCustomList(user.id, name, description, isPublic);

  return NextResponse.json({ list }, { status: 201 });
}
