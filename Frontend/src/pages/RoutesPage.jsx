import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import {
  getAllRoutes,
  getStudentProfile,
  selectStudentRoute,
} from "../services/routeService";
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

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

function RoutesPage() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [savedRouteId, setSavedRouteId] = useState("");
  const [selectedRouteLabel, setSelectedRouteLabel] = useState("");
  const [hasManualSelection, setHasManualSelection] = useState(false);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasSavedRoute = Boolean(savedRouteId);
  const hasUnsavedSelection = Boolean(selectedRouteId) && hasManualSelection;
  const canOpenGeneratePass = hasSavedRoute && !hasManualSelection;
  const selectedRoutePreview =
    routes.find((route) => route._id === selectedRouteId) || null;
  const selectedRoutePreviewLabel = getRouteLabel(selectedRoutePreview);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchPageData = async () => {
      setIsLoadingRoutes(true);
      setIsLoadingProfile(true);
      setErrorMessage("");

      try {
        const [routesData, profileData] = await Promise.all([
          getAllRoutes(),
          getStudentProfile({ token }),
        ]);

        const routeList = Array.isArray(routesData) ? routesData : [];
        const selectedRoute = profileData?.data?.route || null;

        setRoutes(routeList);
        setSelectedRouteId("");
        setHasManualSelection(false);

        if (selectedRoute?._id) {
          setSavedRouteId(selectedRoute._id);
          setSelectedRouteLabel(getRouteLabel(selectedRoute));
        } else {
          setSavedRouteId("");
          setSelectedRouteLabel("");
        }
      } catch (error) {
        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        setErrorMessage(getApiErrorMessage(error, "Failed to fetch routes."));
      } finally {
        setIsLoadingRoutes(false);
        setIsLoadingProfile(false);
      }
    };

    fetchPageData();
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (!selectedRouteId) {
      setErrorMessage("Please select a route first.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await selectStudentRoute({
        routeId: selectedRouteId,
        token,
      });

      setSuccessMessage(data.message || "Route selected successfully");

      if (data?.data?.route) {
        setSavedRouteId(data.data.route._id);
        setSelectedRouteId(data.data.route._id);
        setSelectedRouteLabel(getRouteLabel(data.data.route));
        setHasManualSelection(false);
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Failed to select route."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(48,86,211,0.28),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(255,140,66,0.16),_transparent_26%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-panel backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
          <section className="hidden bg-slate-900/60 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                Route Selection
              </span>
              <div className="space-y-4">
                <h1 className="max-w-sm text-4xl font-semibold leading-tight">
                  Choose the approved bus route for your student pass.
                </h1>
                <p className="max-w-sm text-sm leading-7 text-slate-300">
                  Routes are loaded from the backend, and pass generation stays
                  locked until a route is actually saved on the student
                  profile.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">How it works</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Pick one route, save it, then the generate-pass action becomes
                available. If your session expires, you will be redirected back
                to login automatically.
              </p>
            </div>
          </section>

          <section className="bg-white/95 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
                    Student Dashboard
                  </p>
                  <h2 className="text-3xl font-semibold text-slate-900">
                    Select your route
                  </h2>
                  <p className="text-sm leading-6 text-slate-600">
                    Choose one route from the list below and save it to your
                    account.
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
                <AlertMessage type="success" message={successMessage} />
                {hasSavedRoute && selectedRouteLabel ? (
                  <AlertMessage
                    type="info"
                    message={`Selected route: ${selectedRouteLabel}`}
                  />
                ) : null}
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Available Routes
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    value={selectedRouteId}
                    onChange={(event) => {
                      setSelectedRouteId(event.target.value);
                      setHasManualSelection(Boolean(event.target.value));
                      setSuccessMessage("");
                    }}
                    disabled={isLoadingRoutes || isLoadingProfile || isSubmitting}
                  >
                    <option value="">
                      {isLoadingRoutes || isLoadingProfile
                        ? "Loading routes..."
                        : "Select a route"}
                    </option>
                    {routes.map((route) => (
                      <option key={route._id} value={route._id}>
                        {getRouteLabel(route)}
                      </option>
                    ))}
                  </select>
                </label>

                {!isLoadingRoutes && routes.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No routes are available right now.
                  </p>
                ) : null}

                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={
                    isLoadingRoutes ||
                    isLoadingProfile ||
                    routes.length === 0 ||
                    !selectedRouteId ||
                    !hasManualSelection
                  }
                >
                  Select Route
                </Button>
              </form>

              {routes.length > 0 ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Available fixed routes
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        These routes are pre-approved with fixed fares for
                        student travel.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {routes.length} routes
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {routes.map((route) => {
                      const fareDetails = getFareDetails(route);
                      const isSelected = selectedRouteId === route._id;
                      const isSaved = savedRouteId === route._id;

                      return (
                        <div
                          key={route._id}
                          className={`rounded-2xl border px-4 py-3 transition ${
                            isSelected
                              ? "border-brand-200 bg-brand-50"
                              : isSaved
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {getRouteLabel(route)}
                              </p>
                              <p className="mt-1 text-xs text-slate-600">
                                Base Fare: {formatCurrency(fareDetails.baseFare)}
                              </p>
                              <p className="mt-1 text-xs text-slate-600">
                                Student Fare: {formatCurrency(fareDetails.finalFare)}
                              </p>
                            </div>

                            {isSaved ? (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Saved
                              </span>
                            ) : isSelected ? (
                              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                                Selected
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 space-y-3">
                {hasSavedRoute && selectedRouteLabel ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="font-semibold">Saved route:</span>{" "}
                    {selectedRouteLabel}
                  </div>
                ) : null}

                {hasUnsavedSelection && selectedRoutePreviewLabel ? (
                  <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <p>
                      <span className="font-semibold">Pending route:</span>{" "}
                      {selectedRoutePreviewLabel}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold">Base Fare:</span>{" "}
                      {formatCurrency(getFareDetails(selectedRoutePreview).baseFare)}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold">Student Price:</span>{" "}
                      {formatCurrency(getFareDetails(selectedRoutePreview).finalFare)}
                    </p>
                  </div>
                ) : null}

                <div>
                  {canOpenGeneratePass ? (
                    <Link
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-200"
                      to="/generate-pass"
                    >
                      Open generate pass
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl bg-slate-300 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Open generate pass
                    </button>
                  )}
                </div>

                <p className="text-sm text-slate-600">
                  {canOpenGeneratePass
                    ? "Your route is saved. You can continue to pass generation."
                    : hasUnsavedSelection
                      ? "You selected a route in the dropdown. Click Select Route first to save it and unlock pass generation."
                      : "Select a route first to enable the generate pass button."}
                </p>
              </div>

              <p className="mt-6 text-sm text-slate-600">
                Need to manage funds?{" "}
                <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/wallet">
                  Open wallet
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default RoutesPage;
