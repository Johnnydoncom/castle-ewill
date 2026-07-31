export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3">
        <span className="font-serif text-[10px] uppercase tracking-[0.4em] text-gold animate-pulse">
          Loading
        </span>
        <span className="h-px w-8 bg-gold animate-pulse" />
      </div>
    </div>
  );
}
