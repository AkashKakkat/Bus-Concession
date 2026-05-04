import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import InputField from "../components/InputField";
import StepBadge from "../components/StepBadge";
import {
  getStudentApprovalStatus,
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
  collegeIdCard: null,
};

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [isVerified, setIsVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [signupCompleted, setSignupCompleted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
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

  const goToLogin = () => {
    navigate("/login", {
      state: {
        email: submittedEmail,
        message: "Admin approved your registration. Please login to continue.",
      },
    });
  };

  const handleVerifiedEmailSync = (nextEmail) => {
    setSignupCompleted(false);
    setSubmittedEmail("");
    setApprovalStatus("");
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

    if (isVerified) {
      setMessage("success", "OTP already verified.");
      return;
    }

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
    const { files, name, type, value } = event.target;

    setSignupForm((current) => ({
      ...current,
      [name]: type === "file" ? files?.[0] || null : value,
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

    if (!signupForm.collegeIdCard) {
      setMessage("error", "Please upload your college ID card for admin verification.");
      return;
    }

    setLoading((current) => ({ ...current, signup: true }));

    try {
      const registeredEmail = email.trim();
      const payload = new FormData();
      payload.append("student_id", signupForm.student_id.trim());
      payload.append("name", signupForm.name.trim());
      payload.append("email", registeredEmail);
      payload.append("password", signupForm.password);
      payload.append("college", signupForm.college.trim());
      payload.append("collegeIdCard", signupForm.collegeIdCard);

      const data = await signupStudent(payload);
      setSubmitSuccess(
        data.message || "Registration submitted for admin approval. We will keep checking the status here."
      );
      setSignupCompleted(true);
      setSubmittedEmail(registeredEmail);
      setApprovalStatus(data.data?.verificationStatus || "pending");
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

  useEffect(() => {
    if (!signupCompleted || !submittedEmail || approvalStatus !== "pending") {
      return undefined;
    }

    let isCancelled = false;

    const checkApprovalStatus = async () => {
      setIsCheckingApproval(true);

      try {
        const data = await getStudentApprovalStatus(submittedEmail);

        if (isCancelled) {
          return;
        }

        const nextStatus = data.verificationStatus || "pending";
        setApprovalStatus(nextStatus);

        if (nextStatus === "approved") {
          setSubmitSuccess("Admin approved your registration. Please go to login.");
          setGlobalMessage({ type: "", text: "" });
        } else if (nextStatus === "rejected") {
          setSubmitSuccess("");
          setGlobalMessage({
            type: "error",
            text: "Your registration was not approved. Please contact the admin.",
          });
        }
      } catch (error) {
        if (!isCancelled) {
          setGlobalMessage({
            type: "info",
            text: "Registration submitted. Waiting for admin approval.",
          });
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingApproval(false);
        }
      }
    };

    checkApprovalStatus();
    const intervalId = window.setInterval(checkApprovalStatus, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [approvalStatus, signupCompleted, submittedEmail]);

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
                description="Submit the student account for admin approval."
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
                <Button
                  type="submit"
                  isLoading={loading.verifyOtp}
                  disabled={!otpSent || isVerified}
                >
                  {isVerified ? "OTP Verified" : "Verify OTP"}
                </Button>
              </form>

              <form className="space-y-4 border-t border-slate-200 pt-6" onSubmit={handleSignup}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Student ID"
                    name="student_id"
                    value={signupForm.student_id}
                    onChange={handleSignupInputChange}
                    placeholder="123456"
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

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">College ID Card</span>
                  <input
                    type="file"
                    name="collegeIdCard"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={handleSignupInputChange}
                    disabled={!signupEnabled}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <span className="block text-xs text-slate-500">
                    Upload a clear JPG, PNG, WEBP, or PDF. Admin approval is required before login.
                  </span>
                </label>

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
                      approvalStatus === "approved"
                        ? "text-emerald-600"
                        : signupCompleted
                        ? "text-brand-600"
                        : isVerified
                          ? "text-emerald-600"
                          : "text-amber-600"
                    }`}
                  >
                    {approvalStatus === "approved"
                      ? "Admin approved"
                      : signupCompleted
                        ? isCheckingApproval
                          ? "Checking admin approval"
                          : "Waiting for admin approval"
                      : isVerified
                        ? "Verified"
                        : "Not verified"}
                  </span>
                </div>

                {approvalStatus === "approved" ? (
                  <Button type="button" onClick={goToLogin}>
                    Go to Login
                  </Button>
                ) : null}

                <Button
                  type="submit"
                  isLoading={loading.signup}
                  disabled={!signupEnabled || signupCompleted}
                >
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
