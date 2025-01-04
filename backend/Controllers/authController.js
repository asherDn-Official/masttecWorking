const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Employee = require("../Models/EmployeeModel");
const Role = require("../Models/RolesModel");

exports.login = async (req, res) => {
  const { employeeId, password, department } = req.body;

  try {
    // Step 1: Find employee by employeeId
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(400).json({ error: "Employee not found" });
    }

    // Step 2: Check if password matches
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Step 3: Check if employee's department matches
    if (employee.department !== department) {
      return res.status(403).json({ error: "You are not authorized to access this department" });
    }

    // Step 4: Check if the employee's role is authorized for the department
    const role = await Role.findOne({ role: employee.designation });
    if (role && role.authorizedPersons.includes(employeeId)) {
      // Step 5: Generate JWT token
      const token = jwt.sign({ employeeId: employee._id, department: employee.department }, process.env.JWT_SECRET, {
        expiresIn: "24h", // Token expires in 24 hour
      });

      res.status(200).json({
        message: "Login successful",
        token,
      });
    } else {
      res.status(403).json({ error: "You are not authorized to log in to this department" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Server error" });
  }
};
