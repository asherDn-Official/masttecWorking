import { useState } from "react";
import "../CSS/LoginCss.css";
import axios from "axios";
import API_URL from "../global";
import { toast } from "react-toastify";

export default function Login() {
  const [loginUsers, setLoginuUsers] = useState({});
  const [loginDetail, setLoginDetail] = useState({
    department: "",
    employeeId: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(loginDetail);

    try {
      const respose = await axios.post(
        `${API_URL}/v1/api/auth/login`,
        loginDetail
      );
      // console.log(respose.data.message);
      toast.success(respose.data.message, {
        position: "top-right",
      });

      setLoginDetail({
        department: "",
        userid: "",
        password: "",
      });
    } catch (error) {
      toast.error(error.response.data.error, {
        position: "top-right",
      });
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
          {/* <img src="/images/Logo 1.png" alt="Masttec Moulds" /> */}
        </div>
        <h1>Log in</h1>
        {error && <div className="Login-error">{error}</div>}{" "}
        {/* Display error message */}
        <div className="forme-centeore">
          <form className="form-word" onSubmit={handleSubmit}>
            <div className="Login-form-group">
              <label htmlFor="department">Role</label>
              <select
                name="department"
                onChange={hanldeChange}
                id="department"
                value={loginDetail.department}
                required
              >
                <option defa></option>
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
                onChange={hanldeChange}
                value={loginDetail.userid}
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
                  onChange={hanldeChange}
                  value={loginDetail.password}
                  required
                />
                <span className="Login-password-toggle">
                  <i className="fa-solid fa-eye"></i>
                  <i className="fa-solid fa-eye-slash"></i>
                </span>
              </div>
            </div>
            {/* <div className="Login-remember-me"> */}
            {/* <input type="checkbox" id="remember" /> */}
            {/* <label htmlFor="remember">Remember me</label> */}
            {/* </div> */}
            <div className="Login-forgot-password">
              <a href="#">Forgot Password?</a>
            </div>
            <button type="submit" className="Login-login-button">
              Log in
            </button>
          </form>
        </div>
        {/* <div className="Login-create-account">
          Not Registered yet? <a href="#">Create an account</a>
        </div> */}
      </div>
    </div>
  );
}
