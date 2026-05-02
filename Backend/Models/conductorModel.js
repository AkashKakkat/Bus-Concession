const mongoose = require("mongoose");

const conductorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    bus_no: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["student", "conductor", "admin"],
        default: "conductor"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Conductor", conductorSchema);
