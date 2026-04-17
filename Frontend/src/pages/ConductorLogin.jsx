import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { loginConductor } from "../services/authService";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const initialForm = {
  email: "",
  password: "",
};

function ConductorLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("conductorToken")) {
      navigate("/conductor-dashboard", { replace: true });
    }
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!formData.email.trim() || !formData.password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginConductor({
        email: formData.email.trim(),
        password: formData.password,
      });

      localStorage.setItem("conductorToken", data.token);
      navigate("/conductor-dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Conductor login failed."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(48,86,211,0.28),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(255,140,66,0.18),_transparent_26%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-panel backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-slate-900/60 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                Conductor Access
              </span>
              <div className="space-y-4">
                <h1 className="max-w-md text-4xl font-semibold leading-tight">
                  Login as conductor to verify live student passes.
                </h1>
                <p className="max-w-md text-sm leading-7 text-slate-300">
                  Your conductor JWT is stored separately in local storage and used for the
                  protected pass verification endpoint.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Protected workflow</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                After login, you will be redirected to the conductor dashboard where scanned QR
                tokens can be verified against the current route.
              </p>
            </div>
          </section>

          <section className="bg-white/95 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto flex w-full max-w-md flex-col justify-center">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Conductor Login
                </p>
                <h2 className="text-3xl font-semibold text-slate-900">Access conductor panel</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Sign in with conductor credentials to continue.
                </p>
              </div>

              <div className="mt-6">
                <AlertMessage type="error" message={errorMessage} />
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="conductor@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                />

                <InputField
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                />

                <Button type="submit" isLoading={isLoading}>
                  Login as Conductor
                </Button>
              </form>

              <p className="mt-6 text-sm text-slate-600">
                Need a new conductor account?{" "}
                <Link
                  className="font-semibold text-brand-600 hover:text-brand-700"
                  to="/conductor-signup"
                >
                  Create one here
                </Link>
              </p>

            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ConductorLogin;
