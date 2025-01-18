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

    //Step 2: Check if password matches
    const isPasswordValid = password === employee.password;
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Step 3: Check if employee's department matches
    // if (employee.department !== department) {
    //   return res
    //     .status(403)
    //     .json({ error: "You are not authorized to access this department" });
    // }

    // Step 4: Check if the employee's role is authorized for the department
    const role = await Role.findOne({ role: department });
    console.log(role);
    if (role && role.authorizedPersons.includes(employeeId)) {
      // Step 5: Generate JWT token
      const token = jwt.sign(
        {
          employeeId: employee.employeeId,
          role: role.role,
          department: employee.department,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "24h", // Token expires in 24 hour
        }
      );

      // Step 6: Set token as a cookie
      res.cookie("authToken", token, {
        httpOnly: true, // Prevent client-side JavaScript access
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        sameSite: "strict", // Restrict cookie to the same site
        maxAge: 24 * 60 * 60 * 1000, // Cookie expires in 24 hours
      });

      // Step 7: Send response
      res.status(200).json({
        message: "Login successful",
      });
    } else {
      res
        .status(403)
        .json({ error: "You are not authorized to log in to this department" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.verifyToken = (req, res) => {
  try {
    // Step 1: Get the token from cookies
    const token = req.cookies.authToken;
    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    // Step 2: Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 3: Send the decoded token details to the frontend
    res.status(200).json({
      message: "Token is valid",
      employeeId: decoded.employeeId,
      role: decoded.role,
      department: decoded.department,
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
exports.logout = (req, res) => {
  try {
    // Clear the authToken cookie
    res.clearCookie("authToken", {
      httpOnly: true, // Same settings used when the cookie was created
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Server error" });
  }
};
