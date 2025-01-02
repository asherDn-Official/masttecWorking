import React from "react";
import "./MasttecNav.css"; // Assuming you save the CSS in a file named MasttecNav.css
import { Link } from "react-router-dom";

const MasttecNav = () => {
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
          <li className="masttec-menu-item">
            <Link className="masttec-menu-link" to="/">
              Home
            </Link>
          </li>
          <li className="masttec-menu-item">
            <Link className="masttec-menu-link" to="/payrun">
              Payrun
            </Link>
          </li>
          <li className="masttec-menu-item">
            <Link className="masttec-menu-link" to="/accountsDashboard">
              Dashboard
            </Link>
          </li>
          <li className="masttec-menu-item">
            <Link className="masttec-menu-link" to="/employeesAttendance">
              Daily Attendance
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
    </div>
  );
};

export default MasttecNav;
