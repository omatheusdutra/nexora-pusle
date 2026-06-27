export function EmptyState({ label }: { label: string }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-md border border-dashed border-white/12 bg-white/5 px-4 text-center">
      <div>
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-sm bg-gradient-to-r from-primary via-violet to-accent" />
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
