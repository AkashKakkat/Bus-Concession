const crypto = require("crypto");

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
    if (!process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay secret is not configured");
    }

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    const receivedSignature = String(signature || "");

    if (expectedSignature.length !== receivedSignature.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(receivedSignature)
    );
};

module.exports = { verifyRazorpaySignature };
