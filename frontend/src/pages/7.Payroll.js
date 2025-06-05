import React, { useCallback, useEffect, useState } from "react";
import "../CSS/PayrollCSS.css";
import url from "../Components/global";
import axios from "axios";
import profileImage from "../assets/images/profile.png";

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
          Number(emp.epf) + Number(emp.esic) + productionLossAmount;

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

      console.log("results", results);
      // Check results for failures
      const failed = results.filter((result) => !result.success);

      console.log("failed : ", failed);

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
                <div>
                  <svg
                    width="43"
                    height="43"
                    viewBox="0 0 43 43"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="43" height="43" rx="21.5" fill="#17215E" />
                    <path
                      d="M20.9031 22.0964C23.2335 22.0964 25.345 22.8678 26.894 23.9465C28.3659 24.973 29.6126 26.4984 29.6126 28.1395C29.6126 29.0403 29.2282 29.7868 28.6222 30.3418C28.0524 30.8656 27.3083 31.2052 26.5419 31.4367C25.0103 31.9008 22.9934 32.0501 20.9031 32.0501C18.8129 32.0501 16.796 31.9008 15.2644 31.4367C14.4979 31.2052 13.7539 30.8656 13.1828 30.3418C12.5794 29.7881 12.1936 29.0416 12.1936 28.1407C12.1936 26.4996 13.4403 24.9742 14.9123 23.9477C16.4613 22.8678 18.5727 22.0964 20.9031 22.0964ZM29.6126 23.3406C30.9116 23.3406 32.0911 23.7698 32.9633 24.377C33.7596 24.9332 34.5895 25.8576 34.5895 26.9849C34.5895 27.6281 34.3095 28.1619 33.8927 28.5439C33.512 28.8935 33.0417 29.0988 32.6124 29.2282C32.0276 29.4049 31.3371 29.4957 30.6204 29.5355C30.7722 29.1063 30.8568 28.6397 30.8568 28.1395C30.8568 26.2296 29.6636 24.6072 28.3286 23.4812C28.7503 23.388 29.1808 23.3409 29.6126 23.3406ZM12.1936 23.3406C12.6391 23.3422 13.0671 23.3891 13.4777 23.4812C12.1439 24.6072 10.9494 26.2296 10.9494 28.1395C10.9494 28.6397 11.034 29.1063 11.1858 29.5355C10.4692 29.4957 9.77988 29.4049 9.19385 29.2282C8.7646 29.0988 8.29429 28.8935 7.91231 28.5439C7.69336 28.3477 7.51825 28.1076 7.3984 27.8392C7.27856 27.5708 7.21668 27.2801 7.2168 26.9861C7.2168 25.8601 8.04544 24.9344 8.84298 24.3782C9.82947 23.7019 10.9976 23.3402 12.1936 23.3406ZM28.9905 15.8753C29.8155 15.8753 30.6067 16.203 31.19 16.7863C31.7733 17.3697 32.1011 18.1609 32.1011 18.9858C32.1011 19.8108 31.7733 20.602 31.19 21.1853C30.6067 21.7686 29.8155 22.0964 28.9905 22.0964C28.1656 22.0964 27.3744 21.7686 26.791 21.1853C26.2077 20.602 25.88 19.8108 25.88 18.9858C25.88 18.1609 26.2077 17.3697 26.791 16.7863C27.3744 16.203 28.1656 15.8753 28.9905 15.8753ZM12.8158 15.8753C13.6407 15.8753 14.4319 16.203 15.0152 16.7863C15.5986 17.3697 15.9263 18.1609 15.9263 18.9858C15.9263 19.8108 15.5986 20.602 15.0152 21.1853C14.4319 21.7686 13.6407 22.0964 12.8158 22.0964C11.9908 22.0964 11.1996 21.7686 10.6163 21.1853C10.0329 20.602 9.70522 19.8108 9.70522 18.9858C9.70522 18.1609 10.0329 17.3697 10.6163 16.7863C11.1996 16.203 11.9908 15.8753 12.8158 15.8753ZM20.9031 10.8984C22.2231 10.8984 23.489 11.4228 24.4223 12.3561C25.3556 13.2895 25.88 14.5553 25.88 15.8753C25.88 17.1952 25.3556 18.4611 24.4223 19.3945C23.489 20.3278 22.2231 20.8521 20.9031 20.8521C19.5832 20.8521 18.3173 20.3278 17.384 19.3945C16.4506 18.4611 15.9263 17.1952 15.9263 15.8753C15.9263 14.5553 16.4506 13.2895 17.384 12.3561C18.3173 11.4228 19.5832 10.8984 20.9031 10.8984Z"
                      fill="#EDEDED"
                    />
                  </svg>
                </div>
                <div className="keofroei4o5454">
                  <div className="totalEmployewgy434">Total Employee</div>
                  <div className="noofemplueelist34">
                    {employee.length} Employees
                  </div>
                </div>
              </div>
              <div className="sliderfk5445">
                <div>
                  <svg
                    width="43"
                    height="43"
                    viewBox="0 0 43 43"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="43" height="43" rx="21.5" fill="#17215E" />
                    <path
                      d="M20.9031 22.0964C23.2335 22.0964 25.345 22.8678 26.894 23.9465C28.3659 24.973 29.6126 26.4984 29.6126 28.1395C29.6126 29.0403 29.2282 29.7868 28.6222 30.3418C28.0524 30.8656 27.3083 31.2052 26.5419 31.4367C25.0103 31.9008 22.9934 32.0501 20.9031 32.0501C18.8129 32.0501 16.796 31.9008 15.2644 31.4367C14.4979 31.2052 13.7539 30.8656 13.1828 30.3418C12.5794 29.7881 12.1936 29.0416 12.1936 28.1407C12.1936 26.4996 13.4403 24.9742 14.9123 23.9477C16.4613 22.8678 18.5727 22.0964 20.9031 22.0964ZM29.6126 23.3406C30.9116 23.3406 32.0911 23.7698 32.9633 24.377C33.7596 24.9332 34.5895 25.8576 34.5895 26.9849C34.5895 27.6281 34.3095 28.1619 33.8927 28.5439C33.512 28.8935 33.0417 29.0988 32.6124 29.2282C32.0276 29.4049 31.3371 29.4957 30.6204 29.5355C30.7722 29.1063 30.8568 28.6397 30.8568 28.1395C30.8568 26.2296 29.6636 24.6072 28.3286 23.4812C28.7503 23.388 29.1808 23.3409 29.6126 23.3406ZM12.1936 23.3406C12.6391 23.3422 13.0671 23.3891 13.4777 23.4812C12.1439 24.6072 10.9494 26.2296 10.9494 28.1395C10.9494 28.6397 11.034 29.1063 11.1858 29.5355C10.4692 29.4957 9.77988 29.4049 9.19385 29.2282C8.7646 29.0988 8.29429 28.8935 7.91231 28.5439C7.69336 28.3477 7.51825 28.1076 7.3984 27.8392C7.27856 27.5708 7.21668 27.2801 7.2168 26.9861C7.2168 25.8601 8.04544 24.9344 8.84298 24.3782C9.82947 23.7019 10.9976 23.3402 12.1936 23.3406ZM28.9905 15.8753C29.8155 15.8753 30.6067 16.203 31.19 16.7863C31.7733 17.3697 32.1011 18.1609 32.1011 18.9858C32.1011 19.8108 31.7733 20.602 31.19 21.1853C30.6067 21.7686 29.8155 22.0964 28.9905 22.0964C28.1656 22.0964 27.3744 21.7686 26.791 21.1853C26.2077 20.602 25.88 19.8108 25.88 18.9858C25.88 18.1609 26.2077 17.3697 26.791 16.7863C27.3744 16.203 28.1656 15.8753 28.9905 15.8753ZM12.8158 15.8753C13.6407 15.8753 14.4319 16.203 15.0152 16.7863C15.5986 17.3697 15.9263 18.1609 15.9263 18.9858C15.9263 19.8108 15.5986 20.602 15.0152 21.1853C14.4319 21.7686 13.6407 22.0964 12.8158 22.0964C11.9908 22.0964 11.1996 21.7686 10.6163 21.1853C10.0329 20.602 9.70522 19.8108 9.70522 18.9858C9.70522 18.1609 10.0329 17.3697 10.6163 16.7863C11.1996 16.203 11.9908 15.8753 12.8158 15.8753ZM20.9031 10.8984C22.2231 10.8984 23.489 11.4228 24.4223 12.3561C25.3556 13.2895 25.88 14.5553 25.88 15.8753C25.88 17.1952 25.3556 18.4611 24.4223 19.3945C23.489 20.3278 22.2231 20.8521 20.9031 20.8521C19.5832 20.8521 18.3173 20.3278 17.384 19.3945C16.4506 18.4611 15.9263 17.1952 15.9263 15.8753C15.9263 14.5553 16.4506 13.2895 17.384 12.3561C18.3173 11.4228 19.5832 10.8984 20.9031 10.8984Z"
                      fill="#EDEDED"
                    />
                  </svg>
                </div>
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
                <div>
                  <svg
                    width="43"
                    height="43"
                    viewBox="0 0 43 43"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="43" height="43" rx="21.5" fill="#17215E" />
                    <path
                      d="M20.9031 22.0964C23.2335 22.0964 25.345 22.8678 26.894 23.9465C28.3659 24.973 29.6126 26.4984 29.6126 28.1395C29.6126 29.0403 29.2282 29.7868 28.6222 30.3418C28.0524 30.8656 27.3083 31.2052 26.5419 31.4367C25.0103 31.9008 22.9934 32.0501 20.9031 32.0501C18.8129 32.0501 16.796 31.9008 15.2644 31.4367C14.4979 31.2052 13.7539 30.8656 13.1828 30.3418C12.5794 29.7881 12.1936 29.0416 12.1936 28.1407C12.1936 26.4996 13.4403 24.9742 14.9123 23.9477C16.4613 22.8678 18.5727 22.0964 20.9031 22.0964ZM29.6126 23.3406C30.9116 23.3406 32.0911 23.7698 32.9633 24.377C33.7596 24.9332 34.5895 25.8576 34.5895 26.9849C34.5895 27.6281 34.3095 28.1619 33.8927 28.5439C33.512 28.8935 33.0417 29.0988 32.6124 29.2282C32.0276 29.4049 31.3371 29.4957 30.6204 29.5355C30.7722 29.1063 30.8568 28.6397 30.8568 28.1395C30.8568 26.2296 29.6636 24.6072 28.3286 23.4812C28.7503 23.388 29.1808 23.3409 29.6126 23.3406ZM12.1936 23.3406C12.6391 23.3422 13.0671 23.3891 13.4777 23.4812C12.1439 24.6072 10.9494 26.2296 10.9494 28.1395C10.9494 28.6397 11.034 29.1063 11.1858 29.5355C10.4692 29.4957 9.77988 29.4049 9.19385 29.2282C8.7646 29.0988 8.29429 28.8935 7.91231 28.5439C7.69336 28.3477 7.51825 28.1076 7.3984 27.8392C7.27856 27.5708 7.21668 27.2801 7.2168 26.9861C7.2168 25.8601 8.04544 24.9344 8.84298 24.3782C9.82947 23.7019 10.9976 23.3402 12.1936 23.3406ZM28.9905 15.8753C29.8155 15.8753 30.6067 16.203 31.19 16.7863C31.7733 17.3697 32.1011 18.1609 32.1011 18.9858C32.1011 19.8108 31.7733 20.602 31.19 21.1853C30.6067 21.7686 29.8155 22.0964 28.9905 22.0964C28.1656 22.0964 27.3744 21.7686 26.791 21.1853C26.2077 20.602 25.88 19.8108 25.88 18.9858C25.88 18.1609 26.2077 17.3697 26.791 16.7863C27.3744 16.203 28.1656 15.8753 28.9905 15.8753ZM12.8158 15.8753C13.6407 15.8753 14.4319 16.203 15.0152 16.7863C15.5986 17.3697 15.9263 18.1609 15.9263 18.9858C15.9263 19.8108 15.5986 20.602 15.0152 21.1853C14.4319 21.7686 13.6407 22.0964 12.8158 22.0964C11.9908 22.0964 11.1996 21.7686 10.6163 21.1853C10.0329 20.602 9.70522 19.8108 9.70522 18.9858C9.70522 18.1609 10.0329 17.3697 10.6163 16.7863C11.1996 16.203 11.9908 15.8753 12.8158 15.8753ZM20.9031 10.8984C22.2231 10.8984 23.489 11.4228 24.4223 12.3561C25.3556 13.2895 25.88 14.5553 25.88 15.8753C25.88 17.1952 25.3556 18.4611 24.4223 19.3945C23.489 20.3278 22.2231 20.8521 20.9031 20.8521C19.5832 20.8521 18.3173 20.3278 17.384 19.3945C16.4506 18.4611 15.9263 17.1952 15.9263 15.8753C15.9263 14.5553 16.4506 13.2895 17.384 12.3561C18.3173 11.4228 19.5832 10.8984 20.9031 10.8984Z"
                      fill="#EDEDED"
                    />
                  </svg>
                </div>
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
                <div>
                  <svg
                    width="43"
                    height="43"
                    viewBox="0 0 43 43"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="43" height="43" rx="21.5" fill="#17215E" />
                    <path
                      d="M20.9031 22.0964C23.2335 22.0964 25.345 22.8678 26.894 23.9465C28.3659 24.973 29.6126 26.4984 29.6126 28.1395C29.6126 29.0403 29.2282 29.7868 28.6222 30.3418C28.0524 30.8656 27.3083 31.2052 26.5419 31.4367C25.0103 31.9008 22.9934 32.0501 20.9031 32.0501C18.8129 32.0501 16.796 31.9008 15.2644 31.4367C14.4979 31.2052 13.7539 30.8656 13.1828 30.3418C12.5794 29.7881 12.1936 29.0416 12.1936 28.1407C12.1936 26.4996 13.4403 24.9742 14.9123 23.9477C16.4613 22.8678 18.5727 22.0964 20.9031 22.0964ZM29.6126 23.3406C30.9116 23.3406 32.0911 23.7698 32.9633 24.377C33.7596 24.9332 34.5895 25.8576 34.5895 26.9849C34.5895 27.6281 34.3095 28.1619 33.8927 28.5439C33.512 28.8935 33.0417 29.0988 32.6124 29.2282C32.0276 29.4049 31.3371 29.4957 30.6204 29.5355C30.7722 29.1063 30.8568 28.6397 30.8568 28.1395C30.8568 26.2296 29.6636 24.6072 28.3286 23.4812C28.7503 23.388 29.1808 23.3409 29.6126 23.3406ZM12.1936 23.3406C12.6391 23.3422 13.0671 23.3891 13.4777 23.4812C12.1439 24.6072 10.9494 26.2296 10.9494 28.1395C10.9494 28.6397 11.034 29.1063 11.1858 29.5355C10.4692 29.4957 9.77988 29.4049 9.19385 29.2282C8.7646 29.0988 8.29429 28.8935 7.91231 28.5439C7.69336 28.3477 7.51825 28.1076 7.3984 27.8392C7.27856 27.5708 7.21668 27.2801 7.2168 26.9861C7.2168 25.8601 8.04544 24.9344 8.84298 24.3782C9.82947 23.7019 10.9976 23.3402 12.1936 23.3406ZM28.9905 15.8753C29.8155 15.8753 30.6067 16.203 31.19 16.7863C31.7733 17.3697 32.1011 18.1609 32.1011 18.9858C32.1011 19.8108 31.7733 20.602 31.19 21.1853C30.6067 21.7686 29.8155 22.0964 28.9905 22.0964C28.1656 22.0964 27.3744 21.7686 26.791 21.1853C26.2077 20.602 25.88 19.8108 25.88 18.9858C25.88 18.1609 26.2077 17.3697 26.791 16.7863C27.3744 16.203 28.1656 15.8753 28.9905 15.8753ZM12.8158 15.8753C13.6407 15.8753 14.4319 16.203 15.0152 16.7863C15.5986 17.3697 15.9263 18.1609 15.9263 18.9858C15.9263 19.8108 15.5986 20.602 15.0152 21.1853C14.4319 21.7686 13.6407 22.0964 12.8158 22.0964C11.9908 22.0964 11.1996 21.7686 10.6163 21.1853C10.0329 20.602 9.70522 19.8108 9.70522 18.9858C9.70522 18.1609 10.0329 17.3697 10.6163 16.7863C11.1996 16.203 11.9908 15.8753 12.8158 15.8753ZM20.9031 10.8984C22.2231 10.8984 23.489 11.4228 24.4223 12.3561C25.3556 13.2895 25.88 14.5553 25.88 15.8753C25.88 17.1952 25.3556 18.4611 24.4223 19.3945C23.489 20.3278 22.2231 20.8521 20.9031 20.8521C19.5832 20.8521 18.3173 20.3278 17.384 19.3945C16.4506 18.4611 15.9263 17.1952 15.9263 15.8753C15.9263 14.5553 16.4506 13.2895 17.384 12.3561C18.3173 11.4228 19.5832 10.8984 20.9031 10.8984Z"
                      fill="#EDEDED"
                    />
                  </svg>
                </div>
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
                <div>
                  <svg
                    width="43"
                    height="43"
                    viewBox="0 0 43 43"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="43" height="43" rx="21.5" fill="#17215E" />
                    <path
                      d="M20.9031 22.0964C23.2335 22.0964 25.345 22.8678 26.894 23.9465C28.3659 24.973 29.6126 26.4984 29.6126 28.1395C29.6126 29.0403 29.2282 29.7868 28.6222 30.3418C28.0524 30.8656 27.3083 31.2052 26.5419 31.4367C25.0103 31.9008 22.9934 32.0501 20.9031 32.0501C18.8129 32.0501 16.796 31.9008 15.2644 31.4367C14.4979 31.2052 13.7539 30.8656 13.1828 30.3418C12.5794 29.7881 12.1936 29.0416 12.1936 28.1407C12.1936 26.4996 13.4403 24.9742 14.9123 23.9477C16.4613 22.8678 18.5727 22.0964 20.9031 22.0964ZM29.6126 23.3406C30.9116 23.3406 32.0911 23.7698 32.9633 24.377C33.7596 24.9332 34.5895 25.8576 34.5895 26.9849C34.5895 27.6281 34.3095 28.1619 33.8927 28.5439C33.512 28.8935 33.0417 29.0988 32.6124 29.2282C32.0276 29.4049 31.3371 29.4957 30.6204 29.5355C30.7722 29.1063 30.8568 28.6397 30.8568 28.1395C30.8568 26.2296 29.6636 24.6072 28.3286 23.4812C28.7503 23.388 29.1808 23.3409 29.6126 23.3406ZM12.1936 23.3406C12.6391 23.3422 13.0671 23.3891 13.4777 23.4812C12.1439 24.6072 10.9494 26.2296 10.9494 28.1395C10.9494 28.6397 11.034 29.1063 11.1858 29.5355C10.4692 29.4957 9.77988 29.4049 9.19385 29.2282C8.7646 29.0988 8.29429 28.8935 7.91231 28.5439C7.69336 28.3477 7.51825 28.1076 7.3984 27.8392C7.27856 27.5708 7.21668 27.2801 7.2168 26.9861C7.2168 25.8601 8.04544 24.9344 8.84298 24.3782C9.82947 23.7019 10.9976 23.3402 12.1936 23.3406ZM28.9905 15.8753C29.8155 15.8753 30.6067 16.203 31.19 16.7863C31.7733 17.3697 32.1011 18.1609 32.1011 18.9858C32.1011 19.8108 31.7733 20.602 31.19 21.1853C30.6067 21.7686 29.8155 22.0964 28.9905 22.0964C28.1656 22.0964 27.3744 21.7686 26.791 21.1853C26.2077 20.602 25.88 19.8108 25.88 18.9858C25.88 18.1609 26.2077 17.3697 26.791 16.7863C27.3744 16.203 28.1656 15.8753 28.9905 15.8753ZM12.8158 15.8753C13.6407 15.8753 14.4319 16.203 15.0152 16.7863C15.5986 17.3697 15.9263 18.1609 15.9263 18.9858C15.9263 19.8108 15.5986 20.602 15.0152 21.1853C14.4319 21.7686 13.6407 22.0964 12.8158 22.0964C11.9908 22.0964 11.1996 21.7686 10.6163 21.1853C10.0329 20.602 9.70522 19.8108 9.70522 18.9858C9.70522 18.1609 10.0329 17.3697 10.6163 16.7863C11.1996 16.203 11.9908 15.8753 12.8158 15.8753ZM20.9031 10.8984C22.2231 10.8984 23.489 11.4228 24.4223 12.3561C25.3556 13.2895 25.88 14.5553 25.88 15.8753C25.88 17.1952 25.3556 18.4611 24.4223 19.3945C23.489 20.3278 22.2231 20.8521 20.9031 20.8521C19.5832 20.8521 18.3173 20.3278 17.384 19.3945C16.4506 18.4611 15.9263 17.1952 15.9263 15.8753C15.9263 14.5553 16.4506 13.2895 17.384 12.3561C18.3173 11.4228 19.5832 10.8984 20.9031 10.8984Z"
                      fill="#EDEDED"
                    />
                  </svg>
                </div>
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
                <div className="searchiconsvgpayroll">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 30 30"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21.1158 21.15L24.9658 25M23.8546 14.4763C23.8546 19.71 19.6258 23.9525 14.4108 23.9525C9.19457 23.9525 4.96582 19.71 4.96582 14.4775C4.96582 9.24125 9.19457 5 14.4096 5C19.6258 5 23.8546 9.2425 23.8546 14.4763Z"
                      stroke="#17215E"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="lsoi34545545">
                <button
                  className="sharetoexportbutton"
                  onClick={handleSendAllEmployees}
                >
                  PayRun
                </button>
                <div className="shareiicontorxpoort">
                  {/* <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 20C14.1667 20 13.4583 19.7083 12.875 19.125C12.2917 18.5417 12 17.8333 12 17C12 16.8833 12.0083 16.7623 12.025 16.637C12.0417 16.5117 12.0667 16.3993 12.1 16.3L5.05 12.2C4.76667 12.45 4.45 12.646 4.1 12.788C3.75 12.93 3.38333 13.0007 3 13C2.16667 13 1.45833 12.7083 0.875 12.125C0.291667 11.5417 0 10.8333 0 10C0 9.16667 0.291667 8.45833 0.875 7.875C1.45833 7.29167 2.16667 7 3 7C3.38333 7 3.75 7.071 4.1 7.213C4.45 7.355 4.76667 7.55067 5.05 7.8L12.1 3.7C12.0667 3.6 12.0417 3.48767 12.025 3.363C12.0083 3.23833 12 3.11733 12 3C12 2.16667 12.2917 1.45833 12.875 0.875C13.4583 0.291667 14.1667 0 15 0C15.8333 0 16.5417 0.291667 17.125 0.875C17.7083 1.45833 18 2.16667 18 3C18 3.83333 17.7083 4.54167 17.125 5.125C16.5417 5.70833 15.8333 6 15 6C14.6167 6 14.25 5.92933 13.9 5.788C13.55 5.64667 13.2333 5.45067 12.95 5.2L5.9 9.3C5.93333 9.4 5.95833 9.51267 5.975 9.638C5.99167 9.76333 6 9.884 6 10C6 10.116 5.99167 10.237 5.975 10.363C5.95833 10.489 5.93333 10.6013 5.9 10.7L12.95 14.8C13.2333 14.55 13.55 14.3543 13.9 14.213C14.25 14.0717 14.6167 14.0007 15 14C15.8333 14 16.5417 14.2917 17.125 14.875C17.7083 15.4583 18 16.1667 18 17C18 17.8333 17.7083 18.5417 17.125 19.125C16.5417 19.7083 15.8333 20 15 20Z"
                      fill="white"
                    />
                  </svg> */}
                </div>
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
                      alt={emp.empName || "Employee"}
                      onError={(e) => {
                        e.target.onerror = null; // prevent infinite loop
                        e.target.src = profileImage; // fallback
                      }}
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
                    <button
                      className="pay-slip"
                      onClick={() => sendEmployeeData(emp)}
                    >
                      {" "}
                      pay slip{" "}
                    </button>
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
