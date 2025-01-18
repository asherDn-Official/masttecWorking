const Role = require("../Models/RolesModel");

// 1. Create a role
exports.createRole = async (req, res) => {
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: "Role is required" });
  }

  try {
    const newRole = new Role({ role });
    await newRole.save();

    res.status(201).json({
      message: "Role created successfully",
      role: newRole,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 2. Add authorized persons to a role
exports.addAuthorizedPerson = async (req, res) => {
  const { role, employeeId } = req.body;

  if (!role || !employeeId) {
    return res.status(400).json({ error: "Role and employee ID are required" });
  }

  try {
    const existingRole = await Role.findOne({ role });
    if (!existingRole) {
      return res.status(404).json({ error: "Role not found" });
    }

    if (existingRole.authorizedPersons.includes(employeeId)) {
      return res.status(400).json({ error: "Employee ID already added" });
    }

    existingRole.authorizedPersons.push(employeeId);
    await existingRole.save();

    res.status(200).json({
      message: "Authorized person added successfully",
      role: existingRole,
    });
  } catch (error) {
    console.error("Error adding authorized person:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 3. Remove an employee from authorized persons
exports.removeAuthorizedPerson = async (req, res) => {
  const { role, employeeId } = req.body;

  if (!role || !employeeId) {
    return res.status(400).json({ error: "Role and employee ID are required" });
  }

  try {
    const existingRole = await Role.findOne({ role });
    if (!existingRole) {
      return res.status(404).json({ error: "Role not found" });
    }

    const index = existingRole.authorizedPersons.indexOf(employeeId);
    if (index === -1) {
      return res.status(404).json({ error: "Employee ID not found" });
    }

    existingRole.authorizedPersons.splice(index, 1);
    await existingRole.save();

    res.status(200).json({
      message: "Authorized person removed successfully",
      role: existingRole,
    });
  } catch (error) {
    console.error("Error removing authorized person:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 4. Delete a role
exports.deleteRole = async (req, res) => {
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: "Role is required" });
  }

  try {
    const deletedRole = await Role.findOneAndDelete({ role });
    if (!deletedRole) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.status(200).json({
      message: "Role deleted successfully",
      role: deletedRole,
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
