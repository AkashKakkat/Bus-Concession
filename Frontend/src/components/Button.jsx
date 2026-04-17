function Button({
  children,
  type = "button",
  onClick,
  disabled = false,
  isLoading = false,
  variant = "primary",
  className = "",
}) {
  const variants = {
    primary:
      "bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-200 disabled:bg-slate-300",
    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4 ${variants[variant]} ${className}`}
    >
      {isLoading ? "Please wait..." : children}
    </button>
  );
}

export default Button;
