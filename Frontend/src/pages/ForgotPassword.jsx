import { useState } from "react";
import { Link } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { forgotStudentPassword, resetStudentPassword } from "../services/authService";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState({
    request: false,
    reset: false,
  });

  const clearFeedback = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSendResetOtp = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!email.trim()) {
      setErrorMessage("Please enter your student email.");
      return;
    }

    setLoading((current) => ({ ...current, request: true }));

    try {
      const data = await forgotStudentPassword({ email: email.trim() });
      setOtpSent(true);
      setSuccessMessage(data.message || "Password reset OTP sent successfully.");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to send reset OTP."));
    } finally {
      setLoading((current) => ({ ...current, request: false }));
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!email.trim() || !otp.trim() || !newPassword.trim()) {
      setErrorMessage("Please complete email, OTP, and new password.");
      return;
    }

    setLoading((current) => ({ ...current, reset: true }));

    try {
      const data = await resetStudentPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      setSuccessMessage(data.message || "Password reset successfully.");
      setOtp("");
      setNewPassword("");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to reset password."));
    } finally {
      setLoading((current) => ({ ...current, reset: false }));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(48,86,211,0.28),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(255,140,66,0.16),_transparent_28%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-panel backdrop-blur lg:grid-cols-[1fr_1fr]">
          <section className="hidden bg-slate-900/60 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                Password Recovery
              </span>
              <div className="space-y-4">
                <h1 className="max-w-sm text-4xl font-semibold leading-tight">
                  Reset a student password using secure OTP verification.
                </h1>
                <p className="max-w-sm text-sm leading-7 text-slate-300">
                  Request a password reset OTP by email, verify the code, then create a new password
                  without exposing sensitive account data.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Secure reset flow</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The OTP expires automatically and the backend resets the password only after a valid
                code and a compliant new password are submitted.
              </p>
            </div>
          </section>

          <section className="bg-white/95 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Forgot Password
                </p>
                <h2 className="text-3xl font-semibold text-slate-900">Reset student password</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Request the OTP first, then submit the code with a new password.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <AlertMessage type="error" message={errorMessage} />
                <AlertMessage type="success" message={successMessage} />
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSendResetOtp}>
                <InputField
                  label="Student Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="student@example.com"
                  autoComplete="email"
                  disabled={loading.request || loading.reset}
                />

                <Button type="submit" isLoading={loading.request}>
                  {otpSent ? "Resend Reset OTP" : "Send Reset OTP"}
                </Button>
              </form>

              <form className="mt-6 space-y-4 border-t border-slate-200 pt-6" onSubmit={handleResetPassword}>
                <InputField
                  label="Reset OTP"
                  name="otp"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  disabled={!otpSent || loading.request || loading.reset}
                />

                <InputField
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  disabled={!otpSent || loading.request || loading.reset}
                />

                <Button type="submit" isLoading={loading.reset} disabled={!otpSent}>
                  Reset Password
                </Button>
              </form>

              <p className="mt-6 text-sm text-slate-600">
                Back to student login?{" "}
                <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/login">
                  Go to login
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
