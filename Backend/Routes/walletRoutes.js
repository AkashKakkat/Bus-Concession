const express = require("express");
const authMiddleware = require("../Middleware/authMiddleware");
const walletController = require("../Controllers/walletController");

const walletRouter = express.Router();

walletRouter.get("/balance", authMiddleware, walletController.getWalletBalance);
walletRouter.post("/add", authMiddleware, walletController.addMoney);
walletRouter.post("/pay", authMiddleware, walletController.payFromWallet);
walletRouter.get("/transactions", authMiddleware, walletController.getTransactions);

module.exports = walletRouter;
