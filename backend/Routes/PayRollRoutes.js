const express = require("express");
const router = express.Router();
const payrollController = require("../Controllers/PayRollController");

// Create a new payroll record
router.post("/", payrollController.createPayroll);

// Get all payroll records
router.get("/", payrollController.getAllPayrolls);

// Get a specific payroll record by employee ID
router.get("/:employeeId", payrollController.getPayrollByEmployeeId);

// Update a payroll record by employee ID
router.put("/:employeeId", payrollController.updatePayrollByEmployeeId);

// Delete a payroll record by employee ID
router.delete("/:employeeId", payrollController.deletePayrollByEmployeeId);

module.exports = router;
