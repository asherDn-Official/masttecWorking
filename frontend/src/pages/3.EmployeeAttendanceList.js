import React, { useState, useEffect } from "react";

const EmployeeAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');  // Month is zero-based
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAttendanceData(selectedDate);
  }, [selectedDate]);

  const fetchAttendanceData = async (date) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:4000/v1/api/attendance-records/by-date?specificDate=${date}`
      );
      if (!response.ok) {
        throw new Error("No Response Found");
      }
      const data = await response.json();
      setAttendanceData(data);
      setFilteredData(data);
    } catch (err) {
      setError(err.message);
      setAttendanceData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = attendanceData.filter((record) =>
      record.employeeName.toLowerCase().includes(value)
    );
    setFilteredData(filtered);
  };

  const handleDownloadCSV = () => {
    const headers = [
      "S No",
      "Employee ID",
      "Employee Name",
      "Date",
      "Status",
      "Shift",
      "Punch In",
      "Punch Out",
      "Worked Hours",
      "Late",
      "Early Out",
      "OT1",
      "OT2"
    ];
    const rows = filteredData.map((r, i) => [
      i + 1,
      r.employeeId,
      r.employeeName,
      r.date,
      r.status,
      r.shift,
      r.timeIn || "-",
      r.timeOut || "-",
      r.workedHrs || "-",
      r.late || "-",
      r.earlyOut || "-",
      r.ot1 || "-",
      r.ot2 || "-"
    ]);
    const csvContent =
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2 style={{ color: "#1d275f", marginBottom: "10px" }}>Employee Details</h2>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          style={{
            padding: "4px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            width: "140px"
          }}
        />
        <input
          type="text"
          placeholder="Employee"
          value={searchTerm}
          onChange={handleSearchChange}
          style={{
            padding: "4px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            width: "160px"
          }}
        />
        <button
          onClick={handleDownloadCSV}
          style={{
            backgroundColor: "#1d275f",
            color: "#fff",
            padding: "4px 12px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Download CSV
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #ccc"
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#1d275f", color: "#fff" }}>
            <th style={thStyle}>S No</th>
            <th style={thStyle}>Employee ID</th>
            <th style={thStyle}>Employee Name</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Shift</th>
            <th style={thStyle}>Punch In</th>
            <th style={thStyle}>Punch Out</th>
            <th style={thStyle}>Worked Hours</th>
            <th style={thStyle}>Late</th>
            <th style={thStyle}>Early Out</th>
            <th style={thStyle}>OT1</th>
            <th style={thStyle}>OT2</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length === 0 && !loading && (
            <tr>
              <td colSpan="13" style={{ textAlign: "center" }}>
                No records found
              </td>
            </tr>
          )}
          {filteredData.map((record, index) => (
            <tr key={record._id}>
              <td style={tdStyle}>{index + 1}</td>
              <td style={tdStyle}>{record.employeeId}</td>
              <td style={tdStyle}>{record.employeeName}</td>
              <td style={tdStyle}>{record.date}</td>
              <td style={tdStyle}>{record.status}</td>
              <td style={tdStyle}>{record.shift}</td>
              <td style={tdStyle}>{record.timeIn || "-"}</td>
              <td style={tdStyle}>{record.timeOut || "-"}</td>
              <td style={tdStyle}>{record.workedHrs || "-"}</td>
              <td style={{ ...tdStyle, color: record.late ? "red" : "#000" }}>
                {record.late || "-"}
              </td>
              <td style={tdStyle}>{record.earlyOut || "-"}</td>
              <td style={tdStyle}>{record.ot1 || "-"}</td>
              <td style={tdStyle}>{record.ot2 || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const thStyle = {
  padding: "6px",
  border: "1px solid #ccc",
  textAlign: "left"
};

const tdStyle = {
  padding: "6px",
  border: "1px solid #ccc"
};

export default EmployeeAttendance;


























































// import React, { useEffect, useState } from "react";
// import "../CSS/EmployeeAttendanceListCss.css";
// import url from "../Components/global";
// import axios from "axios";

// export default function EmployeeAttendanceList() {
//   const [attendanceDetails, setAttendanceDetails] = useState([]); // Updated to an array
//   const [showActualPunchIn, setShowActualPunchIn] = useState(false);
//   const [statusFilter, setStatusFilter] = useState(""); // Moved outside of `fetchEmployees`
//   const [date, setDate] = useState(() => {
//     const today = new Date();
//     return today.toISOString().split("T")[0];
//   });
//   const [editingStatusIndex, setEditingStatusIndex] = useState(null);
//   const [designationFilter, setDesignationFilter] = useState("");

//   const statusOptions = [
//     "Present",
//     "Absent",
//     "Late",
//     "Sunday",
//     "Paid Leave",
//     "Up-Paid Leave",
//     "Holiday",
//     "C-Off",
//     "Week-Off",
//   ];
//   const [editingFeedbackIndex, setEditingFeedbackIndex] = useState(null);
//   const [editingPunchOutIndex, setEditingPunchOutIndex] = useState(null);
//   const [designationOptions, setDesignationOptions] = useState([]);

//   const [error, setError] = useState("");
//   const [searchQuery, setSearchQuery] = useState("");

//   const fetchEmployees = async () => {
//     try {
//       // Fetch employee and attendance data
//       const employeeResponse = await axios.get(`${url}/v1/api/employees`);
//       const attendanceResponse = await axios.get(`${url}/v1/api/attendance-records/by-date?specificDate=${date}`);

//       // Combine employee and attendance data based on employeeId
//       const combinedData = employeeResponse.data.map((employee) => {
//         const attendanceRecord = attendanceResponse.data.find(
//           (attendance) => attendance.employeeId.toString() === employee.employeeId.toString()
//         );


//         // Extract only today’s attendance details if records are available
//         const todayRecord = attendanceRecord?.records?.find(
//           (record) => {
//             const recordDate = new Date(record.date).toLocaleDateString("en-CA");
//             return recordDate === date;
//           }
//         );


//         return {
//           ...employee,
//           attendance: todayRecord || {
//             punchIn: null,
//             punchOut: null,
//             status: "No Record",
//           },
//         };
//       });

//       setAttendanceDetails(combinedData);
//     } catch (error) {
//       console.error("Error fetching employee data:", error);
//       setError("Error fetching employee data.");
//       setTimeout(() => setError(""), 5000);
//     }
//   };

//   // Fetch employee data when `date` or `statusFilter` changes
//   useEffect(() => {
//     fetchEmployees();
//   }, [date]);

//   useEffect(() => {
//     // Update designation options after attendance details are set
//     const uniqueDesignations = getUniqueDesignations(attendanceDetails);
//     setDesignationOptions(uniqueDesignations);
//   }, [attendanceDetails]);
//   const handleSearchChange = (event) => {
//     setSearchQuery(event.target.value);
//   };
//   const getUniqueDesignations = (employees) => {
//     const designations = employees.map((employee) => employee.designation);
//     return [...new Set(designations)].filter((designation) => designation); // Remove duplicates and filter out empty strings
//   };

//   const filteredEmployees = attendanceDetails.filter((employee) => {
//     const lowerCaseQuery = searchQuery.toLowerCase();
//     const matchesSearch =
//       employee.employeeName?.toLowerCase().includes(lowerCaseQuery) ||
//       employee.designation?.toLowerCase().includes(lowerCaseQuery) ||
//       employee.attendance?.status?.toLowerCase().includes(lowerCaseQuery) ||
//       employee.employeeId?.toString().includes(lowerCaseQuery);

//     const matchesStatusFilter =
//       !statusFilter || employee.attendance?.status === statusFilter;

//     const matchesDesignationFilter =
//       !designationFilter || employee.designation === designationFilter;

//     return matchesSearch && matchesStatusFilter && matchesDesignationFilter;
//   });

//   const handleStatusChange = async (index, newStatus) => {
//     try {
//       const updatedAttendanceDetails = [...attendanceDetails];
//       const selectedRecord = updatedAttendanceDetails[index];
//       const employeeId = selectedRecord.employeeId;
//       const date = selectedRecord.attendance.date;

//       // Update the status locally
//       updatedAttendanceDetails[index].attendance.status = newStatus;
//       setAttendanceDetails(updatedAttendanceDetails);

//       // Make a PUT request to update the status in the backend
//       const response = await axios.put(`${url}/v1/api/attendance`, {
//         employeeId: employeeId,
//         date: date,
//         status: newStatus,
//       });

//       console.log("Status updated successfully:", response.data.message);
//     } catch (error) {
//       console.error(
//         "Error updating status:",
//         error.response?.data || error.message
//       );
//       alert("Failed to update attendance status. Please try again.");
//     }
//   };

//   const handleFeedbackChange = async (index, newFeedback) => {
//     try {
//       const updatedAttendanceDetails = [...attendanceDetails];
//       const selectedRecord = updatedAttendanceDetails[index];
//       const employeeId = selectedRecord.employeeId;
//       const date = selectedRecord.attendance.date;

//       // Update the status locally
//       updatedAttendanceDetails[index].attendance.note = newFeedback;
//       setAttendanceDetails(updatedAttendanceDetails);

//       // Make a PUT request to update the status in the backend
//       const response = await axios.put(`${url}/v1/api/attendance`, {
//         employeeId: employeeId,
//         date: date,
//         note: newFeedback,
//       });

//       console.log("Status updated successfully:", response.data.message);
//     } catch (error) {
//       console.error(
//         "Error updating status:",
//         error.response?.data || error.message
//       );
//       alert("Failed to update attendance status. Please try again.");
//     }
//   };
//   const handlePunchOutTimeChange = async (index, newTime) => {
//     try {
//       const updatedAttendanceDetails = [...attendanceDetails];
//       const selectedRecord = updatedAttendanceDetails[index];
//       const employeeId = selectedRecord.employeeId;
//       const date = selectedRecord.attendance.date;

//       // Extract current punchOut date
//       const currentPunchOutDate = new Date(
//         selectedRecord.attendance.punchOut || new Date()
//       );

//       // Split the new input time into hours and minutes
//       const [newHours, newMinutes] = newTime.split(":");

//       // Set the new time
//       currentPunchOutDate.setHours(newHours, newMinutes, 0, 0);

//       // Subtract 5 hours and 30 minutes from the new time input
//       currentPunchOutDate.setHours(currentPunchOutDate.getHours() - 5);
//       currentPunchOutDate.setMinutes(currentPunchOutDate.getMinutes() - 30);

//       // Update the time locally
//       updatedAttendanceDetails[index].attendance.punchOut = currentPunchOutDate;
//       setAttendanceDetails(updatedAttendanceDetails);

//       // Make a PUT request to update the punchOut time in the backend
//       const response = await axios.put(`${url}/v1/api/attendance`, {
//         employeeId: employeeId,
//         date: date,
//         punchOut: currentPunchOutDate,
//       });

//       console.log(
//         "Punch-out time updated successfully:",
//         response.data.message
//       );
//     } catch (error) {
//       console.error(
//         "Error updating punch-out time:",
//         error.response?.data || error.message
//       );
//       alert("Failed to update punch-out time. Please try again.");
//     }
//   };
//   const handlePrint = () => {
//     window.print();
//   };

//   return (
//     <div className="printable-section">
//       <div className="widthhall">
//         <div className="alldisplay">
//           <div style={{ width: "100%" }}>
//             <div className="marginbox">
//               <div className="displayflexon">
//                 <div>
//                   <div className="wwxxeeererererererr">
//                     <div className="trtrzzzdndhdfdffdf">Employee Details</div>
//                     <div className="poooosllslslsll">
//                       <input
//                         className="inputddidjdj"
//                         type="date"
//                         value={date}
//                         onChange={(e) => setDate(e.target.value)}
//                       />

//                       <div>
//                         <form className="nhhhiwoop3p2o3po23p">
//                           <input
//                             value={searchQuery}
//                             onChange={handleSearchChange}
//                             className="aewewewelp2i3o23oi23oi32323"
//                             type="text"
//                             placeholder="Employee"
//                           />
//                         </form>
//                       </div>
//                       <div>
//                         <button
//                           className="hgshareeebuteyreuuruer"
//                           onClick={() => handlePrint()}
//                         >
//                           <div className="zvzgggw2323232">Print</div>
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="toprowclassName12">
//                     <div className="secondtoprowhe">
//                       <div className="headcontdisplay">
//                         <div className="allheadsnoh">ID No</div>
//                         <div className="allheadsnoh">Emp Id</div>
//                         <div className="allheadsponumh">Employee Name</div>
//                         <div className="allheadsjobnameh">
//                           <select
//                             className="optiondiv"
//                             value={designationFilter}
//                             onChange={(e) =>
//                               setDesignationFilter(e.target.value)
//                             }
//                           >
//                             <option value="">Designation</option>
//                             {designationOptions.map(des => (
//                               <option key={des} value={des}>{des}
//                               </option>
//                             ))}
//                           </select>
//                         </div>

//                         <div className="allheadsclienth">
//                           {showActualPunchIn ? "Actual Punch In" : "Punch In"}
//                           <span
//                             onClick={() =>
//                               setShowActualPunchIn((prev) => !prev)
//                             }
//                             style={{ cursor: "pointer", color: "#007bff" }}
//                           >
//                             (switch)
//                           </span>
//                         </div>

//                         <div className="allheadsqtyh">Punch Out</div>
//                         <div className="allheadscolorh">
//                           <select
//                             className="optiondiv"
//                             value={statusFilter}
//                             onChange={(e) => setStatusFilter(e.target.value)}
//                           >
//                             <option value="">Status</option>
//                             <option value="Present">Present</option>
//                             <option value="Absent">Absent</option>
//                             <option value="Late">Late</option>
//                             <option value="Sunday">Sunday</option>
//                             <option value="Paid Leave">Paid Leave</option>
//                             <option value="Un-Paid Leave">Un-Paid Leave</option>
//                             <option value="Holiday">Holiday</option>
//                             <option value="C-Off">C-Off</option>
//                             <option value="Week-Off">Week-Off</option>
//                           </select>
//                         </div>

//                         <div className="allheadsdateh">Feedback</div>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="lppooosososso11">
//                     {filteredEmployees.map((emp, index) => (
//                       <div className="secondtoprow" key={index}>
//                         <div className="headcontdisplay">
//                           <div className="allheadsno">{index + 1}</div>
//                           <div className="allheadsno">{emp.employeeId}</div>
//                           <div className="allheadsponum">
//                             {emp.employeeName}
//                           </div>
//                           <div className="allheadsjobname">
//                             {emp.designation}
//                           </div>
//                           <div className="allheadsclient">
//                             {emp.attendance?.punchIn
//                               ? showActualPunchIn
//                                 ? new Date(
//                                     emp.attendance.recordedPunchIn
//                                   ).toLocaleTimeString("en-IN", {
//                                     hour: "2-digit",
//                                     minute: "2-digit",
//                                     hour12: true,
//                                   })
//                                 : new Date(
//                                     new Date(emp.attendance.punchIn)
//                                     //.getTime()
//                                     // +
//                                     //   5.5 * 60 * 60 * 1000
//                                   ).toLocaleTimeString("en-IN", {
//                                     hour: "2-digit",
//                                     minute: "2-digit",
//                                     hour12: true,
//                                   })
//                               : "-"}
//                           </div>
//                           <div className="allheadsqty">
//                             {editingPunchOutIndex === index ? (
//                               <input
//                                 type="time"
//                                 className="punchout-input"
//                                 value={
//                                   emp.attendance?.punchOut
//                                     ? new Date(
//                                         emp.attendance.punchOut
//                                       ).toLocaleTimeString("en-GB", {
//                                         hour: "2-digit",
//                                         minute: "2-digit",
//                                       })
//                                     : ""
//                                 }
//                                 onChange={(e) =>
//                                   handlePunchOutTimeChange(
//                                     index,
//                                     e.target.value
//                                   )
//                                 }
//                                 onBlur={() => setEditingPunchOutIndex(null)} // Close input on blur
//                                 autoFocus
//                               />
//                             ) : (
//                               <span
//                                 onClick={() => setEditingPunchOutIndex(index)}
//                                 style={{ cursor: "pointer" }}
//                               >
//                                 {emp.attendance?.punchOut
//                                   ? new Date(
//                                       new Date(emp.attendance.punchOut)
//                                     ).toLocaleTimeString("en-IN", {
//                                       hour: "2-digit",
//                                       minute: "2-digit",
//                                       hour12: true,
//                                     })
//                                   : "-"}
//                               </span>
//                             )}
//                           </div>

//                           <div className="allheadscolorg">
//                             {editingStatusIndex === index ? (
//                               <select
//                                 className="optiondiv"
//                                 value={emp.attendance?.status}
//                                 onChange={(e) =>
//                                   handleStatusChange(index, e.target.value)
//                                 }
//                                 onBlur={() => setEditingStatusIndex(null)} // To close dropdown on blur
//                                 autoFocus
//                               >
//                                 {statusOptions.map((option) => (
//                                   <option key={option} value={option}>
//                                     {option}
//                                   </option>
//                                 ))}
//                               </select>
//                             ) : (
//                               <span
//                                 onClick={() => setEditingStatusIndex(index)}
//                                 style={{ cursor: "pointer" }}
//                               >
//                                 {emp.attendance?.status || "No Record"}
//                               </span>
//                             )}
//                           </div>
//                           {editingFeedbackIndex === index ? (
//                             <div className="allheadsdate">
//                               <input
//                                 type="text"
//                                 className="feedback-input"
//                                 value={emp.attendance?.note || ""}
//                                 onChange={(e) =>
//                                   handleFeedbackChange(index, e.target.value)
//                                 }
//                                 onBlur={() => setEditingFeedbackIndex(null)} // Close input on blur
//                                 autoFocus
//                               />
//                             </div>
//                           ) : (
//                             <div className="allheadsdate">
//                               <span
//                                 onClick={() => setEditingFeedbackIndex(index)}
//                                 style={{ cursor: "pointer" }}
//                               >
//                                 {emp.attendance?.note || "-"}
//                               </span>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
