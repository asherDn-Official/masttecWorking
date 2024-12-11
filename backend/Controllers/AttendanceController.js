const Attendance = require("../Models/AttendanceModel");
const Employee = require("../Models/EmployeeModel");
const Holiday = require("../Models/HolidayModel");

// Create daily attendance records (automatically set as Absent, Week-Off on Sundays, or skip on holidays)
exports.createDailyAttendance = async (req, res) => {
  try {
    const today = new Date();
    const isSunday = today.getDay() === 0; // Sunday is represented by 0
    const year = today.getFullYear();
    const formattedToday = today.toISOString().split("T")[0];

    // Fetch the holiday list for the current year
    const holidayData = await Holiday.findOne({ year });
    const holidayList = holidayData
      ? holidayData.holidayList.map((date) => date.toISOString().split("T")[0])
      : [];

    // Check if today is a holiday
    if (holidayList.includes(formattedToday)) {
      return res.status(200).json({
        message: "Today is a holiday. No attendance records created.",
      });
    }

    const employees = await Employee.find();

    for (const employee of employees) {
      // Skip employees with status not true
      if (!employee.status) {
        console.log(
          `Skipping employee ${employee.employeeId} - Status inactive`
        );
        continue;
      }

      let attendance = await Attendance.findOne({
        employeeId: employee.employeeId,
      });

      if (!attendance) {
        attendance = new Attendance({ employeeId: employee.employeeId });
      }

      // Check if a record for today already exists
      const recordExists = attendance.records.some(
        (record) => record.date.toISOString().split("T")[0] === formattedToday
      );

      if (!recordExists) {
        // Add a new record with the appropriate status
        attendance.records.push({
          date: today,
          status: isSunday ? "Week-Off" : "Absent",
        });
        await attendance.save();
      }
    }

    res.status(200).json({
      message: isSunday
        ? "Daily attendance initialized with Week-Off for all active employees (Sunday)"
        : "Daily attendance initialized for all active employees",
    });
  } catch (error) {
    console.error("Error initializing daily attendance:", error);
    res.status(400).json({ error: "Error initializing daily attendance" });
  }
};

// Mark attendance (change status)
exports.markAttendance = async (req, res) => {
  try {
    const { employeeId, status } = req.body;
    const date = req.body.date || new Date();

    let attendance = await Attendance.findOne({ employeeId });

    if (!attendance) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    const recordIndex = attendance.records.findIndex(
      (record) =>
        record.date.toISOString().split("T")[0] ===
        date.toISOString().split("T")[0]
    );

    if (recordIndex >= 0) {
      attendance.records[recordIndex].status = status;
    } else {
      attendance.records.push({ date, status });
    }

    await attendance.save();
    res.status(200).json({ message: "Attendance updated successfully" });
  } catch (error) {
    res.status(400).json({ error: "Error updating attendance" });
  }
};

// Get attendance by employee ID
exports.getAttendanceByEmployeeId = async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      employeeId: req.params.id,
    }).populate("employeeId");
    if (!attendance) {
      return res.status(404).json({ error: "Attendance record not found" });
    }
    res.status(200).json(attendance);
  } catch (error) {
    res.status(400).json({ error: "Error fetching attendance record" });
  }
};

// Get attendance all
exports.getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find();
    if (!attendance) {
      return res.status(404).json({ error: "Attendance record not found" });
    }
    res.status(200).json(attendance);
  } catch (error) {
    res.status(400).json({ error: "Error fetching attendance record" });
  }
};

// Update attendance by employee ID and specific date
exports.updateAttendance = async (req, res) => {
  try {
    const {
      employeeId,
      status,
      punchIn,
      punchOut,
      recordedPunchIn,
      recordedPunchOut,
      note,
    } = req.body;
    const date = new Date(req.body.date) || new Date(); // Explicitly convert to Date object

    // Fetch the attendance document for the employee
    let attendance = await Attendance.findOne({ employeeId });

    // If no attendance document exists, return an error
    if (!attendance) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    // Check if the attendance record for the given date exists
    const recordIndex = attendance.records.findIndex(
      (record) =>
        new Date(record.date).toISOString().split("T")[0] ===
        date.toISOString().split("T")[0]
    );

    if (recordIndex >= 0) {
      // If record exists, update the status, punch times, and note
      if (status) attendance.records[recordIndex].status = status;
      if (punchIn) attendance.records[recordIndex].punchIn = new Date(punchIn);
      if (punchOut)
        attendance.records[recordIndex].punchOut = new Date(punchOut);
      if (recordedPunchIn)
        attendance.records[recordIndex].recordedPunchIn = new Date(
          recordedPunchIn
        );
      if (recordedPunchOut)
        attendance.records[recordIndex].recordedPunchOut = new Date(
          recordedPunchOut
        );
      if (note !== undefined) attendance.records[recordIndex].note = note; // Allow empty notes
    } else {
      // If no record exists for the date, create a new one
      const newRecord = {
        date,
        status: status || "Absent",
        punchIn: punchIn ? new Date(punchIn) : null,
        punchOut: punchOut ? new Date(punchOut) : null,
        recordedPunchIn: recordedPunchIn ? new Date(recordedPunchIn) : null,
        recordedPunchOut: recordedPunchOut ? new Date(recordedPunchOut) : null,
        note: note || "",
      };
      attendance.records.push(newRecord);
    }

    // Save the updated attendance document
    await attendance.save();

    res
      .status(200)
      .json({ message: "Attendance updated successfully", attendance });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(400).json({ error: "Error updating attendance record" });
  }
};
const statusOptions = [
  "Present",
  "Absent",
  "Late",
  "Sunday",
  "Paid Leave",
  "Unpaid Leave",
  "Holiday",
  "C-Off",
  "Week-Off",
];

exports.attendanceSummary = async (req, res) => {
  const { date, shift } = req.body; // Accepting data from POST body

  try {
    // Parse the provided date into a Date object
    const queryDate = new Date(date); // The 'date' sent should be in a format that can be parsed into a Date object.
    //console.log("Received Date:", date);

    // Normalize the queryDate to remove time (i.e., set it to midnight) in local timezone
    queryDate.setHours(0, 0, 0, 0); // Set the time to midnight for comparison
    //console.log("Normalized Query Date:", queryDate);

    // If a shift is provided, combine the date with the shift time to form a complete Date object
    if (shift) {
      const [shiftHour, shiftMinute] = shift.split(":");

      // Adjust the queryDate with the provided shift time
      queryDate.setHours(shiftHour, shiftMinute, 0, 0); // Set the time of the queryDate with shift hours and minutes
      console.log("Shift adjusted Query Date:", queryDate);
    }

    // Fetch all attendance data from the database (for all employees)
    const attendanceData = await Attendance.find({});

    // Initialize summary stats
    let total = 0;
    let present = 0;
    let absent = 0;
    let late = 0;
    let sunday = 0;
    let paidLeave = 0;
    let unPaidLeave = 0;
    let holiday = 0;
    let cOff = 0;
    let weekOff = 0;
    let leave = 0;

    // Iterate through the fetched attendance data
    attendanceData.forEach((item) => {
      // console.log("item : ", item);
      item.records.forEach((record) => {
        //console.log("record : ", record);
        // Normalize record date to midnight for comparison (ignore time)
        const recordDate = new Date(record.date);
        //recordDate.setHours(0, 0, 0, 0); // Set record date to midnight
        // console.log("recordDate : ", recordDate.getHours());
        // console.log("queryDate : ", queryDate.getHours());
        // Only consider records where the date matches the queryDate (ignoring time)

        if (recordDate.getDate() === queryDate.getDate()) {
          if (recordDate.getHours() === queryDate.getHours()) {
            total++;
            switch (record.status) {
              case "Present":
                present++;
                break;
              case "Absent":
                absent++;
                break;
              case "Late":
                late++;
                break;
              case "Sunday":
                sunday++;
                break;
              case "Paid Leave":
                paidLeave++;
                break;
              case "Unpaid Leave":
                unPaidLeave++;
                break;
              case "Holiday":
                holiday++;
                break;
              case "C-Off":
                cOff++;
                break;
              case "Week-Off":
                weekOff++;
                break;
              default:
                if (record.status.includes("Leave")) {
                  leave++;
                }
                break;
            }
          }
        }
      });
    });

    // Send the response with the summary data
    res.json({
      total,
      present,
      absent,
      late,
      sunday,
      paidLeave,
      unPaidLeave,
      holiday,
      cOff,
      weekOff,
      leave,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
