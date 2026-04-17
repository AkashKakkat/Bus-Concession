import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, tokenKey, redirectTo }) {
  const token = localStorage.getItem(tokenKey);

  if (!token) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

export default ProtectedRoute;
