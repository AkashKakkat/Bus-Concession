const Student = require("../Models/studentModel");
const Transaction = require("../Models/transactionModel");

const parseAmount = (value) => Number(value);

const validateAmount = (amount) => {
    return Number.isFinite(amount) && amount > 0;
};

const getWalletBalance = async (req, res) => {
    try {
        const student = await Student.findById(req.student.id).select("walletBalance");

        if (!student) {
            return res.status(404).send({
                message: "Student not found"
            });
        }

        return res.status(200).send({
            message: "Wallet balance fetched successfully",
            balance: student.walletBalance
        });
    } catch (error) {
        return res.status(500).send({
            message: "Error fetching wallet balance"
        });
    }
};

const addMoney = async (req, res) => {
    try {
        const amount = parseAmount(req.body.amount);

        if (!validateAmount(amount)) {
            return res.status(400).send({
                message: "Amount must be greater than 0"
            });
        }

        const student = await Student.findById(req.student.id);

        if (!student) {
            return res.status(404).send({
                message: "Student not found"
            });
        }

        student.walletBalance += amount;
        await student.save();

        await Transaction.create({
            studentId: student._id,
            type: "credit",
            amount,
            description: "Wallet top-up"
        });

        return res.status(200).send({
            message: "Money added successfully",
            balance: student.walletBalance
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error adding money to wallet"
        });
    }
};

const payFromWallet = async (req, res) => {
    try {
        const amount = parseAmount(req.body.amount);

        if (!validateAmount(amount)) {
            return res.status(400).send({
                message: "Amount must be greater than 0"
            });
        }

        const student = await Student.findById(req.student.id);

        if (!student) {
            return res.status(404).send({
                message: "Student not found"
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
            description: "Bus pass payment"
        });

        return res.status(200).send({
            message: "Payment successful",
            balance: student.walletBalance
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error processing wallet payment"
        });
    }
};

const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ studentId: req.student.id })
            .sort({ date: -1, createdAt: -1 });

        return res.status(200).send({
            message: "Transactions fetched successfully",
            transactions
        });
    } catch (error) {
        return res.status(500).send({
            message: "Error fetching transactions"
        });
    }
};

module.exports = {
    getWalletBalance,
    addMoney,
    payFromWallet,
    getTransactions
};
