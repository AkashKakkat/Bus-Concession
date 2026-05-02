const express = require("express");
const adminRouter = express.Router();
const adminController = require("../Controllers/adminController");
const isAdmin = require("../Middleware/isAdmin");

adminRouter.post("/login", adminController.adminLogin);

adminRouter.use(isAdmin);

adminRouter.get("/students", adminController.getStudents);
adminRouter.get("/students/:id", adminController.getStudentDetails);
adminRouter.get("/students/:id/id-card", adminController.viewStudentIdCard);
adminRouter.patch("/students/:id/approve", adminController.approveStudent);
adminRouter.patch("/students/:id/reject", adminController.rejectStudent);
adminRouter.delete("/students/:id", adminController.deleteStudent);
adminRouter.get("/conductors", adminController.getConductors);
adminRouter.post("/conductors", adminController.createConductor);
adminRouter.get("/conductors/:id", adminController.getConductorDetails);
adminRouter.delete("/conductors/:id", adminController.deleteConductor);
adminRouter.get("/routes", adminController.getRoutes);
adminRouter.post("/routes", adminController.createRoute);
adminRouter.put("/routes/:id", adminController.updateRoute);
adminRouter.delete("/routes/:id", adminController.deleteRoute);
adminRouter.get("/transactions", adminController.getTransactions);
adminRouter.get("/reports", adminController.getReports);

module.exports = adminRouter;
