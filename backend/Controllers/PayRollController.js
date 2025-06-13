const Payroll = require("../Models/PayRollModel");
const Employee = require("../Models/EmployeeModel");
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
    console.log("getAllPayrolls endpoint called");
    const payrolls = await payrollService.getAllPayrolls();
    console.log(`Found ${payrolls.length} payroll records`);

    res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls,
      message: `Retrieved ${payrolls.length} payroll records successfully`
    });
  } catch (error) {
    console.error("Error retrieving payroll records:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving payroll records",
      error: error.message,
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

// Get payroll records by month and year
exports.getPayrollByMonth = async (req, res) => {
  const { month, year } = req.params;

  try {
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    const payrolls = await payrollService.getPayrollWithEmployeeDetailsByMonth(
      month, 
      year
    );

    res.status(200).json({
      success: true,
      message: `Payroll records retrieved for ${month}/${year}`,
      count: payrolls.length,
      data: payrolls,
    });
  } catch (error) {
    console.error(`Error retrieving payroll for month ${month}/${year}:`, error);
    res.status(500).json({
      success: false,
      message: "Error retrieving payroll records",
      error: error.message,
    });
  }
};

// Create basic employee records for missing employees found in attendance
exports.createMissingEmployeeRecords = async (req, res) => {
  try {
    const { employeeIds } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds)) {
      return res.status(400).json({
        success: false,
        message: "Employee IDs array is required",
      });
    }

    const createdEmployees = [];
    const existingEmployees = [];
    const errors = [];

    for (const employeeId of employeeIds) {
      try {
        // Check if employee already exists
        const existingEmployee = await Employee.findOne({ employeeId });
        
        if (existingEmployee) {
          existingEmployees.push(employeeId);
          continue;
        }

        // Create basic employee record
        const newEmployee = new Employee({
          employeeId: employeeId,
          employeeName: `Employee ${employeeId}`,
          salary: "0",
          epf: "0",
          esic: "0",
          status: true,
          // Other fields will have default values or empty strings
        });

        await newEmployee.save();
        createdEmployees.push(employeeId);
        console.log(`Created basic employee record for ID: ${employeeId}`);
      } catch (error) {
        console.error(`Error creating employee record for ID ${employeeId}:`, error);
        errors.push({
          employeeId,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed ${employeeIds.length} employee IDs`,
      data: {
        created: createdEmployees,
        existing: existingEmployees,
        errors: errors,
        summary: {
          totalProcessed: employeeIds.length,
          created: createdEmployees.length,
          existing: existingEmployees.length,
          errors: errors.length
        }
      }
    });
  } catch (error) {
    console.error("Error creating missing employee records:", error);
    res.status(500).json({
      success: false,
      message: "Error creating missing employee records",
      error: error.message,
    });
  }
};

// Create or update payroll with employee and attendance data integration
exports.createOrUpdatePayrollForEmployee = async (req, res) => {
  try {
    const { employeeId, salaryMonth, salaryYear, payrunData } = req.body;

    if (!employeeId || !salaryMonth || !salaryYear) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, salary month, and salary year are required",
      });
    }

    // Check if payroll record already exists for this employee
    let payrollRecord = await payrollService.getPayrollByEmployeeId(employeeId);

    if (payrollRecord) {
      // Check if payrun for this month and year already exists
      const existingPayrunIndex = payrollRecord.payrunHistory.findIndex(
        payrun => payrun.salaryMonth === salaryMonth && 
                 payrun.salaryYear === salaryYear
      );

      if (existingPayrunIndex !== -1) {
        // Update existing payrun
        const updateData = {
          payrunIndex: existingPayrunIndex,
          payrunData: {
            ...payrunData,
            salaryMonth,
            salaryYear
          }
        };
        
        const updatedPayroll = await payrollService.updatePayrollByEmployeeId(
          employeeId, 
          updateData
        );
        
        return res.status(200).json({
          success: true,
          message: "Payroll record updated successfully",
          data: updatedPayroll,
        });
      } else {
        // Add new payrun to existing record
        const updateData = {
          payrunData: {
            salaryMonth,
            salaryYear,
            present: payrunData.present || "0",
            absent: payrunData.absent || "0",
            basic: payrunData.basic || "0",
            houseRent: payrunData.houseRent || "0",
            EPF: payrunData.EPF || "0",
            ESIC: payrunData.ESIC || "0",
            incentives: payrunData.incentives || "0",
            allowances: payrunData.allowances || "0",
            advance: payrunData.advance || "0",
            paymentLossDays: payrunData.paymentLossDays || "0",
            paymentLossAmount: payrunData.paymentLossAmount || "0",
            OT1Hours: payrunData.OT1Hours || "0",
            OT1Amount: payrunData.OT1Amount || "0",
            OT2Hours: payrunData.OT2Hours || "0",
            OT2Amount: payrunData.OT2Amount || "0",
            holdOT: payrunData.holdOT || "0",
            totalBasicPayment: payrunData.totalBasicPayment || "0",
            totalOTPayment: payrunData.totalOTPayment || "0",
            payableSalary: payrunData.payableSalary || "0",
            balance: payrunData.balance || "0"
          }
        };
        
        const updatedPayroll = await payrollService.updatePayrollByEmployeeId(
          employeeId, 
          updateData
        );
        
        return res.status(201).json({
          success: true,
          message: "New payroll record added successfully",
          data: updatedPayroll,
        });
      }
    } else {
      // Create new payroll record
      const newPayrunData = {
        salaryMonth,
        salaryYear,
        present: payrunData.present || "0",
        absent: payrunData.absent || "0",
        basic: payrunData.basic || "0",
        houseRent: payrunData.houseRent || "0",
        EPF: payrunData.EPF || "0",
        ESIC: payrunData.ESIC || "0",
        incentives: payrunData.incentives || "0",
        allowances: payrunData.allowances || "0",
        advance: payrunData.advance || "0",
        paymentLossDays: payrunData.paymentLossDays || "0",
        paymentLossAmount: payrunData.paymentLossAmount || "0",
        OT1Hours: payrunData.OT1Hours || "0",
        OT1Amount: payrunData.OT1Amount || "0",
        OT2Hours: payrunData.OT2Hours || "0",
        OT2Amount: payrunData.OT2Amount || "0",
        holdOT: payrunData.holdOT || "0",
        totalBasicPayment: payrunData.totalBasicPayment || "0",
        totalOTPayment: payrunData.totalOTPayment || "0",
        payableSalary: payrunData.payableSalary || "0",
        balance: payrunData.balance || "0"
      };

      const newPayroll = await Payroll.create({
        employeeId,
        payrunHistory: [newPayrunData],
      });

      return res.status(201).json({
        success: true,
        message: "Payroll record created successfully",
        data: newPayroll,
      });
    }
  } catch (error) {
    console.error("Error creating/updating payroll record:", error);
    res.status(500).json({
      success: false,
      message: "Error creating/updating payroll record",
      error: error.message,
    });
  }
};

// Test payroll creation with specific attendance record
exports.testPayrollWithAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const AttendanceRecord = require("../Models/AttendanceRecord");

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    // Find attendance record for this employee
    const attendanceRecord = await AttendanceRecord.findOne({ employeeId });

    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        message: `No attendance record found for employee ID: ${employeeId}`,
      });
    }

    console.log(`Testing payroll creation for employee: ${attendanceRecord.employeeName} (ID: ${employeeId})`);

    // Test payroll creation
    const payrollResult = await payrollService.createOrUpdatePayrollFromAttendance(attendanceRecord);

    if (payrollResult.error) {
      return res.status(500).json({
        success: false,
        message: "Error creating payroll from attendance",
        error: payrollResult.message,
        details: payrollResult.details
      });
    }

    // Also check if employee record was created
    const employeeRecord = await Employee.findOne({ employeeId });

    res.status(200).json({
      success: true,
      message: `Payroll test completed for employee ${employeeId}`,
      data: {
        attendanceRecord: {
          employeeId: attendanceRecord.employeeId,
          employeeName: attendanceRecord.employeeName,
          period: `${attendanceRecord.reportPeriodFrom} to ${attendanceRecord.reportPeriodTo}`,
          presentDays: attendanceRecord.monthlySummary.presentDays,
          absentDays: attendanceRecord.monthlySummary.absentDays
        },
        payrollRecord: payrollResult,
        employeeRecord: employeeRecord ? {
          employeeId: employeeRecord.employeeId,
          employeeName: employeeRecord.employeeName,
          salary: employeeRecord.salary,
          epf: employeeRecord.epf,  
          esic: employeeRecord.esic,
          wasCreated: true
        } : null
      }
    });

  } catch (error) {
    console.error("Error in payroll test:", error);
    res.status(500).json({
      success: false,
      message: "Error testing payroll creation",
      error: error.message,
    });
  }
};