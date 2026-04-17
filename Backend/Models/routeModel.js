const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        default: 0
    },
    baseFare: {
        type: Number,
        default: 0,
        min: [0, "Base fare must be at least 0"]
    },
    concessionPercent: {
        type: Number,
        default: 0,
        min: [0, "Concession percent must be at least 0"],
        max: [100, "Concession percent cannot exceed 100"]
    }
}, { timestamps: true });

module.exports = mongoose.model("Route", routeSchema);
