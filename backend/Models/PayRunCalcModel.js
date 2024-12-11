const mongoose = require("mongoose");

const payRunCalcSchema = new mongoose.Schema(
  {
    basic: {
      type: Number,
      required: true,
      min: 0,
    },
    houseRent: {
      type: Number,
      required: true,
      min: 0,
    },
    EPF: {
      type: Number,
      required: true,
      min: 0,
    },
    ESIC: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PayRunCalc", payRunCalcSchema);
