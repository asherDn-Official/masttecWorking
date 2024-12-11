const Payroll = require("../Models/PayRollModel");
const path = require("path");
const fs = require("fs-extra");
const nodemailer = require("nodemailer");
const htmlToPdf = require("html-pdf");
const formatDate = async (date) => {
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" }).toUpperCase();
  const year = date.getFullYear();

  const daySuffix = (day) => {
    if (day > 3 && day < 21) return "TH"; // handles 11th - 13th
    switch (day % 10) {
      case 1:
        return "ST";
      case 2:
        return "ND";
      case 3:
        return "RD";
      default:
        return "TH";
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
  const { employeeData, email, month, year } = req.body;
  console.log("employee : ", email);

  if (!employeeData || !employeeData.employeeId) {
    return res.status(400).json({ message: "Employee ID is required" });
  }
  if (!email) {
    console.log("not sent email not available");
    return res.status(400).send("No employee email data provided.");
  }
  if (!month || !year) {
    return res
      .status(400)
      .json({ message: "Both month and year are required." });
  }
  const date = await formatDate(new Date());
  // Define pdfPath here for later access
  const pdfPath = path.join(
    uploadDir,
    `${employeeData.employeeId}-payslip-${month.toUpperCase()}-${year}.pdf`
  );
  try {
    const payroll = await Payroll.findOne({
      employeeId: employeeData.employeeId,
    });
    if (payroll) {
      // Check if month and year already exist in payrunHistory
      const existingEntryIndex = payroll.payrunHistory.findIndex(
        (entry) =>
          Number(entry.salaryMonth) === Number(month) &&
          Number(entry.salaryYear) === Number(year)
      );

      if (existingEntryIndex >= 0) {
        // Update the existing entry for the same month and year
        payroll.payrunHistory[existingEntryIndex] = {
          salaryMonth: month,
          salaryYear: year,
          present: employeeData.employeePresentDays,
          absent: employeeData.employeeAbsentDays,
          basic: employeeData.employeeBasicSalary,
          houseRent: employeeData.employeeHouseRent,
          EPF: employeeData.employeeEPF,
          ESIC: employeeData.employeeESIC,
          incentives: employeeData.employeeIncentives,
          allowances: employeeData.employeeAllowances,
          advance: employeeData.employeeAdvance,
          paymentLossDays: employeeData.employeePLoss,
          paymentLossAmount: employeeData.employeePLossAmount,
          OT1Hours: employeeData.employeeOT1Days,
          OT1Amount: employeeData.employeeOT1Amount,
          OT2Hours: employeeData.employeeOT2Days,
          OT2Amount: employeeData.employeeOT2Amount,
          holdOT: employeeData.employeeHoldOT,
          totalBasicPayment: employeeData.payOn5th,
          totalOTPayment: employeeData.payOn20th,
          payableSalary: employeeData.empSalary,
          balance: employeeData.empBalance,
        };
      } else {
        // Add a new entry for the month and year
        payroll.payrunHistory.push({
          salaryMonth: month,
          salaryYear: year,
          present: employeeData.employeePresentDays,
          absent: employeeData.employeeAbsentDays,
          basic: employeeData.employeeBasicSalary,
          houseRent: employeeData.employeeHouseRent,
          EPF: employeeData.employeeEPF,
          ESIC: employeeData.employeeESIC,
          incentives: employeeData.employeeIncentives,
          allowances: employeeData.employeeAllowances,
          advance: employeeData.employeeAdvance,
          paymentLossDays: employeeData.employeePLoss,
          paymentLossAmount: employeeData.employeePLossAmount,
          OT1Hours: employeeData.employeeOT1Days,
          OT1Amount: employeeData.employeeOT1Amount,
          OT2Hours: employeeData.employeeOT2Days,
          OT2Amount: employeeData.employeeOT2Amount,
          holdOT: employeeData.employeeHoldOT,
          totalBasicPayment: employeeData.payOn5th,
          totalOTPayment: employeeData.payOn20th,
          payableSalary: employeeData.empSalary,
          balance: employeeData.empBalance,
        });
      }

      // Save the updated payroll document
      await payroll.save();
    } else {
      // If no payroll exists for this employee, create a new record
      const newPayroll = new Payroll({
        employeeId: employeeData.employeeId,
        payrunHistory: [
          {
            salaryMonth: month,
            salaryYear: year,
            present: employeeData.employeePresentDays,
            absent: employeeData.employeeAbsentDays,
            basic: employeeData.employeeBasicSalary,
            houseRent: employeeData.employeeHouseRent,
            EPF: employeeData.employeeEPF,
            ESIC: employeeData.employeeESIC,
            incentives: employeeData.employeeIncentives,
            allowances: employeeData.employeeAllowances,
            advance: employeeData.employeeAdvance,
            paymentLossDays: employeeData.employeePLoss,
            paymentLossAmount: employeeData.employeePLossAmount,
            OT1Hours: employeeData.employeeOT1Days,
            OT1Amount: employeeData.employeeOT1Amount,
            OT2Hours: employeeData.employeeOT2Days,
            OT2Amount: employeeData.employeeOT2Amount,
            holdOT: employeeData.employeeHoldOT,
            totalBasicPayment: employeeData.payOn5th,
            totalOTPayment: employeeData.payOn20th,
            payableSalary: employeeData.empSalary,
            balance: employeeData.empBalance,
          },
        ],
      });

      await newPayroll.save();
    }
    const getValueOrDash = (value) =>
      value !== undefined && value !== null ? value : "-";

    const pdfContent = `pdf`;

    // Generate PDF from HTML content
    await new Promise((resolve, reject) => {
      htmlToPdf.create(pdfContent).toFile(pdfPath, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    // Create HTML email content
    const emailContent = `mail`;

    // Set up the email transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465, // Use 465 for secure connections
      secure: true, // Ensure secure is true for port 465
      auth: {
        user: "developers@asherdn.com", // Replace with valid email
        pass: "asherDn@1234", // Replace with valid password
      },
    });

    // Set up email data
    const mailOptions = {
      from: "developers@asherdn.com", // Sender address
      to: email, // Receiver email
      subject: `Payslip - ${month} ${year}`, // Subject line
      html: emailContent, // Email content in HTML
      attachments: [
        {
          filename: path.basename(pdfPath),
          path: pdfPath, // Path to the PDF file
        },
      ],
    };

    // Send the email
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
    } catch (err) {
      console.error("Error sending email:", err.message);
      throw new Error("Failed to send email. Check SMTP configuration.");
    }

    // After sending the email, delete the file
    fs.unlink(pdfPath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${err.message}`);
      } else {
        console.log(`File deleted successfully: ${pdfPath}`);
      }
    });

    return res.status(201).json({
      message: "Payroll record updated successfully.",
      payroll: payroll || newPayroll,
    });
  } catch (error) {
    console.error("Error creating or updating payroll record:", error);
    res.status(500).json({
      message: "Error creating or updating payroll record.",
      error: error.message,
    });
  }
};

// Get all payroll records
exports.getAllPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find();
    res.status(200).json(payrolls);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving payroll records", error });
  }
};

// Get a specific payroll record by employee ID
exports.getPayrollByEmployeeId = async (req, res) => {
  const { employeeId } = req.params;

  if (!employeeId) {
    return res.status(400).json({ message: "Employee ID is required" });
  }

  try {
    const payroll = await Payroll.findOne({ employeeId });
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving payroll record", error });
  }
};

// Update a payroll record by employee ID
exports.updatePayrollByEmployeeId = async (req, res) => {
  const { employeeId } = req.params;

  if (!employeeId) {
    return res.status(400).json({ message: "Employee ID is required" });
  }

  try {
    const payroll = await Payroll.findOneAndUpdate({ employeeId }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }
    res
      .status(200)
      .json({ message: "Payroll record updated successfully", payroll });
  } catch (error) {
    res.status(400).json({ message: "Error updating payroll record", error });
  }
};

// Delete a payroll record by employee ID
exports.deletePayrollByEmployeeId = async (req, res) => {
  const { employeeId } = req.params;

  if (!employeeId) {
    return res.status(400).json({ message: "Employee ID is required" });
  }

  try {
    const payroll = await Payroll.findOneAndDelete({ employeeId });
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }
    res.status(200).json({ message: "Payroll record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting payroll record", error });
  }
};
