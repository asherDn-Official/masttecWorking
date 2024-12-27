const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    payrunHistory: [
      {
        salaryMonth: { type: String },
        salaryYear: { type: String },
        present: { type: String },
        absent: { type: String },
        basic: { type: String },
        houseRent: { type: String },
        EPF: { type: String },
        ESIC: { type: String },
        incentives: { type: String },
        allowances: { type: String },
        advance: { type: String },
        paymentLossDays: { type: String },
        paymentLossAmount: { type: String },
        OT1Hours: { type: String },
        OT1Amount: { type: String },
        OT2Hours: { type: String },
        OT2Amount: { type: String },
        holdOT: { type: String },
        totalBasicPayment: { type: String },
        totalOTPayment: { type: String },
        payableSalary: { type: String },
        balance: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payroll", payrollSchema);
