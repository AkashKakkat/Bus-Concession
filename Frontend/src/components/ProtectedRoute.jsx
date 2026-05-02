import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, tokenKey, redirectTo, roleKey, requiredRole }) {
  const auth = useAuth();

  const sessionTokenMap = {
    token: auth.studentToken,
    conductorToken: auth.conductorToken,
    adminToken: auth.adminToken,
  };

  const sessionRoleMap = {
    studentRole: auth.studentRole,
    conductorRole: auth.conductorRole,
    adminRole: auth.adminRole,
  };

  const token = sessionTokenMap[tokenKey] || localStorage.getItem(tokenKey);
  const role = roleKey ? sessionRoleMap[roleKey] || localStorage.getItem(roleKey) : null;

  if (!token) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

export default ProtectedRoute;
