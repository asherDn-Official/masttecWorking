import React, { useCallback, useEffect, useState } from "react";
import "../CSS/PayrollCSS.css";
import url from "../Components/global";
import axios from "axios";
import profileImage from "../assets/images/profile.png";

export default function PayrollPage() {
  const [employee, setEmployee] = useState([]);
  const [originalEmployeeData, setOriginalEmployeeData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [holidayList, setHolidayList] = useState();
  const [searchQuery, setSearchQuery] = useState("");
  const [modifiedEmployees, setModifiedEmployees] = useState({});
  const [isSendingPayslips, setIsSendingPayslips] = useState(false);
  const [emailStatus, setEmailStatus] = useState({});

  const handleMonth = (e) => {
    setSelectedMonth(e.target.value);
  };

  const searchfilter = async (e) => {
    e.preventDefault();
    if (searchQuery) {
      setEmployee((prevState) =>
        prevState.filter((emp) => {
          return (
            emp.employeeName
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            emp.employeeId.toString().includes(searchQuery)
          );
        })
      );
    } else {
      setEmployee(originalEmployeeData);
    }
  };

  const handleMonthChange = (event) => {
    const selectedMonthValue = parseInt(event.target.value);
    const filteredData = filterRecordsByMonth(
      attendanceData,
      selectedYear,
      selectedMonthValue
    );
    fetchEmployee(filteredData);
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

  // const fetchAttendance = async () => {
  //   setIsLoading(true);
  //   try {
  //     const response = await axios.get(`${url}/v1/api/attendance`);
  //     setAttendanceData(response.data);
  //   } catch (error) {
  //     handleError("Error fetching attendance data.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${url}/v1/api/holiday/${selectedYear}`);
      setHolidayList(response.data.holidays);
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
      const totalOvertimeHours = {};
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
        const salaryPerHr = Math.round(emp.salary / (30 * 8)) || 0;
        const basicSalary = Math.round(salaryPerHr * presentDays * 8) / 2 || 0;
        const houseRent = Math.round(salaryPerHr * presentDays * 8) / 4 || 0;
        let totalOT1Minutes = 0;
        let totalOT2Minutes = 0;
        attendanceRecord?.records.forEach((record) => {
          const punchIn = new Date(record.punchIn);
          const punchOut = new Date(record.punchOut);
          if (punchIn && punchOut && punchOut > punchIn) {
            const diffInMinutes = Math.floor(
              (punchOut - punchIn) / (1000 * 60)
            );
            const excessMinutes = Math.max(0, diffInMinutes - 8 * 60);
            if (
              record.status === "Sunday" ||
              record.date.includes(holidayList)
            ) {
              totalOT2Minutes += diffInMinutes;
            } else if (record.status === "Present") {
              totalOT1Minutes += excessMinutes;
            }
          }
        });
        const totalOT1Hours = Math.floor(totalOT1Minutes / 60);
        const totalOT1RemainderMinutes = totalOT1Minutes % 60;
        const totalOT2Hours = Math.floor(totalOT2Minutes / 60);
        const totalOT2RemainderMinutes = totalOT2Minutes % 60;
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
        const ot1Decimal = totalOT1Hours + totalOT1RemainderMinutes / 60;
        const ot2Decimal = totalOT2Hours + totalOT2RemainderMinutes / 60;
        const ot1Amount = Math.round(ot1Decimal * salaryPerHr * 1.25);
        const ot2Amount = Math.round(ot2Decimal * salaryPerHr * 1.75);
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
          employeeOT1Hours: ot1Decimal || 0,
          employeeOT1Amount: ot1Amount || 0,
          employeeOT2Hours: ot2Decimal || 0,
          employeeOT2Amount: ot2Amount || 0,
          salary: emp.salary || 0,
          employeeHoldOT: emp.employeeHoldOT || 0,
          payOn5th: payOn5th > 0 ? payOn5th : 0 || 0,
          payOn20th: payOn20th > 0 ? payOn20th : 0 || 0,
          empSalary: empSalary > 0 ? empSalary : 0 || 0,
          empBalance: emp.empBalance || 0,
          totalOT1: `${totalOT1Hours} hrs ${totalOT1RemainderMinutes} mins`,
          totalOT2: `${totalOT2Hours} hrs ${totalOT2RemainderMinutes} mins`,
          grossSalary,
          TotalDeductions,
        };
      });
      setEmployee(mappedEmployeeData);
      setOriginalEmployeeData(mappedEmployeeData);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setError("Error fetching employee data.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const fetchPayrollData = useCallback(async (year, month) => {
    try {
      setIsLoading(true);
      const monthStr = String(month).padStart(2, "0");
      const apiUrl = `${url}/v1/api/payroll/month/${monthStr}/${year}`;
      const response = await axios.get(apiUrl);
      if (response.data.success && Array.isArray(response.data.data)) {
        const mappedData = response.data.data.map((item) => {
          const emp = item.employeeDetails || {};
          const payrun = (item.payrunHistory && item.payrunHistory[0]) || {};
          return {
            employeeId: item.employeeId,
            employeeName: emp.employeeName || "N/A",
            employeePicture: emp.employeePicture
              ? `${url}${emp.employeePicture}`
              : profileImage,
            employeeDepartment: emp.department || "N/A",
            employeePresentDays: payrun.present || "0",
            employeeAbsentDays: payrun.absent || "0",
            employeeBasicSalary: payrun.basic || "0",
            employeeHouseRent: payrun.houseRent || "0",
            employeeEPF: payrun.EPF || "0",
            employeeESIC: payrun.ESIC || "0",
            employeeIncentives: payrun.incentives || "0",
            employeeAllowances: payrun.allowances || "0",
            employeeAdvance: payrun.advance || "0",
            employeePLoss: payrun.paymentLossDays || "0",
            employeePLossAmount: payrun.paymentLossAmount || "0",
            employeeOT1Hours: payrun.OT1Hours || "0",
            employeeOT1Amount: payrun.OT1Amount || "0",
            employeeOT2Hours: payrun.OT2Hours || "0",
            employeeOT2Amount: payrun.OT2Amount || "0",
            employeeHoldOT: payrun.holdOT || "0",
            payOn5th: payrun.payOn5th || "0",
            payOn20th: payrun.payOn20th || "0",
            empSalary: payrun.payableSalary || "0",
            empBalance: payrun.balance || "0",
          };
        });
        setEmployee(mappedData);
        setOriginalEmployeeData(mappedData);
      } else {
        setEmployee([]);
        setOriginalEmployeeData([]);
      }
    } catch (error) {
      console.error("Error fetching payroll data:", error);
      handleError("Failed to fetch payroll data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchPayrollData(selectedYear, selectedMonth),
          // fetchAttendance(),
          fetchHolidays(),
        ]);
      } catch (err) {
        console.error("Error fetching data:", err);
        handleError("Failed to fetch payroll, attendance, or holidays data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedYear, selectedMonth, fetchPayrollData]);

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
          const calculatedFields = calculateFields(updatedEmp);
          setModifiedEmployees((prev) => ({
            ...prev,
            [id]: true,
          }));
          return { ...updatedEmp, ...calculatedFields };
        }
        return emp;
      })
    );
  };

  const handleUpdateEmployee = async (employeeId) => {
    try {
      const employeeToUpdate = employee.find(
        (emp) => emp.employeeId === employeeId
      );
      if (!employeeToUpdate) {
        alert("Employee not found");
        return;
      }
      const payload = {
        payrunHistory: [
          {
            salaryMonth: selectedMonth.toString(),
            salaryYear: selectedYear.toString(),
            present: employeeToUpdate.employeePresentDays,
            absent: employeeToUpdate.employeeAbsentDays,
            basic: employeeToUpdate.employeeBasicSalary,
            houseRent: employeeToUpdate.employeeHouseRent,
            EPF: employeeToUpdate.employeeEPF,
            ESIC: employeeToUpdate.employeeESIC,
            incentives: employeeToUpdate.employeeIncentives,
            allowances: employeeToUpdate.employeeAllowances,
            advance: employeeToUpdate.employeeAdvance,
            paymentLossDays: employeeToUpdate.employeePLoss,
            paymentLossAmount: employeeToUpdate.employeePLossAmount,
            OT1Hours: employeeToUpdate.employeeOT1Hours,
            OT1Amount: employeeToUpdate.employeeOT1Amount,
            OT2Hours: employeeToUpdate.employeeOT2Hours,
            OT2Amount: employeeToUpdate.employeeOT2Amount,
            holdOT: employeeToUpdate.employeeHoldOT,
            payableSalary: employeeToUpdate.empSalary,
            balance: employeeToUpdate.empBalance,
            payOn5th: employeeToUpdate.payOn5th,
            payOn20th: employeeToUpdate.payOn20th,
          },
        ],
      };
      const response = await axios.put(
        `${url}/v1/api/payroll/${employeeId}`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.data.success) {
        alert("Payroll record updated successfully!");
        setModifiedEmployees((prev) => {
          const newState = { ...prev };
          delete newState[employeeId];
          return newState;
        });
      } else {
        alert(response.data.message || "Failed to update payroll record");
      }
    } catch (error) {
      console.error("Error updating payroll record:", error);
      const errorMsg =
        error.response?.data?.message ||
        "An error occurred while updating payroll record.";
      alert(errorMsg);
    }
  };

  const sendEmployeePayslip = async (employeeId) => {
    try {
      setEmailStatus((prev) => ({
        ...prev,
        [employeeId]: { status: "sending" },
      }));

      const payload = {
        salaryMonth: String(selectedMonth).padStart(2, "0"),
        salaryYear: selectedYear.toString(),
      };
      const response = await axios.put(
        `${url}/v1/api/payroll/send-payslip-email/${employeeId}`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data.success) {
        setEmailStatus((prev) => ({
          ...prev,
          [employeeId]: {
            status: "success",
            message: `Payslip sent successfully to ${response.data.data.email}`,
          },
        }));
      } else {
        setEmailStatus((prev) => ({
          ...prev,
          [employeeId]: {
            status: "failed",
            message: response.data.message || "Failed to send payslip",
          },
        }));
      }
    } catch (error) {
      console.error("Error sending payslip:", error);
      setEmailStatus((prev) => ({
        ...prev,
        [employeeId]: {
          status: "failed",
          message:
            error.response?.data?.message ||
            "An error occurred while sending payslip.",
        },
      }));
    }
  };

  const handleSendAllEmployees = async (e) => {
    e.preventDefault();
    try {
      if (!selectedMonth || !selectedYear) {
        alert("Please select both month and year.");
        return;
      }
      setIsSendingPayslips(true);

      // Initialize all statuses to pending
      const initialStatuses = {};
      employee.forEach((emp) => {
        initialStatuses[emp.employeeId] = { status: "pending" };
      });
      setEmailStatus(initialStatuses);

      const employeeIds = employee.map((emp) => emp.employeeId);
      const payload = {
        employeeIds,
        salaryMonth: selectedMonth.toString().padStart(2, "0"),
        salaryYear: selectedYear.toString(),
      };
      const response = await axios.post(
        `${url}/v1/api/payroll/send-bulk-payslip-emails`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.data.success) {
        const { successful, failed } = response.data.data;
        const newEmailStatus = {};

        // Set status for successful emails
        successful.forEach((emp) => {
          newEmailStatus[emp.employeeId] = {
            status: "success",
            message: `Sent to ${emp.email}`,
          };
        });

        // Set status for failed emails
        failed.forEach((emp) => {
          newEmailStatus[emp.employeeId] = {
            status: "failed",
            message: emp.error || "Email address not found",
          };
        });

        setEmailStatus((prev) => ({ ...prev, ...newEmailStatus }));

        if (failed.length > 0) {
          alert(
            `Bulk payslip sending completed. Sent: ${successful.length}, Failed: ${failed.length}`
          );
        } else {
          alert(
            `Successfully sent payslips to all ${successful.length} employees!`
          );
        }
      } else {
        alert(response.data.message || "Failed to send bulk payslips");
      }
    } catch (error) {
      console.error("Error sending bulk payslips:", error);
      const errorMsg =
        error.response?.data?.message ||
        "An error occurred while sending bulk payslips.";
      alert(errorMsg);
    } finally {
      setIsSendingPayslips(false);
    }
  };

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
  ];

  const getStatusBadge = (employeeId) => {
    const statusInfo = emailStatus[employeeId];

    if (!statusInfo) {
      return null;
    }

    switch (statusInfo.status) {
      case "pending":
        return (
          <div className="status-badge status-pending">Payslip: Pending</div>
        );
      case "sending":
        return (
          <div className="status-badge status-sending">Sending payslip...</div>
        );
      case "success":
        return (
          <div
            className="status-badge status-success"
            title={statusInfo.message}
          >
            Payslip: Sent
          </div>
        );
      case "failed":
        return (
          <div
            className="status-badge status-failed"
            title={statusInfo.message}
          >
            Payslip: Failed
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="ksierperki4545454">
        <div className="lpieoroeroerrere">
          <div className="psioo5o4o54io5k5">Payroll Details</div>

          <div className="header-section">
            <div>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  handleMonth(e);
                  setSelectedMonth(e.target.value);
                  handleMonthChange(e);
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
                className="selection-option"
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
                  disabled={isSendingPayslips}
                >
                  {isSendingPayslips ? "Sending..." : "PayRun"}
                </button>
                <div className="shareiicontorxpoort"></div>
              </div>
            </div>
          </div>
          {employee.map((emp, index) => (
            <div className="flexofjo4546656" key={emp.employeeId || index}>
              <div className="ksiskfdk54">
                <div>
                  <img
                    src={emp.employeePicture}
                    alt={emp.employeeName || "Employee"}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = profileImage;
                    }}
                    className="employee-image"
                  />
                </div>
                <div className="nameofthejkd">{emp.employeeName}</div>
                <div className="nameofthejkd">
                  {emp.employeeDesignation || emp.designation || "N/A"}
                </div>
                <div className="nameofthejkd">Emp Id - {emp.employeeId}</div>
                <div className="nameofthejkd">Salary - ₹ {emp.salary || 0}</div>
                <div className="nameofthejkd">
                  Salary/Hr - ₹ {emp.employeePerHrSalary || 0}
                </div>
                {/* Status badge */}
                {getStatusBadge(emp.employeeId)}
                <div className="nameofthejkd">
                  <button
                    className="pay-slip"
                    onClick={() => sendEmployeePayslip(emp.employeeId)}
                    disabled={emailStatus[emp.employeeId]?.status === "sending"}
                  >
                    {emailStatus[emp.employeeId]?.status === "sending"
                      ? "Sending..."
                      : "Pay Slip"}
                  </button>

                  {modifiedEmployees[emp.employeeId] && (
                    <button
                      className="update-button"
                      onClick={() => handleUpdateEmployee(emp.employeeId)}
                    >
                      Update
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="inputfLEXSHSH">
                  {fields.map(({ label, field }) => (
                    <div
                      className="onekdi4545"
                      key={`${emp.employeeId}-${field}`}
                    >
                      <div>
                        <label className="lABLETTITLEII">{label}</label>
                      </div>
                      <input
                        onChange={(e) => handleChange(e, emp.employeeId, field)}
                        className="inputpayroll"
                        type="number"
                        value={emp[field] || 0}
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
