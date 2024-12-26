import "./App.css";
import AddEmployee from "./Components/1.AddEmployee";
import EditEmployee from "./Components/2.EditEmployee";
import EmployeeList from "./Components/0.EmployeeList";
import EmployeeAttendanceList from "./Components/3.EmployeeAttendanceList";
import EmployeeData from "./Components/4.EmployeeData";
import DraftEmployee from "./Components/DraftSave";
import EmployeeDataSecondSection from "./Components/5.EmployeeData1";
import { Routes, BrowserRouter, Route, useLocation } from "react-router-dom";
import Login from "./Components/6.Login";
import PayrollPage from "./Components/7.Payroll";
import MasttecNav from "./Components/Navbar";
import HolidayPage from "./Components/HolidayPage";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function App() {
  return (
    <div className="App">
      <MasttecNav />
      <Routes>
        <Route path="/add-employee-details" element={<AddEmployee />} />
        <Route path="/draft/:id" element={<DraftEmployee />} />
        {/* <Route path="/" element={<Login />} /> */}
        <Route path="/edit-employee-details/:id" element={<EditEmployee />} />
        {/* <Route path="/employees-list" element={<EmployeeList />} /> */}
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
      </Routes>


      <ToastContainer />

    </div>
  );
}

export default App;
