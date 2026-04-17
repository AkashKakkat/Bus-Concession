import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import InputField from "../components/InputField";
import {
  addWalletMoney,
  getWalletBalance,
  getWalletTransactions,
} from "../services/walletService";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

function Wallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [showTransactions, setShowTransactions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchWalletBalance = async (token) => {
    const data = await getWalletBalance({ token });
    setBalance(data.balance || 0);
  };

  const fetchTransactions = async (token) => {
    setIsLoadingTransactions(true);

    try {
      const data = await getWalletTransactions({ token });
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const loadWallet = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        await fetchWalletBalance(token);
      } catch (error) {
        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        setErrorMessage(getApiErrorMessage(error, "Failed to load wallet."));
      } finally {
        setIsLoading(false);
      }
    };

    loadWallet();
  }, [navigate]);

  const handleAddMoney = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const token = localStorage.getItem("token");
    const parsedAmount = Number(amount);

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Please enter an amount greater than 0.");
      return;
    }

    setIsAddingMoney(true);

    try {
      const data = await addWalletMoney({
        token,
        amount: parsedAmount,
      });

      setBalance(data.balance || 0);
      setAmount("");
      setSuccessMessage(data.message || "Money added successfully.");

      if (showTransactions) {
        await fetchTransactions(token);
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to add money."));
    } finally {
      setIsAddingMoney(false);
    }
  };

  const handleToggleTransactions = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (!showTransactions) {
      try {
        await fetchTransactions(token);
      } catch (error) {
        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        setErrorMessage(getApiErrorMessage(error, "Failed to load transactions."));
        return;
      }
    }

    setShowTransactions((current) => !current);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(48,86,211,0.28),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_26%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-panel backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
          <section className="hidden bg-slate-900/60 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                Student Wallet
              </span>
              <div className="space-y-4">
                <h1 className="max-w-sm text-4xl font-semibold leading-tight">
                  Manage your wallet balance and transaction history in one place.
                </h1>
                <p className="max-w-sm text-sm leading-7 text-slate-300">
                  Top up your wallet, check your available balance, and review credits and
                  debits from the latest transaction first.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Wallet flow</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Credits appear in green, debits in red, and the balance is always fetched from
                the authenticated student account.
              </p>
            </div>
          </section>

          <section className="bg-white/95 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Student Wallet
                </p>
                <h2 className="text-3xl font-semibold text-slate-900">Wallet balance</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Add money and review your transaction history.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <AlertMessage type="error" message={errorMessage} />
                <AlertMessage type="success" message={successMessage} />
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 px-6 py-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Current Balance
                </p>
                <p className="mt-3 text-4xl font-semibold text-emerald-800">
                  {isLoading ? "Loading..." : formatCurrency(balance)}
                </p>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleAddMoney}>
                <InputField
                  label="Add Money"
                  name="amount"
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Enter amount"
                  disabled={isAddingMoney || isLoading}
                />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" isLoading={isAddingMoney} disabled={isLoading}>
                    Add Money
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleToggleTransactions}
                    disabled={isLoading}
                  >
                    {showTransactions ? "Hide Transactions" : "View Transactions"}
                  </Button>
                </div>
              </form>

              {showTransactions ? (
                <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-slate-900">Transaction History</h3>
                    {isLoadingTransactions ? (
                      <span className="text-sm text-slate-500">Loading...</span>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-3">
                    {!isLoadingTransactions && transactions.length === 0 ? (
                      <p className="text-sm text-slate-500">No transactions found.</p>
                    ) : null}

                    {transactions.map((transaction) => (
                      <div
                        key={transaction._id}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p
                              className={`text-base font-semibold ${
                                transaction.type === "credit"
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                              }`}
                            >
                              {transaction.type === "credit" ? "+" : "-"}{" "}
                              {formatCurrency(transaction.amount)}
                            </p>
                            <p className="mt-1 text-sm text-slate-700">
                              {transaction.description}
                            </p>
                          </div>
                          <p className="text-xs text-slate-500">
                            {new Date(transaction.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <p className="mt-6 text-center text-sm text-slate-600">
                Need your route page?{" "}
                <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/dashboard">
                  Go back to dashboard
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Wallet;
