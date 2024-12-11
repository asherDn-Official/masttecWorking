const PayRunCalc = require("../Models/PayRunCalcModel");

// CREATE a new payRunCalc record
exports.createPayRunCalc = async (req, res) => {
  try {
    const newPayRunCalc = new PayRunCalc(req.body);
    await newPayRunCalc.save();
    res.status(201).json(newPayRunCalc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET all payRunCalc records
exports.getAllPayRunCalc = async (req, res) => {
  try {
    const records = await PayRunCalc.find();
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET a specific payRunCalc record by ID
exports.getPayRunCalcById = async (req, res) => {
  try {
    const record = await PayRunCalc.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE a specific payRunCalc record by ID
exports.updatePayRunCalcById = async (req, res) => {
  try {
    const updatedRecord = await PayRunCalc.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // Return updated document & validate
    );
    if (!updatedRecord)
      return res.status(404).json({ message: "Record not found" });
    res.status(200).json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE a specific payRunCalc record by ID
exports.deletePayRunCalcById = async (req, res) => {
  try {
    const deletedRecord = await PayRunCalc.findByIdAndDelete(req.params.id);
    if (!deletedRecord)
      return res.status(404).json({ message: "Record not found" });
    res.status(200).json({ message: "Record deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
