import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { useAuth } from "../context/AuthContext";
import {
  approveAdminStudent,
  createAdminConductor,
  createAdminRoute,
  deleteAdminConductor,
  deleteAdminRoute,
  deleteAdminStudent,
  getAdminConductorDetails,
  getAdminConductors,
  getAdminReports,
  getAdminRoutes,
  getAdminStudentIdCard,
  getAdminStudentDetails,
  getAdminStudents,
  getAdminTransactions,
  rejectAdminStudent,
  updateAdminRoute,
} from "../services/adminService";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const initialRouteForm = {
  from: "",
  to: "",
  baseFare: "",
  concessionPercent: "",
};

const initialConductorForm = {
  name: "",
  email: "",
  password: "",
  bus_no: "",
};

const initialStudentFilters = {
  q: "",
  college: "",
  verificationStatus: "",
};

const initialConductorFilters = {
  q: "",
  busNo: "",
};

const initialRouteFilters = {
  q: "",
};

const initialTransactionFilters = {
  q: "",
  type: "",
  dateFrom: "",
  dateTo: "",
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString();
};

const getVerificationBadgeClass = (status) => {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "rejected") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-amber-100 text-amber-700";
};

function AdminDashboard() {
  const navigate = useNavigate();
  const { adminToken, adminRole, clearSession } = useAuth();
  const [students, setStudents] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reports, setReports] = useState(null);
  const [routeForm, setRouteForm] = useState(initialRouteForm);
  const [conductorForm, setConductorForm] = useState(initialConductorForm);
  const [studentFilters, setStudentFilters] = useState(initialStudentFilters);
  const [conductorFilters, setConductorFilters] = useState(initialConductorFilters);
  const [routeFilters, setRouteFilters] = useState(initialRouteFilters);
  const [transactionFilters, setTransactionFilters] = useState(initialTransactionFilters);
  const [editingRouteId, setEditingRouteId] = useState("");
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedEntityType, setSelectedEntityType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingRoute, setIsSubmittingRoute] = useState(false);
  const [isSubmittingConductor, setIsSubmittingConductor] = useState(false);
  const [deletingRouteId, setDeletingRouteId] = useState("");
  const [loadingDetailsId, setLoadingDetailsId] = useState("");
  const [deletingStudentId, setDeletingStudentId] = useState("");
  const [deletingConductorId, setDeletingConductorId] = useState("");
  const [approvingStudentId, setApprovingStudentId] = useState("");
  const [rejectingStudentId, setRejectingStudentId] = useState("");
  const [viewingStudentIdCardId, setViewingStudentIdCardId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleAdminSessionError = (error) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      clearSession("admin");
      navigate("/admin-login", { replace: true });
      return true;
    }

    return false;
  };

  const clearSelectedEntity = () => {
    setSelectedEntity(null);
    setSelectedEntityType("");
  };

  const fetchStudents = async (params = studentFilters) => {
    const data = await getAdminStudents(adminToken, params);
    setStudents(Array.isArray(data) ? data : []);
  };

  const fetchConductors = async (params = conductorFilters) => {
    const data = await getAdminConductors(adminToken, params);
    setConductors(Array.isArray(data) ? data : []);
  };

  const fetchRoutes = async (params = routeFilters) => {
    const data = await getAdminRoutes(adminToken, params);
    setRoutes(Array.isArray(data) ? data : []);
  };

  const fetchTransactions = async (params = transactionFilters) => {
    const data = await getAdminTransactions(adminToken, params);
    setTransactions(Array.isArray(data) ? data : []);
  };

  const fetchReports = async () => {
    const data = await getAdminReports(adminToken);
    setReports(data);
  };

  const loadDashboard = async () => {
    if (!adminToken) {
      navigate("/admin-login", { replace: true });
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      await Promise.all([
        fetchStudents(studentFilters),
        fetchConductors(conductorFilters),
        fetchRoutes(routeFilters),
        fetchTransactions(transactionFilters),
        fetchReports(),
      ]);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to load admin dashboard."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!adminToken || adminRole !== "admin") {
      navigate("/admin-login", { replace: true });
      return;
    }

    loadDashboard();
  }, [adminRole, adminToken, navigate]);

  const resetRouteForm = () => {
    setRouteForm(initialRouteForm);
    setEditingRouteId("");
  };

  const handleRouteFormChange = (event) => {
    const { name, value } = event.target;

    setRouteForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleConductorFormChange = (event) => {
    const { name, value } = event.target;

    setConductorForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleStudentFilterChange = (event) => {
    const { name, value } = event.target;
    setStudentFilters((current) => ({ ...current, [name]: value }));
  };

  const handleConductorFilterChange = (event) => {
    const { name, value } = event.target;
    setConductorFilters((current) => ({ ...current, [name]: value }));
  };

  const handleRouteFilterChange = (event) => {
    const { name, value } = event.target;
    setRouteFilters((current) => ({ ...current, [name]: value }));
  };

  const handleTransactionFilterChange = (event) => {
    const { name, value } = event.target;
    setTransactionFilters((current) => ({ ...current, [name]: value }));
  };

  const handleRouteSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (
      !routeForm.from.trim() ||
      !routeForm.to.trim() ||
      !routeForm.baseFare.trim() ||
      routeForm.concessionPercent === ""
    ) {
      setErrorMessage("Please complete all route fields.");
      return;
    }

    setIsSubmittingRoute(true);

    try {
      const payload = {
        from: routeForm.from.trim(),
        to: routeForm.to.trim(),
        baseFare: Number(routeForm.baseFare),
        price: Number(routeForm.baseFare),
        concessionPercent: Number(routeForm.concessionPercent),
      };

      const response = editingRouteId
        ? await updateAdminRoute(adminToken, editingRouteId, payload)
        : await createAdminRoute(adminToken, payload);

      setSuccessMessage(
        response.message ||
          (editingRouteId ? "Route updated successfully" : "Route created successfully")
      );
      resetRouteForm();
      await Promise.all([fetchRoutes(routeFilters), fetchReports()]);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to save route."));
    } finally {
      setIsSubmittingRoute(false);
    }
  };

  const handleConductorSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (
      !conductorForm.name.trim() ||
      !conductorForm.email.trim() ||
      !conductorForm.password.trim() ||
      !conductorForm.bus_no.trim()
    ) {
      setErrorMessage("Please complete all conductor fields.");
      return;
    }

    setIsSubmittingConductor(true);

    try {
      const response = await createAdminConductor(adminToken, {
        name: conductorForm.name.trim(),
        email: conductorForm.email.trim(),
        password: conductorForm.password,
        bus_no: conductorForm.bus_no.trim(),
      });

      setSuccessMessage(response.message || "Conductor created successfully");
      setConductorForm(initialConductorForm);
      await Promise.all([fetchConductors(conductorFilters), fetchReports()]);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to create conductor."));
    } finally {
      setIsSubmittingConductor(false);
    }
  };

  const handleRouteEdit = (route) => {
    setEditingRouteId(route._id);
    setRouteForm({
      from: route.from || "",
      to: route.to || "",
      baseFare: String(route.baseFare ?? route.price ?? ""),
      concessionPercent: String(route.concessionPercent ?? 0),
    });
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleRouteDelete = async (routeId) => {
    setErrorMessage("");
    setSuccessMessage("");
    setDeletingRouteId(routeId);

    try {
      const response = await deleteAdminRoute(adminToken, routeId);
      setSuccessMessage(response.message || "Route deleted successfully");

      if (editingRouteId === routeId) {
        resetRouteForm();
      }

      await Promise.all([fetchRoutes(routeFilters), fetchReports()]);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to delete route."));
    } finally {
      setDeletingRouteId("");
    }
  };

  const handleStudentDetails = async (studentId) => {
    setLoadingDetailsId(studentId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const data = await getAdminStudentDetails(adminToken, studentId);
      setSelectedEntity(data);
      setSelectedEntityType("student");
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to load student details."));
    } finally {
      setLoadingDetailsId("");
    }
  };

  const handleViewStudentIdCard = async (studentId) => {
    setViewingStudentIdCardId(studentId);
    setErrorMessage("");
    setSuccessMessage("");
    const viewerWindow = window.open("", "_blank");

    if (viewerWindow) {
      viewerWindow.opener = null;
      viewerWindow.document.title = "College ID Card";
      viewerWindow.document.body.innerHTML =
        '<p style="font-family: system-ui, sans-serif; padding: 24px;">Opening college ID card...</p>';
    }

    try {
      const fileBlob = await getAdminStudentIdCard(adminToken, studentId);
      const fileUrl = URL.createObjectURL(fileBlob);

      if (viewerWindow) {
        viewerWindow.location.href = fileUrl;
      } else {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60 * 1000);
    } catch (error) {
      if (viewerWindow) {
        viewerWindow.close();
      }

      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to open college ID card."));
    } finally {
      setViewingStudentIdCardId("");
    }
  };

  const handleStudentApproval = async (studentId) => {
    setApprovingStudentId(studentId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await approveAdminStudent(adminToken, studentId);
      setSuccessMessage(response.message || "Student approved successfully");

      if (selectedEntityType === "student" && selectedEntity?._id === studentId) {
        const data = await getAdminStudentDetails(adminToken, studentId);
        setSelectedEntity(data);
      }

      await Promise.all([fetchStudents(studentFilters), fetchReports()]);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to approve student."));
    } finally {
      setApprovingStudentId("");
    }
  };

  const handleStudentRejection = async (studentId) => {
    setRejectingStudentId(studentId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await rejectAdminStudent(adminToken, studentId);
      setSuccessMessage(response.message || "Student rejected");

      if (selectedEntityType === "student" && selectedEntity?._id === studentId) {
        const data = await getAdminStudentDetails(adminToken, studentId);
        setSelectedEntity(data);
      }

      await fetchStudents(studentFilters);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to reject student."));
    } finally {
      setRejectingStudentId("");
    }
  };

  const handleConductorDetails = async (conductorId) => {
    setLoadingDetailsId(conductorId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const data = await getAdminConductorDetails(adminToken, conductorId);
      setSelectedEntity(data);
      setSelectedEntityType("conductor");
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to load conductor details."));
    } finally {
      setLoadingDetailsId("");
    }
  };

  const handleStudentDelete = async (studentId) => {
    setDeletingStudentId(studentId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await deleteAdminStudent(adminToken, studentId);
      setSuccessMessage(response.message || "Student deleted successfully");

      if (selectedEntityType === "student" && selectedEntity?._id === studentId) {
        clearSelectedEntity();
      }

      await Promise.all([fetchStudents(studentFilters), fetchTransactions(transactionFilters), fetchReports()]);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to delete student."));
    } finally {
      setDeletingStudentId("");
    }
  };

  const handleConductorDelete = async (conductorId) => {
    setDeletingConductorId(conductorId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await deleteAdminConductor(adminToken, conductorId);
      setSuccessMessage(response.message || "Conductor deleted successfully");

      if (selectedEntityType === "conductor" && selectedEntity?._id === conductorId) {
        clearSelectedEntity();
      }

      await Promise.all([fetchConductors(conductorFilters), fetchReports()]);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to delete conductor."));
    } finally {
      setDeletingConductorId("");
    }
  };

  const handleApplyStudentFilters = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await fetchStudents(studentFilters);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to search students."));
    }
  };

  const handleApplyConductorFilters = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await fetchConductors(conductorFilters);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to search conductors."));
    }
  };

  const handleApplyRouteFilters = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await fetchRoutes(routeFilters);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to search routes."));
    }
  };

  const handleApplyTransactionFilters = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await fetchTransactions(transactionFilters);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to filter transactions."));
    }
  };

  const handleResetStudentFilters = async () => {
    const nextFilters = initialStudentFilters;
    setStudentFilters(nextFilters);

    try {
      await fetchStudents(nextFilters);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to reset student filters."));
    }
  };

  const handleResetConductorFilters = async () => {
    const nextFilters = initialConductorFilters;
    setConductorFilters(nextFilters);

    try {
      await fetchConductors(nextFilters);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to reset conductor filters."));
    }
  };

  const handleResetRouteFilters = async () => {
    const nextFilters = initialRouteFilters;
    setRouteFilters(nextFilters);

    try {
      await fetchRoutes(nextFilters);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to reset route filters."));
    }
  };

  const handleResetTransactionFilters = async () => {
    const nextFilters = initialTransactionFilters;
    setTransactionFilters(nextFilters);

    try {
      await fetchTransactions(nextFilters);
    } catch (error) {
      if (handleAdminSessionError(error)) {
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to reset transaction filters."));
    }
  };

  const handleLogout = () => {
    clearSession("admin");
    navigate("/admin-login", { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_28%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-panel backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Admin Dashboard
              </p>
              <h1 className="text-3xl font-semibold text-white">
                Manage the entire bus concession system
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300">
                Review users, manage routes, filter live records, and inspect report summaries from
                one protected admin workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Logout
            </button>
          </div>

          <div className="space-y-4">
            <AlertMessage type="error" message={errorMessage} />
            <AlertMessage type="success" message={successMessage} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 text-white">
              <p className="text-sm text-slate-300">Students</p>
              <p className="mt-3 text-3xl font-semibold">{reports?.overview?.studentCount ?? students.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 text-white">
              <p className="text-sm text-slate-300">Conductors</p>
              <p className="mt-3 text-3xl font-semibold">
                {reports?.overview?.conductorCount ?? conductors.length}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 text-white">
              <p className="text-sm text-slate-300">Routes</p>
              <p className="mt-3 text-3xl font-semibold">{reports?.overview?.routeCount ?? routes.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 text-white">
              <p className="text-sm text-slate-300">Transactions</p>
              <p className="mt-3 text-3xl font-semibold">
                {reports?.overview?.transactionCount ?? transactions.length}
              </p>
            </div>
          </div>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Reports & Aggregation</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Snapshot totals, monthly movement, and route selection analytics.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchReports}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Refresh Reports
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-emerald-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Total Credits
                </p>
                <p className="mt-3 text-2xl font-semibold text-emerald-800">
                  {formatMoney(reports?.overview?.totalCredits || 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-rose-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
                  Total Debits
                </p>
                <p className="mt-3 text-2xl font-semibold text-rose-800">
                  {formatMoney(reports?.overview?.totalDebits || 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Net Wallet Movement
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {formatMoney(
                    Number(reports?.overview?.totalCredits || 0) -
                      Number(reports?.overview?.totalDebits || 0)
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-lg font-semibold text-slate-900">Monthly Transactions</h3>
                <div className="mt-4 space-y-3">
                  {reports?.monthlyTransactions?.length ? (
                    reports.monthlyTransactions.map((item) => (
                      <div
                        key={item._id}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-slate-900">{item._id}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Credits: {formatMoney(item.credits)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Debits: {formatMoney(item.debits)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Transactions: {item.transactions}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                      No monthly report data yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-lg font-semibold text-slate-900">Top Route Assignments</h3>
                <div className="mt-4 space-y-3">
                  {reports?.routeSelectionReport?.length ? (
                    reports.routeSelectionReport.map((item) => (
                      <div
                        key={item._id}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-slate-900">{item.routeLabel}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Students Assigned: {item.studentsAssigned}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Base Fare: {formatMoney(item.baseFare)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Concession: {item.concessionPercent}%
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                      No route selection report data yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Route management</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Add, edit, and remove routes with fare details.
                  </p>
                </div>

                {editingRouteId ? (
                  <button
                    type="button"
                    onClick={resetRouteForm}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>

              <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleRouteSubmit}>
                <InputField
                  label="From"
                  name="from"
                  value={routeForm.from}
                  onChange={handleRouteFormChange}
                  placeholder="Kochi"
                  disabled={isSubmittingRoute}
                />
                <InputField
                  label="To"
                  name="to"
                  value={routeForm.to}
                  onChange={handleRouteFormChange}
                  placeholder="Thrissur"
                  disabled={isSubmittingRoute}
                />
                <InputField
                  label="Base Fare"
                  name="baseFare"
                  type="number"
                  value={routeForm.baseFare}
                  onChange={handleRouteFormChange}
                  placeholder="120"
                  disabled={isSubmittingRoute}
                />
                <InputField
                  label="Concession %"
                  name="concessionPercent"
                  type="number"
                  value={routeForm.concessionPercent}
                  onChange={handleRouteFormChange}
                  placeholder="50"
                  disabled={isSubmittingRoute}
                />

                <div className="md:col-span-2">
                  <Button type="submit" isLoading={isSubmittingRoute}>
                    {editingRouteId ? "Update Route" : "Create Route"}
                  </Button>
                </div>
              </form>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                  <InputField
                    label="Search Routes"
                    name="q"
                    value={routeFilters.q}
                    onChange={handleRouteFilterChange}
                    placeholder="Search by from or to"
                  />
                  <Button type="button" onClick={handleApplyRouteFilters} variant="secondary">
                    Search
                  </Button>
                  <Button type="button" onClick={handleResetRouteFilters} variant="secondary">
                    Reset
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {isLoading ? (
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Loading routes...
                  </p>
                ) : routes.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No routes found.
                  </p>
                ) : (
                  routes.map((route) => (
                    <div
                      key={route._id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {route.from} {"->"} {route.to}
                          </p>
                          <p className="text-sm text-slate-600">
                            Base Fare: {formatMoney(route.baseFare ?? route.price)}
                          </p>
                          <p className="text-sm text-slate-600">
                            Concession: {Number(route.concessionPercent ?? 0)}%
                          </p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => handleRouteEdit(route)}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRouteDelete(route._id)}
                            disabled={deletingRouteId === route._id}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingRouteId === route._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <div className="grid gap-6">
              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Create Conductor</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Add a conductor account and assign a bus number.
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <form className="grid gap-3 md:grid-cols-2" onSubmit={handleConductorSubmit}>
                    <InputField
                      label="Conductor Name"
                      name="name"
                      value={conductorForm.name}
                      onChange={handleConductorFormChange}
                      placeholder="Enter conductor name"
                      disabled={isSubmittingConductor}
                    />
                    <InputField
                      label="Email"
                      name="email"
                      type="email"
                      value={conductorForm.email}
                      onChange={handleConductorFormChange}
                      placeholder="conductor@example.com"
                      disabled={isSubmittingConductor}
                    />
                    <InputField
                      label="Password"
                      name="password"
                      type="password"
                      value={conductorForm.password}
                      onChange={handleConductorFormChange}
                      placeholder="Enter password"
                      disabled={isSubmittingConductor}
                    />
                    <InputField
                      label="Bus Number"
                      name="bus_no"
                      value={conductorForm.bus_no}
                      onChange={handleConductorFormChange}
                      placeholder="Enter bus number"
                      disabled={isSubmittingConductor}
                    />
                    <div className="md:col-span-2">
                      <Button type="submit" isLoading={isSubmittingConductor}>
                        Create Conductor
                      </Button>
                    </div>
                  </form>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Students</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Search, filter, view details, or remove a student account.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {students.length}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_0.8fr_auto_auto]">
                    <InputField
                      label="Search"
                      name="q"
                      value={studentFilters.q}
                      onChange={handleStudentFilterChange}
                      placeholder="Name, email, student ID"
                    />
                    <InputField
                      label="College"
                      name="college"
                      value={studentFilters.college}
                      onChange={handleStudentFilterChange}
                      placeholder="Filter by college"
                    />
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-slate-700">Status</span>
                      <select
                        name="verificationStatus"
                        value={studentFilters.verificationStatus}
                        onChange={handleStudentFilterChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                      >
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </label>
                    <Button type="button" onClick={handleApplyStudentFilters} variant="secondary">
                      Search
                    </Button>
                    <Button type="button" onClick={handleResetStudentFilters} variant="secondary">
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {students.slice(0, 8).map((student) => (
                    <div key={student._id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${getVerificationBadgeClass(
                            student.verificationStatus
                          )}`}
                        >
                          {student.verificationStatus || "approved"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{student.email}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Route: {student.route ? `${student.route.from} -> ${student.route.to}` : "Not selected"}
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => handleStudentDetails(student._id)}
                          disabled={loadingDetailsId === student._id}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loadingDetailsId === student._id ? "Loading..." : "View Details"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStudentDelete(student._id)}
                          disabled={deletingStudentId === student._id}
                          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingStudentId === student._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                  {!isLoading && students.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      No students found.
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Conductors</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Search, filter, view details, or remove a conductor account.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {conductors.length}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                    <InputField
                      label="Search"
                      name="q"
                      value={conductorFilters.q}
                      onChange={handleConductorFilterChange}
                      placeholder="Name, email, bus number"
                    />
                    <InputField
                      label="Bus Number"
                      name="busNo"
                      value={conductorFilters.busNo}
                      onChange={handleConductorFilterChange}
                      placeholder="Filter by bus number"
                    />
                    <Button type="button" onClick={handleApplyConductorFilters} variant="secondary">
                      Search
                    </Button>
                    <Button type="button" onClick={handleResetConductorFilters} variant="secondary">
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {conductors.slice(0, 8).map((conductor) => (
                    <div key={conductor._id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{conductor.name}</p>
                      <p className="mt-1 text-xs text-slate-600">{conductor.email}</p>
                      <p className="mt-1 text-xs text-slate-600">Bus No: {conductor.bus_no}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => handleConductorDetails(conductor._id)}
                          disabled={loadingDetailsId === conductor._id}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loadingDetailsId === conductor._id ? "Loading..." : "View Details"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConductorDelete(conductor._id)}
                          disabled={deletingConductorId === conductor._id}
                          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingConductorId === conductor._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                  {!isLoading && conductors.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      No conductors found.
                    </p>
                  ) : null}
                </div>
              </section>
            </div>
          </div>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Transactions</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Filter payments and wallet entries by student, type, or date range.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto_auto]">
                <InputField
                  label="Search"
                  name="q"
                  value={transactionFilters.q}
                  onChange={handleTransactionFilterChange}
                  placeholder="Student or description"
                />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Type</span>
                  <select
                    name="type"
                    value={transactionFilters.type}
                    onChange={handleTransactionFilterChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  >
                    <option value="">All Types</option>
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                  </select>
                </label>
                <InputField
                  label="Date From"
                  name="dateFrom"
                  type="date"
                  value={transactionFilters.dateFrom}
                  onChange={handleTransactionFilterChange}
                />
                <InputField
                  label="Date To"
                  name="dateTo"
                  type="date"
                  value={transactionFilters.dateTo}
                  onChange={handleTransactionFilterChange}
                />
                <Button type="button" onClick={handleApplyTransactionFilters} variant="secondary">
                  Search
                </Button>
                <Button type="button" onClick={handleResetTransactionFilters} variant="secondary">
                  Reset
                </Button>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <th className="pb-3 pr-4">Student</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Description</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-slate-900">
                          {transaction.student?.name || "Unknown student"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {transaction.student?.email || "No email"}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            transaction.type === "credit"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{formatMoney(transaction.amount)}</td>
                      <td className="py-3 pr-4">{transaction.description}</td>
                      <td className="py-3">
                        {new Date(transaction.date || transaction.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!isLoading && transactions.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No transactions found.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {selectedEntity ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  {selectedEntityType === "student" ? "Student Details" : "Conductor Details"}
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                  {selectedEntity.name || "User record"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Full admin view for the selected {selectedEntityType}, including account and
                  activity-related details.
                </p>
              </div>

              <button
                type="button"
                onClick={clearSelectedEntity}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            {selectedEntityType === "student" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Name</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{selectedEntity.name}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Email</p>
                  <p className="mt-2 text-sm text-slate-900">{selectedEntity.email}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Role</p>
                  <p className="mt-2 text-sm text-slate-900">{selectedEntity.role || "student"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Verification</p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getVerificationBadgeClass(
                      selectedEntity.verificationStatus
                    )}`}
                  >
                    {selectedEntity.verificationStatus || "approved"}
                  </span>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Student ID</p>
                  <p className="mt-2 text-sm text-slate-900">{selectedEntity.student_id}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">College</p>
                  <p className="mt-2 text-sm text-slate-900">{selectedEntity.college}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Wallet Balance</p>
                  <p className="mt-2 text-sm text-slate-900">{formatMoney(selectedEntity.walletBalance)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Route</p>
                  <p className="mt-2 text-sm text-slate-900">
                    {selectedEntity.route
                      ? `${selectedEntity.route.from} -> ${selectedEntity.route.to}`
                      : "Not selected"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Base Fare</p>
                  <p className="mt-2 text-sm text-slate-900">
                    {selectedEntity.route
                      ? formatMoney(selectedEntity.route.baseFare ?? selectedEntity.route.price)
                      : "Not available"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Concession</p>
                  <p className="mt-2 text-sm text-slate-900">
                    {selectedEntity.route
                      ? `${Number(selectedEntity.route.concessionPercent ?? 0)}%`
                      : "Not available"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Created</p>
                  <p className="mt-2 text-sm text-slate-900">{formatDateTime(selectedEntity.createdAt)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Updated</p>
                  <p className="mt-2 text-sm text-slate-900">{formatDateTime(selectedEntity.updatedAt)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">College ID Card</p>
                  {selectedEntity.collegeIdCard ? (
                    <>
                      <p className="mt-2 text-sm text-slate-900">
                        {selectedEntity.collegeIdCard.originalName || "Uploaded file"}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleViewStudentIdCard(selectedEntity._id)}
                        disabled={viewingStudentIdCardId === selectedEntity._id}
                        className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {viewingStudentIdCardId === selectedEntity._id ? "Opening..." : "View ID Card"}
                      </button>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-900">Not uploaded</p>
                  )}
                </div>
                <div className="rounded-2xl bg-amber-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Verification Action</p>
                  <div className="mt-3 grid gap-2">
                    <button
                      type="button"
                      onClick={() => handleStudentApproval(selectedEntity._id)}
                      disabled={
                        selectedEntity.verificationStatus === "approved" ||
                        approvingStudentId === selectedEntity._id
                      }
                      className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {approvingStudentId === selectedEntity._id ? "Approving..." : "Approve Student"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStudentRejection(selectedEntity._id)}
                      disabled={
                        selectedEntity.verificationStatus === "rejected" ||
                        rejectingStudentId === selectedEntity._id
                      }
                      className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {rejectingStudentId === selectedEntity._id ? "Rejecting..." : "Reject Student"}
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl bg-rose-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">Admin Action</p>
                  <button
                    type="button"
                    onClick={() => handleStudentDelete(selectedEntity._id)}
                    disabled={deletingStudentId === selectedEntity._id}
                    className="mt-3 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingStudentId === selectedEntity._id ? "Deleting..." : "Delete Student"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Name</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{selectedEntity.name}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Email</p>
                  <p className="mt-2 text-sm text-slate-900">{selectedEntity.email}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Role</p>
                  <p className="mt-2 text-sm text-slate-900">{selectedEntity.role || "conductor"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Bus Number</p>
                  <p className="mt-2 text-sm text-slate-900">{selectedEntity.bus_no}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Created</p>
                  <p className="mt-2 text-sm text-slate-900">{formatDateTime(selectedEntity.createdAt)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Updated</p>
                  <p className="mt-2 text-sm text-slate-900">{formatDateTime(selectedEntity.updatedAt)}</p>
                </div>
                <div className="rounded-2xl bg-rose-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">Admin Action</p>
                  <button
                    type="button"
                    onClick={() => handleConductorDelete(selectedEntity._id)}
                    disabled={deletingConductorId === selectedEntity._id}
                    className="mt-3 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingConductorId === selectedEntity._id ? "Deleting..." : "Delete Conductor"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminDashboard;
