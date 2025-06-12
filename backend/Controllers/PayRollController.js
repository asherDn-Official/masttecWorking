const Payroll = require("../Models/PayRollModel");
const path = require("path");
const fs = require("fs-extra");
const nodemailer = require("nodemailer");
const htmlToPdf = require("html-pdf");
const payrollService = require("../services/payrollService");
const attendanceService = require("../services/attendanceService");

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  const daySuffix = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `${day}${daySuffix(day)} ${month} ${year}`;
};
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Create a new payroll record
exports.createPayroll = async (req, res) => {
  try {
    const { employeeId, payrunData } = req.body;

    if (!employeeId || !payrunData) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and payrun data are required",
      });
    }

    // Check if payroll record already exists for this employee
    let payrollRecord = await Payroll.findOne({ employeeId });

    if (payrollRecord) {
      // Add new payrun to history
      payrollRecord.payrunHistory.push(payrunData);
      await payrollRecord.save();
    } else {
      // Create new payroll record
      payrollRecord = new Payroll({
        employeeId,
        payrunHistory: [payrunData],
      });
      await payrollRecord.save();
    }

    res.status(201).json({
      success: true,
      message: "Payroll record created successfully",
      data: payrollRecord,
    });
  } catch (error) {
    console.error("Error creating payroll record:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payroll record",
      error: error.message,
    });
  }
};

// Process payroll from attendance data
exports.processPayrollFromAttendance = async (req, res) => {
  try {
    const { periodFrom, periodTo } = req.body;

    if (!periodFrom || !periodTo) {
      return res.status(400).json({
        success: false,
        message: "Period from and to dates are required",
      });
    }

    const result = await payrollService.processPayrollForPeriod(
      periodFrom,
      periodTo
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || "Failed to process payroll",
        errors: result.errors,
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed payroll for ${result.processedCount} employees`,
      data: {
        processedCount: result.processedCount,
        errorCount: result.errorCount,
        payrolls: result.payrolls,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error("Error processing payroll from attendance:", error);
    res.status(500).json({
      success: false,
      message: "Error processing payroll from attendance",
      error: error.message,
    });
  }
};

// Get all payroll records
exports.getAllPayrolls = async (req, res) => {
  try {
    const payrolls = await payrollService.getAllPayrolls();

    res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls,
    });
  } catch (error) {
    console.error("Error retrieving payroll records:", error);
    res.status(500).json({
      message: "Error retrieving payroll records ",
      error,
    });
  }
};

// Get a specific payroll record by employee ID
exports.getPayrollByEmployeeId = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const payroll = await payrollService.getPayrollByEmployeeId(employeeId);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: `Payroll record not found for employee ${employeeId}`,
      });
    }

    res.status(200).json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    console.error(`Error retrieving payroll for employee ${employeeId}:`, error);
    res.status(500).json({
      success: false,
      message: "Error retrieving payroll record",
      error: error.message,
    });
  }
};

// Update a payroll record by employee ID
exports.updatePayrollByEmployeeId = async (req, res) => {
  const { employeeId } = req.params;
  const updateData = req.body;

  try {
    const updatedPayroll = await payrollService.updatePayrollByEmployeeId(
      employeeId,
      updateData
    );

    res.status(200).json({
      success: true,
      message: "Payroll record updated successfully",
      data: updatedPayroll,
    });
  } catch (error) {
    console.error(`Error updating payroll for employee ${employeeId}:`, error);
    res.status(500).json({
      success: false,
      message: "Error updating payroll record",
      error: error.message,
    });
  }
};

// Delete a payroll record by employee ID
exports.deletePayrollByEmployeeId = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const deletedPayroll = await payrollService.deletePayrollByEmployeeId(
      employeeId
    );

    if (!deletedPayroll) {
      return res.status(404).json({
        success: false,
        message: `Payroll record not found for employee ${employeeId}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Payroll record deleted successfully",
      data: deletedPayroll,
    });
  } catch (error) {
    console.error(`Error deleting payroll for employee ${employeeId}:`, error);
    res.status(500).json({
      success: false,
      message: "Error deleting payroll record",
      error: error.message,
    });
  }
};