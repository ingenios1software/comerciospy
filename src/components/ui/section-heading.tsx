export function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">{title}</h2>
      <p className="max-w-2xl text-sm text-slate-400 sm:text-base">{description}</p>
    </div>
  );
}
