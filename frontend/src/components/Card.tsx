import type { PropsWithChildren } from "react";

export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <section className={`rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glow ${className}`}>{children}</section>;
}

export function SectionHeader({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return (
    <div className="mb-5">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.3em] text-court-gold">{eyebrow}</p> : null}
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h2>
      {copy ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">{copy}</p> : null}
    </div>
  );
}

export function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {detail ? <p className="mt-2 text-sm text-slate-400">{detail}</p> : null}
    </Card>
  );
}
