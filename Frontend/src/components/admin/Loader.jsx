function Loader({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-slate-200 bg-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
      <span className="ml-3 text-sm font-semibold text-slate-600">{label}</span>
    </div>
  );
}

export default Loader;
