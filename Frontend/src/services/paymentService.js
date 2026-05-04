import api from "./api";

export const completePayment = async ({
  conductorToken,
  token,
  currentFrom,
  currentTo,
}) => {
  const response = await api.post(
    "/payment/complete",
    {
      token,
      currentFrom,
      currentTo,
    },
    {
      headers: {
        Authorization: `Bearer ${conductorToken}`,
      },
    }
  );

  return response.data;
};

export const getConductorPaymentHistory = async ({ conductorToken }) => {
  const response = await api.get("/payment/history", {
    headers: {
      Authorization: `Bearer ${conductorToken}`,
    },
  });

  return response.data;
};
