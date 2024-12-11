const mongoose = require("mongoose");

const rolesSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
    },
    authorizedPersons: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("roles", rolesSchema);
