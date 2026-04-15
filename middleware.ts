import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/lists(.*)",
  "/for-you(.*)",
  "/settings(.*)",
  "/notifications(.*)",
  "/admin(.*)",
  "/api/list(.*)",
  "/api/recs(.*)",
  "/api/preferences(.*)",
  "/api/notification-preferences(.*)",
  "/api/custom-lists(.*)",
  "/api/notifications(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  const requestId = crypto.randomUUID();
  const res = NextResponse.next();
  res.headers.set("x-request-id", requestId);
  return res;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
