const getRazorpayClient = require("../Utils/razorpay");

const createRazorpayOrder = async ({ amount, currency, receipt, notes }) => {
    const razorpay = getRazorpayClient();

    try {
        return await razorpay.orders.create({
            amount,
            currency,
            receipt,
            notes
        });
    } catch (error) {
        const providerMessage =
            error?.error?.description ||
            error?.response?.data?.error?.description ||
            error?.message ||
            "Failed to create order with Razorpay";

        const wrappedError = new Error(providerMessage);
        wrappedError.status =
            error?.statusCode ||
            error?.status ||
            error?.response?.statusCode ||
            error?.response?.status ||
            500;

        throw wrappedError;
    }
};

module.exports = { createRazorpayOrder };
