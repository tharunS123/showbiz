export function TMDbAttribution() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Data provided by</span>
      <a
        href="https://www.themoviedb.org"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold hover:text-foreground transition-colors"
      >
        TMDb
      </a>
    </div>
  );
}
