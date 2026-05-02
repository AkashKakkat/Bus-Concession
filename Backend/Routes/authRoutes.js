const express = require("express");
const authRoute = express.Router();
const controller = require("../Controllers/authController");
const authMiddleware = require("../Middleware/authMiddleware");
const studentIdUpload = require("../Middleware/studentIdUpload");

authRoute.post("/signUp", studentIdUpload.single("collegeIdCard"), controller.studentSignUp);
authRoute.post("/login", controller.studentLogin);
authRoute.post("/send-otp",controller.sendOtpController);
authRoute.post("/verify-otp",controller.verifyOtpController);
authRoute.post("/forgot-password", controller.forgotPasswordController);
authRoute.post("/reset-password", controller.resetPasswordController);
authRoute.post("/change-password", authMiddleware, controller.changePasswordController);

module.exports = authRoute;

