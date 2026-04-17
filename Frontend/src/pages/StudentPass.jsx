import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import { generateStudentPass, getStudentProfile } from "../services/routeService";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const getRouteLabel = (route) =>
  route?.from && route?.to ? `${route.from} -> ${route.to}` : "";

const getFareDetails = (route) => {
  const baseFare = Number(route?.baseFare ?? route?.price ?? 0);
  const concessionPercent = Number(route?.concessionPercent ?? 0);
  const finalFare = Math.max(
    0,
    Number((baseFare - (baseFare * concessionPercent) / 100).toFixed(2))
  );

  return { baseFare, concessionPercent, finalFare };
};

function StudentPass() {
  const navigate = useNavigate();
  const [passToken, setPassToken] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRoute, setIsCheckingRoute] = useState(true);
  const [hasSelectedRoute, setHasSelectedRoute] = useState(false);
  const [routeLabel, setRouteLabel] = useState("");
  const [fareDetails, setFareDetails] = useState({
    baseFare: 0,
    concessionPercent: 0,
    finalFare: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const checkSelectedRoute = async () => {
      setIsCheckingRoute(true);
      setErrorMessage("");

      try {
        const data = await getStudentProfile({ token });
        const selectedRoute = data?.data?.route || null;

        setHasSelectedRoute(Boolean(selectedRoute));
        setRouteLabel(getRouteLabel(selectedRoute));
        setFareDetails(getFareDetails(selectedRoute));
      } catch (error) {
        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        setErrorMessage(getApiErrorMessage(error, "Failed to load route selection."));
      } finally {
        setIsCheckingRoute(false);
      }
    };

    checkSelectedRoute();
  }, [navigate]);

  const showCopyFeedback = (message) => {
    setCopyMessage(message);
    window.setTimeout(() => {
      setCopyMessage("");
    }, 2000);
  };

  const handleGeneratePass = async () => {
    setSuccessMessage("");
    setErrorMessage("");
    setCopyMessage("");

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (!hasSelectedRoute) {
      setErrorMessage("Please select a route first before generating your pass.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await generateStudentPass({ token });
      setPassToken(data.token || "");
      setSuccessMessage(data.message || "Pass generated successfully");
      setFareDetails({
        baseFare: Number(data.baseFare ?? 0),
        concessionPercent: Number(data.concessionPercent ?? 0),
        finalFare: Number(data.finalFare ?? 0),
      });
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to generate pass."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPass = async () => {
    if (!passToken) {
      return;
    }

    try {
      await navigator.clipboard.writeText(passToken);
      showCopyFeedback("Pass Copied!");
    } catch {
      showCopyFeedback("Copy failed");
    }
  };

  const handleCopyQr = async () => {
    try {
      const canvas = document.getElementById("qrCode");

      if (!canvas) {
        throw new Error("QR canvas not found");
      }

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve);
      });

      if (!blob || typeof ClipboardItem === "undefined") {
        throw new Error("Clipboard image copy is not supported");
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);

      showCopyFeedback("QR Copied!");
    } catch {
      showCopyFeedback("Copy failed");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(48,86,211,0.26),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,140,66,0.18),_transparent_24%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-panel backdrop-blur lg:grid-cols-[1fr_1fr]">
          <section className="hidden bg-slate-900/60 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                Student Pass
              </span>
              <div className="space-y-4">
                <h1 className="max-w-sm text-4xl font-semibold leading-tight">
                  Generate, copy, and share your concession pass in one place.
                </h1>
                <p className="max-w-sm text-sm leading-7 text-slate-300">
                  The pass is generated from the backend, rendered as a QR locally from the
                  returned token, and can be copied either as text or as an image.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Before you generate</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                If no route is selected yet, the generate button stays disabled and the page
                guides you back to route selection first.
              </p>
            </div>
          </section>

          <section className="bg-white/95 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto flex w-full max-w-md flex-col justify-center">
              <div className="space-y-3 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Student Pass
                </p>
                <h2 className="text-3xl font-semibold text-slate-900">Generate your pass</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Generate the pass, copy the token, or copy the QR image directly.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <AlertMessage type="error" message={errorMessage} />
                <AlertMessage type="success" message={successMessage} />
                {copyMessage ? (
                  <AlertMessage
                    type={copyMessage === "Copy failed" ? "error" : "success"}
                    message={`✔ ${copyMessage}`}
                  />
                ) : null}
                {hasSelectedRoute && routeLabel ? (
                  <AlertMessage type="info" message={`Selected route: ${routeLabel}`} />
                ) : null}
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  isLoading={isLoading}
                  onClick={handleGeneratePass}
                  disabled={isCheckingRoute || !hasSelectedRoute}
                >
                  Generate Pass
                </Button>
              </div>

              {!isCheckingRoute && !hasSelectedRoute ? (
                <div className="mt-4 space-y-3 rounded-2xl bg-amber-50 px-4 py-4 text-center">
                  <p className="text-sm text-amber-800">
                    No route is selected yet. The generate button stays disabled until you save
                    a route first.
                  </p>
                  <Link
                    className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
                    to="/dashboard"
                  >
                    Go to Route Selection
                  </Link>
                </div>
              ) : null}

              <div className="mt-8 flex min-h-[320px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                {passToken ? (
                  <div className="w-full space-y-5">
                    <div className="flex justify-center">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <QRCodeCanvas id="qrCode" value={passToken} size={180} includeMargin />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Pass Token
                      </p>
                      <p className="mt-2 break-all text-sm leading-6 text-slate-800 select-all">
                        {passToken}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700">
                      <p>
                        <span className="font-semibold">Base Fare:</span> ₹{fareDetails.baseFare}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold">Concession %:</span> {fareDetails.concessionPercent}%
                      </p>
                      <p className="mt-1 text-base font-semibold text-emerald-700">
                        Final Fare: ₹{fareDetails.finalFare}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button type="button" variant="secondary" onClick={handleCopyPass}>
                        Copy Pass
                      </Button>
                      <Button type="button" variant="secondary" onClick={handleCopyQr}>
                        Copy QR
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="max-w-xs text-sm leading-6 text-slate-500">
                    Your generated QR pass and token will appear here.
                  </p>
                )}
              </div>

              {hasSelectedRoute ? (
                <p className="mt-6 text-center text-sm text-slate-600">
                  Need to update your route first?{" "}
                  <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/dashboard">
                    Go back to route selection
                  </Link>
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default StudentPass;
