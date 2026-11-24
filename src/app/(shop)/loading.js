export default function Loading() {
  return <div className="wrap py-10" aria-busy="true"><div className="h-8 w-48 animate-pulse rounded-lg bg-ink-100" /><div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-ink-100" />)}</div></div>;
}
