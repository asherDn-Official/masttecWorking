const express = require("express");
const router = express.Router();
const payRunCalcController = require("../Controllers/PayRunCalcConytroller");

// POST: Create a new payRunCalc record
router.post("/", payRunCalcController.createPayRunCalc);

// GET: Retrieve all payRunCalc records
router.get("/", payRunCalcController.getAllPayRunCalc);

// GET: Retrieve a single payRunCalc record by ID
router.get("/:id", payRunCalcController.getPayRunCalcById);

// PUT: Update a payRunCalc record by ID
router.put("/:id", payRunCalcController.updatePayRunCalcById);

// DELETE: Delete a payRunCalc record by ID
router.delete("/:id", payRunCalcController.deletePayRunCalcById);

module.exports = router;
