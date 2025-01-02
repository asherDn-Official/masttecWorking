import React, { useCallback, useEffect, useState } from "react";
import "../CSS/PayrollCSS.css";
import url from "../Components/global";
import axios from "axios";

export default function PayrollPage() {
  const [employee, setEmployee] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Default to current month (1-based index)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Initialize with current year
  const [holidayList, setHolidayList] = useState();
  const [searchQuery, setSearchQuery] = useState("");
  const handleMonth = (e) => {
    setSelectedMonth(e.target.value); // Update state with the selected value
  };
  const searchfilter = async (e) => {
    e.preventDefault();
    if (searchQuery) {
      setEmployee((prevState) =>
        prevState.filter(
          (emp) =>
            emp.employeeName
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            emp.employeeId.toString().includes(searchQuery)
        )
      );
    } else {
      setEmployee(employee);
    }
  };
  // const handleYearChange = async (e) => {
  //   setSelectedYear(e.target.value);
  // };
  const handleMonthChange = (event) => {
    const selectedMonthValue = parseInt(event.target.value); // Parse the selected value
    //const currentYear = new Date().getFullYear(); // Get the current year

    // Filter attendance data by the selected month and year
    const filteredData = filterRecordsByMonth(
      attendanceData,
      selectedYear,
      selectedMonthValue
    );

    // Fetch and update employee data with filtered records
    fetchEmployee(filteredData); // Assuming fetchEmployee updates state or performs relevant tasks
  };

  const filterRecordsByMonth = useCallback((data, year, month) => {
    return data
      .map(({ employeeId, records }) => ({
        employeeId,
        records: records.filter(({ date }) => {
          const recordDate = new Date(date);
          return (
            recordDate.getFullYear() === year &&
            recordDate.getMonth() + 1 === month
          );
        }),
      }))
      .filter(({ records }) => records.length > 0);
  }, []);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${url}/v1/api/attendance`);
      setAttendanceData(response.data);
    } catch (error) {
      handleError("Error fetching attendance data.");
    } finally {
      setIsLoading(false);
    }
  };
  console.log("month: ", selectedMonth);
  console.log("year:", selectedYear);
  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      console.log(selectedYear);
      const response = await axios.get(`${url}/v1/api/holiday/${selectedYear}`);
      setHolidayList(response.data.holidays);
      console.log("holiday : ", holidayList);
    } catch (error) {
      handleError("Error fetching attendance data.");
    } finally {
      setIsLoading(false);
    }
  };
  const fetchEmployee = async (filteredAttendance) => {
    try {
      const empResponse = await axios.get(`${url}/v1/api/employees`);
      const employeeData = empResponse.data;

      const totalOvertimeHours = {}; // Initialize total overtime storage

      const mappedEmployeeData = employeeData.map((emp) => {
        const attendanceRecord = filteredAttendance.find(
          (att) => att.employeeId === emp.employeeId
        );

        const presentDays = attendanceRecord
          ? attendanceRecord.records.filter((rec) => rec.status === "Present")
              .length
          : 0;
        const absentDays = attendanceRecord
          ? attendanceRecord.records.filter((rec) => rec.status === "Absent")
              .length
          : 0;
        const unpaidLeave = attendanceRecord
          ? attendanceRecord.records.filter(
              (rec) => rec.status === "Up-Paid Leave"
            ).length
          : 0;
        const salaryPerHr = Math.round(emp.salary / (30 * 8)) || 0; // Hourly rate calculation
        const basicSalary = Math.round(salaryPerHr * presentDays * 8) / 2 || 0; // Adjusted for present days
        const houseRent = Math.round(salaryPerHr * presentDays * 8) / 4 || 0; // Adjusted for present days
        let totalOT1Minutes = 0; // Overtime for Present status
        let totalOT2Minutes = 0; // Overtime for Sunday/Holiday status

        // Calculate overtime from attendance records
        attendanceRecord?.records.forEach((record) => {
          const punchIn = new Date(record.punchIn);
          const punchOut = new Date(record.punchOut);

          if (punchIn && punchOut && punchOut > punchIn) {
            const diffInMinutes = Math.floor(
              (punchOut - punchIn) / (1000 * 60)
            );
            const excessMinutes = Math.max(0, diffInMinutes - 8 * 60); // Check for overtime

            // Assign overtime to the correct category based on the status
            if (
              record.status === "Sunday" || // Check if it's Sunday
              record.date.includes(holidayList) // Or a holiday
            ) {
              totalOT2Minutes += diffInMinutes; // OT2 for Sunday/Holiday
            } else if (record.status === "Present") {
              totalOT1Minutes += excessMinutes; // OT1 for Present
            }
          }
        });

        // Convert overtime minutes to hours and minutes
        const totalOT1Hours = Math.floor(totalOT1Minutes / 60);
        const totalOT1RemainderMinutes = totalOT1Minutes % 60;

        const totalOT2Hours = Math.floor(totalOT2Minutes / 60);
        const totalOT2RemainderMinutes = totalOT2Minutes % 60;

        // Store the overtime hours for both OT1 and OT2
        totalOvertimeHours[emp.employeeId] = {
          OT1: {
            hours: totalOT1Hours,
            minutes: totalOT1RemainderMinutes,
          },
          OT2: {
            hours: totalOT2Hours,
            minutes: totalOT2RemainderMinutes,
          },
        };

        // Convert OT1 and OT2 to decimal hours
        const ot1Decimal = totalOT1Hours + totalOT1RemainderMinutes / 60;
        const ot2Decimal = totalOT2Hours + totalOT2RemainderMinutes / 60;

        // Calculate OT1 and OT2 amounts with the respective multipliers
        const ot1Amount = Math.round(ot1Decimal * salaryPerHr * 1.25); // OT1 at 1.25x
        const ot2Amount = Math.round(ot2Decimal * salaryPerHr * 1.75); // OT2 at 1.75x

        // Calculate total salary and payments (automatically interlinked)
        const empSalary =
          basicSalary +
          houseRent +
          ot1Amount +
          ot2Amount -
          Number(emp.epf) -
          Number(emp.esic);
        const payOn5th =
          basicSalary + houseRent - Number(emp.epf) - Number(emp.esic);

        const payOn20th = ot1Amount + ot2Amount;
        const productionLossAmount = unpaidLeave * salaryPerHr * 8;

        const grossSalary =
          basicSalary +
          houseRent +
          ot1Amount +
          ot2Amount +
          emp.incentives +
          emp.allowances +
          emp.advance;


        const TotalDeductions =
          Number(emp.epf) +
          Number(emp.esic) +
          productionLossAmount ;
         

        return {
          employeeName: emp.employeeName || "",
          employeePicture: emp.employeePicture || "",
          employeeDesignation: emp.designation || "",
          employeeEmail: emp.mailId || "",
          employeeDepartment: emp.department || "",
          employeeId: emp.employeeId || "",
          employeeMobileNumber: emp.mobileNumber || "",
          employeeAadhaarNo: emp.aadhaarNo || "",

          bankName: emp.bankName || "",
          bankBranch: emp.bankBranch || "",
          designation: emp.designation || "",
          bankAccountNumber: emp.bankAccountNumber || "",
          bankIFSCCode: emp.bankIFSCCode || "",
          employeePANNumber: emp.PANNumber || "",
          employeeESICId: emp.esicId || "",
          employeeEPFId: emp.epfId || "",
          employeeUANNo: emp.UANNo || "",
          employeePerHrSalary: salaryPerHr || 0,
          employeePresentDays: presentDays || 0,
          employeeAbsentDays: absentDays || 0,
          employeeBasicSalary: basicSalary || 0,
          employeeHouseRent: houseRent || 0,
          employeeEPF: emp.epf || 0,
          employeeESIC: emp.esic || 0,
          employeeIncentives: emp.employeeIncentives || 0,
          employeeAllowances: emp.employeeAllowances || 0,
          employeeAdvance: emp.employeeAdvance || 0,
          employeePLoss: unpaidLeave || 0,
          employeePLossAmount: productionLossAmount || 0,
          employeeOT1Hours: ot1Decimal || 0, // OT1 in decimal
          employeeOT1Amount: ot1Amount || 0,
          employeeOT2Hours: ot2Decimal || 0, // OT2 in decimal
          employeeOT2Amount: ot2Amount || 0,
          salary: emp.salary || 0,
          employeeHoldOT: emp.employeeHoldOT || 0,
          payOn5th: payOn5th > 0 ? payOn5th : 0 || 0, // Calculated pay on 5th (without overtime)
          payOn20th: payOn20th > 0 ? payOn20th : 0 || 0, // Calculated pay on 20th (with overtime)
          empSalary: empSalary > 0 ? empSalary : 0 || 0, // Total salary (with overtime)
          empBalance: emp.empBalance || 0,
          totalOT1: `${totalOT1Hours} hrs ${totalOT1RemainderMinutes} mins`, // OT1 in time format
          totalOT2: `${totalOT2Hours} hrs ${totalOT2RemainderMinutes} mins`, // OT2 in time format,
          grossSalary,
          TotalDeductions,
        };
      });

      setEmployee(mappedEmployeeData);
      console.log("employee : ", employee);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setError("Error fetching employee data.");
      setTimeout(() => setError(""), 5000);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchAttendance();
      await fetchEmployee(attendanceData);
      await fetchHolidays();
    };
    fetchData();
  }, [selectedYear]);
  const handleError = (message) => {
    setError(message);
    setTimeout(() => setError(""), 5000);
  };

  const calculateFields = (employee) => {
    const salaryPerHr = employee.employeePerHrSalary;
    const presentDays = employee.employeePresentDays;
    const advance = employee.employeeAdvance;
    const holdOT = employee.employeeHoldOT;
    const productionLossAmount = employee.employeePLoss * salaryPerHr * 8 || 0;

    const basicSalary = Math.round(salaryPerHr * presentDays * 8) / 2 || 0;
    const houseRent = Math.round(salaryPerHr * presentDays * 8) / 4 || 0;

    const ot1Amount =
      Math.round(employee.employeeOT1Hours * salaryPerHr * 1.25) || 0;
    const ot2Amount =
      Math.round(employee.employeeOT2Hours * salaryPerHr * 1.75) || 0;

    const totalSalary =
      basicSalary +
      houseRent +
      Number(employee.employeeIncentives) +
      Number(employee.employeeAllowances) -
      Number(employee.employeeESIC) -
      Number(employee.employeeEPF) +
      Number(advance) +
      ot1Amount +
      ot2Amount -
      holdOT;

    const payOn5th =
      basicSalary +
      houseRent +
      Number(employee.employeeIncentives) +
      Number(employee.employeeAllowances) -
      Number(employee.employeeESIC) -
      Number(employee.employeeEPF) +
      Number(advance);
    const payOn20th = ot1Amount + ot2Amount - holdOT;

    return {
      employeeBasicSalary: basicSalary,
      employeeHouseRent: houseRent,
      employeeOT1Amount: ot1Amount,
      employeeOT2Amount: ot2Amount,
      employeePLossAmount: productionLossAmount,
      empSalary: totalSalary > 0 ? totalSalary : 0,
      payOn5th: payOn5th > 0 ? payOn5th : 0,
      payOn20th: payOn20th > 0 ? payOn20th : 0,
      empBalance: holdOT,
    };
  };

  const handleChange = (e, id, field) => {
    const { value } = e.target;

    setEmployee((prevData) =>
      prevData.map((emp) => {
        if (emp.employeeId === id) {
          const updatedEmp = { ...emp, [field]: value };

          // Calculate fields based on the updated employee data
          const calculatedFields = calculateFields(updatedEmp);

          // Update the employee's fields
          return { ...updatedEmp, ...calculatedFields };
        }
        return emp;
      })
    );
  };

  const sendEmployeeData = async (employeebase) => {
    try {
      if (!employeebase || typeof employeebase !== "object") {
        alert("Employee data is missing or invalid.");
        return;
      }

      if (!employeebase.employeeEmail) {
        alert("Employee email is required.");
        return;
      }

      // Prepare the payload
      const payload = {
        employeeData: employeebase,
        email: employeebase.employeeEmail,
        month: selectedMonth,
        year: selectedYear,
      };

      // Send the request
      const response = await axios.post(`${url}/v1/api/payroll`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      // Check the response status
      if ([200, 201].includes(response.status)) {
        return { success: true, message: "Employee data sent successfully!" };
      } else {
        return { success: false, message: "Failed to send employee data." };
      }
    } catch (error) {
      console.error("Error sending employee data:", error);
      const errorMsg =
        error.response?.data?.message ||
        "An error occurred while sending employee data.";
      return { success: false, message: errorMsg };
    }
  };

  const handleSendAllEmployees = async (e) => {
    e.preventDefault();

    try {
      // Validate input fields
      if (!selectedMonth || !selectedYear) {
        alert("Please select both month and year.");
        return;
      }

      // Send data for all employees concurrently
      const results = await Promise.all(
        employee.map((emp) => sendEmployeeData(emp))
      );

      // Check results for failures
      const failed = results.filter((result) => !result.success);
      
    

      if (failed.length > 0) {
        console.warn(
          `Failed to send data for ${failed.length} employee(s):`,
          failed.map((result) => result.message)
        );
        alert(`Failed to send data for ${failed.length} employee(s).`);
      } else {
        alert("Data successfully sent to all employees!");
      }
    } catch (error) {
      console.error("Error sending employee data:", error);
      alert(
        "An unexpected error occurred while sending employee data. Please try again."
      );
    }
  };

  console.log("attendance : ", attendanceData);
  const fields = [
    { label: "Present", field: "employeePresentDays" },
    { label: "Absent", field: "employeeAbsentDays" },
    { label: "Basic", field: "employeeBasicSalary" },
    { label: "House Rent", field: "employeeHouseRent" },
    { label: "EPF", field: "employeeEPF" },
    { label: "ESIC", field: "employeeESIC" },
    { label: "Incentives", field: "employeeIncentives" },
    { label: "Allowance", field: "employeeAllowances" },
    { label: "Advance", field: "employeeAdvance" },
    { label: "P.Loss Days", field: "employeePLoss" },
    { label: "P.Loss Amount", field: "employeePLossAmount" },
    { label: "OT 1", field: "employeeOT1Hours" },
    { label: "OT 1 Amount", field: "employeeOT1Amount" },
    { label: "OT 2", field: "employeeOT2Hours" },
    { label: "OT 2 Amount", field: "employeeOT2Amount" },
    { label: "Hold OT", field: "employeeHoldOT" },
    { label: "Pay on 5th", field: "payOn5th" },
    { label: "Pay on 20th", field: "payOn20th" },
    { label: "Salary", field: "empSalary" },
    { label: "Balance", field: "empBalance" },
    // { label: "Salary", field: "empSalary" },
    // { label: "Balance", field: "empBalance" },
    // { label: "Salary", field: "empSalary" },
    // { label: "Balance", field: "empBalance" },
    // { label: "Salary", field: "empSalary" },
  ];
  return (
    <div>
      <div className="ksierperki4545454">
        <div className="lpieoroeroerrere">
          <div className="psioo5o4o54io5k5">Payroll Details</div>

          <div className="header-section">
            <div>
              <select
                value={selectedMonth} // Bind the select value to state
                onChange={(e) => {
                  // handleMonth(e); // Update state
                  setSelectedMonth(e.target.value); 
                  handleMonthChange(e); // Process the selected month
                }}
                className="pojejrejrerer"
              >
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="  selection-option"
              >
                <option value="">Select Year</option>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>


        </div>


        <div className="ldijk45rrt">
          <div className="overviewPayroll">Overview</div>
          <div>
            <div className="sldijkero454545">
              <div className="sliderfk5445">
                <div>svg1</div>
                <div className="keofroei4o5454">
                  <div className="totalEmployewgy434">Total Employee</div>
                  <div className="noofemplueelist34">
                    {employee.length} Employees
                  </div>
                </div>
              </div>
              <div className="sliderfk5445">
                <div>svg2</div>
                <div className="keofroei4o5454">
                  <div className="totalEmployewgy434">Total Net Pay</div>
                  <div className="noofemplueelist34">
                    ₹{" "}
                    {Math.max(
                      employee.reduce(
                        (total, emp) =>
                          total +
                          Number(emp.employeeBasicSalary) +
                          Number(emp.employeeHouseRent) +
                          Number(emp.employeeIncentives) +
                          Number(emp.employeeAllowances) -
                          Number(emp.employeeESIC) -
                          Number(emp.employeeEPF) +
                          Number(emp.employeeAdvance) +
                          Number(emp.employeeOT1Amount) +
                          Number(emp.employeeOT2Amount) -
                          Number(emp.employeeHoldOT),
                        0
                      ),
                      0
                    )}
                  </div>
                </div>
              </div>

              <div className="sliderfk5445">
                <div>svg 3</div>
                <div className="keofroei4o5454">
                  <div className="totalEmployewgy434">Total Gross Pay</div>
                  <div className="noofemplueelist34">
                    ₹{" "}
                    {employee.reduce(
                      (total, emp) =>
                        total +
                        Number(emp.empSalary) +
                        Number(emp.employeeEPF) +
                        Number(emp.employeeESIC) +
                        Number(emp.employeeAdvance) +
                        Number(emp.employeeOT1Amount) +
                        Number(emp.employeeOT2Amount),
                      0
                    )}
                  </div>
                </div>
              </div>
              <div className="sliderfk5445">
                <div>svg 4</div>
                <div className="keofroei4o5454">
                  <div className="totalEmployewgy434">Total Deduction</div>
                  <div className="noofemplueelist34">
                    ₹{" "}
                    {employee.reduce(
                      (total, emp) =>
                        total +
                        Number(emp.employeeEPF) +
                        Number(emp.employeeESIC),
                      0
                    )}
                  </div>
                </div>
              </div>
              <div className="sliderfk5445">
                <div>svg 5</div>
                <div className="keofroei4o5454">
                  <div className="totalEmployewgy434">Total Deduction</div>
                  <div className="noofemplueelist34">₹ 2,00,000.00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="whgitebackgroundivsss">
          <div className="kkdkl4l34k4343443">
            <div className="employeeddtextfguh3453">Employee Details</div>
            <div className="poogp656556">
              <div className="seqarch3453455">
                <input
                  placeholder="Search Employee"
                  type="text"
                  className="searchemployeepayrolldiv21"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchfilter(e);
                  }}
                />
                <div className="searchiconsvgpayroll">svg 6</div>
              </div>
              <div className="lsoi34545545">
                <button
                  className="sharetoexportbutton"
                  onClick={handleSendAllEmployees}
                >
                  PayRun
                </button>
                <div className="shareiicontorxpoort">svg 7</div>
              </div>
            </div>
          </div>
          {employee &&
            employee.map((emp, index) => (
              <div className="flexofjo4546656" key={index}>
                <div className="ksiskfdk54">
                  <div>
                    <img
                      src={`http://localhost:4000${emp.employeePicture}`}
                      alt=""
                    />
                  </div>
                  <div className="nameofthejkd">{emp.employeeName}</div>
                  <div className="nameofthejkd">{emp.designation}</div>
                  <div className="nameofthejkd">Emp Id - {emp.employeeId}</div>
                  <div className="nameofthejkd">Salary - ₹ {emp.salary}</div>
                  <div className="nameofthejkd">
                    Salary/Hr - ₹ {emp.employeePerHrSalary}
                  </div>
                  <div className="nameofthejkd">
                     <button className="pay-slip" onClick={()=>sendEmployeeData(emp)}> pay slip </button>
                  </div>
                </div>
                <div>
                  <div className="inputfLEXSHSH">
                    {fields.map(({ label, field }) => (
                      <div className="onekdi4545" key={field}>
                        <div>
                          <label className="lABLETTITLEII" htmlFor="">
                            {label}
                          </label>
                        </div>
                        <input
                          onChange={(e) =>
                            handleChange(e, emp.employeeId, field)
                          }
                          className="inputpayroll"
                          type="number"
                          value={emp[field]}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
