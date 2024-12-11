const express = require("express");
const router = express.Router();
const tempEmployeeController = require("../controllers/tempEmployeeController");

// Route to check and update if employee exists, else create a new record
router.post("/", tempEmployeeController.upsertTempEmployee);
// get all
router.get("/", tempEmployeeController.getAllTempEmployees);
// get by id
router.get("/:id", tempEmployeeController.getSingleTempEmployee);
// Route to delete a record by employeeId
router.delete("/", tempEmployeeController.deleteTempEmployee);

module.exports = router;
