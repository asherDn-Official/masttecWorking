import React, { useEffect, useState } from "react";
import "./MasttecNav.css"; // Assuming you save the CSS in a file named MasttecNav.css
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../global";
import { toast } from "react-toastify";

const MasttecNav = () => {
  const [initial, setinitial] = useState(["", ""]);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});

  const [navigateLink, setNavigateLink] = useState({
    Accountant: [
      { path: "/", linkName: "Home" },
      { path: "/payrun", linkName: "Payrun" },
      { path: "/employeeDatails", linkName: "Employees" },
    ],
    Supervisor: [
      { path: "/", linkName: "Home" },
      { path: "/employeeDatails", linkName: "Employees" },
    ],
    SuperAdmin: [
      { path: "/", linkName: "Role Management" },
      { path: "/holiday-page", linkName: "Holiday Approval" },
      { path: "/employeeDatails", linkName: "employees" },
      { path: "/payrun", linkName: "payrun" },
      { path: "/accountsDashboard", linkName: "Account Dashboard" },
      { path: "/employeesAttendance", linkName: "Employee Attendance" },
    ],
  });

  async function getVerifyToken() {
    try {
      const res = await axios.get(`${API_URL}/v1/api/auth/verify`);
      setProfile(res.data);
    } catch (error) {
      // if not cookie found go to login
      navigate("/login");
    }
  }

  function getInitial() {
    if (typeof profile?.employeeName === "string") {
      const initial = profile?.employeeName
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2);
      setinitial(initial);
    }
  }

  useEffect(() => {
    getVerifyToken();
    getInitial();
  }, [profile, profile?.employeeName]);

  const handleProfile = () => {
    document.querySelector(".user-profile").classList.toggle("active");
  };

  const handleLogOut = async (e) => {
    console.log("logout");
    try {
      const res = await axios.get(`${API_URL}/v1/api/auth/logout`);
      toast.success(res.data, {
        position: "top-right",
      });

      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="masttec-container">
      <nav className="masttec-nav">
        <a href="/">
          <img
            className="masttec-logo"
            src="/MasttecLogo.png"
            alt="Masttec Logo"
          />
        </a>
        <ul className="masttec-menu">
          {navigateLink[profile?.role]?.map((item, index) => (
            <li className="masttec-menu-item" key={index}>
              <Link className="masttec-menu-link" to={item.path}>
                {item.linkName}
              </Link>
            </li>
          ))}
          <li className="masttec-menu-item">
            <Link className="profile-links " onClick={handleProfile}>
              <img
                src={`https://ui-avatars.com/api/?name=${initial[0]}+${initial[1]}`}
                alt="user"
                className="profile-image"
              />
            </Link>
          </li>
          {/*<li className="masttec-menu-item">
            <a className="masttec-menu-link" href="#">
              Payroll
            </a>
            {/* //  Uncomment the submenu if needed 
            <ul className="masttec-submenu">
              <li className="masttec-submenu-item">
                <a className="masttec-submenu-link" href="#">View Payroll</a>
              </li>
              <li className="masttec-submenu-item">
                <a className="masttec-submenu-link" href="#">Generate Payroll</a>
              </li>
              <li className="masttec-submenu-item">
                <a className="masttec-submenu-link" href="#">Payroll Settings</a>
              </li>
            </ul> 
          </li>*/}
          {/* <li className="masttec-menu-item">
            <a className="masttec-menu-link" href="#">
              Settings
            </a>
          </li>
          <li className="masttec-menu-item">
            <a className="masttec-menu-link" href="#">
              Log Out
            </a>
          </li> */}
        </ul>
      </nav>
      <div className="user-profile active">
        <div>
          <div className="user-name">{profile?.employeeName}</div>
          <div className="user-Admin">{profile?.role}</div>
          <div className="user-id">emp id : {profile?.employeeId}</div>
        </div>
        <button className="logout" onClick={handleLogOut}>
          LOGOUT
        </button>
      </div>
    </div>
  );
};

export default MasttecNav;
