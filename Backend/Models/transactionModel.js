const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },
        conductorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conductor"
        },
        type: {
            type: String,
            enum: ["credit", "debit"],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        routeSnapshot: {
            from: String,
            to: String
        },
        currency: {
            type: String,
            default: "INR",
            trim: true
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "success", "failed", "cancelled"],
            default: "success"
        },
        paymentProvider: {
            type: String,
            enum: ["wallet", "razorpay", "conductor"],
            default: "wallet"
        },
        razorpayOrderId: {
            type: String,
            trim: true,
            unique: true,
            sparse: true
        },
        razorpayPaymentId: {
            type: String,
            trim: true,
            unique: true,
            sparse: true
        },
        razorpaySignature: {
            type: String,
            trim: true
        },
        receipt: {
            type: String,
            trim: true
        },
        purpose: {
            type: String,
            trim: true
        },
        paidAt: {
            type: Date
        },
        failedAt: {
            type: Date
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

transactionSchema.index({ studentId: 1, paymentStatus: 1, createdAt: -1 });
transactionSchema.index({ razorpayOrderId: 1, paymentStatus: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
