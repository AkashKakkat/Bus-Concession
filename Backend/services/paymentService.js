const getRazorpayClient = require("../Utils/razorpay");

const createRazorpayOrder = async ({ amount, currency, receipt, notes }) => {
    const razorpay = getRazorpayClient();

    return razorpay.orders.create({
        amount,
        currency,
        receipt,
        notes
    });
};

module.exports = { createRazorpayOrder };
