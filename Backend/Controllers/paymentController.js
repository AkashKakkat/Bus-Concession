const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Student = require("../Models/studentModel");
const Transaction = require("../Models/transactionModel");
const { normalizeFareDetails } = require("../Utils/fareCalculator");
const { isSameRoutePoint } = require("../Utils/routeMatcher");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

const sendPaymentConfirmation = async ({ to, baseFare, concessionPercent, amount, route, date }) => {
    await transporter.sendMail({
        from: process.env.EMAIL,
        to,
        subject: "Payment Successful",
        text: `Payment Successful\nBase Fare: Rs.${baseFare}\nConcession: ${concessionPercent}%\nFinal Amount: Rs.${amount}\nRoute: ${route.from} -> ${route.to}\nDate: ${date}`
    });
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

        await Transaction.create({
            studentId: student._id,
            type: "debit",
            amount,
            description: "Bus Travel Payment"
        });

        const paymentDate = new Date().toLocaleString();

        await sendPaymentConfirmation({
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
            paidAt: paymentDate
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

module.exports = { completePayment };
