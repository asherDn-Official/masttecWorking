import React, { useEffect, useState } from "react";
import "../CSS/EmployeeAttendanceListCss.css";
import url from "./global";
import axios from "axios";

export default function EmployeeAttendanceList() {
  const [attendanceDetails, setAttendanceDetails] = useState([]); // Updated to an array
  const [showActualPunchIn, setShowActualPunchIn] = useState(false);
  const [statusFilter, setStatusFilter] = useState(""); // Moved outside of `fetchEmployees`
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [editingStatusIndex, setEditingStatusIndex] = useState(null);
  const [designationFilter, setDesignationFilter] = useState("");

  const statusOptions = [
    "Present",
    "Absent",
    "Late",
    "Sunday",
    "Paid Leave",
    "Up-Paid Leave",
    "Holiday",
    "C-Off",
    "Week-Off",
  ];
  const [editingFeedbackIndex, setEditingFeedbackIndex] = useState(null);
  const [editingPunchOutIndex, setEditingPunchOutIndex] = useState(null);
  const [designationOptions, setDesignationOptions] = useState([]);

  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEmployees = async () => {
    try {
      // Fetch employee and attendance data
      const employeeResponse = await axios.get(`${url}/v1/api/employees`);
      const attendanceResponse = await axios.get(`${url}/v1/api/attendance`);

      // Combine employee and attendance data based on employeeId
      const combinedData = employeeResponse.data.map((employee) => {
        const attendanceRecord = attendanceResponse.data.find(
          (attendance) => attendance.employeeId === employee.employeeId
        );

        // Extract only today’s attendance details if records are available
        const todayRecord = attendanceRecord?.records?.find(
          (record) => record.date.split("T")[0] === date
        );

        return {
          ...employee,
          attendance: todayRecord || {
            punchIn: null,
            punchOut: null,
            status: "No Record",
          },
        };
      });

      setAttendanceDetails(combinedData);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setError("Error fetching employee data.");
      setTimeout(() => setError(""), 5000);
    }
  };

  // Fetch employee data when `date` or `statusFilter` changes
  useEffect(() => {
    fetchEmployees();
  }, [date]);
  useEffect(() => {
    // Update designation options after attendance details are set
    const uniqueDesignations = getUniqueDesignations(attendanceDetails);
    setDesignationOptions(uniqueDesignations);
  }, [attendanceDetails]);
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  const getUniqueDesignations = (employees) => {
    const designations = employees.map((employee) => employee.designation);
    return [...new Set(designations)].filter((designation) => designation); // Remove duplicates and filter out empty strings
  };

  const filteredEmployees = attendanceDetails.filter((employee) => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const matchesSearch =
      employee.employeeName?.toLowerCase().includes(lowerCaseQuery) ||
      employee.designation?.toLowerCase().includes(lowerCaseQuery) ||
      employee.attendance?.status?.toLowerCase().includes(lowerCaseQuery) ||
      employee.employeeId?.toString().includes(lowerCaseQuery);

    const matchesStatusFilter =
      !statusFilter || employee.attendance?.status === statusFilter;

    const matchesDesignationFilter =
      !designationFilter || employee.designation === designationFilter;

    return matchesSearch && matchesStatusFilter && matchesDesignationFilter;
  });

  const handleStatusChange = async (index, newStatus) => {
    try {
      const updatedAttendanceDetails = [...attendanceDetails];
      const selectedRecord = updatedAttendanceDetails[index];
      const employeeId = selectedRecord.employeeId;
      const date = selectedRecord.attendance.date;

      // Update the status locally
      updatedAttendanceDetails[index].attendance.status = newStatus;
      setAttendanceDetails(updatedAttendanceDetails);

      // Make a PUT request to update the status in the backend
      const response = await axios.put(`${url}/v1/api/attendance`, {
        employeeId: employeeId,
        date: date,
        status: newStatus,
      });

      console.log("Status updated successfully:", response.data.message);
    } catch (error) {
      console.error(
        "Error updating status:",
        error.response?.data || error.message
      );
      alert("Failed to update attendance status. Please try again.");
    }
  };

  const handleFeedbackChange = async (index, newFeedback) => {
    try {
      const updatedAttendanceDetails = [...attendanceDetails];
      const selectedRecord = updatedAttendanceDetails[index];
      const employeeId = selectedRecord.employeeId;
      const date = selectedRecord.attendance.date;

      // Update the status locally
      updatedAttendanceDetails[index].attendance.note = newFeedback;
      setAttendanceDetails(updatedAttendanceDetails);

      // Make a PUT request to update the status in the backend
      const response = await axios.put(`${url}/v1/api/attendance`, {
        employeeId: employeeId,
        date: date,
        note: newFeedback,
      });

      console.log("Status updated successfully:", response.data.message);
    } catch (error) {
      console.error(
        "Error updating status:",
        error.response?.data || error.message
      );
      alert("Failed to update attendance status. Please try again.");
    }
  };
  const handlePunchOutTimeChange = async (index, newTime) => {
    try {
      const updatedAttendanceDetails = [...attendanceDetails];
      const selectedRecord = updatedAttendanceDetails[index];
      const employeeId = selectedRecord.employeeId;
      const date = selectedRecord.attendance.date;

      // Extract current punchOut date
      const currentPunchOutDate = new Date(
        selectedRecord.attendance.punchOut || new Date()
      );

      // Split the new input time into hours and minutes
      const [newHours, newMinutes] = newTime.split(":");

      // Set the new time
      currentPunchOutDate.setHours(newHours, newMinutes, 0, 0);

      // Subtract 5 hours and 30 minutes from the new time input
      currentPunchOutDate.setHours(currentPunchOutDate.getHours() - 5);
      currentPunchOutDate.setMinutes(currentPunchOutDate.getMinutes() - 30);

      // Update the time locally
      updatedAttendanceDetails[index].attendance.punchOut = currentPunchOutDate;
      setAttendanceDetails(updatedAttendanceDetails);

      // Make a PUT request to update the punchOut time in the backend
      const response = await axios.put(`${url}/v1/api/attendance`, {
        employeeId: employeeId,
        date: date,
        punchOut: currentPunchOutDate,
      });

      console.log(
        "Punch-out time updated successfully:",
        response.data.message
      );
    } catch (error) {
      console.error(
        "Error updating punch-out time:",
        error.response?.data || error.message
      );
      alert("Failed to update punch-out time. Please try again.");
    }
  };
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="printable-section">
      <div className="widthhall">
        <div className="alldisplay">
          <div style={{ width: "100%" }}>
            <div className="marginbox">
              <div className="displayflexon">
                <div>
                  <div className="wwxxeeererererererr">
                    <div className="trtrzzzdndhdfdffdf">Employee Details</div>
                    <div className="poooosllslslsll">
                      <input
                        className="inputddidjdj"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />

                      <div>
                        <form className="nhhhiwoop3p2o3po23p">
                          <input
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="aewewewelp2i3o23oi23oi32323"
                            type="text"
                            placeholder="Employee"
                          />
                        </form>
                      </div>
                      <div>
                        <button
                          className="hgshareeebuteyreuuruer"
                          onClick={() => handlePrint()}
                        >
                          <div className="zvzgggw2323232">Print</div>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="toprowclassName12">
                    <div className="secondtoprowhe">
                      <div className="headcontdisplay">
                        <div className="allheadsnoh">ID No</div>
                        <div className="allheadsponumh">Employee Name</div>
                        <div className="allheadsjobnameh">
                          <select
                            className="optiondiv"
                            value={designationFilter}
                            onChange={(e) =>
                              setDesignationFilter(e.target.value)
                            }
                          >
                            <option value="">Designation</option>
                            {designationOptions.map((designation) => (
                              <option key={designation} value={designation}>
                                {designation}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="allheadsclienth">
                          {showActualPunchIn ? "Actual Punch In" : "Punch In"}
                          <span
                            onClick={() =>
                              setShowActualPunchIn((prev) => !prev)
                            }
                            style={{ cursor: "pointer", color: "#007bff" }}
                          >
                            (switch)
                          </span>
                        </div>

                        <div className="allheadsqtyh">Punch Out</div>
                        <div className="allheadscolorh">
                          <select
                            className="optiondiv"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                          >
                            <option value="">Status</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                            <option value="Sunday">Sunday</option>
                            <option value="Paid Leave">Paid Leave</option>
                            <option value="Un-Paid Leave">Un-Paid Leave</option>
                            <option value="Holiday">Holiday</option>
                            <option value="C-Off">C-Off</option>
                            <option value="Week-Off">Week-Off</option>
                          </select>
                        </div>

                        <div className="allheadsdateh">Feedback</div>
                      </div>
                    </div>
                  </div>
                  <div className="lppooosososso11">
                    {filteredEmployees.map((employee, index) => (
                      <div className="secondtoprow" key={index}>
                        <div className="headcontdisplay">
                          <div className="allheadsno">{index + 1}</div>
                          <div className="allheadsponum">
                            {employee.employeeName}
                          </div>
                          <div className="allheadsjobname">
                            {employee.designation}
                          </div>
                          <div className="allheadsclient">
                            {employee.attendance?.punchIn
                              ? showActualPunchIn
                                ? new Date(
                                    employee.attendance.recordedPunchIn
                                  ).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                : new Date(
                                    new Date(employee.attendance.punchIn)
                                    //.getTime()
                                    // +
                                    //   5.5 * 60 * 60 * 1000
                                  ).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                              : "-"}
                          </div>
                          <div className="allheadsqty">
                            {editingPunchOutIndex === index ? (
                              <input
                                type="time"
                                className="punchout-input"
                                value={
                                  employee.attendance?.punchOut
                                    ? new Date(
                                        employee.attendance.punchOut
                                      ).toLocaleTimeString("en-GB", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : ""
                                }
                                onChange={(e) =>
                                  handlePunchOutTimeChange(
                                    index,
                                    e.target.value
                                  )
                                }
                                onBlur={() => setEditingPunchOutIndex(null)} // Close input on blur
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => setEditingPunchOutIndex(index)}
                                style={{ cursor: "pointer" }}
                              >
                                {employee.attendance?.punchOut
                                  ? new Date(
                                      new Date(employee.attendance.punchOut)
                                    ).toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    })
                                  : "-"}
                              </span>
                            )}
                          </div>

                          <div className="allheadscolorg">
                            {editingStatusIndex === index ? (
                              <select
                                className="optiondiv"
                                value={employee.attendance?.status}
                                onChange={(e) =>
                                  handleStatusChange(index, e.target.value)
                                }
                                onBlur={() => setEditingStatusIndex(null)} // To close dropdown on blur
                                autoFocus
                              >
                                {statusOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span
                                onClick={() => setEditingStatusIndex(index)}
                                style={{ cursor: "pointer" }}
                              >
                                {employee.attendance?.status || "No Record"}
                              </span>
                            )}
                          </div>
                          <div className="allheadsdate">
                            {editingFeedbackIndex === index ? (
                              <input
                                type="text"
                                className="feedback-input"
                                value={employee.attendance?.note || ""}
                                onChange={(e) =>
                                  handleFeedbackChange(index, e.target.value)
                                }
                                onBlur={() => setEditingFeedbackIndex(null)} // Close input on blur
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => setEditingFeedbackIndex(index)}
                                style={{ cursor: "pointer" }}
                              >
                                {employee.attendance?.note || "-"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
