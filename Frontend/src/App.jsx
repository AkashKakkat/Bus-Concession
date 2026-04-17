import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import ConductorDashboard from "./pages/ConductorDashboard";
import ConductorLogin from "./pages/ConductorLogin";
import ConductorSignup from "./pages/ConductorSignup";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignupPage from "./pages/SignupPage";
import StudentPass from "./pages/StudentPass";
import Wallet from "./pages/Wallet";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/conductor-login" element={<ConductorLogin />} />
      <Route path="/conductor-signup" element={<ConductorSignup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute tokenKey="token" redirectTo="/login">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conductor-dashboard"
        element={
          <ProtectedRoute tokenKey="conductorToken" redirectTo="/conductor-login">
            <ConductorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/generate-pass"
        element={
          <ProtectedRoute tokenKey="token" redirectTo="/login">
            <StudentPass />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute tokenKey="token" redirectTo="/login">
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
