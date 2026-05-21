import { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import Loader from "../../components/admin/Loader";
import StatsCard from "../../components/admin/StatsCard";
import { formatMoney } from "../../components/admin/adminFormatters";
import { useAdminAuthGuard } from "../../hooks/useAdminAuthGuard";
import { getAdminReports, getAdminTransactions } from "../../services/adminService";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

function Dashboard() {
  const { adminToken, handleAdminError } = useAdminAuthGuard();
  const [reports, setReports] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadOverview = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [reportData, transactionData] = await Promise.all([
        getAdminReports(adminToken),
        getAdminTransactions(adminToken, {}),
      ]);
      setReports(reportData);
      setRecentTransactions(Array.isArray(transactionData) ? transactionData.slice(0, 6) : []);
    } catch (error) {
      if (!handleAdminError(error)) {
        setErrorMessage(getApiErrorMessage(error, "Failed to load dashboard overview."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [adminToken]);

  if (isLoading) {
    return <Loader label="Loading admin overview..." />;
  }

  const overview = reports?.overview || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-slate-600">System totals, wallet movement, and recent activity.</p>
      </div>

      <AlertMessage type="error" message={errorMessage} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Students" value={overview.studentCount || 0} helper="Registered student accounts" />
        <StatsCard label="Conductors" value={overview.conductorCount || 0} tone="sky" helper="Active conductor records" />
        <StatsCard label="Routes" value={overview.routeCount || 0} tone="amber" helper="Configured bus routes" />
        <StatsCard label="Transactions" value={overview.transactionCount || 0} tone="rose" helper="Wallet activity entries" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total Credits</p>
          <p className="mt-3 text-2xl font-semibold text-emerald-700">{formatMoney(overview.totalCredits)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total Debits</p>
          <p className="mt-3 text-2xl font-semibold text-rose-700">{formatMoney(overview.totalDebits)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Net Wallet Movement</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {formatMoney(Number(overview.totalCredits || 0) - Number(overview.totalDebits || 0))}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Monthly Transactions</h2>
          <div className="mt-4 space-y-3">
            {reports?.monthlyTransactions?.length ? (
              reports.monthlyTransactions.map((item) => (
                <div key={item._id} className="rounded-lg bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item._id}</p>
                    <p className="text-sm text-slate-500">{item.transactions} transactions</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: `${Math.min(100, ((item.credits || 0) / Math.max(1, (item.credits || 0) + (item.debits || 0))) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Credits {formatMoney(item.credits)} · Debits {formatMoney(item.debits)}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No monthly report data yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Recent Activities</h2>
          <div className="mt-4 space-y-3">
            {recentTransactions.length ? (
              recentTransactions.map((transaction) => (
                <div key={transaction._id} className="rounded-lg bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{transaction.student?.name || "Unknown student"}</p>
                      <p className="mt-1 text-sm text-slate-500">{transaction.description}</p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold text-slate-900">{formatMoney(transaction.amount)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No recent transactions found.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
