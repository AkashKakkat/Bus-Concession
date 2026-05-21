import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import Loader from "../../components/admin/Loader";
import Pagination from "../../components/admin/Pagination";
import Table from "../../components/admin/Table";
import { formatDateTime, formatMoney, getPaymentStatusBadgeClass, getTransactionBadgeClass } from "../../components/admin/adminFormatters";
import { useAdminAuthGuard } from "../../hooks/useAdminAuthGuard";
import { getAdminTransactions } from "../../services/adminService";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

const initialFilters = { q: "", type: "", paymentStatus: "", dateFrom: "", dateTo: "" };
const TRANSACTIONS_PAGE_SIZE = 10;

function Transactions() {
  const { adminToken, handleAdminError } = useAdminAuthGuard();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTransactions: 0,
  });
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadTransactions = async (params = filters, page = pagination.currentPage) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await getAdminTransactions(adminToken, {
        ...params,
        page,
        limit: TRANSACTIONS_PAGE_SIZE,
      });

      setTransactions(Array.isArray(data?.transactions) ? data.transactions : []);
      setPagination({
        currentPage: Number(data?.currentPage || page),
        totalPages: Number(data?.totalPages || 1),
        totalTransactions: Number(data?.totalTransactions || 0),
      });
    } catch (error) {
      if (!handleAdminError(error)) {
        setErrorMessage(getApiErrorMessage(error, "Failed to load transactions."));
      }
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    loadTransactions(initialFilters, 1);
  }, [adminToken]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    loadTransactions(filters, 1);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    loadTransactions(initialFilters, 1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.currentPage || isLoading) {
      return;
    }

    loadTransactions(filters, page);
  };

  const columns = useMemo(
    () => [
      {
        key: "student",
        header: "Student",
        render: (transaction) => (
          <div>
            <p className="font-semibold text-slate-900">{transaction.student?.name || "Unknown student"}</p>
            <p className="text-xs text-slate-500">{transaction.student?.email || "No email"}</p>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        render: (transaction) => (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getTransactionBadgeClass(transaction.type)}`}>
            {transaction.type}
          </span>
        ),
      },
      {
        key: "paymentStatus",
        header: "Payment Status",
        render: (transaction) => (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getPaymentStatusBadgeClass(transaction.paymentStatus || "success")}`}>
            {transaction.paymentStatus || "success"}
          </span>
        ),
      },
      { key: "amount", header: "Amount", render: (transaction) => formatMoney(transaction.amount) },
      { key: "description", header: "Description" },
      {
        key: "gateway",
        header: "Gateway IDs",
        render: (transaction) => (
          <div className="space-y-1 text-xs text-slate-600">
            <p>{transaction.razorpayPaymentId || "No payment id"}</p>
            <p>{transaction.razorpayOrderId || "No order id"}</p>
          </div>
        ),
      },
      { key: "date", header: "Date", render: (transaction) => formatDateTime(transaction.date || transaction.createdAt) },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Transactions</h1>
        <p className="mt-1 text-sm text-slate-600">Search wallet activity by student, payment status, and date.</p>
      </div>

      <AlertMessage type="error" message={errorMessage} />

      <form
        onSubmit={applyFilters}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_150px_170px_160px_160px_auto_auto]"
      >
        <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" name="q" value={filters.q} onChange={handleFilterChange} placeholder="Search student or description" />
        <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" name="type" value={filters.type} onChange={handleFilterChange}>
          <option value="">All types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" name="paymentStatus" value={filters.paymentStatus} onChange={handleFilterChange}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" name="dateFrom" type="date" value={filters.dateFrom} onChange={handleFilterChange} />
        <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" name="dateTo" type="date" value={filters.dateTo} onChange={handleFilterChange} />
        <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Filter</button>
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold"
        >
          Reset
        </button>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-700">{pagination.totalTransactions} transactions ready for export</p>
          <p className="text-xs text-slate-500">Table columns are arranged for clean CSV copy/export workflows.</p>
        </div>
      </div>

      {!hasLoadedOnce ? (
        <Loader label="Loading transactions..." />
      ) : (
        <div className="space-y-4">
          <div className="relative min-h-[560px]">
            <Table columns={columns} rows={transactions} emptyMessage="No transactions found." />
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-[1px]">
                <div className="flex items-center rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
                  <span className="ml-3 text-sm font-semibold text-slate-600">Loading transactions...</span>
                </div>
              </div>
            ) : null}
          </div>

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalTransactions}
            pageSize={TRANSACTIONS_PAGE_SIZE}
            isLoading={isLoading}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <p className="text-xs text-slate-500">
        Page {pagination.currentPage} of {pagination.totalPages}. Showing {transactions.length} transaction records.
      </p>
    </div>
  );
}

export default Transactions;
