import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Film, Bookmark, Sparkles, Compass, Settings } from "lucide-react";
import { Suspense } from "react";
import { NotificationBell } from "@/components/notification-bell";

export async function Navbar() {
  const user = await currentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md" role="banner">
      <div className="container mx-auto flex items-center gap-4 px-4 h-16">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Film className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg hidden sm:inline">Showbiz</span>
        </Link>

        <Suspense>
          <SearchInput className="flex-1 max-w-md" />
        </Suspense>

        <nav className="flex items-center gap-2 ml-auto" aria-label="Main navigation">
          <Link href="/discover">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Compass className="w-4 h-4" />
              <span className="hidden md:inline">Discover</span>
            </Button>
          </Link>
          {user ? (
            <>
              <Link href="/lists">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden md:inline">My Lists</span>
                </Button>
              </Link>
              <Link href="/for-you">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden md:inline">For You</span>
                </Button>
              </Link>
              <NotificationBell />
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              <UserButton />
            </>
          ) : (
            <Link href="/sign-in">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
