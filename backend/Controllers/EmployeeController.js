const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Employee = require("../Models/EmployeeModel");
const TempEmployee = require("../Models/tempEmployeeModel");
const Role = require("../Models/RolesModel");
// Helper function to generate password from DOB
const generatePasswordFromDOB = (dob) => {
  // Assuming dob is in format "yyyy-mm-dd", we convert it to "ddmmyyyy"
  const [year, month, day] = dob.split("-");
  return `${day}${month}${year}`;
};

// Create a new employee
exports.createEmployee = async (req, res) => {
  try {
    // const {
    //   employeeName,
    //   employeePicture,
    //   employeeId,
    //   designation,
    //   dateOfBirth,
    //   qualification,
    //   bloodGroup,
    //   mobileNumber,
    //   mailId,
    //   address,
    //   bankAccountNumber,
    //   bankIFSCCode,
    //   PANNumber,
    //   addressProof,
    //   educationCertificate,
    //   passbookProof,
    //   PANCardProof,
    //   department,
    //   departmentCode,
    //   bankName,
    //   bankBranch,
    //   salary,
    //   epf,
    //   esic,
    //   esicId,
    //   epfId,
    //   UANNo,
    // } = req.body;
    // console.log(req.body);
    const employee = req.body;
    console.log(employee);
    // Automatically generate the password from DOB
    const password = generatePasswordFromDOB(employee.dateOfBirth);

    const newEmployee = new Employee({
      employeeName: employee.employeeName,
      employeePicture: employee.employeePicture,
      employeeId: employee.employeeId,
      designation: employee.designation,
      dateOfBirth: employee.dateOfBirth,
      password: password, // Update the password as well
      qualification: employee.qualification,
      bloodGroup: employee.bloodGroup,
      mobileNumber: employee.mobileNumber,
      mailId: employee.mailId,
      address: employee.address,
      bankAccountNumber: employee.bankAccountNumber,
      bankIFSCCode: employee.bankIFSCCode,
      PANNumber: employee.PANNumber,
      addressProof: employee.addressProof,
      educationCertificate: employee.educationCertificate,
      passbookProof: employee.passbookProof,
      PANCardProof: employee.PANCardProof,
      department: employee.department,
      departmentCode: employee.departmentCode,
      bankName: employee.bankName,
      bankBranch: employee.bankBranch,
      salary: employee.salary,
      epf: employee.epf,
      esic: employee.esic,
      esicId: employee.esicId,
      epfId: employee.epfId,
      UANNo: employee.UANNo,
    });

    const savedEmployee = await newEmployee.save();
    // Delete the temporary employee record with the same employeeId
    await TempEmployee.findOneAndDelete({ employeeId: employee.employeeId });

    res.status(201).json(savedEmployee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create employee" });
  }
};

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    res.status(400).json({ error: "Error fetching employees" });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.id });
    //console.log("test", employee);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.status(200).json(employee);
  } catch (error) {
    res.status(400).json({ error: "Error fetching employee" });
  }
};

// Update an existing employee
exports.updateEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;
    console.log(employeeId);
    // const {
    //   employeeName,
    //   employeePicture,
    //   designation,
    //   dateOfBirth,
    //   qualification,
    //   bloodGroup,
    //   mobileNumber,
    //   mailId,
    //   address,
    //   bankAccountNumber,
    //   bankIFSCCode,
    //   PANNumber,
    //   addressProof,
    //   educationCertificate,
    //   passbookProof,
    //   PANCardProof,
    //   department,
    //   departmentCode,
    //   bankName,
    //   bankBranch,
    //   salary,
    //   epf,
    //   esic,
    //   esicId,
    //   epfId,
    //   UANNo,
    // } = req.body;
    const { employee } = req.body;
    console.log(employee.employeeName);
    // Automatically generate the password from DOB
    const password = generatePasswordFromDOB(employee.dateOfBirth);

    const updatedEmployee = await Employee.findOneAndUpdate(
      { employeeId: employee.employeeId },
      {
        employeeName: employee.employeeName,
        employeePicture: employee.employeePicture,
        employeeId: employee.employeeId,
        designation: employee.designation,
        dateOfBirth: employee.dateOfBirth,
        password: password, // Update the password as well
        qualification: employee.qualification,
        bloodGroup: employee.bloodGroup,
        mobileNumber: employee.mobileNumber,
        mailId: employee.mailId,
        address: employee.address,
        bankAccountNumber: employee.bankAccountNumber,
        bankIFSCCode: employee.bankIFSCCode,
        PANNumber: employee.PANNumber,
        addressProof: employee.addressProof,
        educationCertificate: employee.educationCertificate,
        passbookProof: employee.passbookProof,
        PANCardProof: employee.PANCardProof,
        department: employee.department,
        departmentCode: employee.departmentCode,
        bankName: employee.bankName,
        bankBranch: employee.bankBranch,
        salary: employee.salary,
        epf: employee.epf,
        esic: employee.esic,
        esicId: employee.esicId,
        epfId: employee.epfId,
        UANNo: employee.UANNo,
      },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json(updatedEmployee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update employee" });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: "Error deleting employee" });
  }
};

exports.checkEmployeeId = async (req, res) => {
  const { employeeId } = req.body;
  console.log(req.body);
  try {
    const employeeExists = await Employee.findOne({ employeeId });
    //console.log(employeeId);
    if (employeeExists) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking employeeId:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
