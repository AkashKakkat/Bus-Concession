function StatsCard({ label, value, tone = "emerald", helper }) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-50 text-rose-700"
      : tone === "sky"
      ? "bg-sky-50 text-sky-700"
      : tone === "amber"
      ? "bg-amber-50 text-amber-700"
      : "bg-emerald-50 text-emerald-700";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${toneClass}`}>
        {label}
      </div>
      <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

export default StatsCard;
