import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import Loader from "../../components/admin/Loader";
import Pagination from "../../components/admin/Pagination";
import Table from "../../components/admin/Table";
import { formatDateTime } from "../../components/admin/adminFormatters";
import { useAdminAuthGuard } from "../../hooks/useAdminAuthGuard";
import {
  createAdminConductor,
  deleteAdminConductor,
  getAdminConductors,
  updateAdminConductor,
} from "../../services/adminService";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

const initialFilters = { q: "", busNo: "" };
const initialForm = { name: "", email: "", password: "", bus_no: "" };
const CONDUCTORS_PAGE_SIZE = 10;

function Conductors() {
  const { adminToken, handleAdminError } = useAdminAuthGuard();
  const [conductors, setConductors] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalConductors: 0,
  });
  const [filters, setFilters] = useState(initialFilters);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadConductors = async (params = filters, page = pagination.currentPage) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await getAdminConductors(adminToken, {
        ...params,
        page,
        limit: CONDUCTORS_PAGE_SIZE,
      });

      setConductors(Array.isArray(data?.conductors) ? data.conductors : []);
      setPagination({
        currentPage: Number(data?.currentPage || page),
        totalPages: Number(data?.totalPages || 1),
        totalConductors: Number(data?.totalConductors || 0),
      });
    } catch (error) {
      if (!handleAdminError(error)) {
        setErrorMessage(getApiErrorMessage(error, "Failed to load conductors."));
      }
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    loadConductors(initialFilters, 1);
  }, [adminToken]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId("");
  };

  const submitConductor = async (event) => {
    event.preventDefault();
    setBusyId(editingId || "new");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        bus_no: form.bus_no.trim(),
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      const response = editingId
        ? await updateAdminConductor(adminToken, editingId, payload)
        : await createAdminConductor(adminToken, { ...payload, password: form.password });

      setSuccessMessage(response.message || "Conductor saved successfully.");
      resetForm();
      await loadConductors(filters, editingId ? pagination.currentPage : 1);
    } catch (error) {
      if (!handleAdminError(error)) {
        setErrorMessage(getApiErrorMessage(error, "Failed to save conductor."));
      }
    } finally {
      setBusyId("");
    }
  };

  const beginEdit = (conductor) => {
    setEditingId(conductor._id);
    setForm({
      name: conductor.name || "",
      email: conductor.email || "",
      password: "",
      bus_no: conductor.bus_no || "",
    });
  };

  const deleteConductor = async (conductorId) => {
    setBusyId(conductorId);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await deleteAdminConductor(adminToken, conductorId);
      setSuccessMessage(response.message || "Conductor deleted successfully.");
      await loadConductors(filters, pagination.currentPage);
    } catch (error) {
      if (!handleAdminError(error)) {
        setErrorMessage(getApiErrorMessage(error, "Failed to delete conductor."));
      }
    } finally {
      setBusyId("");
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Conductor",
        render: (conductor) => (
          <div>
            <p className="font-semibold text-slate-900">{conductor.name}</p>
            <p className="text-xs text-slate-500">{conductor.email}</p>
          </div>
        ),
      },
      { key: "bus_no", header: "Bus No" },
      {
        key: "verified",
        header: "Status",
        render: () => <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Verified</span>,
      },
      { key: "createdAt", header: "Created", render: (conductor) => formatDateTime(conductor.createdAt) },
      {
        key: "actions",
        header: "Actions",
        render: (conductor) => (
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold" onClick={() => beginEdit(conductor)}>
              Edit
            </button>
            <button
              className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50"
              onClick={() => deleteConductor(conductor._id)}
              disabled={busyId === conductor._id}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [busyId]
  );

  const applyFilters = (event) => {
    event.preventDefault();
    resetForm();
    loadConductors(filters, 1);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    resetForm();
    loadConductors(initialFilters, 1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.currentPage || isLoading) {
      return;
    }

    resetForm();
    loadConductors(filters, page);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Conductors Management</h1>
        <p className="mt-1 text-sm text-slate-600">Create, verify, edit, and remove conductor accounts.</p>
      </div>

      <AlertMessage type="error" message={errorMessage} />
      <AlertMessage type="success" message={successMessage} />

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <form onSubmit={submitConductor} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-950">{editingId ? "Edit conductor" : "Add conductor"}</h2>
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" name="name" value={form.name} onChange={handleFormChange} placeholder="Name" />
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" name="email" value={form.email} onChange={handleFormChange} placeholder="Email" />
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" name="bus_no" value={form.bus_no} onChange={handleFormChange} placeholder="Bus number" />
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" name="password" type="password" value={form.password} onChange={handleFormChange} placeholder={editingId ? "New password optional" : "Password"} />
          <div className="flex gap-2">
            <button className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={busyId === (editingId || "new")}>
              {editingId ? "Save Changes" : "Create Conductor"}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold">
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="min-w-0 space-y-4">
          <form onSubmit={applyFilters} className="grid min-w-0 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,180px)_auto_auto]">
            <input className="min-w-0 rounded-md border border-slate-200 px-3 py-2 text-sm" name="q" value={filters.q} onChange={handleFilterChange} placeholder="Search name, email, bus" />
            <input className="min-w-0 rounded-md border border-slate-200 px-3 py-2 text-sm" name="busNo" value={filters.busNo} onChange={handleFilterChange} placeholder="Bus no" />
            <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Search</button>
            <button type="button" onClick={resetFilters} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold">Reset</button>
          </form>
          {!hasLoadedOnce ? (
            <Loader label="Loading conductors..." />
          ) : (
            <div className="min-w-0 space-y-4">
              <div className="relative min-h-[560px] min-w-0">
                <Table columns={columns} rows={conductors} emptyMessage="No conductors found." />
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-[1px]">
                    <div className="flex items-center rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
                      <span className="ml-3 text-sm font-semibold text-slate-600">Loading conductors...</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalConductors}
                pageSize={CONDUCTORS_PAGE_SIZE}
                isLoading={isLoading}
                onPageChange={handlePageChange}
              />
            </div>
          )}
          <p className="text-xs text-slate-500">
            Page {pagination.currentPage} of {pagination.totalPages}. Showing {conductors.length} conductor records.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Conductors;
