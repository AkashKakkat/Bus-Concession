const express = require("express");
const conductorMiddleware = require("../Middleware/conductorMiddleware");
const paymentController = require("../Controllers/paymentController");

const paymentRouter = express.Router();

paymentRouter.post("/complete", conductorMiddleware, paymentController.completePayment);

module.exports = paymentRouter;
