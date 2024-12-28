import React, { useState, useEffect } from "react";
import "../CSS/EmployeeListCss.css";
import axios from "axios";
import url from "../Components/global";
import ErrorPopup from "../Components/errorPopup";
import { useNavigate } from "react-router-dom";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [tempEmpData, setTempEmpData] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${url}/v1/api/employees`);
      const empData = response.data.map((emp) => ({
        empImg: emp.employeePicture || "",
        empName: emp.employeeName || "",
        empDesignation: emp.designation || "",
        empID: emp.employeeId || "",
      }));
      setEmployees(empData);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setError("Error fetching employee data.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const fetchTempEmployees = async () => {
    try {
      const response = await axios.get(`${url}/v1/api/tempEmployee`);
      const empData = response.data.map((emp) => ({
        empImg: emp.employeePicture || "",
        empName: emp.employeeName || "",
        empDesignation: emp.designation || "",
        empID: emp.employeeId || "",
      }));
      setTempEmpData(empData);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      //setError("Error fetching employee data.");
      //setTimeout(() => setError(""), 5000);
    }
  };
  useEffect(() => {
    fetchEmployees();
    fetchTempEmployees();
  }, []);
  const navigateToEdit = (empID) => {
    navigate(`/edit-employee-details/${empID}`);
  };
  const navigateToAdd = () => {
    navigate(`/add-employee-details`);
  };
  async function navigateToDraft(id) {
    navigate(`/draft/${id}`);
  }
  console.log(employees);
  return (
    <div>
      {error && <ErrorPopup error={error} setError={setError} />}
      <div className="mainsectiondududid">
        <div className="mepdjwjejjhjs">
          <div className="emploueeswsdnerhejhrwidth">
            <div>
              <button
                className="hgshareeebuteyreuuruer"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToAdd();
                }}
              >
                <div className="zvzgggw2323232">Add Emploee</div>
              </button>
            </div>

            {/* <div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  navigateToAdd();
                }}
              >
                add +
              </button>
            </div> */}
            <div className="employeesectionflexdidd">
              {employees &&
                employees.map((emp) => (
                  <div
                    key={emp.empID}
                    className="maincardoftheenpluee"
                    onClick={() => navigateToEdit(emp.empID)}
                  >
                    <div>
                      <img
                        className="empliyetegehpiccbd"
                        src={`http://localhost:4000${emp.empImg}`}
                        alt={emp.empName || "Employee"}
                      />
                    </div>
                    <div className="employeename122">{emp.empName}</div>
                    <div className="employedddworktype11">
                      {emp.empDesignation}
                    </div>
                    <div className="employedidNumberr">
                      Emp ID - {emp.empID}
                    </div>
                  </div>
                ))}
              {tempEmpData &&
                tempEmpData.map((emp) => (
                  <div
                    key={emp.empID}
                    className="maincardoftheenplueess"
                    onClick={() => navigateToDraft(emp.empID)}
                  >
                    <div>
                      <img
                        className="empliyetegehpiccbd"
                        src={`http://localhost:4000${emp.empImg}`}
                        alt={emp.empName || "Employee"}
                      />
                    </div>
                    <div className="employeename122">{emp.empName}</div>
                    <div className="employedddworktype11">
                      {emp.empDesignation}
                    </div>
                    <div className="employedidNumberr">
                      Emp ID - {emp.empID}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
