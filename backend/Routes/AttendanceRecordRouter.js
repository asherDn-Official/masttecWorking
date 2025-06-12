const express = require('express');
const router = express.Router();
const attendanceRecordController = require('../Controllers/AttendanceRecordController');

// GET attendance details (by specific date or by full month)
// Query params: employeeId (required), specificDate (YYYY-MM-DD, optional), reportMonth (YYYY-MM, optional)
router.get('/', attendanceRecordController.getAttendanceDetails);

// GET attendance details for ALL employees by a specific date
// Query params: specificDate (YYYY-MM-DD, required)
router.get('/by-date', attendanceRecordController.getAttendanceByDateForAllEmployees);

// PUT (update) a specific daily attendance entry
// Body: { employeeId, reportOverallDate (YYYY-MM), date (YYYY-MM-DD of entry), updateData: { ... } }
router.put('/daily-entry', attendanceRecordController.updateDailyAttendanceEntry);

// DELETE a whole monthly attendance record
// Query params: employeeId, reportOverallDate (YYYY-MM)
router.delete('/', attendanceRecordController.deleteMonthlyAttendanceRecord);

// DELETE a specific daily attendance entry from a monthly record
// Query params: employeeId, reportOverallDate (YYYY-MM), date (YYYY-MM-DD of entry)
router.delete('/daily-entry', attendanceRecordController.deleteDailyAttendanceEntry);

module.exports = router;