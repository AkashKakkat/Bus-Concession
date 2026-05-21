import api from "./api";

const getAdminHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getAdminStudents = async (token, params = {}) => {
  const response = await api.get("/admin/students", {
    ...getAdminHeaders(token),
    params,
  });
  return response.data;
};

export const getAdminConductors = async (token, params = {}) => {
  const response = await api.get("/admin/conductors", {
    ...getAdminHeaders(token),
    params,
  });
  return response.data;
};

export const createAdminConductor = async (token, payload) => {
  const response = await api.post("/admin/conductors", payload, getAdminHeaders(token));
  return response.data;
};

export const getAdminStudentDetails = async (token, studentId) => {
  const response = await api.get(`/admin/students/${studentId}`, getAdminHeaders(token));
  return response.data;
};

export const updateAdminStudent = async (token, studentId, payload) => {
  const response = await api.put(`/admin/students/${studentId}`, payload, getAdminHeaders(token));
  return response.data;
};

export const deleteAdminStudent = async (token, studentId) => {
  const response = await api.delete(`/admin/students/${studentId}`, getAdminHeaders(token));
  return response.data;
};

export const approveAdminStudent = async (token, studentId) => {
  const response = await api.patch(`/admin/students/${studentId}/approve`, {}, getAdminHeaders(token));
  return response.data;
};

export const rejectAdminStudent = async (token, studentId) => {
  const response = await api.patch(`/admin/students/${studentId}/reject`, {}, getAdminHeaders(token));
  return response.data;
};

export const getAdminStudentIdCard = async (token, studentId) => {
  const response = await api.get(`/admin/students/${studentId}/id-card`, {
    ...getAdminHeaders(token),
    responseType: "blob",
  });
  return response.data;
};

export const getAdminConductorDetails = async (token, conductorId) => {
  const response = await api.get(`/admin/conductors/${conductorId}`, getAdminHeaders(token));
  return response.data;
};

export const updateAdminConductor = async (token, conductorId, payload) => {
  const response = await api.put(`/admin/conductors/${conductorId}`, payload, getAdminHeaders(token));
  return response.data;
};

export const deleteAdminConductor = async (token, conductorId) => {
  const response = await api.delete(`/admin/conductors/${conductorId}`, getAdminHeaders(token));
  return response.data;
};

export const getAdminRoutes = async (token, params = {}) => {
  const response = await api.get("/admin/routes", {
    ...getAdminHeaders(token),
    params,
  });
  return response.data;
};

export const createAdminRoute = async (token, payload) => {
  const response = await api.post("/admin/routes", payload, getAdminHeaders(token));
  return response.data;
};

export const updateAdminRoute = async (token, routeId, payload) => {
  const response = await api.put(`/admin/routes/${routeId}`, payload, getAdminHeaders(token));
  return response.data;
};

export const deleteAdminRoute = async (token, routeId) => {
  const response = await api.delete(`/admin/routes/${routeId}`, getAdminHeaders(token));
  return response.data;
};

export const getAdminTransactions = async (token, params = {}) => {
  const response = await api.get("/admin/transactions", {
    ...getAdminHeaders(token),
    params,
  });
  return response.data;
};

export const getAdminReports = async (token) => {
  const response = await api.get("/admin/reports", getAdminHeaders(token));
  return response.data;
};

export const getAdminProfile = async (token) => {
  const response = await api.get("/admin/profile", getAdminHeaders(token));
  return response.data;
};

export const updateAdminPassword = async (token, payload) => {
  const response = await api.put("/admin/password", payload, getAdminHeaders(token));
  return response.data;
};
