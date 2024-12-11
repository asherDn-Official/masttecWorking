const express = require("express");
const router = express.Router();
const attendanceController = require("../Controllers/AttendanceController");

// Attendance routes
router.post("/daily", attendanceController.createDailyAttendance); // Auto-generate daily attendance
router.post("/mark", attendanceController.markAttendance); // Mark attendance for employee
router.get("/:id", attendanceController.getAttendanceByEmployeeId); // Get attendance by employee ID
router.get("/", attendanceController.getAllAttendance);
router.put("/", attendanceController.updateAttendance);
router.post("/summary", attendanceController.attendanceSummary);

module.exports = router;
