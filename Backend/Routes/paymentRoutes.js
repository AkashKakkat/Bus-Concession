const express = require("express");
const authMiddleware = require("../Middleware/authMiddleware");
const conductorMiddleware = require("../Middleware/conductorMiddleware");
const paymentController = require("../Controllers/paymentController");

const paymentRouter = express.Router();

paymentRouter.post("/create-order", authMiddleware, paymentController.createOrder);
paymentRouter.post("/verify", authMiddleware, paymentController.verifyPayment);
paymentRouter.post("/failed", authMiddleware, paymentController.markPaymentFailed);
paymentRouter.post("/complete", conductorMiddleware, paymentController.completePayment);
paymentRouter.get("/history", conductorMiddleware, paymentController.getConductorPaymentHistory);

module.exports = paymentRouter;
