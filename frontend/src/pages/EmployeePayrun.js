import React, { useCallback, useEffect, useState } from "react";
import "../CSS/PayrollCSS.css";
import axios from "axios";
import profileImage from "../assets/images/profile.png";

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

export default function EmployeePayroll() {
  const [employee, setEmployee] = useState([]);
  const [originalEmployeeData, setOriginalEmployeeData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [modifiedEmployees, setModifiedEmployees] = useState({});
  const [isSendingPayslips, setIsSendingPayslips] = useState(false);
  const [emailStatus, setEmailStatus] = useState({});
  const [viewMode, setViewMode] = useState("card");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [customerFilter, setCustomerFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [toasts, setToasts] = useState([]);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });

  const API_BASE = "https://attendance.masttecmoulds.com/api";

  // Add a toast message
  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  // Remove a toast message
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Filter employees based on search query
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

  // Calculate salary components
  const calculateSalary = (employeeData, attendanceRecords = []) => {
    const monthlySalary = Number(employeeData.salary) || 0;
    const salaryPerDay = monthlySalary / 30;
    const salaryPerHour = monthlySalary / (30 * 8);
    
    // Get values from payrun if available, otherwise calculate
    const presentDays = Number(employeeData.present) || 0;
    const absentDays = Number(employeeData.absent) || 0;
    const OT1Hours = Number(employeeData.OT1Hours) || 0;
    const OT2Hours = Number(employeeData.OT2Hours) || 0;
    const paymentLossDays = Number(employeeData.paymentLossDays) || 0;
    const advance = Number(employeeData.advance) || 0;
    const incentives = Number(employeeData.incentives) || 0;
    const allowances = Number(employeeData.allowances) || 0;
    
    // Calculate late hours from attendance records
    let totalLateHours = 0;
    if (attendanceRecords && Array.isArray(attendanceRecords)) {
      const expectedStartTime = 9 * 60; // 9:00 AM in minutes
      
      attendanceRecords.forEach(record => {
        if (record.punchIn && record.status === "Present") {
          const punchInTime = new Date(record.punchIn);
          const minutes = punchInTime.getHours() * 60 + punchInTime.getMinutes();
          
          if (minutes > expectedStartTime) {
            totalLateHours += (minutes - expectedStartTime) / 60;
          }
        }
      });
      totalLateHours = Number(totalLateHours.toFixed(2));
    } else {
      totalLateHours = Number(employeeData.totalLateHours) || 0;
    }
    
    // Calculate components
    const basic = (monthlySalary / 2) * (presentDays / (presentDays + absentDays));
    const houseRent = (monthlySalary / 4) * (presentDays / (presentDays + absentDays));
    const EPF = basic * 0.12; // 12% of basic
    const ESIC = monthlySalary <= 21000 ? monthlySalary * 0.0075 : 0; // 0.75% if salary <= 21,000
    
    // OT calculations
    const OT1Amount = OT1Hours * salaryPerHour * 1.25;
    const OT2Amount = OT2Hours * salaryPerHour * 1.75;
    
    // Deductions
    const lateDeduction = totalLateHours * salaryPerHour;
    const paymentLossAmount = paymentLossDays * salaryPerDay;
    
    // Total calculations
    const totalDeductions = EPF + ESIC + lateDeduction + paymentLossAmount;
    const totalAdditions = OT1Amount + OT2Amount + incentives + allowances;
    
    // Salary distribution
    const payOn5th = basic + houseRent + incentives + allowances - EPF - ESIC - lateDeduction - paymentLossAmount;
    const payOn20th = OT1Amount + OT2Amount;
    const netSalary = Math.max(0, payOn5th + payOn20th - advance);

    return {
      employeePresentDays: presentDays,
      employeeAbsentDays: absentDays,
      employeeBasicSalary: Math.round(basic),
      employeeHouseRent: Math.round(houseRent),
      employeeEPF: Math.round(EPF),
      employeeESIC: Math.round(ESIC),
      employeeIncentives: incentives,
      employeeAllowances: allowances,
      employeeAdvance: advance,
      employeePLoss: paymentLossDays,
      employeePLossAmount: Math.round(paymentLossAmount),
      employeeOT1Hours: OT1Hours,
      employeeOT1Amount: Math.round(OT1Amount),
      employeeOT2Hours: OT2Hours,
      employeeOT2Amount: Math.round(OT2Amount),
      employeeLateHours: totalLateHours,
      employeeLateDeduction: Math.round(lateDeduction),
      employeeHoldOT: Number(employeeData.holdOT) || 0,
      payOn5th: Math.round(Math.max(0, payOn5th)),
      payOn20th: Math.round(Math.max(0, payOn20th)),
      empSalary: Math.round(netSalary),
      empBalance: Number(employeeData.balance) || 0,
    };
  };

  const fetchPayrollData = useCallback(async (year, month) => {
    try {
      setIsLoading(true);
      const monthStr = String(month).padStart(2, "0");
      
      // Fetch payroll data
      const payrollResponse = await axios.get(
        `${API_BASE}/v1/api/payroll/month/${monthStr}/${year}`
      );
      
      if (payrollResponse.data.success && Array.isArray(payrollResponse.data.data)) {
        // Fetch employee details for additional information
        const empResponse = await axios.get(`${API_BASE}/v1/api/employees`);
        const employeeData = empResponse.data;
        
        const mappedData = payrollResponse.data.data.map((item) => {
          const empDetails = employeeData.find(e => e.employeeId === item.employeeId) || {};
          const payrun = (item.payrunHistory && item.payrunHistory[0]) || {};
          
          // Calculate salary components
          const salaryData = calculateSalary(
            { ...empDetails, ...payrun }, 
            item.attendanceRecords
          );
          
          return {
            employeeId: item.employeeId,
            employeeName: item.employeeDetails?.employeeName || empDetails.employeeName || "N/A",
            employeePicture: empDetails.employeePicture
              ? `${API_BASE}${empDetails.employeePicture}`
              : profileImage,
            employeeDesignation: empDetails.designation || "N/A",
            employeeEmail: empDetails.mailId || "N/A",
            employeeDepartment: item.employeeDetails?.department || empDetails.department || "N/A",
            employeeMobileNumber: empDetails.mobileNumber || "N/A",
            employeeAadhaarNo: empDetails.aadhaarNo || "N/A",
            bankName: empDetails.bankName || "N/A",
            bankBranch: empDetails.bankBranch || "N/A",
            bankAccountNumber: empDetails.bankAccountNumber || "N/A",
            bankIFSCCode: empDetails.bankIFSCCode || "N/A",
            employeePANNumber: empDetails.PANNumber || "N/A",
            employeeESICId: empDetails.esicId || "N/A",
            employeeEPFId: empDetails.epfId || "N/A",
            employeeUANNo: empDetails.UANNo || "N/A",
            salary: empDetails.salary || 0,
            ...salaryData
          };
        });
        
        setEmployee(mappedData);
        setOriginalEmployeeData(mappedData);
        setSelectedEmployees([]);
        setSelectAll(false);
      } else {
        setEmployee([]);
        setOriginalEmployeeData([]);
      }
    } catch (error) {
      console.error("Error fetching payroll data:", error);
      addToast("Failed to fetch payroll data. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayrollData(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, fetchPayrollData]);

  const handleChange = (e, id, field) => {
    const { value } = e.target;
    setEmployee((prevData) =>
      prevData.map((emp) => {
        if (emp.employeeId === id) {
          const updatedEmp = { ...emp, [field]: value };
          
          // Recalculate salary when relevant fields change
          if (["employeePresentDays", "employeeAbsentDays", "employeeOT1Hours", 
               "employeeOT2Hours", "employeeAdvance", "employeeIncentives", 
               "employeeAllowances", "employeePLoss"].includes(field)) {
            const salaryData = calculateSalary(updatedEmp);
            return { ...updatedEmp, ...salaryData };
          }
          
          setModifiedEmployees((prev) => ({
            ...prev,
            [id]: true,
          }));
          return updatedEmp;
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
        addToast("Employee not found", "error");
        return;
      }
      
      const payload = {
        payrunHistory: [
          {
            salaryMonth: String(selectedMonth).padStart(2, "0"),
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
            totalLateHours: employeeToUpdate.employeeLateHours,
            holdOT: employeeToUpdate.employeeHoldOT,
            payableSalary: employeeToUpdate.empSalary,
            balance: employeeToUpdate.empBalance,
            payOn5th: employeeToUpdate.payOn5th,
            payOn20th: employeeToUpdate.payOn20th,
          },
        ],
      };
      
      const response = await axios.put(
        `${API_BASE}/v1/api/payroll/${employeeId}`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      
      if (response.data.success) {
        addToast("Payroll record updated successfully!", "success");
        setModifiedEmployees((prev) => {
          const newState = { ...prev };
          delete newState[employeeId];
          return newState;
        });
      } else {
        addToast(response.data.message || "Failed to update payroll record", "error");
      }
    } catch (error) {
      console.error("Error updating payroll record:", error);
      const errorMsg =
        error.response?.data?.message ||
        "An error occurred while updating payroll record.";
      addToast(errorMsg, "error");
    }
  };

  const sendEmployeePayslip = async (employeeId) => {
    try {
      setEmailStatus((prev) => ({
        ...prev,
        [employeeId]: { status: "sending" },
      }));

      const employeeData = employee.find(emp => emp.employeeId === employeeId);
      
      // Check if employee has an email address
      if (!employeeData.employeeEmail || employeeData.employeeEmail === "N/A") {
        setEmailStatus((prev) => ({
          ...prev,
          [employeeId]: {
            status: "failed",
            message: "Email address not found for this employee",
          },
        }));
        addToast(`Email address not found for ${employeeData.employeeName}`, "error");
        return;
      }

      const payload = {
        salaryMonth: String(selectedMonth).padStart(2, "0"),
        salaryYear: selectedYear.toString(),
      };
      
      const response = await axios.put(
        `${API_BASE}/v1/api/payroll/send-payslip-email/${employeeId}`,
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
        addToast(`Payslip sent to ${employeeData.employeeName}`, "success");
      } else {
        setEmailStatus((prev) => ({
          ...prev,
          [employeeId]: {
            status: "failed",
            message: response.data.message || "Failed to send payslip",
          },
        }));
        addToast(`Failed to send payslip to ${employeeData.employeeName}: ${response.data.message}`, "error");
      }
    } catch (error) {
      console.error("Error sending payslip:", error);
      const errorMessage = error.response?.data?.message || "An error occurred while sending payslip.";
      
      setEmailStatus((prev) => ({
        ...prev,
        [employeeId]: {
          status: "failed",
          message: errorMessage,
        },
      }));
      
      const employeeData = employee.find(emp => emp.employeeId === employeeId);
      addToast(`Failed to send payslip to ${employeeData.employeeName}: ${errorMessage}`, "error");
    }
  };

  const handleSendAllEmployees = async (e) => {
    e.preventDefault();
    try {
      if (!selectedMonth || !selectedYear) {
        addToast("Please select both month and year.", "error");
        return;
      }
      
      setIsSendingPayslips(true);
      setProgress({ sent: 0, total: employee.length });

      // Initialize all statuses to pending
      const initialStatuses = {};
      employee.forEach((emp) => {
        initialStatuses[emp.employeeId] = { status: "pending" };
      });
      setEmailStatus(initialStatuses);

      const employeeIds = employee.map((emp) => emp.employeeId);
      const payload = {
        employeeIds,
        salaryMonth: String(selectedMonth).padStart(2, "0"),
        salaryYear: selectedYear.toString(),
      };
      
      const response = await axios.post(
        `${API_BASE}/v1/api/payroll/send-bulk-payslip-emails`,
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
        setProgress({ sent: successful.length, total: employee.length });

        if (failed.length > 0) {
          addToast(
            `Bulk payslip sending completed. Sent: ${successful.length}, Failed: ${failed.length}`,
            failed.length === employee.length ? "error" : "warning"
          );
        } else {
          addToast(
            `Successfully sent payslips to all ${successful.length} employees!`,
            "success"
          );
        }
      } else {
        addToast(response.data.message || "Failed to send bulk payslips", "error");
      }
    } catch (error) {
      console.error("Error sending bulk payslips:", error);
      const errorMsg =
        error.response?.data?.message ||
        "An error occurred while sending bulk payslips.";
      addToast(errorMsg, "error");
    } finally {
      setIsSendingPayslips(false);
      setProgress({ sent: 0, total: 0 });
    }
  };

  const handleSendSelectedEmployees = async (e) => {
    e.preventDefault();
    if (selectedEmployees.length === 0) {
      addToast("Please select at least one employee to send payslips.", "error");
      return;
    }
    
    try {
      setIsSendingPayslips(true);
      setProgress({ sent: 0, total: selectedEmployees.length });

      // Initialize selected statuses to pending
      const initialStatuses = { ...emailStatus };
      selectedEmployees.forEach((id) => {
        initialStatuses[id] = { status: "pending" };
      });
      setEmailStatus(initialStatuses);

      const payload = {
        employeeIds: selectedEmployees,
        salaryMonth: String(selectedMonth).padStart(2, "0"),
        salaryYear: selectedYear.toString(),
      };
      
      const response = await axios.post(
        `${API_BASE}/v1/api/payroll/send-bulk-payslip-emails`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      
      if (response.data.success) {
        const { successful, failed } = response.data.data;
        const newEmailStatus = { ...emailStatus };

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

        setEmailStatus(newEmailStatus);
        setProgress({ sent: successful.length, total: selectedEmployees.length });

        if (failed.length > 0) {
          addToast(
            `Payslip sending completed. Sent: ${successful.length}, Failed: ${failed.length}`,
            failed.length === selectedEmployees.length ? "error" : "warning"
          );
        } else {
          addToast(
            `Successfully sent payslips to all ${successful.length} selected employees!`,
            "success"
          );
        }
      } else {
        addToast(response.data.message || "Failed to send payslips", "error");
      }
    } catch (error) {
      console.error("Error sending payslips:", error);
      const errorMsg =
        error.response?.data?.message ||
        "An error occurred while sending payslips.";
      addToast(errorMsg, "error");
    } finally {
      setIsSendingPayslips(false);
      setProgress({ sent: 0, total: 0 });
    }
  };

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

  // Handle employee selection
  const handleEmployeeSelect = (employeeId) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };

  // Handle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmployees(employee.map(emp => emp.employeeId));
      setSelectAll(true);
    } else {
      setSelectedEmployees([]);
      setSelectAll(false);
    }
  };

  // Filter employees based on status and department
  const filteredEmployees = employee.filter(emp => {
    // Status filter
    const statusMatch = customerFilter === "all" || 
      (customerFilter === "sent" && emailStatus[emp.employeeId]?.status === "success") ||
      (customerFilter === "notSent" && (!emailStatus[emp.employeeId] || emailStatus[emp.employeeId]?.status !== "success"));
    
    // Department filter
    const departmentMatch = departmentFilter === "all" || 
      emp.employeeDepartment === departmentFilter;
    
    return statusMatch && departmentMatch;
  });

  // Get unique departments for filter
  const departments = [...new Set(employee.map(emp => emp.employeeDepartment))].filter(Boolean);

  // Render card view with all data
  const renderCardView = () => (
    <div className="card-view-container">
      {filteredEmployees.map((emp, index) => (
        <div className="employee-card-wide" key={emp.employeeId || index}>
          <div className="card-wide-header">
            <div className="employee-select-checkbox">
              <input
                type="checkbox"
                checked={selectedEmployees.includes(emp.employeeId)}
                onChange={() => handleEmployeeSelect(emp.employeeId)}
              />
            </div>
            <img
              src={emp.employeePicture}
              alt={emp.employeeName || "Employee"}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = profileImage;
              }}
              className="employee-card-image-wide"
            />
            <div className="employee-card-info-wide">
              <h3>{emp.employeeName}</h3>
              <p><strong>ID:</strong> {emp.employeeId}</p>
              <p><strong>Designation:</strong> {emp.employeeDesignation || "N/A"}</p>
              <p><strong>Department:</strong> {emp.employeeDepartment}</p>
              <p><strong>Email:</strong> {emp.employeeEmail}</p>
            </div>
          </div>
          
          <div className="card-wide-content">
            <div className="card-wide-section">
              <h4>Attendance Summary</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span>Present Days:</span>
                  <input
                    type="number"
                    value={emp.employeePresentDays}
                    onChange={(e) => handleChange(e, emp.employeeId, "employeePresentDays")}
                    className="summary-input"
                  />
                </div>
                <div className="summary-item">
                  <span>Absent Days:</span>
                  <input
                    type="number"
                    value={emp.employeeAbsentDays}
                    onChange={(e) => handleChange(e, emp.employeeId, "employeeAbsentDays")}
                    className="summary-input"
                  />
                </div>
                <div className="summary-item">
                  <span>Payment Loss Days:</span>
                  <input
                    type="number"
                    value={emp.employeePLoss}
                    onChange={(e) => handleChange(e, emp.employeeId, "employeePLoss")}
                    className="summary-input"
                  />
                </div>
                <div className="summary-item">
                  <span>Late Hours:</span>
                  <span>{emp.employeeLateHours}</span>
                </div>
              </div>
            </div>
            
            <div className="card-wide-section">
              <h4>Earnings</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span>Basic Salary:</span>
                  <span>₹{emp.employeeBasicSalary}</span>
                </div>
                <div className="summary-item">
                  <span>House Rent:</span>
                  <span>₹{emp.employeeHouseRent}</span>
                </div>
                <div className="summary-item">
                  <span>Incentives:</span>
                  <input
                    type="number"
                    value={emp.employeeIncentives}
                    onChange={(e) => handleChange(e, emp.employeeId, "employeeIncentives")}
                    className="summary-input"
                  />
                </div>
                <div className="summary-item">
                  <span>Allowances:</span>
                  <input
                    type="number"
                    value={emp.employeeAllowances}
                    onChange={(e) => handleChange(e, emp.employeeId, "employeeAllowances")}
                    className="summary-input"
                  />
                </div>
                <div className="summary-item">
                  <span>OT1 Hours:</span>
                  <input
                    type="number"
                    value={emp.employeeOT1Hours}
                    onChange={(e) => handleChange(e, emp.employeeId, "employeeOT1Hours")}
                    className="summary-input"
                  />
                </div>
                <div className="summary-item">
                  <span>OT1 Amount:</span>
                  <span>₹{emp.employeeOT1Amount}</span>
                </div>
                <div className="summary-item">
                  <span>OT2 Hours:</span>
                  <input
                    type="number"
                    value={emp.employeeOT2Hours}
                    onChange={(e) => handleChange(e, emp.employeeId, "employeeOT2Hours")}
                    className="summary-input"
                  />
                </div>
                <div className="summary-item">
                  <span>OT2 Amount:</span>
                  <span>₹{emp.employeeOT2Amount}</span>
                </div>
              </div>
            </div>
            
            <div className="card-wide-section">
              <h4>Deductions</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span>EPF:</span>
                  <span>₹{emp.employeeEPF}</span>
                </div>
                <div className="summary-item">
                  <span>ESIC:</span>
                  <span>₹{emp.employeeESIC}</span>
                </div>
                <div className="summary-item">
                  <span>Late Deduction:</span>
                  <span>₹{emp.employeeLateDeduction}</span>
                </div>
                <div className="summary-item">
                  <span>Payment Loss Amount:</span>
                  <span>₹{emp.employeePLossAmount}</span>
                </div>
                <div className="summary-item">
                  <span>Advance:</span>
                  <input
                    type="number"
                    value={emp.employeeAdvance}
                    onChange={(e) => handleChange(e, emp.employeeId, "employeeAdvance")}
                    className="summary-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="card-wide-section">
              <h4>Salary Distribution</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span>Pay on 5th:</span>
                  <span>₹{emp.payOn5th}</span>
                </div>
                <div className="summary-item">
                  <span>Pay on 20th:</span>
                  <span>₹{emp.payOn20th}</span>
                </div>
                <div className="summary-item highlight">
                  <span>Net Salary:</span>
                  <span>₹{emp.empSalary}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card-wide-footer">
            <div className="status-section">
              {getStatusBadge(emp.employeeId)}
            </div>
            <div className="action-buttons">
              <button
                className="btn-payslip"
                onClick={() => sendEmployeePayslip(emp.employeeId)}
                disabled={emailStatus[emp.employeeId]?.status === "sending"}
              >
                {emailStatus[emp.employeeId]?.status === "sending"
                  ? "Sending..."
                  : "Send Payslip"}
              </button>
              
              {modifiedEmployees[emp.employeeId] && (
                <button
                  className="btn-update"
                  onClick={() => handleUpdateEmployee(emp.employeeId)}
                >
                  Update Changes
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render list view (Excel-like)
  const renderListView = () => (
    <div className="list-view-container">
      <table className="payroll-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
              />
            </th>
            <th>Employee</th>
            <th>Present</th>
            <th>Absent</th>
            <th>Basic</th>
            <th>House Rent</th>
            <th>EPF</th>
            <th>ESIC</th>
            <th>Incentives</th>
            <th>Allowances</th>
            <th>Advance</th>
            <th>OT Hours</th>
            <th>OT Amount</th>
            <th>Late Hours</th>
            <th>Late Deduction</th>
            <th>Net Salary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((emp, index) => (
            <tr key={emp.employeeId || index}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedEmployees.includes(emp.employeeId)}
                  onChange={() => handleEmployeeSelect(emp.employeeId)}
                />
              </td>
              <td className="employee-info-cell">
                <div className="table-employee-info">
                  <img
                    src={emp.employeePicture}
                    alt={emp.employeeName}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = profileImage;
                    }}
                    className="table-employee-image"
                  />
                  <div>
                    <div>{emp.employeeName}</div>
                    <small>{emp.employeeDesignation}</small>
                  </div>
                </div>
              </td>
              <td>
                <input
                  type="number"
                  value={emp.employeePresentDays}
                  onChange={(e) => handleChange(e, emp.employeeId, "employeePresentDays")}
                  className="table-input"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={emp.employeeAbsentDays}
                  onChange={(e) => handleChange(e, emp.employeeId, "employeeAbsentDays")}
                  className="table-input"
                />
              </td>
              <td>₹{emp.employeeBasicSalary}</td>
              <td>₹{emp.employeeHouseRent}</td>
              <td>₹{emp.employeeEPF}</td>
              <td>₹{emp.employeeESIC}</td>
              <td>
                <input
                  type="number"
                  value={emp.employeeIncentives}
                  onChange={(e) => handleChange(e, emp.employeeId, "employeeIncentives")}
                  className="table-input"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={emp.employeeAllowances}
                  onChange={(e) => handleChange(e, emp.employeeId, "employeeAllowances")}
                  className="table-input"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={emp.employeeAdvance}
                  onChange={(e) => handleChange(e, emp.employeeId, "employeeAdvance")}
                  className="table-input"
                />
              </td>
              <td>
                {Number(emp.employeeOT1Hours) + Number(emp.employeeOT2Hours)}
              </td>
              <td>
                ₹{Number(emp.employeeOT1Amount) + Number(emp.employeeOT2Amount)}
              </td>
              <td>{emp.employeeLateHours}</td>
              <td>₹{emp.employeeLateDeduction}</td>
              <td className="net-salary-cell">₹{emp.empSalary}</td>
              <td className="actions-cell">
                <div className="table-actions">
                  <button
                    className="btn-payslip-sm"
                    onClick={() => sendEmployeePayslip(emp.employeeId)}
                    disabled={emailStatus[emp.employeeId]?.status === "sending"}
                    title="Send Payslip"
                  >
                    {emailStatus[emp.employeeId]?.status === "sending" ? "⏳" : "📧"}
                  </button>
                  
                  {modifiedEmployees[emp.employeeId] && (
                    <button
                      className="btn-update-sm"
                      onClick={() => handleUpdateEmployee(emp.employeeId)}
                      title="Update"
                    >
                      💾
                    </button>
                  )}
                </div>
                {getStatusBadge(emp.employeeId)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="payroll-container">
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
      
      <div className="payroll-header">
        <h1>Payroll Management</h1>
        
        <div className="controls-row">
          <div className="date-filters">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="month-select"
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
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="year-select"
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
          
          <div className="search-box">
            <input
              placeholder="Search Employee"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value) setEmployee(originalEmployeeData);
              }}
              onKeyPress={(e) => e.key === 'Enter' && searchfilter(e)}
            />
            <button onClick={searchfilter}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="view-toggle">
            <button 
              className={viewMode === 'card' ? 'active' : ''}
              onClick={() => setViewMode('card')}
            >
              Card View
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
          </div>
          
          <button
            className="btn-bulk-payslip"
            onClick={handleSendAllEmployees}
            disabled={isSendingPayslips || employee.length === 0}
          >
            {isSendingPayslips ? `Sending... (${progress.sent}/${progress.total})` : "Send All Payslips"}
          </button>
        </div>

        {/* Employee Selection and Filter Section */}
        <div className="selection-controls">
          <div className="selection-header">
            <h3>Select Employees for Payslip Distribution</h3>
            <div className="selection-actions">
              <span>{selectedEmployees.length} employees selected</span>
              <button
                className="btn-send-selected"
                onClick={handleSendSelectedEmployees}
                disabled={isSendingPayslips || selectedEmployees.length === 0}
              >
                {isSendingPayslips ? `Sending... (${progress.sent}/${progress.total})` : "Send to Selected"}
              </button>
            </div>
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label>Payslip Status:</label>
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
              >
                <option value="all">All Employees</option>
                <option value="sent">Payslip Sent</option>
                <option value="notSent">Payslip Not Sent</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Department:</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="select-all">
              <input
                type="checkbox"
                id="selectAll"
                checked={selectAll}
                onChange={handleSelectAll}
              />
              <label htmlFor="selectAll">Select All Visible Employees</label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">👥</div>
          <div className="summary-details">
            <h3>{employee.length}</h3>
            <p>Total Employees</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-details">
            <h3>₹{employee.reduce((total, emp) => total + Number(emp.empSalary), 0)}</h3>
            <p>Total Net Pay</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-details">
            <h3>₹{employee.reduce((total, emp) => 
              total + Number(emp.empSalary) + 
              Number(emp.employeeEPF) + 
              Number(emp.employeeESIC), 0)}</h3>
            <p>Total Gross Pay</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">📉</div>
          <div className="summary-details">
            <h3>₹{employee.reduce((total, emp) => 
              total + Number(emp.employeeEPF) + 
              Number(emp.employeeESIC) + 
              Number(emp.employeeLateDeduction), 0)}</h3>
            <p>Total Deductions</p>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading payroll data...</p>
        </div>
      ) : filteredEmployees.length > 0 ? (
        viewMode === 'card' ? renderCardView() : renderListView()
      ) : (
        <div className="no-data">
          <p>No payroll data found for the selected filters.</p>
        </div>
      )}
    </div>
  );
}