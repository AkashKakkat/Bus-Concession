import { useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import InputField from "../components/InputField";
import StepBadge from "../components/StepBadge";
import {
  sendOtp,
  signupStudent,
  verifyOtp,
} from "../services/authService";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const initialSignupForm = {
  student_id: "",
  name: "",
  email: "",
  password: "",
  college: "",
};

function SignupPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [isVerified, setIsVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [signupCompleted, setSignupCompleted] = useState(false);
  const [globalMessage, setGlobalMessage] = useState({
    type: "",
    text: "",
  });
  const [loading, setLoading] = useState({
    sendOtp: false,
    verifyOtp: false,
    signup: false,
  });

  const signupEnabled = useMemo(() => isVerified && signupForm.email === email, [
    isVerified,
    signupForm.email,
    email,
  ]);

  const setMessage = (type, text) => {
    setGlobalMessage({ type, text });
  };

  const clearMessages = () => {
    setGlobalMessage({ type: "", text: "" });
    setSubmitSuccess("");
  };

  const handleVerifiedEmailSync = (nextEmail) => {
    setSignupCompleted(false);
    setEmail(nextEmail);
    setSignupForm((current) => ({
      ...current,
      email: nextEmail,
    }));

    if (isVerified && nextEmail !== signupForm.email) {
      setIsVerified(false);
      setMessage("info", "Email changed. Please verify the new email before signing up.");
    }
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!email.trim()) {
      setMessage("error", "Please enter your email first.");
      return;
    }

    setLoading((current) => ({ ...current, sendOtp: true }));

    try {
      const data = await sendOtp({ email: email.trim() });
      setOtpSent(true);
      setIsVerified(false);
      setSignupCompleted(false);
      setOtp("");
      setMessage("success", data.message || "OTP sent successfully.");
    } catch (error) {
      setMessage("error", getApiErrorMessage(error, "Failed to send OTP."));
    } finally {
      setLoading((current) => ({ ...current, sendOtp: false }));
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!otpSent) {
      setMessage("error", "Request an OTP before trying to verify it.");
      return;
    }

    if (!otp.trim()) {
      setMessage("error", "Please enter the OTP.");
      return;
    }

    setLoading((current) => ({ ...current, verifyOtp: true }));

    try {
      const data = await verifyOtp({ email: email.trim(), otp: otp.trim() });
      setIsVerified(true);
      setSignupCompleted(false);
      setSignupForm((current) => ({
        ...current,
        email: email.trim(),
      }));
      setMessage("success", data.message || "OTP verified successfully.");
    } catch (error) {
      setIsVerified(false);
      setMessage("error", getApiErrorMessage(error, "OTP verification failed."));
    } finally {
      setLoading((current) => ({ ...current, verifyOtp: false }));
    }
  };

  const handleSignupInputChange = (event) => {
    const { name, value } = event.target;

    setSignupForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (name === "email") {
      handleVerifiedEmailSync(value);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!signupEnabled) {
      setMessage("error", "Please verify your email with OTP before signing up.");
      return;
    }

    setLoading((current) => ({ ...current, signup: true }));

    try {
      const payload = {
        ...signupForm,
        email: email.trim(),
      };

      const data = await signupStudent(payload);
      setSubmitSuccess(data.message || "Signup completed successfully.");
      setSignupCompleted(true);
      setOtp("");
      setOtpSent(false);
      setIsVerified(false);
      setEmail("");
      setSignupForm(initialSignupForm);
    } catch (error) {
      setMessage("error", getApiErrorMessage(error, "Signup failed."));
    } finally {
      setLoading((current) => ({ ...current, signup: false }));
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(48,86,211,0.3),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(255,140,66,0.2),_transparent_28%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/5 p-8 text-white backdrop-blur md:p-10">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                Bus Concession System
              </span>
              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
                  Student signup with OTP verification, built for a safer onboarding flow.
                </h1>
                <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  Verify the student email first, then unlock the registration form. This page
                  keeps the OTP flow explicit, prevents early signup, and shows backend
                  responses clearly at every step.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              <StepBadge
                step="1"
                title="Send OTP"
                description="Request a one-time password for the student email."
                active={!otpSent}
                complete={otpSent}
              />
              <StepBadge
                step="2"
                title="Verify OTP"
                description="Confirm the code before enabling the signup form."
                active={otpSent && !isVerified}
                complete={isVerified || signupCompleted}
              />
              <StepBadge
                step="3"
                title="Complete Signup"
                description="Create the student account only after verification."
                active={isVerified || signupCompleted}
                complete={Boolean(submitSuccess) || signupCompleted}
              />
            </div>
          </section>

          <section className="panel p-6 sm:p-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Step 1
                </p>
                <h2 className="text-3xl font-semibold text-slate-900">Create student account</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Start with email verification, then finish the registration form once the OTP
                  is confirmed.
                </p>
              </div>

              <AlertMessage type={globalMessage.type || "info"} message={globalMessage.text} />
              <AlertMessage type="success" message={submitSuccess} />

              <form className="space-y-4" onSubmit={handleSendOtp}>
                <InputField
                  label="Student Email"
                  name="verification-email"
                  type="email"
                  value={email}
                  onChange={(event) => handleVerifiedEmailSync(event.target.value)}
                  placeholder="student@example.com"
                  autoComplete="email"
                />
                <Button type="submit" isLoading={loading.sendOtp}>
                  {otpSent ? "Resend OTP" : "Send OTP"}
                </Button>
              </form>

              <form className="space-y-4" onSubmit={handleVerifyOtp}>
                <InputField
                  label="OTP"
                  name="otp"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  disabled={!otpSent}
                />
                <Button type="submit" isLoading={loading.verifyOtp} disabled={!otpSent}>
                  Verify OTP
                </Button>
              </form>

              <form className="space-y-4 border-t border-slate-200 pt-6" onSubmit={handleSignup}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Student ID"
                    name="student_id"
                    value={signupForm.student_id}
                    onChange={handleSignupInputChange}
                    placeholder="BCS001"
                    disabled={!signupEnabled}
                  />
                  <InputField
                    label="Full Name"
                    name="name"
                    value={signupForm.name}
                    onChange={handleSignupInputChange}
                    placeholder="Enter full name"
                    disabled={!signupEnabled}
                  />
                </div>

                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={signupForm.email}
                  onChange={handleSignupInputChange}
                  placeholder="Verified email"
                  autoComplete="email"
                  disabled={!signupEnabled}
                  readOnly={isVerified}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Password"
                    name="password"
                    type="password"
                    value={signupForm.password}
                    onChange={handleSignupInputChange}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    disabled={!signupEnabled}
                  />
                  <InputField
                    label="College"
                    name="college"
                    value={signupForm.college}
                    onChange={handleSignupInputChange}
                    placeholder="College name"
                    disabled={!signupEnabled}
                  />
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  OTP status:{" "}
                  <span
                    className={`font-semibold ${
                      signupCompleted
                        ? "text-brand-600"
                        : isVerified
                          ? "text-emerald-600"
                          : "text-amber-600"
                    }`}
                  >
                    {signupCompleted
                      ? "Signup completed"
                      : isVerified
                        ? "Verified"
                        : "Not verified"}
                  </span>
                </div>

                <Button type="submit" isLoading={loading.signup} disabled={!signupEnabled}>
                  Create Account
                </Button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
