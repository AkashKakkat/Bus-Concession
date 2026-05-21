import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { useAuth } from "../context/AuthContext";
import { loginAdmin } from "../services/authService";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const initialForm = {
  email: "",
  password: "",
};

function AdminLogin() {
  const navigate = useNavigate();
  const { setSession, adminToken, adminRole } = useAuth();
  const [formData, setFormData] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (adminToken && adminRole === "admin") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [adminRole, adminToken, navigate]);

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
      setErrorMessage("Please enter admin email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginAdmin({
        email: formData.email.trim(),
        password: formData.password,
      });

      setSession("admin", data.token, data.role || "admin");
      navigate("/admin/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Admin login failed."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.45),_transparent_34%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-panel backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-slate-900/70 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                Admin Access
              </span>
              <div className="space-y-4">
                <h1 className="max-w-md text-4xl font-semibold leading-tight">
                  Control students, conductors, routes, and payments from one admin panel.
                </h1>
                <p className="max-w-md text-sm leading-7 text-slate-300">
                  Admin access is isolated with its own token, its own dashboard, and backend
                  role checks on every protected endpoint.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Role-aware protection</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The dashboard only opens when the JWT belongs to an admin. Frontend state is
                helpful, but the backend remains the source of truth.
              </p>
            </div>
          </section>

          <section className="bg-white/95 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto flex w-full max-w-md flex-col justify-center">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  Admin Login
                </p>
                <h2 className="text-3xl font-semibold text-slate-900">Open admin dashboard</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Sign in with admin credentials to manage the system safely.
                </p>
              </div>

              <div className="mt-6">
                <AlertMessage type="error" message={errorMessage} />
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <InputField
                  label="Admin Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                />

                <InputField
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  disabled={isLoading}
                />

                <Button type="submit" isLoading={isLoading}>
                  Login as Admin
                </Button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
