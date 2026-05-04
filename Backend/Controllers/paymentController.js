const jwt = require("jsonwebtoken");
const Student = require("../Models/studentModel");
const Transaction = require("../Models/transactionModel");
const { sendTextMail } = require("../Utils/sendMail");
const { normalizeFareDetails } = require("../Utils/fareCalculator");
const { isSameRoutePoint } = require("../Utils/routeMatcher");

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

module.exports = { completePayment, getConductorPaymentHistory };
