const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeName: { type: String },
    employeePicture: { type: String },
    employeeId: { type: String },
    department: { type: String },
    allowance: { type: String },
    departmentCode: { type: String },
    bankName: { type: String },
    bankBranch: { type: String },
    designation: { type: String },
    dateOfBirth: { type: String },
    password: { type: String },
    qualification: { type: String },
    bloodGroup: { type: String },
    mobileNumber: { type: String },
    mailId: { type: String },
    address: { type: String },
    bankAccountNumber: { type: String },
    bankIFSCCode: { type: String },
    PANNumber: { type: String },
    addressProof: { type: String },
    educationCertificate: { type: String },
    passbookProof: { type: String },
    PANCardProof: { type: String },
    salary: { type: String },
    aadhaarNo: { type: String },
    hra: { type: String },
    esic: { type: String },
    esicId: { type: String },
    epfId: { type: String },
    UANNo: { type: String },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
