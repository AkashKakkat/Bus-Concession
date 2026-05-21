const jwt = require("jsonwebtoken");
const Student = require("../Models/studentModel");
const Transaction = require("../Models/transactionModel");
const { sendTextMail } = require("../Utils/sendMail");
const { normalizeFareDetails } = require("../Utils/fareCalculator");
const { isSameRoutePoint } = require("../Utils/routeMatcher");
const { verifyRazorpaySignature } = require("../Utils/paymentVerification");
const { createRazorpayOrder } = require("../services/paymentService");

const RAZORPAY_CURRENCY = "INR";
const WALLET_TOP_UP_PURPOSE = "wallet_top_up";
const PENDING_ORDER_MINUTES = 10;
const MAX_WALLET_TOP_UP_AMOUNT = 50000;

const parseAmount = (value) => Number(value);

const validateWalletTopUpAmount = (amount) => {
    return Number.isFinite(amount) && amount > 0 && amount <= MAX_WALLET_TOP_UP_AMOUNT;
};

const getPendingOrderCutoff = () => {
    return new Date(Date.now() - PENDING_ORDER_MINUTES * 60 * 1000);
};

const buildOrderResponse = (transaction) => ({
    message: "Payment order created successfully",
    orderId: transaction.razorpayOrderId,
    amount: Math.round(transaction.amount * 100),
    amountInRupees: transaction.amount,
    currency: transaction.currency || RAZORPAY_CURRENCY,
    receipt: transaction.receipt,
    key: process.env.RAZORPAY_KEY_ID
});

const sendPaymentConfirmation = async ({ to, baseFare, concessionPercent, amount, route, date }) => {
    if (!process.env.EMAIL || !process.env.EMAIL_PASS || !to) {
        return {
            sent: false,
            message: "Payment email skipped because email service is not configured"
        };
    }

    await sendTextMail({
        to,
        subject: "Payment Successful",
        text: `Payment Successful\nBase Fare: Rs.${baseFare}\nConcession: ${concessionPercent}%\nFinal Amount: Rs.${amount}\nRoute: ${route.from} -> ${route.to}\nDate: ${date}`
    });

    return {
        sent: true,
        message: "Payment confirmation email sent"
    };
};

const sendPaymentConfirmationSafely = async (paymentDetails) => {
    try {
        return await sendPaymentConfirmation(paymentDetails);
    } catch (error) {
        console.error("Payment confirmation email failed:", error.message);

        return {
            sent: false,
            message: error.message || "Payment confirmation email failed"
        };
    }
};

const createOrder = async (req, res) => {
    try {
        const amount = parseAmount(req.body.amount);

        if (!validateWalletTopUpAmount(amount)) {
            return res.status(400).send({
                message: `Amount must be greater than 0 and not more than ${MAX_WALLET_TOP_UP_AMOUNT}`
            });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).send({
                message: "Payment gateway is not configured"
            });
        }

        const student = await Student.findById(req.student.id).select("name email");

        if (!student) {
            return res.status(404).send({
                message: "Student not found"
            });
        }

        const normalizedAmount = Number(amount.toFixed(2));
        const existingPendingTransaction = await Transaction.findOne({
            studentId: student._id,
            type: "credit",
            amount: normalizedAmount,
            paymentStatus: "pending",
            paymentProvider: "razorpay",
            razorpayOrderId: { $exists: true, $ne: "" },
            createdAt: { $gte: getPendingOrderCutoff() }
        }).sort({ createdAt: -1 });

        if (existingPendingTransaction) {
            return res.status(200).send(buildOrderResponse(existingPendingTransaction));
        }

        const receipt = `wallet_${student._id}_${Date.now()}`;
        const order = await createRazorpayOrder({
            amount: Math.round(normalizedAmount * 100),
            currency: RAZORPAY_CURRENCY,
            receipt,
            notes: {
                studentId: student._id.toString(),
                studentName: student.name,
                studentEmail: student.email,
                purpose: WALLET_TOP_UP_PURPOSE
            }
        });

        const transaction = await Transaction.create({
            studentId: student._id,
            type: "credit",
            amount: normalizedAmount,
            currency: order.currency || RAZORPAY_CURRENCY,
            description: "Wallet top-up",
            paymentStatus: "pending",
            paymentProvider: "razorpay",
            razorpayOrderId: order.id,
            receipt: order.receipt || receipt,
            purpose: WALLET_TOP_UP_PURPOSE
        });

        return res.status(201).send(buildOrderResponse(transaction));
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error creating payment order"
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature
        } = req.body;

        if (!orderId || !paymentId || !signature) {
            return res.status(400).send({
                message: "Order id, payment id and signature are required"
            });
        }

        const transaction = await Transaction.findOne({
            razorpayOrderId: orderId,
            paymentProvider: "razorpay"
        });

        if (!transaction) {
            return res.status(404).send({
                message: "Payment order not found"
            });
        }

        if (transaction.studentId.toString() !== req.student.id) {
            return res.status(403).send({
                message: "Payment order does not belong to this student"
            });
        }

        if (transaction.paymentStatus === "success") {
            if (transaction.razorpayPaymentId !== paymentId) {
                return res.status(409).send({
                    message: "This order was already verified with another payment"
                });
            }

            const student = await Student.findById(req.student.id).select("walletBalance");

            return res.status(200).send({
                message: "Payment already verified",
                balance: student?.walletBalance || 0,
                transaction
            });
        }

        if (transaction.paymentStatus !== "pending") {
            return res.status(409).send({
                message: `Payment cannot be verified because it is ${transaction.paymentStatus}`
            });
        }

        const duplicatePayment = await Transaction.findOne({
            razorpayPaymentId: paymentId,
            _id: { $ne: transaction._id }
        });

        if (duplicatePayment) {
            return res.status(409).send({
                message: "Payment was already recorded"
            });
        }

        const isValidSignature = verifyRazorpaySignature({
            orderId,
            paymentId,
            signature
        });

        if (!isValidSignature) {
            return res.status(400).send({
                message: "Invalid payment signature"
            });
        }

        const student = await Student.findById(req.student.id);

        if (!student) {
            return res.status(404).send({
                message: "Student not found"
            });
        }

        student.walletBalance += transaction.amount;
        transaction.paymentStatus = "success";
        transaction.razorpayPaymentId = paymentId;
        transaction.razorpaySignature = signature;
        transaction.paidAt = new Date();
        transaction.date = transaction.paidAt;

        await Promise.all([student.save(), transaction.save()]);

        return res.status(200).send({
            message: "Payment verified and money added successfully",
            balance: student.walletBalance,
            transaction
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).send({
                message: "Payment was already recorded"
            });
        }

        return res.status(500).send({
            message: error.message || "Error verifying payment"
        });
    }
};

const markPaymentFailed = async (req, res) => {
    try {
        const { razorpay_order_id: orderId, reason = "Payment failed or cancelled" } = req.body;

        if (!orderId) {
            return res.status(400).send({
                message: "Order id is required"
            });
        }

        const transaction = await Transaction.findOne({
            razorpayOrderId: orderId,
            studentId: req.student.id,
            paymentProvider: "razorpay",
            paymentStatus: "pending"
        });

        if (!transaction) {
            return res.status(404).send({
                message: "Pending payment order not found"
            });
        }

        transaction.paymentStatus = reason.toLowerCase().includes("cancel")
            ? "cancelled"
            : "failed";
        transaction.failedAt = new Date();
        transaction.description = `Wallet top-up ${transaction.paymentStatus}`;
        await transaction.save();

        return res.status(200).send({
            message: "Payment status updated",
            transaction
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error updating payment status"
        });
    }
};

const completePayment = async (req, res) => {
    try {
        const { token, currentFrom, currentTo } = req.body;

        if (!token || !currentFrom || !currentTo) {
            return res.status(400).send({
                message: "Token, currentFrom and currentTo are required"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const student = await Student.findById(decoded.id).populate("route");

        if (!student || !student.route) {
            return res.status(404).send({
                message: "Invalid pass..!!"
            });
        }

        const passFrom = student.route.from;
        const passTo = student.route.to;

        if (
            !isSameRoutePoint(passFrom, currentFrom) ||
            !isSameRoutePoint(passTo, currentTo)
        ) {
            return res.status(403).send({
                message: "Route not allowed..!!",
                AllowedRoute: `${passFrom}  -->  ${passTo}`
            });
        }

        const fareDetails = normalizeFareDetails(student.route);
        const amount = fareDetails.finalFare;

        if (amount <= 0) {
            return res.status(400).send({
                message: "Invalid route price"
            });
        }

        if (student.walletBalance < amount) {
            return res.status(400).send({
                message: "Insufficient balance"
            });
        }

        student.walletBalance -= amount;
        await student.save();

        const transaction = await Transaction.create({
            studentId: student._id,
            conductorId: req.conductor.id,
            type: "debit",
            amount,
            description: "Bus Travel Payment",
            paymentStatus: "success",
            paymentProvider: "conductor",
            routeSnapshot: {
                from: student.route.from,
                to: student.route.to
            }
        });

        const paymentDate = new Date().toLocaleString();

        const emailStatus = await sendPaymentConfirmationSafely({
            to: student.email,
            baseFare: fareDetails.baseFare,
            concessionPercent: fareDetails.concessionPercent,
            amount,
            route: student.route,
            date: paymentDate
        });

        return res.status(200).send({
            message: "Payment successful",
            student: {
                Name: student.name,
                Email: student.email
            },
            route: student.route,
            baseFare: fareDetails.baseFare,
            concessionPercent: fareDetails.concessionPercent,
            finalFare: fareDetails.finalFare,
            amount,
            balance: student.walletBalance,
            paidAt: paymentDate,
            transaction: {
                _id: transaction._id,
                student: {
                    name: student.name,
                    email: student.email
                },
                amount: transaction.amount,
                description: transaction.description,
                route: transaction.routeSnapshot,
                date: transaction.date
            },
            emailStatus
        });
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).send({
                message: "Invalid or expired token..!!"
            });
        }

        return res.status(500).send({
            message: error.message || "Error completing payment"
        });
    }
};

const getConductorPaymentHistory = async (req, res) => {
    try {
        const transactions = await Transaction.find({
            conductorId: req.conductor.id,
            type: "debit"
        })
            .populate("studentId", "name email")
            .sort({ date: -1, createdAt: -1 })
            .lean();

        return res.status(200).send({
            transactions: transactions.map((transaction) => ({
                _id: transaction._id,
                student: transaction.studentId
                    ? {
                        name: transaction.studentId.name,
                        email: transaction.studentId.email
                    }
                    : null,
                amount: transaction.amount,
                description: transaction.description,
                route: transaction.routeSnapshot || null,
                date: transaction.date || transaction.createdAt
            }))
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error fetching payment history"
        });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    markPaymentFailed,
    completePayment,
    getConductorPaymentHistory
};
