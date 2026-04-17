const express = require("express");
const authRoute = express.Router();
const controller = require("../Controllers/authController");




authRoute.post("/signUp", controller.studentSignUp);
authRoute.post("/login", controller.studentLogin);
authRoute.post("/send-otp",controller.sendOtpController);
authRoute.post("/verify-otp",controller.verifyOtpController);

module.exports = authRoute;

