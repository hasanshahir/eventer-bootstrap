import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] bg-background text-foreground flex items-center justify-center px-4 py-16 pt-[5.5rem]">
      <div className="max-w-lg w-full border-2 border-foreground bg-card p-8 space-y-5 shadow-[4px_4px_0px_0px_currentColor]">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
          404 &bull; Dispatch Not Found
        </span>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground">
          This coordinates desk does not exist.
        </h1>
        <p className="font-mono text-xs text-muted-foreground leading-relaxed">
          The event or regional desk you requested may have moved or been archived from the active radar.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/"
            className="border border-foreground bg-primary px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-blue-600 transition-colors shadow-[2px_2px_0px_0px_currentColor]"
          >
            Open Live Radar &rarr;
          </Link>
          <Link
            href="/cities"
            className="border border-foreground/40 bg-background px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground hover:border-primary"
          >
            Browse City Desks
          </Link>
        </div>
      </div>
    </div>
  );
}

