const express = require("express");
const router = express.Router();
const payrollController = require("../Controllers/PayRollController");

// Create a new payroll record
router.post("/", payrollController.createPayroll);

// Get all payroll records
router.get("/", payrollController.getAllPayrolls);

// Process payroll from attendance data
router.post("/process-from-attendance", payrollController.processPayrollFromAttendance);

// Get a specific payroll record by employee ID
router.get("/:employeeId", payrollController.getPayrollByEmployeeId);

// Update a payroll record by employee ID
router.put("/:employeeId", payrollController.updatePayrollByEmployeeId);

// Delete a payroll record by employee ID
router.delete("/:employeeId", payrollController.deletePayrollByEmployeeId);

// Get payroll records by month and year
router.get("/month/:month/:year", payrollController.getPayrollByMonth);

// Create or update payroll with integrated employee and attendance data
router.post("/create-update", payrollController.createOrUpdatePayrollForEmployee);

// Create basic employee records for missing employees
router.post("/create-missing-employees", payrollController.createMissingEmployeeRecords);
router.post("/test-with-attendance/:employeeId", payrollController.testPayrollWithAttendance);

module.exports = router;