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
        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Transaction", transactionSchema);
