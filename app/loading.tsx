export default function LoadingPage() {
  return (
    <div className="min-h-[60vh] bg-background text-foreground flex items-center justify-center px-4 pt-[5.5rem]">
      <div className="border border-foreground/30 bg-card px-6 py-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-3 shadow-[2px_2px_0px_0px_currentColor]">
        <span className="size-2.5 rounded-full bg-primary animate-ping" />
        <span>Synchronizing Pakistan Tech Signal…</span>
      </div>
    </div>
  );
}

