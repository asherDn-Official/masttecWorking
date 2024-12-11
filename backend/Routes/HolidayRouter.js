const express = require("express");
const router = express.Router();
const holidayController = require("../Controllers/HolidayControllers");

// Create a new payroll record
router.post("/", holidayController.updateHolidays);

// Get all payroll records
router.get("/:year", holidayController.getHolidays);

module.exports = router;
