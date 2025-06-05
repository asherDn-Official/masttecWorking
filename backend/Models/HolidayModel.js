const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
  holidays: [{ // Renamed from holidayList for clarity and to store objects
    date: { type: Date, required: true },
    detail: { type: String, required: true } // Detail for each specific holiday
  }]
});

module.exports = mongoose.model("Holiday", holidaySchema);
