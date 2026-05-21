import { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import Loader from "../../components/admin/Loader";
import { formatDateTime } from "../../components/admin/adminFormatters";
import { useAdminAuthGuard } from "../../hooks/useAdminAuthGuard";
import { getAdminProfile, updateAdminPassword } from "../../services/adminService";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

const initialPasswordForm = { currentPassword: "", newPassword: "" };

function Settings() {
  const { adminToken, handleAdminError, logoutAdmin } = useAdminAuthGuard();
  const [profile, setProfile] = useState(null);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const data = await getAdminProfile(adminToken);
        setProfile(data);
      } catch (error) {
        if (!handleAdminError(error)) {
          setErrorMessage(getApiErrorMessage(error, "Failed to load admin profile."));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [adminToken]);

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await updateAdminPassword(adminToken, passwordForm);
      setSuccessMessage(response.message || "Password updated successfully.");
      setPasswordForm(initialPasswordForm);
    } catch (error) {
      if (!handleAdminError(error)) {
        setErrorMessage(getApiErrorMessage(error, "Failed to update password."));
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loader label="Loading admin settings..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">Manage admin profile, password, and active session.</p>
      </div>

      <AlertMessage type="error" message={errorMessage} />
      <AlertMessage type="success" message={successMessage} />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Admin Details</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Name</p>
              <p className="mt-1 font-semibold text-slate-900">{profile?.name || "Admin"}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Email</p>
              <p className="mt-1 font-semibold text-slate-900">{profile?.email}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Role</p>
              <p className="mt-1 font-semibold capitalize text-slate-900">{profile?.role}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Created</p>
              <p className="mt-1 font-semibold text-slate-900">{formatDateTime(profile?.createdAt)}</p>
            </div>
          </div>
          <button type="button" onClick={logoutAdmin} className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            Logout
          </button>
        </div>

        <form onSubmit={submitPassword} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Update Password</h2>
          <div className="mt-4 space-y-3">
            <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" name="currentPassword" type="password" value={passwordForm.currentPassword} onChange={handlePasswordChange} placeholder="Current password" />
            <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" name="newPassword" type="password" value={passwordForm.newPassword} onChange={handlePasswordChange} placeholder="New password" />
            <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={isSaving}>
              {isSaving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default Settings;
