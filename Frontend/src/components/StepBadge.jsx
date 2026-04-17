function StepBadge({ step, title, description, active, complete }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 transition ${
        active
          ? "border-brand-200 bg-brand-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
            complete
              ? "bg-emerald-500 text-white"
              : active
                ? "bg-brand-500 text-white"
                : "bg-white text-slate-500"
          }`}
        >
          {complete ? "✓" : step}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default StepBadge;
