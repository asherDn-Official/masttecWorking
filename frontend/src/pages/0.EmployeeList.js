import React, { useState, useEffect, useContext } from "react";
import "../CSS/EmployeeListCss.css";
import axios from "axios";
import url from "../Components/global";
import ErrorPopup from "../Components/errorPopup";
import { useNavigate } from "react-router-dom";
import profileImage from "../assets/images/profile.png";
import DisableScreen from "../Components/DisableScreen";
import { ContentProvieder } from "../global";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [tempEmpData, setTempEmpData] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const profile = useContext(ContentProvieder);

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
      const empData = response.data.map((emp) => {
        // Check if the data is nested in EmployeeData property
        const employee = emp.EmployeeData || emp;
        return {
          empImg: employee.employeePicture || "",
          empName: employee.employeeName || "",
          empDesignation: employee.designation || "",
          empID: employee.employeeId || "",
        };
      });
      setTempEmpData(empData);
    } catch (error) {
      console.error("Error fetching draft employee data:", error);
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

  return (
    <div>
      {error && <ErrorPopup error={error} setError={setError} />}
      <div className="mainsectiondududid">
        <div className="mepdjwjejjhjs">
          <div className="emploueeswsdnerhejhrwidth">
            <div>
              <button
                className="hgshareeebuteyreuuruer"
                onClick={navigateToAdd}
                style={{
                  backgroundColor: "#1d275f",
                  color: "#ffffff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "20px",
                }}
              >
                <div className="zvzgggw2323232">Add Employee</div>
              </button>
            </div>

            <div className="employeesectionflexdidd">
              {employees.map((emp) => (
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
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = profileImage;
                      }}
                    />
                  </div>
                  <div className="employeename122">{emp.empName}</div>
                  <div className="employedddworktype11">
                    {emp.empDesignation}
                  </div>
                  <div className="employedidNumberr">Emp ID - {emp.empID}</div>
                </div>
              ))}

              {tempEmpData.map((emp) => (
                <div
                  key={emp.empID}
                  className="maincardoftheenplueess"
                  onClick={() => navigateToDraft(emp.empID)}
                >
                  <div>
                    <img
                      className="empliyetegehpiccbd"
                      src={
                        emp.empImg
                          ? `http://localhost:4000${emp.empImg}`
                          : profileImage
                      }
                      alt={emp.empName || "Employee"}
                    />
                  </div>
                  <div className="employeename122">{emp.empName}</div>
                  <div className="employedddworktype11">
                    {emp.empDesignation}
                  </div>
                  <div className="employedidNumberr">Emp ID - {emp.empID}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {profile.role === "Supervisor" && <DisableScreen />}
    </div>
  );
}

// import React, { useState, useEffect, useContext } from "react";
// import "../CSS/EmployeeListCss.css";
// import axios from "axios";
// import url from "../Components/global";
// import ErrorPopup from "../Components/errorPopup";
// import { useNavigate } from "react-router-dom";
// import profileImage from "../assets/images/profile.png";
// import DisableScreen from "../Components/DisableScreen";
// import { ContentProvieder } from "../global";

// export default function EmployeeList() {
//   const [employees, setEmployees] = useState([]);
//   const [tempEmpData, setTempEmpData] = useState([]);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();
//   const profile = useContext(ContentProvieder);

//   const fetchEmployees = async () => {
//     try {
//       const response = await axios.get(`${url}/v1/api/employees`);
//       const empData = response.data.map((emp) => ({
//         empImg: emp.employeePicture || "",
//         empName: emp.employeeName || "",
//         empDesignation: emp.designation || "",
//         empID: emp.employeeId || "",
//       }));
//       setEmployees(empData);
//     } catch (error) {
//       console.error("Error fetching employee data:", error);
//       setError("Error fetching employee data.");
//       setTimeout(() => setError(""), 5000);
//     }
//   };

//   const fetchTempEmployees = async () => {
//     try {
//       const response = await axios.get(`${url}/v1/api/tempEmployee`);
//       const empData = response.data.map((emp) => ({
//         empImg: emp.employeePicture || "",
//         empName: emp.employeeName || "",
//         empDesignation: emp.designation || "",
//         empID: emp.employeeId || "",
//       }));
//       setTempEmpData(empData);
//     } catch (error) {
//       console.error("Error fetching employee data:", error);
//       //setError("Error fetching employee data.");
//       //setTimeout(() => setError(""), 5000);
//     }
//   };
//   useEffect(() => {
//     fetchEmployees();
//     fetchTempEmployees();
//   }, []);
//   const navigateToEdit = (empID) => {
//     navigate(`/edit-employee-details/${empID}`);
//   };
//   const navigateToAdd = () => {
//     navigate(`/add-employee-details`);
//   };
//   async function navigateToDraft(id) {
//     navigate(`/draft/${id}`);
//   }
//   return (
//     <div>
//       {error && <ErrorPopup error={error} setError={setError} />}
//       <div className="mainsectiondududid">
//         <div className="mepdjwjejjhjs">
//           <div className="emploueeswsdnerhejhrwidth">
//             <div>
//               <button
//                 className="hgshareeebuteyreuuruer"
//                 onClick={(e) => {
//                   e.preventDefault();
//                   navigateToAdd();
//                 }}
//                 style={{
//                   backgroundColor: "#1d275f", // Dark blue background
//                   color: "#ffffff", // White text
//                   padding: "8px 16px", // Vertical and horizontal padding
//                   border: "none", // No border
//                   borderRadius: "4px", // Slightly rounded corners
//                   cursor: "pointer", // Pointer cursor on hover
//                   fontSize: "14px", // Font size
//                   fontWeight: "500", // Medium font weight
//                   marginBottom: "20px",
//                   ":hover": {
//                     backgroundColor: "#2a3a7a", // Darker blue on hover
//                     boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)", // Stronger shadow on hover
//                   },
//                 }}
//               >
//                 <div className="zvzgggw2323232">Add Employee</div>
//               </button>
//             </div>

//             {/* <div>
//               <button
//                 onClick={(e) => {
//                   e.preventDefault();
//                   navigateToAdd();
//                 }}
//               >
//                 add +
//               </button>
//             </div> */}
//             <div className="employeesectionflexdidd">
//               {employees &&
//                 employees.map((emp) => (
//                   <div
//                     key={emp.empID}
//                     className="maincardoftheenpluee"
//                     onClick={() => navigateToEdit(emp.empID)}
//                   >
//                     <div>
//                       <img
//                         className="empliyetegehpiccbd"
//                         src={`http://localhost:4000${emp.empImg}`}
//                         alt={emp.empName || "Employee"}
//                         onError={(e) => {
//                           e.target.onerror = null;
//                           e.target.src = profileImage;
//                         }}
//                       />
//                     </div>
//                     <div className="employeename122">{emp.empName}</div>
//                     <div className="employedddworktype11">
//                       {emp.empDesignation}
//                     </div>
//                     <div className="employedidNumberr">
//                       Emp ID - {emp.empID}
//                     </div>
//                   </div>
//                 ))}
//               {tempEmpData &&
//                 tempEmpData.map((emp) => (
//                   <div
//                     key={emp.empID}
//                     className="maincardoftheenplueess"
//                     onClick={() => navigateToDraft(emp.empID)}
//                   >
//                     <div>
//                       <img
//                         className="empliyetegehpiccbd"
//                         src={
//                           emp.empImg
//                             ? `http://localhost:4000${emp.empImg}`
//                             : profileImage
//                         }
//                         alt={emp.empName || "Employee"}
//                       />
//                     </div>
//                     <div className="employeename122">{emp.empName}</div>
//                     <div className="employedddworktype11">
//                       {emp.empDesignation}
//                     </div>
//                     <div className="employedidNumberr">
//                       Emp ID - {emp.empID}
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           </div>
//         </div>
//       </div>
//       {profile.role === "Supervisor" && <DisableScreen />}
//     </div>
//   );
// }
