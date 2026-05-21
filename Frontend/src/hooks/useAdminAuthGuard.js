import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function useAdminAuthGuard() {
  const navigate = useNavigate();
  const { adminToken, adminRole, clearSession } = useAuth();

  const handleAdminError = (error) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      clearSession("admin");
      navigate("/admin-login", { replace: true });
      return true;
    }

    return false;
  };

  const logoutAdmin = () => {
    clearSession("admin");
    navigate("/admin-login", { replace: true });
  };

  return {
    adminToken,
    adminRole,
    handleAdminError,
    logoutAdmin,
  };
}
