const Holiday = require("../Models/HolidayModel");
const Employee = require("../Models/EmployeeModel");
const Attendance = require("../Models/AttendanceModel");

exports.updateHolidays = async (req, res) => {
  // Expecting holidayList to be an array of objects: [{ date: "YYYY-MM-DD", detail: "Reason" }, ...]
  const { holidayList } = req.body;
  try {
    //console.log("Received request:", req.body);

    const today = new Date(); // Get today's date
    today.setHours(0, 0, 0, 0); // Normalize today to the start of the day

    // Filter out past dates and ensure detail is present
    const validHolidayEntries = holidayList.filter(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0); // Normalize entry date
      return entryDate >= today && entry.detail && entry.detail.trim() !== "";
    });

    if (validHolidayEntries.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid future holiday entries (date and detail) provided." });
    }

    for (const holidayEntry of validHolidayEntries) {
      const year = new Date(holidayEntry.date).getFullYear(); // Extract the year from the date

      // Update or create holiday list for the specific year
      // Find the document for the year, or create it if it doesn't exist
      let holidayDocument = await Holiday.findOne({ year });

      if (!holidayDocument) {
        holidayDocument = new Holiday({ year, holidays: [] });
      }

      // Check if the holiday (date and detail) already exists to prevent duplicates
      const holidayExists = holidayDocument.holidays.some(
        h => new Date(h.date).toISOString().split('T')[0] === new Date(holidayEntry.date).toISOString().split('T')[0]
      );

      if (!holidayExists) {
        holidayDocument.holidays.push({
          date: new Date(holidayEntry.date),
          detail: holidayEntry.detail,
        });
        await holidayDocument.save();
         //console.log("Holiday updated for year:", year, "Date:", holidayEntry.date, "Detail:", holidayEntry.detail);
      } else {
        // Optionally, you can log or inform that the holiday already exists
        // console.log(`Holiday for date ${holidayEntry.date} already exists in year ${year}.`);
        // If you want to update the detail if the date exists, you'd modify the logic here.
        // For now, $addToSet behavior is mimicked by checking existence first.
      }


      // Fetch all employees
      const employees = await Employee.find();
      for (const employee of employees) {
        // Check if attendance record exists for the date
        const attendance = await Attendance.findOne({
          employeeId: employee.employeeId,
          "records.date": new Date(holidayEntry.date),
        });
        if (attendance) {
          // Update existing record
          await Attendance.updateOne(
            { employeeId: employee.employeeId, "records.date": new Date(holidayEntry.date) },
            { $set: { "records.$.status": "Holiday" } }
          );
          // console.log(
          //   `Updated attendance for employee ${employee.employeeId} on ${holidayEntry.date}`
          // );
        } else {
          // Create new attendance record or update existing employee's attendance document
          await Attendance.updateOne(
            { employeeId: employee.employeeId },
            {
              $push: {
                records: {
                  date: new Date(holidayEntry.date),
                  status: "Holiday",
                },
              },
            },
            { upsert: true } // This will create the Attendance document if it doesn't exist for the employee
          );
          // console.log(
          //   `Created/Updated attendance for employee ${employee.employeeId} on ${holidayEntry.date}`
          // );
        }
      }
    }

    res.status(200).json({
      message: "Holidays updated successfully for valid future dates.",
    });
  } catch (error) {
    console.error("Error updating holidays:", error);
    res.status(500).json({ message: "Failed to update holidays", error: error.message });
  }
};

// Get The Holiday List
exports.getHolidays = async (req, res) => {
  try {
    const { year } = req.params;
    //console.log(year);
    if (!year) {
      return res.status(400).json({ message: "Year is required" });
    }

    const holidayData = await Holiday.findOne({ year: parseInt(year) }); // Ensure year is a number
    //console.log("Fetched holidayData for year", year, ":", holidayData);
    if (!holidayData || !holidayData.holidays || holidayData.holidays.length === 0) {
      return res
        .status(404)
        .json({ message: `No holiday data found for the year ${year}` });
    }

    // holidayData.holidays is now an array of objects { date: Date, detail: String }
    const formattedHolidays = holidayData.holidays.map(
      (holiday) => ({
        date: new Date(holiday.date).toISOString().split("T")[0], // Format the date
        detail: holiday.detail // Include the detail
      })
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
    //console.log("Received request to delete holiday:", req.body);

    const today = new Date();
    const holidayDateToDelete = new Date(date);
    today.setHours(0,0,0,0); // Normalize today to the start of the day
    holidayDateToDelete.setHours(0,0,0,0); // Normalize holiday date to the start of the day


    // Validate that the date is not in the past
    if (holidayDateToDelete < today) {
      return res.status(400).json({
        message: "Cannot delete holidays for dates that are before today.",
      });
    }

    const year = holidayDateToDelete.getFullYear(); // Extract the year from the date

    // Remove the date from the holiday list for the specified year
    const holiday = await Holiday.findOneAndUpdate(
      { year },
      { $pull: { holidays: { date: holidayDateToDelete } } }, // Remove the holiday object by date
      { new: true }
    );

    if (!holiday) {
      return res
        .status(404)
        .json({ message: "Holiday not found for the given year or date was not in the list." });
    }

    //console.log("Holiday removed for year:", year, "Date:", date);

    // Fetch all employees
    const employees = await Employee.find();

    for (const employee of employees) {
      // Check if attendance record exists for the date
      const attendance = await Attendance.findOne({
        employeeId: employee.employeeId,
        "records.date": holidayDateToDelete,
      });

      if (attendance) {
        // Update the record status to "Absent"
        await Attendance.updateOne(
          { employeeId: employee.employeeId, "records.date": holidayDateToDelete },
          { $set: { "records.$.status": "Absent" } } // Or another default status
        );
        // console.log(
        //   `Updated attendance to Absent for employee ${employee.employeeId} on ${date}`
        // );
      }
    }

    res.status(200).json({
      message: "Holiday deleted successfully and attendance updated.",
    });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    res.status(500).json({ message: "Failed to delete holiday", error: error.message });
  }
};
