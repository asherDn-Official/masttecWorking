const Holiday = require("../Models/HolidayModel");
const Employee = require("../Models/EmployeeModel");
const Attendance = require("../Models/AttendanceModel");

exports.updateHolidays = async (req, res) => {
  const { holidayList } = req.body;
  try {
    console.log("Received request:", req.body);

    const today = new Date(); // Get today's date
    const validDates = holidayList.filter((date) => new Date(date) >= today); // Filter out past dates

    if (validDates.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid future dates provided in holiday list." });
    }

    for (const date of validDates) {
      const year = new Date(date).getFullYear(); // Extract the year from the date

      // Update or create holiday list for the specific year
      const holiday = await Holiday.findOneAndUpdate(
        { year },
        { $addToSet: { holidayList: date } }, // Ensure no duplicate dates
        { upsert: true, new: true }
      );
      console.log("Holiday updated for year:", year, "Date:", date);

      // Fetch all employees
      const employees = await Employee.find();
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

    res.status(200).json({
      message: "Holidays updated successfully for valid future dates.",
    });
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

    const formattedHolidays = holidayData.holidayList.map(
      (date) => new Date(date).toISOString().split("T")[0] // Format the dates to remove time component
    );

    res.status(200).json({
      message: `Holiday data for the year ${year} retrieved successfully.`,
      holidays: formattedHolidays,
    });
  } catch (error) {
    console.error("Error retrieving holiday data:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  const { date } = req.body; // only one date in the request body

  try {
    console.log("Received request to delete holiday:", req.body);

    const today = new Date();
    const holidayDate = new Date(date);

    // Validate that the date is not in the past
    if (holidayDate < today) {
      return res.status(400).json({
        message: "Cannot delete holidays for dates that are before today.",
      });
    }

    const year = holidayDate.getFullYear(); // Extract the year from the date

    // Remove the date from the holiday list for the specified year
    const holiday = await Holiday.findOneAndUpdate(
      { year },
      { $pull: { holidayList: date } }, // Remove the date
      { new: true }
    );

    if (!holiday) {
      return res
        .status(404)
        .json({ message: "Holiday not found for the given year." });
    }

    console.log("Holiday removed for year:", year, "Date:", date);

    // Fetch all employees
    const employees = await Employee.find();

    for (const employee of employees) {
      // Check if attendance record exists for the date
      const attendance = await Attendance.findOne({
        employeeId: employee.employeeId,
        "records.date": date,
      });

      if (attendance) {
        // Update the record status to "Absent"
        await Attendance.updateOne(
          { employeeId: employee._id, "records.date": date },
          { $set: { "records.$.status": "Absent" } }
        );
        console.log(
          `Updated attendance to Absent for employee ${employee.employeeId} on ${date}`
        );
      }
    }

    res.status(200).json({
      message: "Holiday deleted successfully and attendance updated.",
    });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    res.status(500).json({ message: "Failed to delete holiday", error });
  }
};
