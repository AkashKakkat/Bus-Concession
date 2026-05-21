import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import Loader from "../../components/admin/Loader";
import Pagination from "../../components/admin/Pagination";
import Table from "../../components/admin/Table";
import { formatDateTime, formatMoney, getVerificationBadgeClass } from "../../components/admin/adminFormatters";
import { useAdminAuthGuard } from "../../hooks/useAdminAuthGuard";
import {
  approveAdminStudent,
  deleteAdminStudent,
  getAdminStudentIdCard,
  getAdminStudents,
  rejectAdminStudent,
  updateAdminStudent,
} from "../../services/adminService";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

const initialFilters = { q: "", college: "", verificationStatus: "" };
const initialEditForm = { name: "", email: "", student_id: "", college: "", verificationStatus: "" };
const STUDENTS_PAGE_SIZE = 10;

function Students() {
  const { adminToken, handleAdminError } = useAdminAuthGuard();
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalStudents: 0,
  });
  const [filters, setFilters] = useState(initialFilters);
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState(initialEditForm);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadStudents = async (params = filters, page = pagination.currentPage) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await getAdminStudents(adminToken, {
        ...params,
        page,
        limit: STUDENTS_PAGE_SIZE,
      });

      setStudents(Array.isArray(data?.students) ? data.students : []);
      setPagination({
        currentPage: Number(data?.currentPage || page),
        totalPages: Number(data?.totalPages || 1),
        totalStudents: Number(data?.totalStudents || 0),
      });
    } catch (error) {
      if (!handleAdminError(error)) {
        setErrorMessage(getApiErrorMessage(error, "Failed to load students."));
      }
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    loadStudents(initialFilters, 1);
  }, [adminToken]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setEditId("");
    loadStudents(filters, 1);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setEditId("");
    loadStudents(initialFilters, 1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.currentPage || isLoading) {
      return;
    }

    setEditId("");
    loadStudents(filters, page);
  };

  const beginEdit = (student) => {
    setEditId(student._id);
    setEditForm({
      name: student.name || "",
      email: student.email || "",
      student_id: String(student.student_id || ""),
      college: student.college || "",
      verificationStatus: student.verificationStatus || "pending",
    });
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setBusyId(editId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await updateAdminStudent(adminToken, editId, {
        ...editForm,
        student_id: Number(editForm.student_id),
      });
      setSuccessMessage(response.message || "Student updated successfully.");
      setEditId("");
      await loadStudents(filters, pagination.currentPage);
    } catch (error) {
      if (!handleAdminError(error)) {
        setErrorMessage(getApiErrorMessage(error, "Failed to update student."));
      }
    } finally {
      setBusyId("");
    }
  };

  const changeVerification = async (studentId, action) => {
    setBusyId(studentId);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response =
        action === "approve"
          ? await approveAdminStudent(adminToken, studentId)
          : await rejectAdminStudent(adminToken, studentId);
      setSuccessMessage(response.message || "Student verification updated.");
      await loadStudents(filters, pagination.currentPage);
    } catch (error) {
      if (!handleAdminError(error)) {
        setErrorMessage(getApiErrorMessage(error, "Failed to update verification."));
      }
    } finally {
      setBusyId("");
    }
  };

  const deleteStudent = async (studentId) => {
    setBusyId(studentId);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await deleteAdminStudent(adminToken, studentId);
      setSuccessMessage(response.message || "Student deleted successfully.");
      await loadStudents(filters, pagination.currentPage);
    } catch (error) {
      if (!handleAdminError(error)) {
        setErrorMessage(getApiErrorMessage(error, "Failed to delete student."));
      }
    } finally {
      setBusyId("");
    }
  };

  const viewIdCard = async (studentId) => {
    setBusyId(studentId);
    try {
      const viewerWindow = window.open("", "_blank");
      const fileBlob = await getAdminStudentIdCard(adminToken, studentId);
      const fileUrl = URL.createObjectURL(fileBlob);
      if (viewerWindow) {
        viewerWindow.location.href = fileUrl;
      }
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
    } catch (error) {
      if (!handleAdminError(error)) {
        setErrorMessage(getApiErrorMessage(error, "Failed to open college ID card."));
      }
    } finally {
      setBusyId("");
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "student",
        header: "Student",
        render: (student) => (
          <div>
            <p className="font-semibold text-slate-900">{student.name}</p>
            <p className="text-xs text-slate-500">{student.email}</p>
          </div>
        ),
      },
      { key: "student_id", header: "ID" },
      { key: "college", header: "College" },
      {
        key: "route",
        header: "Route",
        render: (student) => (student.route ? `${student.route.from} to ${student.route.to}` : "Not selected"),
      },
      { key: "walletBalance", header: "Wallet", render: (student) => formatMoney(student.walletBalance) },
      {
        key: "verificationStatus",
        header: "Status",
        render: (student) => (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getVerificationBadgeClass(student.verificationStatus)}`}>
            {student.verificationStatus || "pending"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        render: (student) => (
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold" onClick={() => beginEdit(student)}>
              Edit
            </button>
            <button
              className="rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-50"
              onClick={() => changeVerification(student._id, "approve")}
              disabled={busyId === student._id || student.verificationStatus === "approved"}
            >
              Approve
            </button>
            <button
              className="rounded-md border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-50"
              onClick={() => changeVerification(student._id, "reject")}
              disabled={busyId === student._id || student.verificationStatus === "rejected"}
            >
              Reject
            </button>
            {student.collegeIdCard ? (
              <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold" onClick={() => viewIdCard(student._id)}>
                ID Card
              </button>
            ) : null}
            <button
              className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50"
              onClick={() => deleteStudent(student._id)}
              disabled={busyId === student._id}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [busyId]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Students Management</h1>
        <p className="mt-1 text-sm text-slate-600">Search, approve, edit, and manage student accounts.</p>
      </div>

      <AlertMessage type="error" message={errorMessage} />
      <AlertMessage type="success" message={successMessage} />

      <form onSubmit={applyFilters} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_220px_auto_auto]">
        <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" name="q" value={filters.q} onChange={handleFilterChange} placeholder="Search name, email, ID" />
        <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" name="college" value={filters.college} onChange={handleFilterChange} placeholder="College" />
        <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" name="verificationStatus" value={filters.verificationStatus} onChange={handleFilterChange}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Search</button>
        <button type="button" onClick={resetFilters} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Reset</button>
      </form>

      {editId ? (
        <form onSubmit={saveEdit} className="grid gap-3 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm md:grid-cols-5">
          <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" name="name" value={editForm.name} onChange={handleEditChange} placeholder="Name" />
          <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" name="email" value={editForm.email} onChange={handleEditChange} placeholder="Email" />
          <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" name="student_id" value={editForm.student_id} onChange={handleEditChange} placeholder="Student ID" />
          <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" name="college" value={editForm.college} onChange={handleEditChange} placeholder="College" />
          <div className="flex gap-2">
            <button className="flex-1 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" disabled={busyId === editId}>Save</button>
            <button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold" onClick={() => setEditId("")}>Cancel</button>
          </div>
        </form>
      ) : null}

      {!hasLoadedOnce ? (
        <Loader label="Loading students..." />
      ) : (
        <div className="space-y-4">
          <div className="relative min-h-[560px]">
            <Table columns={columns} rows={students} emptyMessage="No students found." />
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-[1px]">
                <div className="flex items-center rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
                  <span className="ml-3 text-sm font-semibold text-slate-600">Loading students...</span>
                </div>
              </div>
            ) : null}
          </div>

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalStudents}
            pageSize={STUDENTS_PAGE_SIZE}
            isLoading={isLoading}
            onPageChange={handlePageChange}
          />
        </div>
      )}
      <p className="text-xs text-slate-500">
        Page {pagination.currentPage} of {pagination.totalPages}. Last shown record:{" "}
        {formatDateTime(students[students.length - 1]?.createdAt)}
      </p>
    </div>
  );
}

export default Students;
