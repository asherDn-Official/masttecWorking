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
    <title>Responsive Pay Slip</title>
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <style>
      :root {
        --headingColor: #5769b2;
        --textColor: #1b2356;
        --white: #ffffff;
        --EmployeebackGoundColor: #eeeff5;
        --SalaryH3: #17215e;
      }
      .lft {
        border-right: 2px solid solid #1b2356;
      }
      .card-custom {
        border-radius: 8px;
        padding: 15px 30px;
        background-color: #eeeff5;
      }

      .info-item {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 5px;
        color: #1b2356;
      }

      h3 {
        font-size: 40px;
        font-weight: 600;
        color: #5769b2;
      }

      h4 {
        font-size: 24px;
        color: #1b2356;
      }

      .SalaryH3 {
        color: #17215e;
        font-size: 36px;
        font-weight: 600;
      }

      .table-responsive {
        overflow-x: auto;
      }

      img {
        width: 100%;
        max-width: 300px;
        height: auto;
      }

      @media (max-width: 768px) {
        h3 {
          font-size: 1.8rem;
        }
        h4 {
          font-size: 1.4rem;
        }
        .card-custom {
          padding: 15px;
        }
        .info-item {
          /* grid-template-columns: 120px 1fr; */
          /* background-color: red; */
        }
      }

      .salary-head {
        background-color: #17215e !important;
        color: #ffffff !important;
      }

      .salary-offeset {
        background-color: #eeeff5 !important;
        font-weight: bold !important;
        color: #17215e !important;
      }

      .pay-number {
        color: #17215e !important;
      }
      .text-blue {
         color: #5769b2 !important;
      }
    </style>
  </head>
  <body>
    <div class="container py-5">
      <!-- Logo Section -->
      <header >
        <div class="text-center d-flex justify-content-between">
          <div class="  text-start ">
            <img src="./Assets/Logo.png" alt="Logo" class="img-fluid mb-3" style="max-width: 300px" />
            <h6 class="text-blue" >NO: 18-A JEEVA NAGAR EXTN,DRR AVENUE,
             <br>KATTUPAKKAM,CHENNAI-58</h6>
          </div>
          <h4 class="text-uppercase  text-blue">PAY SLIP - October 2024</h4>
        </div>
      </header>

      <h4 class="my-3 text-center">Employee Details</h4>


      <!-- Employee Details -->
      <div class="container my-3">
        <div class="card card-custom shadow">
          <div class="row g-3">
            <!-- Left Column -->
            <div class="col-md-6 col-12">
              <div class="info-item lft">
                <span>Name</span>
                <p>: Kuppan</p>
              </div>
              <div class="info-item lft">
                <span>Designation</span>
                <p>: Fitter</p>
              </div>
              <div class="info-item lft">
                <span>Department</span>
                <p>: Production</p>
              </div>
              <div class="info-item lft">
                <span>Date of Joining</span>
                <p>: 17.06.2019</p>
              </div>
              <div class="info-item lft">
                <span>Increment on Salary</span>
                <p>: N/A</p>
              </div>
              <div class="info-item lft">
                <span>Payable Days</span>
                <p>: 28</p>
              </div>
              <div class="info-item lft">
                <span>Per Day Salary</span>
                <p>: 484</p>
              </div>
              <div class="info-item lft">
                <span>1 Hour Salary</span>
                <p>: 60</p>
              </div>
              <div class="info-item lft">
                <span>Leave/Absent</span>
                <p>: 2</p>
              </div>
              <div class="info-item lft">
                <span>Mobile Number</span>
                <p>: 9551207526</p>
              </div>
            </div>

            <!-- Right Column -->
            <div class="col-md-6 col-12">
              <div class="info-item">
                <span>Aadhaar No.</span>
                <p>: 3193 0742 0162</p>
              </div>
              <div class="info-item">
                <span>Bank A/c No.</span>
                <p>: 296801000002313</p>
              </div>
              <div class="info-item">
                <span>Bank & Branch</span>
                <p>: IOB / KATTUPAKKAM</p>
              </div>
              <div class="info-item">
                <span>IFSC Code</span>
                <p>: IOBA0002968</p>
              </div>
              <div class="info-item">
                <span>EPF Member ID</span>
                <p>: TNAMB0069262000001064</p>
              </div>
              <div class="info-item">
                <span>UAN No.</span>
                <p>: 101113294505</p>
              </div>
              <div class="info-item">
                <span>ESIC No.</span>
                <p>: 5132396769</p>
              </div>
              <div class="info-item">
                <span>PAN No.</span>
                <p>: IJEPK9723H</p>
              </div>
              <div class="info-item">
                <span>Employee ID</span>
                <p>: 46</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Salary Details Section -->
      <div class="text-center mb-4">
        <h3 class="SalaryH3">SALARY DETAILS</h3>
      </div>

      <!-- Salary Table -->
      <div class="table-responsive">
        <table class="table text-center table-bordered rounded-5">
          <thead>
            <tr>
              <th class="salary-head">Employee’s</th>
              <th class="salary-head">Earned</th>
              <th class="salary-head">Deductions</th>
              <th class="salary-head">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="salary-offeset">Basic</td>
              <td>7500</td>
              <td class="salary-offeset">Loss of Pay</td>
              <td>968</td>
            </tr>
            <tr>
              <td class="salary-offeset">Incentive</td>
              <td>0</td>
              <td class="salary-offeset">EPF</td>
              <td>900</td>
            </tr>
            <tr>
              <td class="salary-offeset">Allowances</td>
              <td>1500</td>
              <td class="salary-offeset">ESIC</td>
              <td>132</td>
            </tr>
            <tr>
              <td class="salary-offeset">HRA</td>
              <td>4000</td>
              <td class="salary-offeset">Advance</td>
              <td>3000</td>
            </tr>
            <tr>
              <td class="salary-offeset">Others</td>
              <td>0</td>
              <td class="salary-offeset">TDS Debit</td>
              <td>-</td>
            </tr>
            <tr>
              <td class="salary-offeset">Bonus</td>
              <td>-</td>
              <td class="salary-offeset">Other Debits</td>
              <td>-</td>
            </tr>
            <tr>
              <td class="salary-offeset">O.T @ 1.25</td>
              <td>1210(16)</td>
              <td class="salary-offeset">Production Loss</td>
              <td></td>
            </tr>
            <tr>
              <td class="salary-offeset">O.T @ 1.75</td>
              <td>847(8)</td>
              <td class="salary-offeset"></td>
              <td></td>
            </tr>
            <tr>
              <td class="salary-offeset"><b>Salary Gross</b></td>
              <td><b>20500</b></td>
              <td class="salary-offeset"><b>Total Deductions - B</b></td>
              <td><b>4999</b></td>
            </tr>
            <tr>
              <td class="salary-offeset"></td>
              <td></td>
              <td class="salary-offeset"><b>Salary Net - A-B</b></td>
              <td><b> Rs.17557.00</b></td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- <h4 class="text-end h6 fw-bold pay-number">
        PAY :
        <span>Seventeen Thousand five hundred and fifty seven Rupees</span>
      </h4> -->
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js"></script>
  </body>
</html>
`

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
