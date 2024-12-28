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
      .header {
        text-align: center;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
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
        background-color: #eeeff5 ;
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
      .bg-light{
        background-color: #eeeff5 !important;
      }


      .logo{
         display: flex;
         flex-direction: column;
         text-align: left;
      }

    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">
          <h1>MASTEC MOULDS</h1>
          <p>
            No,18-A JEEVA NAGAR EXTN,DRR AVENUE,
            <br> KATTUPAKKAM,CHENNAI-56
          </p>
        </div>
        <h2>Pay Slip - October 2024</h2>
        <!-- <p>Pay Date: 24-11-2024</p> -->
      </div>

      <div class="section">
        <h3 class="title">Employee Details</h3>
        <table>
          <tr>
            <th>Name</th>
            <td>Kuppan</td>
            <th>Aadhaar No.</th>
            <td>3193 0742 0162</td>
          </tr>
          <tr>
            <th>Designation</th>
            <td>Fitter</td>
            <th>Bank A/c No.</th>
            <td>296801000002313</td>
          </tr>
          <tr>
            <th>Department</th>
            <td>Production</td>
            <th>Bank & Branch</th>
            <td>IOB / Kattupakkam</td>
          </tr>
          <tr>
            <th>Date of Joining</th>
            <td>17.06.2019</td>
            <th>IFSC Code</th>
            <td>IOBA0002968</td>
          </tr>
          <tr>
            <th>Increment on Salary</th>
            <td>N/A</td>
            <th>EPF Member ID</th>
            <td>TNAMB00692620000010064</td>
          </tr>
          <tr>
            <th>Payable Days</th>
            <td>28</td>
            <th>UAN No.</th>
            <td>10113294505</td>
          </tr>

          <tr>
            <th>Per Day Salary</th>
            <td>484</td>
            <th>ESIC No</th>
            <td>5132396769</td>
          </tr>

          <tr>
            <th>1 Hour salary</th>
            <td>60</td>
            <th>PAN NO</th>
            <td>IJEPK9723H</td>
          </tr>

          <tr>
            <th>Leave/Absent</th>
            <td>2</td>
            <th>Emploement ID</th>
            <td>46</td>
          </tr>

          <tr>
            <th>Mobile number</th>
            <td>9500123456</td>
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
              <td  class=" bg-light ">Basic</td>
              <td>7500</td>
              <td  class=" bg-light ">Loss of Pay</td>
              <td>968</td>
            </tr>
            <tr>
              <td  class=" bg-light " >Incentive</td>
              <td>0</td>
              <td  class=" bg-light ">EPF</td>
              <td>900</td>
            </tr>
            <tr>
              <td  class=" bg-light ">Allowances</td>
              <td>1500</td>
              <td  class=" bg-light ">ESIC</td>
              <td>132</td>
            </tr>
            <tr>
              <td  class=" bg-light ">HRA</td>
              <td>4000</td>
              <td  class=" bg-light ">Advance</td>
              <td>3000</td>
            </tr>
            <tr>
              <td  class=" bg-light ">Others</td>
              <td>0</td>
              <td  class=" bg-light ">TDS Debits</td>
              <td>-</td>
            </tr>
            <tr>
              <td  class=" bg-light ">Bonus</td>
              <td>-</td>
              <td  class=" bg-light ">Other Debits</td>
              <td>-</td>
            </tr>


            <tr>
              <td  class=" bg-light ">O.T @ 1.25</td>
              <td>1210 (16)</td>
              <td  class=" bg-light ">Production  Loss</td>
              <td>-</td>
            </tr>
            <tr>
              <td  class=" bg-light ">O.T @ 1.75</td>
              <td>847 (8)</td>
              <td  class=" bg-light ">-</td>
              <td>-</td>
            </tr>
            <tr class="total">
              <td  class=" bg-light ">Salary Gross</td>
              <td>20500</td>
              <td>Total Deductions -B</td>
              <td>4999</td>
            </tr>
            <tr class="total">
              <td colspan="3">Salary Net - A-B</td>
              <td>17557</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>PAY: Seventeen Thousand Five Hundred and Fifty-Seven Rupees</p>
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
