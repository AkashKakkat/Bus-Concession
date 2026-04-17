import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { signupConductor } from "../services/authService";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const initialForm = {
  name: "",
  email: "",
  password: "",
  bus_no: "",
};

function ConductorSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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
    setSuccessMessage("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.bus_no.trim()
    ) {
      setErrorMessage("Please fill in all conductor signup fields.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await signupConductor({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        bus_no: formData.bus_no.trim(),
      });

      setSuccessMessage(data.message || "Conductor account created successfully.");
      setFormData(initialForm);
      window.setTimeout(() => {
        navigate("/conductor-login", { replace: true });
      }, 1200);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Conductor signup failed."));
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
                Conductor Signup
              </span>
              <div className="space-y-4">
                <h1 className="max-w-md text-4xl font-semibold leading-tight">
                  Create a conductor account for bus-side pass verification.
                </h1>
                <p className="max-w-md text-sm leading-7 text-slate-300">
                  Register a conductor with name, email, password, and bus number, then sign in
                  to access the conductor dashboard.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">What happens next</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                After signup succeeds, this page redirects to conductor login so the new account
                can start verifying student passes immediately.
              </p>
            </div>
          </section>

          <section className="bg-white/95 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto flex w-full max-w-md flex-col justify-center">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
                  New Conductor
                </p>
                <h2 className="text-3xl font-semibold text-slate-900">Create conductor account</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Fill in the required details to register a conductor.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <AlertMessage type="error" message={errorMessage} />
                <AlertMessage type="success" message={successMessage} />
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <InputField
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  disabled={isLoading}
                />

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
                  placeholder="Enter password"
                  autoComplete="new-password"
                  disabled={isLoading}
                />

                <InputField
                  label="Bus Number"
                  name="bus_no"
                  value={formData.bus_no}
                  onChange={handleChange}
                  placeholder="Enter bus number"
                  disabled={isLoading}
                />

                <Button type="submit" isLoading={isLoading}>
                  Create Conductor Account
                </Button>
              </form>

              <p className="mt-6 text-sm text-slate-600">
                Already registered?{" "}
                <Link
                  className="font-semibold text-brand-600 hover:text-brand-700"
                  to="/conductor-login"
                >
                  Go to conductor login
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ConductorSignup;
