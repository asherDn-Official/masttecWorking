const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
  year: { type: Number, required: true },
  holidayList: { type: [Date], required: true },
});

module.exports = mongoose.model("Holiday", holidaySchema);
