import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { loginStudent } from "../services/authService";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const initialForm = {
  email: "",
  password: "",
};

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard", { replace: true });
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
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
      };

      const data = await loginStudent(payload);

      localStorage.setItem("token", data.token);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Login failed. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(48,86,211,0.28),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(255,140,66,0.18),_transparent_26%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-panel backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden flex-col justify-between bg-slate-900/60 p-10 text-white lg:flex">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                Student Login
              </span>
              <div className="space-y-4">
                <h1 className="max-w-md text-4xl font-semibold leading-tight">
                  Access your bus concession account in a secure, simple flow.
                </h1>
                <p className="max-w-md text-sm leading-7 text-slate-300">
                  Sign in with your registered student email and password. On success, your
                  JWT is stored locally and you are redirected to the route selection area.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">Secure session handling</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  The login flow stores the issued JWT in `localStorage` using the required
                  `token` key for upcoming protected API calls.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">Backend-driven feedback</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  API errors are surfaced directly so invalid credentials and missing users are
                  shown clearly.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white/95 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Welcome Back
                </p>
                <h2 className="text-3xl font-semibold text-slate-900">Login to continue</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Enter your student credentials to continue to route selection.
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
                  placeholder="student@example.com"
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
                  Login
                </Button>
              </form>

              <p className="mt-6 text-sm text-slate-600">
                New student account?{" "}
                <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/signup">
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

export default LoginPage;
