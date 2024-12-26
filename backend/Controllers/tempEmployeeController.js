const TempEmployee = require("../Models/tempEmployeeModel");

// Controller to check and update or create a new record
exports.upsertTempEmployee = async (req, res) => {
  const { employeeId, EmployeeData } = req.body; // Match the key from the API call

  try {
    // Check if the employee already exists using employeeId
    const existingEmployee = await TempEmployee.findOne({ employeeId });

    if (existingEmployee) {
      const updatedEmployee = await TempEmployee.findOneAndUpdate(
        { employeeId },
        { $set: EmployeeData }, // Use EmployeeData here
        { new: true }
      );
      return res.status(200).json({
        message: "Employee record updated successfully",
        data: updatedEmployee,
      });
    } else {
      const newEmployee = new TempEmployee({ employeeId, ...EmployeeData }); // Use EmployeeData here
      await newEmployee.save();
      return res.status(201).json({
        message: "New employee record created successfully",
        data: newEmployee,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Controller to delete a record by employeeId
exports.deleteTempEmployee = async (req, res) => {
  const { employeeId } = req.params;

  try {
    // Delete the employee record
    const deletedEmployee = await TempEmployee.findOneAndDelete({ employeeId });

    if (deletedEmployee) {
      return res.status(200).json({
        message: "Employee record deleted successfully",
        data: deletedEmployee,
      });
    } else {
      return res.status(404).json({ message: "Employee record not found" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Get all temp employees
exports.getAllTempEmployees = async (req, res) => {
  try {
    const employees = await TempEmployee.find({});
    if (!employees || employees.length === 0) {
      return res.status(404).json({ message: "No temporary employees found" });
    }
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching all temp employees:", error);
    res.status(500).json({ message: "Failed to fetch temp employees" });
  }
};

// Get a single temp employee by employeeId
exports.getSingleTempEmployee = async (req, res) => {
  const { id: employeeId } = req.params;
  //console.log(employeeId);
  try {
    const employee = await TempEmployee.findOne({ employeeId: employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Temp employee not found" });
    }
    res.status(200).json(employee);
  } catch (error) {
    console.error("Error fetching temp employee:", error);
    res.status(500).json({ message: "Failed to fetch temp employee" });
  }
};
