import { useState } from "react";
import "../CSS/LoginCss.css";

export default function Login() {
  const [loginUsers, setLoginuUsers] = useState({});
  const [loginDetail, setLoginDetail] = useState({
    department: "",
    userid: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "http://localhost:5000/api/employees/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            department: loginDetail.department, // Include department
            employeeId: loginDetail.userid,
            password: loginDetail.password,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setLoginuUsers(data.employee);
      setLoginDetail({
        department: "",
        userid: "",
        password: "",
      });
      alert("Login successful!");
    } catch (error) {
      setError(error.message);
    }
  };

  const hanldeChange = (e) => {
    setLoginDetail((oldDetail) => ({
      ...oldDetail,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="Login-container">
      <div className="Login-left-side"></div>
      <div className="Login-right-side">
        <div className="Login-top-logo">
          <img src="/images/Logo 1.png" alt="Masttec Moulds" />
        </div>
        <h1>Log in</h1>
        {error && <div className="Login-error">{error}</div>}{" "}
        {/* Display error message */}
        <div className="forme-centeore">
          <form className="form-word" onSubmit={handleSubmit}>
            <div className="Login-form-group">
              <label htmlFor="department">Department</label>
              <select
                name="department"
                onChange={hanldeChange}
                id="department"
                value={loginDetail.department}
              >
                <option disabled></option>
                <option>Accounts</option>
                <option>Production</option>
                <option>Maintenance</option>
              </select>
            </div>

            <div className="Login-form-group">
              <label htmlFor="userid">Employee Id</label>
              <input
                type="text"
                id="userid"
                name="userid"
                onChange={hanldeChange}
                value={loginDetail.userid}
              />
            </div>
            <div className="Login-form-group">
              <label htmlFor="password">Password</label>
              <div className="Login-password-input">
                <input
                  type="password"
                  id="password"
                  name="password"
                  onChange={hanldeChange}
                  value={loginDetail.password}
                />
                <span className="Login-password-toggle">
                  <i className="fa-solid fa-eye"></i>
                  <i className="fa-solid fa-eye-slash"></i>
                </span>
              </div>
            </div>
            <div className="Login-remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <div className="Login-forgot-password">
              <a href="#">Forgot Password?</a>
            </div>
            <button type="submit" className="Login-login-button">
              Log in
            </button>
          </form>
        </div>
        <div className="Login-create-account">
          Not Registered yet? <a href="#">Create an account</a>
        </div>
      </div>
    </div>
  );
}
