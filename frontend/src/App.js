import Login from "./pages/6.Login";
// import "./App.css";
import AddEmployee from "./pages/1.AddEmployee";
import EditEmployee from "./pages/2.EditEmployee";
import EmployeeList from "./pages/0.EmployeeList";
import EmployeeAttendanceList from "./pages/3.EmployeeAttendanceList";
import EmployeeData from "./pages/4.EmployeeData";
import DraftEmployee from "./pages/DraftSave";
import EmployeeDataSecondSection from "./pages/5.EmployeeData1";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import PayrollPage from "./pages/7.Payroll";
import MasttecNav from "./Components/Navbar";
import HolidayPage from "./pages/HolidayPage";
import { ToastContainer } from "react-toastify";
import RoleMangement from "./pages/RoleMangement";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import API_URL from "./global";
import { useEffect, useState } from "react";
axios.defaults.withCredentials = true; //store cookie

function App() {
  // it dones'nt need matechNavbar for login
  const location = useLocation();
  const navigate = useNavigate();
  const hideNavbarForPaths = ["/login"];
  const shouldShowNavbar = !hideNavbarForPaths.includes(location.pathname);
  const [profile, setProfile] = useState({});

  console.log(profile);

  async function getVerifyToken() {
    try {
      const res = await axios.get(`${API_URL}/v1/api/auth/verify`);
      console.log(res.data);
      setProfile(res.data);
    } catch (error) {
      // if not cookie found go to login
      navigate("/login");
    }
  }

  useEffect(() => {
    getVerifyToken();
  }, []);

  return (
    <div className="App">
      {shouldShowNavbar && <MasttecNav />}
      <Routes>
        {profile.role === "Accountant" ? (
          <>
            <Route path="/" element={<EmployeeData />} />
            <Route path="/payRun" element={<PayrollPage />} />
            <Route path="/employeeDatails" element={<EmployeeList />} />
          </>
        ) : profile.role === "Supervisors" ? (
          <>
            <Route path="/" element={<EmployeeAttendanceList />} />
            <Route path="/employeeDatails" element={<EmployeeList />} />
          </>
        ) : profile.role === "superAdmin" ? (
          <>
            <Route path="/" element={<RoleMangement />} />
            <Route path="/holiday-page" element={<HolidayPage />} />
            <Route
              path="/employeesAttendance"
              element={<EmployeeAttendanceList />}
            />
            <Route path="/employeeDatails" element={<EmployeeList />} />
            <Route path="/payRun" element={<PayrollPage />} />
            <Route path="/accountsDashboard" element={<EmployeeData />} />
          </>
        ) : (
          <></>
        )}

        <Route path="/login" element={<Login />} />
        <Route
          path="/employees-data1"
          element={<EmployeeDataSecondSection />}
        />
        <Route path="/add-employee-details" element={<AddEmployee />} />
        <Route path="/draft/:id" element={<DraftEmployee />} />
        <Route path="/edit-employee-details/:id" element={<EditEmployee />} />
      </Routes>

      <ToastContainer />
    </div>
  );
}

export default App;
