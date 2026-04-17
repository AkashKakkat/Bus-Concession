import api from "./api";

export const getAllRoutes = async () => {
  const response = await api.get("/route/all");
  return response.data;
};

export const getStudentProfile = async ({ token }) => {
  const response = await api.get("/student/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const selectStudentRoute = async ({ routeId, token }) => {
  const response = await api.post(
    "/student/select-route",
    { routeId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const generateStudentPass = async ({ token }) => {
  const response = await api.get("/student/generate-pass", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const verifyStudentPass = async ({
  token,
  currentFrom,
  currentTo,
  conductorToken,
}) => {
  const response = await api.post(
    "/student/verify-pass",
    {
      token,
      currentFrom,
      currentTo,
    },
    {
      headers: conductorToken
        ? {
            Authorization: `Bearer ${conductorToken}`,
          }
        : {},
    }
  );

  return response.data;
};
