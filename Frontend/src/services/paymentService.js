import api from "./api";

export const createPaymentOrder = async ({ token, amount }) => {
  const response = await api.post(
    "/api/payment/create-order",
    { amount },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const verifyPayment = async ({ token, payment }) => {
  const response = await api.post("/api/payment/verify", payment, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const markPaymentFailed = async ({ token, orderId, reason }) => {
  const response = await api.post(
    "/api/payment/failed",
    {
      razorpay_order_id: orderId,
      reason,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
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

export const createConductorPaymentOrder = async ({
  conductorToken,
  token,
  currentFrom,
  currentTo,
}) => {
  const response = await api.post(
    "/payment/conductor/create-order",
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

export const verifyConductorPayment = async ({ conductorToken, payment }) => {
  const response = await api.post("/payment/conductor/verify", payment, {
    headers: {
      Authorization: `Bearer ${conductorToken}`,
    },
  });

  return response.data;
};

export const markConductorPaymentFailed = async ({
  conductorToken,
  orderId,
  reason,
}) => {
  const response = await api.post(
    "/payment/conductor/failed",
    {
      razorpay_order_id: orderId,
      reason,
    },
    {
      headers: {
        Authorization: `Bearer ${conductorToken}`,
      },
    }
  );

  return response.data;
};
