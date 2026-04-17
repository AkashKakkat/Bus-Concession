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
  const response = await api.post("/auth/signUp", payload);
  return response.data;
};

export const loginStudent = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

export const loginConductor = async (payload) => {
  const response = await api.post("/conductor/login", payload);
  return response.data;
};

export const signupConductor = async (payload) => {
  const response = await api.post("/conductor/signup", payload);
  return response.data;
};
