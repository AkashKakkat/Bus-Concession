import api from "./api";

export const sendOtp = async (payload) => {
  const response = await api.post("/auth/send-otp", payload);
  return response.data;
};

export const verifyOtp = async (payload) => {
  const response = await api.post("/auth/verify-otp", payload);
  return response.data;
};

export const signupStudent = async (payload) => {
  const response = await api.post("/auth/signUp", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const loginStudent = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

export const forgotStudentPassword = async (payload) => {
  const response = await api.post("/auth/forgot-password", payload);
  return response.data;
};

export const resetStudentPassword = async (payload) => {
  const response = await api.post("/auth/reset-password", payload);
  return response.data;
};

export const changeStudentPassword = async ({ token, ...payload }) => {
  const response = await api.post("/auth/change-password", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const loginConductor = async (payload) => {
  const response = await api.post("/conductor/login", payload);
  return response.data;
};

export const loginAdmin = async (payload) => {
  const response = await api.post("/admin/login", payload);
  return response.data;
};
