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
router.put("/bulkUpdate", payrollController.updateMultiplePayrolls);

// Delete a payroll record by employee ID
router.delete("/:employeeId", payrollController.deletePayrollByEmployeeId);

// Get payroll records by month and year
router.get("/month/:month/:year", payrollController.getPayrollByMonth);

// Create or update payroll with integrated employee and attendance data
router.post("/create-update", payrollController.createOrUpdatePayrollForEmployee);

// Create basic employee records for missing employees
router.post("/create-missing-employees", payrollController.createMissingEmployeeRecords);
// router.post("/test-with-attendance/:employeeId", payrollController.testPayrollWithAttendance);

// Send payslip via email
router.post("/send-payslip-email/:employeeId", payrollController.sendPayslipEmail);

// Send bulk payslips via email
router.post("/send-bulk-payslip-emails", payrollController.sendBulkPayslipEmails);

module.exports = router;