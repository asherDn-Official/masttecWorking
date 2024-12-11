const express = require("express");
const router = express.Router();
const employeeController = require("../Controllers/EmployeeController");

// Employee CRUD routes
router.post("/", employeeController.createEmployee);
router.get("/", employeeController.getAllEmployees);
router.get("/:id", employeeController.getEmployeeById);
router.put("/:id", employeeController.updateEmployee);
router.delete("/:id", employeeController.deleteEmployee);
router.post("/check", employeeController.checkEmployeeId);

module.exports = router;
