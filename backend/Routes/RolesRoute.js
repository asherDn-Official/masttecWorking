const express = require("express");
const router = express.Router();
const rolesController = require("../Controllers/rolesController");

// Route to create a role
router.post("/createRole", rolesController.createRole);

// Route to add authorized persons to a role
router.put("/addAuthorizedPerson", rolesController.addAuthorizedPerson);

// Route to remove an employee from authorized persons
router.put("/removeAuthorizedPerson", rolesController.removeAuthorizedPerson);

// Route to delete a role
router.delete("/deleteRole", rolesController.deleteRole);

// Route to get a role and its assigned members
router.get("/getRole/:role", rolesController.getRole);

// Route to get all roles and their data
router.get("/getAllRoles", rolesController.getAllRoles);

module.exports = router;
