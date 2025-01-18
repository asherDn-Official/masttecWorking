import Login from "./pages/6.Login";
// import "./App.css";
import AddEmployee from "./pages/1.AddEmployee";
import EditEmployee from "./pages/2.EditEmployee";
import EmployeeList from "./pages/0.EmployeeList";
import EmployeeAttendanceList from "./pages/3.EmployeeAttendanceList";
import EmployeeData from "./pages/4.EmployeeData";
import DraftEmployee from "./pages/DraftSave";
import EmployeeDataSecondSection from "./pages/5.EmployeeData1";
import { Routes, Route, useLocation } from "react-router-dom";
import PayrollPage from "./pages/7.Payroll";
import MasttecNav from "./Components/Navbar";
import HolidayPage from "./pages/HolidayPage";
import { ToastContainer } from "react-toastify";
import RoleMangement from "./pages/RoleMangement";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import API_URL from "./global";
import { useEffect } from "react";

function App() {
  // it dones'nt need matechNavbar for login
  const location = useLocation();
  const hideNavbarForPaths = ["/login"];
  const shouldShowNavbar = !hideNavbarForPaths.includes(location.pathname);

  async function getVerifyToken() {
    try {
      const res = await axios.get(`${API_URL}/v1/api/auth/verify`);
      console.log("verify",res);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getVerifyToken();
  }, []);

  return (
    <div className="App">
      {shouldShowNavbar && <MasttecNav />}
      <Routes>
        <Route path="/add-employee-details" element={<AddEmployee />} />
        <Route path="/draft/:id" element={<DraftEmployee />} />
        <Route path="/edit-employee-details/:id" element={<EditEmployee />} />
        <Route path="/" element={<EmployeeList />} />
        <Route
          path="/employeesAttendance"
          element={<EmployeeAttendanceList />}
        />
        <Route path="/accountsDashboard" element={<EmployeeData />} />
        <Route
          path="/employees-data1"
          element={<EmployeeDataSecondSection />}
        />
        <Route path="/payRun" element={<PayrollPage />} />
        <Route path="/holiday" element={<HolidayPage />} />
        <Route path="/role-management" element={<RoleMangement />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/employees-list" element={<EmployeeList />} /> */}
      </Routes>

      <ToastContainer />
    </div>
  );
}

export default App;
