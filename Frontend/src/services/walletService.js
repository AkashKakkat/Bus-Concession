import api from "./api";

export const getWalletBalance = async ({ token }) => {
  const response = await api.get("/wallet/balance", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const addWalletMoney = async ({ token, amount }) => {
  const response = await api.post(
    "/wallet/add",
    { amount },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const payFromWallet = async ({ token, amount }) => {
  const response = await api.post(
    "/wallet/pay",
    { amount },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getWalletTransactions = async ({ token }) => {
  const response = await api.get("/wallet/transactions", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
