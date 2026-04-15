import Image from "next/image";
import { backdropUrl } from "@/lib/catalog/images";

interface BackdropProps {
  path: string | null;
  alt?: string;
}

export function Backdrop({ path, alt = "" }: BackdropProps) {
  const src = backdropUrl(path, "w1280");

  return (
    <div className="relative h-64 md:h-[28rem] overflow-hidden bg-muted" role="img" aria-label={alt || "Backdrop"}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
    </div>
  );
}
