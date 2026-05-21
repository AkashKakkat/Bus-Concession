import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLogin from "./pages/AdminLogin";
import ChangePassword from "./pages/ChangePassword";
import ConductorDashboard from "./pages/ConductorDashboard";
import ConductorLogin from "./pages/ConductorLogin";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignupPage from "./pages/SignupPage";
import StudentPass from "./pages/StudentPass";
import Wallet from "./pages/Wallet";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/Dashboard";
import AdminStudents from "./pages/admin/Students";
import AdminConductors from "./pages/admin/Conductors";
import AdminRoutes from "./pages/admin/Routes";
import AdminTransactions from "./pages/admin/Transactions";
import AdminSettings from "./pages/admin/Settings";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/conductor-login" element={<ConductorLogin />} />
      <Route path="/conductor-signup" element={<Navigate to="/admin-login" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute
            tokenKey="adminToken"
            roleKey="adminRole"
            requiredRole="admin"
            redirectTo="/admin-login"
          >
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminOverview />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="conductors" element={<AdminConductors />} />
        <Route path="routes" element={<AdminRoutes />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            tokenKey="token"
            roleKey="studentRole"
            requiredRole="student"
            redirectTo="/login"
          >
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conductor-dashboard"
        element={
          <ProtectedRoute
            tokenKey="conductorToken"
            roleKey="conductorRole"
            requiredRole="conductor"
            redirectTo="/conductor-login"
          >
            <ConductorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/generate-pass"
        element={
          <ProtectedRoute
            tokenKey="token"
            roleKey="studentRole"
            requiredRole="student"
            redirectTo="/login"
          >
            <StudentPass />
          </ProtectedRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute
            tokenKey="token"
            roleKey="studentRole"
            requiredRole="student"
            redirectTo="/login"
          >
            <ChangePassword />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute
            tokenKey="token"
            roleKey="studentRole"
            requiredRole="student"
            redirectTo="/login"
          >
            <Wallet />
          </ProtectedRoute>
        }
      />
      <Route path="/routes" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
