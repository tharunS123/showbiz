import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserByClerkId, syncClerkUser } from "@/lib/db/user";

export async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  let user = await getUserByClerkId(clerkId);
  if (!user) {
    user = await autoSyncClerkUser(clerkId);
  }
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

async function autoSyncClerkUser(clerkId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses?.[0]?.emailAddress;
  if (!email) return null;

  return syncClerkUser({
    clerkId,
    email,
    name:
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      null,
    image: clerkUser.imageUrl ?? null,
  });
}
