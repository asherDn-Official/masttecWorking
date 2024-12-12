const Holiday = require("../Models/HolidayModel");
const Employee = require("../Models/EmployeeModel");
const Attendance = require("../Models/AttendanceModel");

exports.updateHolidays = async (req, res) => {
  const { year, holidayList } = req.body;
  try {
    console.log("Received request:", req.body);
    // Update or create holiday list
    const holiday = await Holiday.findOneAndUpdate(
      { year },
      { holidayList },
      { upsert: true, new: true }
    );
    console.log("Holiday updated:", holiday);
    // Fetch all employees
    const employees = await Employee.find();
    for (const date of holidayList) {
      for (const employee of employees) {
        // Check if attendance record exists for the date
        const attendance = await Attendance.findOne({
          employeeId: employee.employeeId,
          "records.date": date,
        });
        if (attendance) {
          // Update existing record
          await Attendance.updateOne(
            { employeeId: employee._id, "records.date": date },
            { $set: { "records.$.status": "Holiday" } }
          );
          console.log(
            `Updated attendance for employee ${employee.employeeId} on ${date}`
          );
        } else {
          // Create new attendance record
          await Attendance.updateOne(
            { employeeId: employee._id },
            {
              $push: {
                records: {
                  date,
                  status: "Holiday",
                },
              },
            },
            { upsert: true }
          );
          console.log(
            `Created attendance for employee ${employee._id} on ${date}`
          );
        }
      }
    }
    res.status(200).json({ message: "Holidays updated successfully" });
  } catch (error) {
    console.error("Error updating holidays:", error);
    res.status(500).json({ message: "Failed to update holidays", error });
  }
};

// Get The Holiday List
exports.getHolidays = async (req, res) => {
  try {
    const { year } = req.params;
    console.log(year);
    if (!year) {
      return res.status(400).json({ message: "Year is required" });
    }

    const holidayData = await Holiday.findOne({ year });
    console.log(holidayData);
    if (!holidayData) {
      return res
        .status(404)
        .json({ message: `No holiday data found for the year ${year}` });
    }

    res.status(200).json({
      message: `Holiday data for the year ${year} retrieved successfully.`,
      holidays: holidayData.holidayList,
    });
  } catch (error) {
    console.error("Error retrieving holiday data:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
