import { useState } from "react";
import "../CSS/LoginCss.css";
import axios from "axios";
import API_URL from "../global";
import { toast } from "react-toastify";

export default function Login() {
  const [loginDetail, setLoginDetail] = useState({
    department: "",
    employeeId: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${API_URL}/v1/api/auth/login`,
        loginDetail
      );
      toast.success(response.data.message, {
        position: "top-right",
      });

      window.location.href = "/";

      setLoginDetail({
        department: "",
        employeeId: "",
        password: "",
      });
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error, {
          position: "top-right",
        });
      } else {
        toast.error("An unexpected error occurred.", {
          position: "top-right",
        });
      }
    }
  };

  const handleChange = (e) => {
    setLoginDetail((oldDetail) => ({
      ...oldDetail,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="Login-container">
      <div className="Login-left-side"></div>
      <div className="Login-right-side">
        <div className="Login-top-logo"></div>
        <h1>Log in</h1>
        <div className="forme-centeore">
          <form className="form-word" onSubmit={handleSubmit}>
            <div className="Login-form-group">
              <label htmlFor="department">Role</label>
              <select
                name="department"
                onChange={handleChange}
                id="department"
                value={loginDetail.department}
                required
              >
                <option value="" default></option>
                <option>Accountant</option>
                <option>Supervisor</option>
                <option>SuperAdmin</option>
              </select>
            </div>

            <div className="Login-form-group">
              <label htmlFor="employeeId">Employee Id</label>
              <input
                type="number"
                id="employeeId"
                name="employeeId"
                onChange={handleChange}
                value={loginDetail.employeeId}
                required
              />
            </div>
            <div className="Login-form-group">
              <label htmlFor="password">Password</label>
              <div className="Login-password-input">
                <input
                  type="password"
                  id="password"
                  name="password"
                  onChange={handleChange}
                  value={loginDetail.password}
                  required
                />
                <span className="Login-password-toggle">
                  <i className="fa-solid fa-eye"></i>
                  <i className="fa-solid fa-eye-slash"></i>
                </span>
              </div>
            </div>
            <div className="Login-forgot-password">
              <a href="#">Forgot Password?</a>
            </div>
            <button type="submit" className="Login-login-button">
              Log in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
