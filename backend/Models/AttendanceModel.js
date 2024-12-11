const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    records: [
      {
        date: { type: Date, required: true, default: Date.now },
        status: {
          type: String,
          enum: [
            "Present",
            "Absent",
            "Late",
            "Sunday",
            "Paid Leave",
            "Up-Paid Leave",
            "Holiday",
            "C-Off",
            "Week-Off",
          ],
          default: "Absent",
        },
        punchIn: { type: Date },
        punchOut: { type: Date },
        recordedPunchIn: { type: Date },
        recordedPunchOut: { type: Date },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
