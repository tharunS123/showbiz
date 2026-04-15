import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { WatchProviderResult } from "@/lib/catalog/providers";

interface Props {
  providers: WatchProviderResult;
}

function ProviderLogo({ name, logoPath }: { name: string; logoPath: string | null }) {
  if (!logoPath) return null;
  return (
    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0" title={name}>
      <Image
        src={`https://image.tmdb.org/t/p/w92${logoPath}`}
        alt={name}
        fill
        className="object-cover"
        sizes="40px"
      />
    </div>
  );
}

function ProviderSection({ label, providers }: { label: string; providers: { providerName: string; logoPath: string | null }[] }) {
  if (providers.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <div className="flex flex-wrap gap-2">
        {providers.map((p) => (
          <ProviderLogo key={p.providerName} name={p.providerName} logoPath={p.logoPath} />
        ))}
      </div>
    </div>
  );
}

export function WatchProviders({ providers }: Props) {
  const hasAny = providers.flatrate.length > 0 || providers.rent.length > 0 || providers.buy.length > 0;

  if (!hasAny) {
    return (
      <p className="text-sm text-muted-foreground">
        No streaming information available for your region.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ProviderSection label="Stream" providers={providers.flatrate} />
      <ProviderSection label="Rent" providers={providers.rent} />
      <ProviderSection label="Buy" providers={providers.buy} />
      {providers.link && (
        <a
          href={providers.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          View all options <ExternalLink className="w-3 h-3" />
        </a>
      )}
      <p className="text-[10px] text-muted-foreground">
        Powered by JustWatch
      </p>
    </div>
  );
}
