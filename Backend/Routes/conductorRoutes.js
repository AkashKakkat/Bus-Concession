const express = require("express");
const router = express.Router();
const conductorController = require("../Controllers/conductorController");

router.post("/signup", conductorController.conductorSignUp);
router.post("/login", conductorController.conductorLogin);

module.exports = router;