import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import Loader from "../../components/admin/Loader";
import Pagination from "../../components/admin/Pagination";
import Table from "../../components/admin/Table";
import { formatMoney } from "../../components/admin/adminFormatters";
import { useAdminAuthGuard } from "../../hooks/useAdminAuthGuard";
import { createAdminRoute, deleteAdminRoute, getAdminRoutes, updateAdminRoute } from "../../services/adminService";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

const initialForm = { from: "", to: "", baseFare: "", concessionPercent: "" };
const ROUTES_PAGE_SIZE = 10;

function Routes() {
  const { adminToken, handleAdminError } = useAdminAuthGuard();
  const [routes, setRoutes] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRoutes: 0,
  });
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadRoutes = async (params = { q: query }, page = pagination.currentPage) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await getAdminRoutes(adminToken, {
        ...params,
        page,
        limit: ROUTES_PAGE_SIZE,
      });

      setRoutes(Array.isArray(data?.routes) ? data.routes : []);
      setPagination({
        currentPage: Number(data?.currentPage || page),
        totalPages: Number(data?.totalPages || 1),
        totalRoutes: Number(data?.totalRoutes || 0),
      });
    } catch (error) {
      if (!handleAdminError(error)) {
        setErrorMessage(getApiErrorMessage(error, "Failed to load routes."));
      }
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    loadRoutes({ q: "" }, 1);
  }, [adminToken]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId("");
  };

  const submitRoute = async (event) => {
    event.preventDefault();
    setBusyId(editingId || "new");
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const payload = {
        from: form.from.trim(),
        to: form.to.trim(),
        baseFare: Number(form.baseFare),
        price: Number(form.baseFare),
        concessionPercent: Number(form.concessionPercent),
      };
      const response = editingId
        ? await updateAdminRoute(adminToken, editingId, payload)
        : await createAdminRoute(adminToken, payload);
      setSuccessMessage(response.message || "Route saved successfully.");
      resetForm();
      await loadRoutes({ q: query }, editingId ? pagination.currentPage : 1);
    } catch (error) {
      if (!handleAdminError(error)) {
        setErrorMessage(getApiErrorMessage(error, "Failed to save route."));
      }
    } finally {
      setBusyId("");
    }
  };

  const beginEdit = (route) => {
    setEditingId(route._id);
    setForm({
      from: route.from || "",
      to: route.to || "",
      baseFare: String(route.baseFare ?? route.price ?? ""),
      concessionPercent: String(route.concessionPercent ?? 0),
    });
  };

  const removeRoute = async (routeId) => {
    setBusyId(routeId);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await deleteAdminRoute(adminToken, routeId);
      setSuccessMessage(response.message || "Route deleted successfully.");
      await loadRoutes({ q: query }, pagination.currentPage);
    } catch (error) {
      if (!handleAdminError(error)) {
        setErrorMessage(getApiErrorMessage(error, "Failed to delete route."));
      }
    } finally {
      setBusyId("");
    }
  };

  const applySearch = (event) => {
    event.preventDefault();
    resetForm();
    loadRoutes({ q: query }, 1);
  };

  const resetSearch = () => {
    setQuery("");
    resetForm();
    loadRoutes({ q: "" }, 1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.currentPage || isLoading) {
      return;
    }

    resetForm();
    loadRoutes({ q: query }, page);
  };

  const columns = useMemo(
    () => [
      { key: "from", header: "From" },
      { key: "to", header: "To" },
      { key: "baseFare", header: "Base Fare", render: (route) => formatMoney(route.baseFare ?? route.price) },
      { key: "concessionPercent", header: "Concession", render: (route) => `${Number(route.concessionPercent || 0)}%` },
      {
        key: "studentFare",
        header: "Student Fare",
        render: (route) => formatMoney(Number(route.baseFare ?? route.price ?? 0) * (1 - Number(route.concessionPercent || 0) / 100)),
      },
      {
        key: "actions",
        header: "Actions",
        render: (route) => (
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold" onClick={() => beginEdit(route)}>Edit</button>
            <button className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50" onClick={() => removeRoute(route._id)} disabled={busyId === route._id}>Delete</button>
          </div>
        ),
      },
    ],
    [busyId]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Routes Management</h1>
        <p className="mt-1 text-sm text-slate-600">Add routes, update fares, and keep concession pricing clean.</p>
      </div>

      <AlertMessage type="error" message={errorMessage} />
      <AlertMessage type="success" message={successMessage} />

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <form onSubmit={submitRoute} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-950">{editingId ? "Edit route" : "Add route"}</h2>
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" name="from" value={form.from} onChange={handleChange} placeholder="From" />
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" name="to" value={form.to} onChange={handleChange} placeholder="To" />
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" name="baseFare" type="number" value={form.baseFare} onChange={handleChange} placeholder="Base fare" />
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" name="concessionPercent" type="number" value={form.concessionPercent} onChange={handleChange} placeholder="Concession percent" />
          <div className="flex gap-2">
            <button className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={busyId === (editingId || "new")}>
              {editingId ? "Save Route" : "Create Route"}
            </button>
            {editingId ? <button type="button" onClick={resetForm} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold">Cancel</button> : null}
          </div>
        </form>

        <div className="min-w-0 space-y-4">
          <form onSubmit={applySearch} className="grid min-w-0 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto]">
            <input className="min-w-0 rounded-md border border-slate-200 px-3 py-2 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search from or to" />
            <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Search</button>
            <button type="button" onClick={resetSearch} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold">Reset</button>
          </form>
          {!hasLoadedOnce ? (
            <Loader label="Loading routes..." />
          ) : (
            <div className="min-w-0 space-y-4">
              <div className="relative min-h-[560px] min-w-0">
                <Table columns={columns} rows={routes} emptyMessage="No routes found." />
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-[1px]">
                    <div className="flex items-center rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
                      <span className="ml-3 text-sm font-semibold text-slate-600">Loading routes...</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalRoutes}
                pageSize={ROUTES_PAGE_SIZE}
                isLoading={isLoading}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </section>
      <p className="text-xs text-slate-500">
        Page {pagination.currentPage} of {pagination.totalPages}. Showing {routes.length} route records.
      </p>
    </div>
  );
}

export default Routes;
