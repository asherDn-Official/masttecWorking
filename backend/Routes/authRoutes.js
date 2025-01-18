const express = require("express");
const router = express.Router();
const authController = require("../Controllers/authController");

router.post("/login", authController.login);
router.post("/verify", authController.verifyToken);
router.post("/logout", authController.logout);
module.exports = router;
