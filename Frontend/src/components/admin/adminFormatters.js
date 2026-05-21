export const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatDateTime = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString();
};

export const getVerificationBadgeClass = (status) => {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "rejected") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-amber-100 text-amber-700";
};

export const getTransactionBadgeClass = (type) =>
  type === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";

export const getPaymentStatusBadgeClass = (status) => {
  if (status === "success") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "failed" || status === "cancelled") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-amber-100 text-amber-700";
};
