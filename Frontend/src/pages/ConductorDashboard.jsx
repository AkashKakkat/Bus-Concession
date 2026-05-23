import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrReader } from "react-qr-reader";
import { toast } from "react-toastify";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { useAuth } from "../context/AuthContext";
import {
  createConductorPaymentOrder,
  getConductorPaymentHistory,
  markConductorPaymentFailed,
  verifyConductorPayment,
} from "../services/paymentService";
import { verifyStudentPass } from "../services/routeService";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import { loadRazorpay } from "../utils/loadRazorpay";

const initialForm = {
  token: "",
  currentFrom: "",
  currentTo: "",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const shouldForceConductorLogout = (error) => {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || "").toLowerCase();

  if (status !== 401) {
    return false;
  }

  return (
    message.includes("token required") ||
    message.includes("invalid token format") ||
    message === "invalid token"
  );
};

function ConductorDashboard() {
  const navigate = useNavigate();
  const { conductorToken, clearSession } = useAuth();
  const [formData, setFormData] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [cameraMessage, setCameraMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRazorpayPaying, setIsRazorpayPaying] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [activeRazorpayOrderId, setActiveRazorpayOrderId] = useState("");
  const isPaymentButtonDisabled =
    isRazorpayPaying ||
    paymentCompleted ||
    Boolean(result?.payment) ||
    Boolean(activeRazorpayOrderId);

  useEffect(() => {
    if (!conductorToken) {
      navigate("/conductor-login", { replace: true });
      return;
    }

    const loadPaymentHistory = async () => {
      setIsLoadingHistory(true);

      try {
        const data = await getConductorPaymentHistory({ conductorToken });
        setPaymentHistory(Array.isArray(data.transactions) ? data.transactions : []);
      } catch (error) {
        if (shouldForceConductorLogout(error)) {
          clearSession("conductor");
          navigate("/conductor-login", { replace: true });
          return;
        }

        if (error?.response?.status === 404) {
          setPaymentHistory([]);
          return;
        }

        setErrorMessage(getApiErrorMessage(error, "Failed to load payment history."));
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadPaymentHistory();
  }, [clearSession, conductorToken, navigate]);

  const prependPaymentHistory = (transaction) => {
    if (!transaction?._id) {
      return;
    }

    setPaymentHistory((current) => {
      const withoutDuplicate = current.filter((item) => item._id !== transaction._id);
      return [transaction, ...withoutDuplicate];
    });
  };

  const applyPaymentResult = (data) => {
    if (data.transaction) {
      prependPaymentHistory(data.transaction);
    }

    setResult((current) =>
      current
        ? {
            ...current,
            baseFare: data.baseFare,
            concessionPercent: data.concessionPercent,
            finalFare: data.finalFare,
            payment: {
              amount: data.amount,
              paidAt: data.paidAt,
              paymentProvider: data.transaction?.paymentProvider || "razorpay",
              paymentStatus: data.transaction?.paymentStatus || "success",
              razorpayPaymentId: data.transaction?.razorpayPaymentId || null,
            },
          }
        : current
    );
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleScanToggle = () => {
    setCameraMessage("");
    setScanning((current) => !current);
  };

  const handleScanResult = (scanResult) => {
    if (!scanResult?.text) {
      return;
    }

    setFormData((current) => ({
      ...current,
      token: scanResult.text,
    }));
    setCameraMessage("QR code scanned successfully.");
    setScanning(false);
  };

  const handleScanError = (error) => {
    if (!error) {
      return;
    }

    setCameraMessage("Unable to access camera. Please allow camera permission or paste the token manually.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setResult(null);
    setPaymentCompleted(false);
    setIsRazorpayPaying(false);
    setActiveRazorpayOrderId("");

    if (!formData.token.trim() || !formData.currentFrom.trim() || !formData.currentTo.trim()) {
      setErrorMessage("Please enter the QR token, current from, and current to.");
      return;
    }

    if (!conductorToken) {
      navigate("/conductor-login", { replace: true });
      return;
    }

    setIsLoading(true);

    try {
      const data = await verifyStudentPass({
        token: formData.token.trim(),
        currentFrom: formData.currentFrom.trim(),
        currentTo: formData.currentTo.trim(),
        conductorToken,
      });

      setResult({
        isValid: true,
        message: data.message || "Valid Pass",
        student: data.student,
        route: data.route,
        baseFare: data.baseFare,
        concessionPercent: data.concessionPercent,
        finalFare: data.finalFare,
      });
      setCameraMessage("");
    } catch (error) {
      if (shouldForceConductorLogout(error)) {
        clearSession("conductor");
        navigate("/conductor-login", { replace: true });
        return;
      }

      setResult({
        isValid: false,
        message: getApiErrorMessage(error, "Invalid Pass"),
        student: null,
        route: error?.response?.data?.AllowedRoute || null,
      });
      setErrorMessage(getApiErrorMessage(error, "Invalid Pass"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (isPaymentButtonDisabled) {
      return;
    }

    if (activeRazorpayOrderId) {
      setErrorMessage("A Razorpay payment is already in progress.");
      return;
    }

    if (!conductorToken) {
      navigate("/conductor-login", { replace: true });
      return;
    }

    setErrorMessage("");
    setIsRazorpayPaying(true);

    try {
      await loadRazorpay();

      const order = await createConductorPaymentOrder({
        conductorToken,
        token: formData.token.trim(),
        currentFrom: formData.currentFrom.trim(),
        currentTo: formData.currentTo.trim(),
      });
      setActiveRazorpayOrderId(order.orderId || "");

      const razorpay = new window.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "Bus Concession",
        description: "Bus Travel Payment",
        order_id: order.orderId,
        handler: async (paymentResponse) => {
          try {
            const data = await verifyConductorPayment({
              conductorToken,
              payment: {
                ...paymentResponse,
                token: formData.token.trim(),
                currentFrom: formData.currentFrom.trim(),
                currentTo: formData.currentTo.trim(),
              },
            });

            setPaymentCompleted(true);
            applyPaymentResult(data);
            toast.success("Razorpay payment successful.");
          } catch (error) {
            if (shouldForceConductorLogout(error)) {
              clearSession("conductor");
              navigate("/conductor-login", { replace: true });
              return;
            }

            const message = getApiErrorMessage(error, "Payment verification failed.");
            setErrorMessage(message);
          } finally {
            setIsRazorpayPaying(false);
            setActiveRazorpayOrderId("");
          }
        },
        modal: {
          ondismiss: async () => {
            try {
              await markConductorPaymentFailed({
                conductorToken,
                orderId: order.orderId,
                reason: "Payment cancelled",
              });
            } catch {
              // Keep UX smooth even if cancellation sync fails.
            } finally {
              setErrorMessage("Razorpay payment was cancelled.");
              toast.info("Razorpay payment was cancelled.");
              setIsRazorpayPaying(false);
              setActiveRazorpayOrderId("");
            }
          },
        },
        theme: {
          color: "#3056d3",
        },
      });

      razorpay.on("payment.failed", async (response) => {
        try {
          await markConductorPaymentFailed({
            conductorToken,
            orderId: order.orderId,
            reason: response?.error?.description || "Payment failed",
          });
        } catch {
          // Show failure even if backend failure-sync fails.
        } finally {
          const message =
            response?.error?.description || "Razorpay payment failed. Please try again.";
          setErrorMessage(message);
          setIsRazorpayPaying(false);
          setActiveRazorpayOrderId("");
        }
      });

      razorpay.open();
      setIsRazorpayPaying(false);

      window.setTimeout(() => {
        setActiveRazorpayOrderId((current) => (current === order.orderId ? "" : current));
      }, 30000);
    } catch (error) {
      if (shouldForceConductorLogout(error)) {
        setIsRazorpayPaying(false);
        setActiveRazorpayOrderId("");
        clearSession("conductor");
        navigate("/conductor-login", { replace: true });
        return;
      }

      const message = getApiErrorMessage(error, "Unable to start Razorpay payment.");
      setErrorMessage(message);
      setIsRazorpayPaying(false);
      setActiveRazorpayOrderId("");
    }
  };

  const handleLogout = () => {
    clearSession("conductor");
    navigate("/conductor-login", { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(48,86,211,0.28),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(239,68,68,0.16),_transparent_24%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-panel backdrop-blur lg:grid-cols-[1fr_1fr]">
          <section className="hidden bg-slate-900/60 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                Conductor Panel
              </span>
              <div className="space-y-4">
                <h1 className="max-w-sm text-4xl font-semibold leading-tight">
                  Verify student passes and complete travel payments cleanly.
                </h1>
                <p className="max-w-sm text-sm leading-7 text-slate-300">
                  Scan or paste the QR token, verify the route, review the fare breakdown, then
                  collect payment through Razorpay in the conductor panel.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Payment flow</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                After pass verification succeeds, open Razorpay checkout and collect the travel
                fare once for that journey.
              </p>
            </div>
          </section>

          <section className="bg-white/95 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
                    Conductor Panel
                  </p>
                  <h2 className="text-3xl font-semibold text-slate-900">Verify Pass</h2>
                  <p className="text-sm leading-6 text-slate-600">
                    Scan or paste the QR token, verify the pass, then collect payment.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Logout
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <AlertMessage type="error" message={errorMessage} />
                <AlertMessage
                  type={cameraMessage === "QR code scanned successfully." ? "success" : "info"}
                  message={cameraMessage}
                />
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-3">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Token (QR scan result)</span>
                    <textarea
                      name="token"
                      value={formData.token}
                      onChange={handleChange}
                      placeholder="Paste scanned QR token"
                      rows={5}
                      disabled={isLoading || isRazorpayPaying}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>

                  <Button
                    type="button"
                    variant={scanning ? "secondary" : "primary"}
                    onClick={handleScanToggle}
                    disabled={isLoading || isRazorpayPaying}
                  >
                    {scanning ? "Close Scanner" : "Scan QR"}
                  </Button>
                </div>

                {scanning ? (
                  <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="overflow-hidden rounded-2xl">
                      <QrReader
                        constraints={{ facingMode: "environment" }}
                        onResult={handleScanResult}
                        onError={handleScanError}
                        scanDelay={500}
                        videoStyle={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "1rem",
                        }}
                        containerStyle={{
                          width: "100%",
                          borderRadius: "1rem",
                          overflow: "hidden",
                        }}
                      />
                    </div>
                    <p className="mt-3 text-center text-sm text-slate-600">
                      Point the camera at the QR code. The scanner will stop automatically after
                      a successful scan.
                    </p>
                  </div>
                ) : null}

                <InputField
                  label="Current From"
                  name="currentFrom"
                  value={formData.currentFrom}
                  onChange={handleChange}
                  placeholder="Enter current from"
                  disabled={isLoading || isRazorpayPaying}
                />

                <InputField
                  label="Current To"
                  name="currentTo"
                  value={formData.currentTo}
                  onChange={handleChange}
                  placeholder="Enter current to"
                  disabled={isLoading || isRazorpayPaying}
                />

                <Button type="submit" isLoading={isLoading} disabled={isRazorpayPaying}>
                  Verify Pass
                </Button>
              </form>

              {result ? (
                <div
                  className={`mt-8 rounded-[1.75rem] border px-5 py-5 ${
                    result.isValid
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-rose-200 bg-rose-50"
                  }`}
                >
                  <p
                    className={`text-lg font-semibold ${
                      result.isValid ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {result.isValid ? "Valid Pass" : "Invalid Pass"}
                  </p>

                  <p
                    className={`mt-2 text-sm ${
                      result.isValid ? "text-emerald-800" : "text-rose-800"
                    }`}
                  >
                    {result.message}
                  </p>

                  {result.isValid && result.student ? (
                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                      <p>
                        <span className="font-semibold">Student Name:</span> {result.student.Name}
                      </p>
                      <p className="break-words">
                        <span className="font-semibold">Student Email:</span> {result.student.Email}
                      </p>
                      {result.route ? (
                        <>
                          <p>
                            <span className="font-semibold">Route:</span> {result.route.from} {"->"}{" "}
                            {result.route.to}
                          </p>
                          <p>
                            <span className="font-semibold">Base Fare:</span> Rs.{result.baseFare}
                          </p>
                          <p>
                            <span className="font-semibold">Concession:</span> {result.concessionPercent}%
                          </p>
                          <p className="font-semibold text-emerald-700">
                            <span className="font-semibold">Final Fare:</span> Rs.{result.finalFare}
                          </p>
                        </>
                      ) : null}
                    </div>
                  ) : null}

                  {result.isValid ? (
                    <div className="mt-5 space-y-3">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleRazorpayPayment}
                        isLoading={isRazorpayPaying}
                        disabled={isPaymentButtonDisabled}
                      >
                        {isPaymentButtonDisabled && !isRazorpayPaying
                          ? "Payment Completed"
                          : "Pay with Razorpay"}
                      </Button>
                    </div>
                  ) : null}

                  {result.payment ? (
                    <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-700">
                      <p>
                        <span className="font-semibold">Base Fare:</span> Rs.{result.baseFare}
                      </p>
                      <p>
                        <span className="font-semibold">Student Discount:</span> -Rs.
                        {Number(result.baseFare) - Number(result.finalFare)}
                      </p>
                      <p className="font-semibold text-emerald-700">
                        <span className="font-semibold">Final Payable:</span> Rs.{result.payment.amount}
                      </p>
                      <p>
                        <span className="font-semibold">Payment Method:</span>{" "}
                        {(result.payment.paymentProvider || "razorpay").toUpperCase()}
                      </p>
                      {result.payment.razorpayPaymentId ? (
                        <p>
                          <span className="font-semibold">Razorpay Payment ID:</span>{" "}
                          {result.payment.razorpayPaymentId}
                        </p>
                      ) : null}
                      <p>
                        <span className="font-semibold">Date:</span> {result.payment.paidAt}
                      </p>
                    </div>
                  ) : null}

                  {!result.isValid && result.route ? (
                    <p className="mt-4 text-sm text-rose-800">
                      <span className="font-semibold">Allowed Route:</span> {result.route}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Payment History</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Latest payments collected from this conductor account.
                    </p>
                  </div>
                  {isLoadingHistory ? (
                    <span className="text-xs font-semibold text-slate-500">Loading...</span>
                  ) : (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {paymentHistory.length}
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  {!isLoadingHistory && paymentHistory.length === 0 ? (
                    <p className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                      No payment history found.
                    </p>
                  ) : null}

                  {paymentHistory.map((payment) => (
                    <div
                      key={payment._id}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {payment.student?.name || "Unknown student"}
                          </p>
                          <p className="mt-1 break-all text-xs text-slate-600">
                            {payment.student?.email || "No email"}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-rose-600">
                          - {formatCurrency(payment.amount)}
                        </p>
                      </div>

                      {payment.route?.from && payment.route?.to ? (
                        <p className="mt-2 text-xs text-slate-600">
                          {payment.route.from} {"->"} {payment.route.to}
                        </p>
                      ) : null}

                      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span>
                          {(payment.description || "Bus Travel Payment")} {" "}
                          {payment.paymentProvider ? `(${String(payment.paymentProvider).toUpperCase()})` : ""}
                        </span>
                        <span>{payment.date ? new Date(payment.date).toLocaleString() : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ConductorDashboard;
