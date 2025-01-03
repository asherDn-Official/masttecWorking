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

function getMonthName(monthNumber) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error(
      "Invalid month number. Please provide a number between 1 and 12."
    );
  }

  return months[monthNumber - 1];
}

// Create a new payroll record

exports.createPayroll = async (req, res) => {
  const { employeeData, email, month, year } = req.body;
  console.log("employee :   ", email);

  console.log("employeeData : ", employeeData);

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
  let monthName;
  try {
    monthName = getMonthName(month);
    console.log("Selected Month: ", monthName);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  const date = await formatDate(new Date());
  // Define pdfPath here for later access
  const pdfPath = path.join(
    uploadDir,
    `${employeeData.employeeId}-payslip-${monthName.toUpperCase()}-${year}.pdf`
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
      value !== undefined && value !== null && value !== "" ? value : "-";

    const pdfContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pay Slip - October 2024</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 800px;
        margin: auto;
        padding: 20px;
        border: 1px solid #ccc;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        color: #333;
      }
      .header h2 {
        margin: 5px 0 0;
        font-size: 18px;
        color: #666;
      }
      .section {
        margin-bottom: 20px;
      }
      .section h3 {
        margin-bottom: 10px;
        font-size: 18px;
        color: #333;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      table,
      th,
      td {
        border: 1px solid #ddd;
      }
      th,
      td {
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #eeeff5;
      }
      .total {
        font-weight: bold;
        background-color: #f9f9f9;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        font-size: 14px;
        color: #555;
      }
      .title {
        text-align: center;
      }

      .table-title {
        background-color: #17215e;
        color: #fff;
      }
      .bg-light {
        background-color: #eeeff5 !important;
      }

      .logo {
        display: flex;
        flex-direction: column;
        text-align: left;
      }

      .logo p {
        font-size: 12px;
        color: #17215e;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header" >
        <div class="logo" style="float: left;">
          <!-- <h1>MASTEC MOULDS</h1> -->
          <img
            src="https://www.masttecmoulds.com/image/logo%20mast.png"
            alt="Logo"
            width="250"
            height="80"
          />
          <p>
            No,18-A JEEVA NAGAR EXTN,DRR AVENUE,
            <br />
            KATTUPAKKAM,CHENNAI-56
          </p>
        </div>
        <h2 style="float: right;">Pay Slip - ${monthName} 2024</h2>
        <!-- <p>Pay Date: 24-11-2024</p> -->
      </div>
      <div style="clear: both;"></div>

      <div class="section">
        <h3 class="title">Employee Details</h3>
        <table>
          <tr>
            <th>Name</th>
            <td>${getValueOrDash(employeeData?.employeeName)}</td>
            <th>Aadhaar No.</th>
            <td>${getValueOrDash(employeeData?.employeeAadhaarNo)}</td>
          </tr>
          <tr>
            <th>Designation</th>
            <td>${getValueOrDash(employeeData?.employeeDesignation)}</td>
            <th>Bank A/c No.</th>
            <td>${getValueOrDash(
              employeeData?.bankAccountNumber
            )}  </td>  //not found
          </tr>
          <tr>
            <th>Department</th>
            <td>${getValueOrDash(employeeData?.employeeDepartment)}</td>
            <th>Bank & Branch</th>
            <td> ${getValueOrDash(employeeData?.bankName)}/${
      employeeData?.bankBranch
    }</td> 
          </tr>
          <tr>
            <th>Date of Joining</th>
            <td> ${employeeData?.employeeDateOfJoining}</td>  //not found
            <th>IFSC Code</th>
            <td>${getValueOrDash(employeeData?.bankIFSCCode)}</td> 
          </tr>
          <tr>
            <th>Increment on Salary</th>
            <td> N/A </td>        //not needed
            <th>EPF Member ID</th>  
            <td> ${getValueOrDash(employeeData?.employeeEPF)}</td>
          </tr>
          <tr>
            <th>Payable Days</th>  
            <td>${getValueOrDash(employeeData?.employeePresentDays)}</td>
            <th>UAN No.</th>
            <td>${getValueOrDash(employeeData?.employeeUANNo)}</td>
          </tr>

          <tr>
            <th>Per Day Salary</th>
            <td>${getValueOrDash(employeeData?.employeePerHrSalary * 8)}</td>   
            <th>ESIC No</th>
            <td> ${getValueOrDash(employeeData?.employeeESIC)}</td>
          </tr>

          <tr>
            <th>1 Hour salary</th>
            <td>${employeeData?.employeePerHrSalary}</td>   
            <th>PAN NO</th>  
            <td>${getValueOrDash(employeeData?.employeePANNumber)}</td>
          </tr>

          <tr>
            <th>Leave/Absent</th>
            <td>${getValueOrDash(30 - employeeData?.employeePresentDays)}</td>
            <th>Emploement ID</th>
            <td>${getValueOrDash(employeeData?.employeeId)}</td>
          </tr>

          <tr>
            <th>Mobile number</th>
            <td>${getValueOrDash(employeeData?.employeeMobileNumber)}</td>
            <th></th>
            <td></td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h3 class="title">Salary Details</h3>
        <table>
          <thead>
            <tr>
              <th class="table-title">Employee's</th>
              <th class="table-title">Earned</th>
              <th class="table-title">Deductions</th>
              <th class="table-title">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="bg-light">Basic</td>
              <td>${getValueOrDash(employeeData?.employeeBasicSalary)}</td>
              <td class="bg-light">Loss of Pay</td>
              <td>968</td>
            </tr>
            <tr>
              <td class="bg-light">Incentive</td>
              <td>${getValueOrDash(employeeData?.employeeIncentives)}</td>
              <td class="bg-light">EPF</td>
              <td>${getValueOrDash(employeeData?.employeeEPFId)}</td>
            </tr>
            <tr>
              <td class="bg-light">Allowances</td>s
              <td>${getValueOrDash(employeeData?.employeeAllowances)}</td>
              <td class="bg-light">ESIC</td>
              <td>${getValueOrDash(employeeData?.employeeESICId)}</td>
            </tr>
            <tr>
              <td class="bg-light">HRA</td>
              <td>${getValueOrDash(employeeData?.employeeHouseRent)}</td>
              <td class="bg-light">Advance</td>
              <td>${getValueOrDash(employeeData?.employeeAdvance)}</td>
            </tr>
            <tr>
              <td class="bg-light">Others</td>  - not neeeded
              <td>0</td> 
              <td class="bg-light">TDS Debits</td>  - not needed
              <td>-</td>
            </tr>
            <tr>
              <td class="bg-light">Bonus</td>   -needed
              <td>-</td>
              <td class="bg-light">Other Debits</td>  - not needed
              <td>-</td>
            </tr>

            <tr>
              <td class="bg-light">O.T @ 1.25</td>
              <td> 
              ${getValueOrDash(
                employeeData?.employeeOT1Amount
              )}(${getValueOrDash(employeeData?.employeeOT1Hours)}) </td>
              <td class="bg-light">Production Loss</td>  // not needed
              <td>-</td>
            </tr>
            <tr>
              <td class="bg-light">O.T @ 1.75</td>
              <td>${getValueOrDash(employeeData?.employeeOT2Amount)} (${getValueOrDash(
      employeeData?.employeeOT2Hour)
    })</td>
              <td class="bg-light">-</td>
              <td>-</td>
            </tr>
            <tr class="total">
              <td class="bg-light">Salary Gross</td>
              <td>${getValueOrDash(employeeData?.grossSalary)}</td>
              <td>Total Deductions -B</td>
              <td>${getValueOrDash(employeeData?.TotalDeductions)}</td>
            </tr>
            <tr class="total">
              <td colspan="3">Salary Net - A-B</td>
              <td>${getValueOrDash(employeeData?.salary)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </body>
</html>
`;

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
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
      },
    });

    //--------------------------------------------------------------------------------------------------------------

    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: "crouselearn@gmail.com",
    //     pass: "praveenK48706@gmail.com",
    //   },
    //   tls: {
    //     rejectUnauthorized: false, // Accept self-signed certificates
    //   },
    // });

    //--------------------------------------------------------------------------------------------------------------

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
      .json({ message: "Error retrieving payroll records ", error });
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
