import Image from "next/image";
import { posterUrl } from "@/lib/catalog/images";
import { cn } from "@/lib/utils";

interface PosterProps {
  path: string | null;
  title: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
}

const sizeClasses = {
  sm: "w-20 aspect-[2/3]",
  md: "w-32 aspect-[2/3]",
  lg: "w-48 aspect-[2/3]",
};

export function Poster({ path, title, size = "md", className, priority = false }: PosterProps) {
  const src = posterUrl(path, "w342");
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg bg-muted",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={`${title} poster`}
          fill
          className="object-cover"
          sizes={size === "lg" ? "192px" : size === "md" ? "128px" : "80px"}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground text-xs p-2 text-center">
          {title}
        </div>
      )}
    </div>
  );
}
