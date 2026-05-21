import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/admin/dashboard", label: "Overview", mark: "O" },
  { to: "/admin/students", label: "Students", mark: "S" },
  { to: "/admin/conductors", label: "Conductors", mark: "C" },
  { to: "/admin/routes", label: "Routes", mark: "R" },
  { to: "/admin/transactions", label: "Transactions", mark: "T" },
  { to: "/admin/settings", label: "Settings", mark: "A" },
];

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-950/50 lg:hidden ${isOpen ? "block" : "hidden"}`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800 bg-slate-950 px-4 py-5 text-white transition-transform lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Bus Concession</p>
            <h1 className="mt-2 text-xl font-semibold">Admin Panel</h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 lg:hidden"
          >
            Close
          </button>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-xs">
                {item.mark}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
