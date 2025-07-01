const mongoose = require("mongoose");

const emailResultSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  successful: [
    {
      employeeId: { type: String, required: true },
      employeeName: { type: String, required: true },
      email: { type: String, required: true },
      payableSalary: { type: String, required: true }
    }
  ],
  failed: [
    {
      employeeId: { type: String, required: true },
      employeeName: { type: String, required: true },
      error: { type: String, required: true }
    }
  ],
  total: { type: Number, required: true }
});

module.exports = mongoose.model("EmailResult", emailResultSchema);
