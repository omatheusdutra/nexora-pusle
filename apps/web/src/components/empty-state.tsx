export function EmptyState({ label }: { label: string }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-md border border-dashed border-border bg-background/60 px-4 text-center dark:border-white/12 dark:bg-white/5">
      <div>
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-sm bg-gradient-to-r from-primary via-violet to-accent" />
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
