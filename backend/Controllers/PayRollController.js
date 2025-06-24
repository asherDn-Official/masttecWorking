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
// exports.testPayrollWithAttendance = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     const AttendanceRecord = require("../Models/AttendanceRecord");

//     if (!employeeId) {
//       return res.status(400).json({
//         success: false,
//         message: "Employee ID is required",
//       });
//     }

//     // Find attendance record for this employee
//     const attendanceRecord = await AttendanceRecord.findOne({ employeeId });

//     if (!attendanceRecord) {
//       return res.status(404).json({
//         success: false,
//         message: `No attendance record found for employee ID: ${employeeId}`,
//       });
//     }

//     console.log(`Testing payroll creation for employee: ${attendanceRecord.employeeName} (ID: ${employeeId})`);

//     // Test payroll creation
//     const payrollResult = await payrollService.createOrUpdatePayrollFromAttendance(attendanceRecord);

//     if (payrollResult.error) {
//       return res.status(500).json({
//         success: false,
//         message: "Error creating payroll from attendance",
//         error: payrollResult.message,
//         details: payrollResult.details
//       });
//     }

//     // Also check if employee record was created
//     const employeeRecord = await Employee.findOne({ employeeId });

//     res.status(200).json({
//       success: true,
//       message: `Payroll test completed for employee ${employeeId}`,
//       data: {
//         attendanceRecord: {
//           employeeId: attendanceRecord.employeeId,
//           employeeName: attendanceRecord.employeeName,
//           period: `${attendanceRecord.reportPeriodFrom} to ${attendanceRecord.reportPeriodTo}`,
//           presentDays: attendanceRecord.monthlySummary.presentDays,
//           absentDays: attendanceRecord.monthlySummary.absentDays
//         },
//         payrollRecord: payrollResult,
//         employeeRecord: employeeRecord ? {
//           employeeId: employeeRecord.employeeId,
//           employeeName: employeeRecord.employeeName,
//           salary: employeeRecord.salary,
//           epf: employeeRecord.epf,  
//           esic: employeeRecord.esic,
//           wasCreated: true
//         } : null
//       }
//     });

//   } catch (error) {
//     console.error("Error in payroll test:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error testing payroll creation",
//       error: error.message,
//     });
//   }
// };

// Send payslip via email
exports.sendPayslipEmail = async (req, res) => {
  try {
    const {  salaryMonth, salaryYear } = req.body;
    const { employeeId } = req.params;

    // Validate required fields
    if (!employeeId || !salaryMonth || !salaryYear) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, salary month, and salary year are required",
      });
    }

    // Get employee data
    console.log("Getting employee data for ID:", employeeId)
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee not found with ID: ${employeeId}`,
      });
    }
console.log("employeedetails",employee)
    // Check if employee has email
    if (!employee.mailId || employee.mailId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: `Email address not found for employee: ${employee.employeeName}`,
      });
    }

    // Get payroll data
    const payroll = await Payroll.findOne({ employeeId });
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: `Payroll record not found for employee: ${employee.employeeName}`,
      });
    }

    // Find the specific payrun for the month/year
    const payrun = payroll.payrunHistory.find(
      p => p.salaryMonth === salaryMonth && p.salaryYear === salaryYear
    );

    if (!payrun) {
      return res.status(404).json({
        success: false,
        message: `Payroll record not found for ${salaryMonth}/${salaryYear}`,
      });
    }

    // Create HTML payslip template
    const payslipHTML = createPayslipHTML(employee, payrun);

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to your email service
      auth: {
        user: process.env.EMAIL_USER || "gangadharana01@gmail.com", // Set in environment variables
        pass: process.env.EMAIL_PASS || 'moutcnnagdjyuobq' // Set in environment variables
      }
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      // to: employee.mailId,
      to: "gangadharana01@gmail.com",
      subject: `Payslip for ${getMonthName(salaryMonth)} ${salaryYear} - ${employee.employeeName}`,
      html: payslipHTML
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: `Payslip sent successfully to ${employee.mailId}`,
      data: {
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        email: employee.mailId,
        period: `${getMonthName(salaryMonth)} ${salaryYear}`,
        payableSalary: payrun.payableSalary
      }
    });

  } catch (error) {
    console.error("Error sending payslip email:", error);
    res.status(500).json({
      success: false,
      message: "Error sending payslip email",
      error: error.message,
    });
  }
};

// Send payslips to multiple employees
exports.sendBulkPayslipEmails = async (req, res) => {
  try {
    const { employeeIds, salaryMonth, salaryYear } = req.body;

    // Validate required fields
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Employee IDs array is required",
      });
    }

    if (!salaryMonth || !salaryYear) {
      return res.status(400).json({
        success: false,
        message: "Salary month and year are required",
      });
    }

    const results = {
      successful: [],
      failed: [],
      total: employeeIds.length
    };

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });

    // Process each employee
    for (const employeeId of employeeIds) {
      try {
        // Get employee data
        const employee = await Employee.findOne({ employeeId });
        if (!employee) {
          results.failed.push({
            employeeId,
            error: 'Employee not found'
          });
          continue;
        }

        // Check if employee has email
        if (!employee.mailId || employee.mailId.trim() === '') {
          results.failed.push({
            employeeId,
            employeeName: employee.employeeName,
            error: 'Email address not found'
          });
          continue;
        }

        // Get payroll data
        const payroll = await Payroll.findOne({ employeeId });
        if (!payroll) {
          results.failed.push({
            employeeId,
            employeeName: employee.employeeName,
            error: 'Payroll record not found'
          });
          continue;
        }

        // Find the specific payrun
        const payrun = payroll.payrunHistory.find(
          p => p.salaryMonth === salaryMonth && p.salaryYear === salaryYear
        );

        if (!payrun) {
          results.failed.push({
            employeeId,
            employeeName: employee.employeeName,
            error: `Payroll record not found for ${salaryMonth}/${salaryYear}`
          });
          continue;
        }

        // Create HTML payslip
        const payslipHTML = createPayslipHTML(employee, payrun);

        // Email options
        const mailOptions = {
          from: process.env.EMAIL_USER || 'your-email@gmail.com',
          to: employee.mailId,
          subject: `Payslip for ${getMonthName(salaryMonth)} ${salaryYear} - ${employee.employeeName}`,
          html: payslipHTML
        };

        // Send email
        await transporter.sendMail(mailOptions);

        results.successful.push({
          employeeId,
          employeeName: employee.employeeName,
          email: employee.mailId,
          payableSalary: payrun.payableSalary
        });

        // Add small delay to avoid overwhelming the email server
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error sending payslip to employee ${employeeId}:`, error);
        results.failed.push({
          employeeId,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk payslip sending completed. Sent: ${results.successful.length}, Failed: ${results.failed.length}`,
      data: results
    });

  } catch (error) {
    console.error("Error sending bulk payslip emails:", error);
    res.status(500).json({
      success: false,
      message: "Error sending bulk payslip emails",
      error: error.message,
    });
  }
};

// Helper function to create payslip HTML template
function createPayslipHTML(employee, payrun) {
  const monthName = getMonthName(payrun.salaryMonth);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payslip - ${employee.employeeName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .payslip-container {
          background-color: white;
          max-width: 800px;
          margin: 0 auto;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }
        .payslip-title {
          font-size: 18px;
          color: #666;
          margin-bottom: 10px;
        }
        .period {
          font-size: 16px;
          color: #333;
          font-weight: bold;
        }
        .employee-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 5px;
        }
        .employee-details {
          flex: 1;
        }
        .detail-row {
          margin-bottom: 8px;
        }
        .label {
          font-weight: bold;
          display: inline-block;
          width: 120px;
        }
        .payslip-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .payslip-table th,
        .payslip-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .payslip-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .earnings {
          background-color: #e8f5e8;
        }
        .deductions {
          background-color: #ffe8e8;
        }
        .total-row {
          background-color: #333;
          color: white;
          font-weight: bold;
        }
        .net-salary {
          background-color: #4CAF50;
          color: white;
          font-size: 18px;
          font-weight: bold;
          text-align: center;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
        .amount {
          text-align: right;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="payslip-container">
        <div class="header">
          <div class="company-name">Massetec Technology Solutions</div>
          <div class="payslip-title">SALARY SLIP</div>
          <div class="period">For the month of ${monthName} ${payrun.salaryYear}</div>
        </div>

        <div class="employee-info">
          <div class="employee-details">
            <div class="detail-row">
              <span class="label">Employee ID:</span>
              <span>${employee.employeeId}</span>
            </div>
            <div class="detail-row">
              <span class="label">Employee Name:</span>
              <span>${employee.employeeName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Department:</span>
              <span>${employee.department || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Designation:</span>
              <span>${employee.designation || 'N/A'}</span>
            </div>
          </div>
          <div class="employee-details">
            <div class="detail-row">
              <span class="label">Days Present:</span>
              <span>${payrun.present}</span>
            </div>
            <div class="detail-row">
              <span class="label">Days Absent:</span>
              <span>${payrun.absent}</span>
            </div>
            <div class="detail-row">
              <span class="label">Bank Account:</span>
              <span>${employee.bankAccountNumber || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="label">PAN Number:</span>
              <span>${employee.PANNumber || 'N/A'}</span>
            </div>
          </div>
        </div>

        <table class="payslip-table">
          <thead>
            <tr>
              <th style="width: 50%;">EARNINGS</th>
              <th style="width: 25%;">AMOUNT (₹)</th>
              <th style="width: 25%;">DEDUCTIONS</th>
              <th style="width: 25%;">AMOUNT (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary</td>
              <td class="amount">₹${parseFloat(payrun.basic || 0).toFixed(2)}</td>
              <td>EPF</td>
              <td class="amount">₹${parseFloat(payrun.EPF || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>House Rent Allowance</td>
              <td class="amount">₹${parseFloat(payrun.houseRent || 0).toFixed(2)}</td>
              <td>ESIC</td>
              <td class="amount">₹${parseFloat(payrun.ESIC || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Incentives</td>
              <td class="amount">₹${parseFloat(payrun.incentives || 0).toFixed(2)}</td>
              <td>Advance</td>
              <td class="amount">₹${parseFloat(payrun.advance || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Allowances</td>
              <td class="amount">₹${parseFloat(payrun.allowances || 0).toFixed(2)}</td>
              <td>Payment Loss</td>
              <td class="amount">₹${parseFloat(payrun.paymentLossAmount || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>OT1 Payment (${payrun.OT1Hours || 0} hrs)</td>
              <td class="amount">₹${parseFloat(payrun.OT1Amount || 0).toFixed(2)}</td>
              <td></td>
              <td class="amount"></td>
            </tr>
            <tr>
              <td>OT2 Payment (${payrun.OT2Hours || 0} hrs)</td>
              <td class="amount">₹${parseFloat(payrun.OT2Amount || 0).toFixed(2)}</td>
              <td></td>
              <td class="amount"></td>
            </tr>
            <tr class="total-row">
              <td>TOTAL EARNINGS</td>
              <td class="amount">₹${calculateTotalEarnings(payrun).toFixed(2)}</td>
              <td>TOTAL DEDUCTIONS</td>
              <td class="amount">₹${calculateTotalDeductions(payrun).toFixed(2)}</td>
            </tr>
            <tr class="net-salary">
              <td colspan="2">NET SALARY</td>
              <td colspan="2" class="amount">₹${parseFloat(payrun.payableSalary || 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>This is a computer-generated payslip and does not require a signature.</p>
          <p>Generated on: ${formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to get month name
function getMonthName(monthNumber) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[parseInt(monthNumber) - 1] || 'Unknown';
}

// Helper function to calculate total earnings
function calculateTotalEarnings(payrun) {
  return parseFloat(payrun.basic || 0) +
         parseFloat(payrun.houseRent || 0) +
         parseFloat(payrun.incentives || 0) +
         parseFloat(payrun.allowances || 0) +
         parseFloat(payrun.OT1Amount || 0) +
         parseFloat(payrun.OT2Amount || 0);
}

// Helper function to calculate total deductions
function calculateTotalDeductions(payrun) {
  return parseFloat(payrun.EPF || 0) +
         parseFloat(payrun.ESIC || 0) +
         parseFloat(payrun.advance || 0) +
         parseFloat(payrun.paymentLossAmount || 0);
}