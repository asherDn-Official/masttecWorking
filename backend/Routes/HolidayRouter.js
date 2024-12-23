const express = require("express");
const router = express.Router();
const holidayController = require("../Controllers/HolidayControllers");

// Create a new holiday record
router.post("/", holidayController.updateHolidays);

// Get all holiday records
router.get("/:year", holidayController.getHolidays);

// delete holiday records
router.delete("/", holidayController.deleteHoliday);

module.exports = router;
