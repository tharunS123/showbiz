import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Film } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Film className="w-16 h-16 text-muted-foreground" />
      <h1 className="text-3xl font-bold">404 — Not Found</h1>
      <p className="text-muted-foreground text-center max-w-md">
        The page you&apos;re looking for doesn&apos;t exist. It might have been
        moved or the title may no longer be available.
      </p>
      <Link href="/">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
