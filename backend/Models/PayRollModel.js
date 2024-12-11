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
        salaryYear: { type: Number },
        present: { type: Number },
        absent: { type: Number },
        basic: { type: Number },
        houseRent: { type: Number },
        EPF: { type: Number },
        ESIC: { type: Number },
        incentives: { type: Number, default: 0 },
        allowances: { type: Number, default: 0 },
        advance: { type: Number, default: 0 },
        paymentLossDays: { type: Number, default: 0 },
        paymentLossAmount: { type: Number, default: 0 },
        OT1Hours: { type: Number, default: 0 },
        OT1Amount: { type: Number, default: 0 },
        OT2Hours: { type: Number, default: 0 },
        OT2Amount: { type: Number, default: 0 },
        holdOT: { type: Number, default: 0 },
        totalBasicPayment: { type: Number },
        totalOTPayment: { type: Number, default: 0 },
        payableSalary: { type: Number },
        balance: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payroll", payrollSchema);
