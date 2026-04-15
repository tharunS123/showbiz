interface Fact {
  label: string;
  value: string | null;
}

export function FactsGrid({ facts }: { facts: Fact[] }) {
  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
      {facts
        .filter((f) => f.value)
        .map(({ label, value }) => (
          <div key={label} className="flex flex-col">
            <dt className="text-muted-foreground text-xs uppercase tracking-wide">
              {label}
            </dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
    </dl>
  );
}
