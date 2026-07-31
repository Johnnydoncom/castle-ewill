export function PageHead({
  kicker,
  title,
  blurb,
}: {
  kicker: string;
  title: string;
  blurb: string;
}) {
  return (
    <div className="border-b border-border pb-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px w-10 shrink-0 bg-gold" />
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
          {kicker}
        </p>
      </div>
      <h1 className="font-serif text-3xl tracking-tight text-navy sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{blurb}</p>
    </div>
  );
}
