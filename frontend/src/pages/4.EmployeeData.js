import React, { useEffect, useState } from "react";
import EmployeeDataCss from "../CSS/EmployeeDataCss.css";
import { formatDistanceToNow } from "date-fns";
import url from "../Components/global";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PieAnimation from "../Components/Pichart";

// profile picture
import profile from '../assets/images/profile.png'

export default function EmployeeData() {
  const [tempEmpData, setTempEmpData] = useState([]);
  const navigate = useNavigate();
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [shiftTime, setShiftTime] = useState("19:00");
  const [summary, setSummary] = useState(null);

  const shiftOptions = ["7:00", "9:00", "15:00", "19:00"];

  const fetchAttendance = async () => {
    try {
      // Fetch employee and attendance data

      const attendanceResponse = await axios.get(`${url}/v1/api/attendance`);
      const TempEmpResponse = await axios.get(`${url}/v1/api/tempEmployee`);
      setAttendanceData(attendanceResponse.data);
      setTempEmpData(TempEmpResponse.data);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setError("Error fetching employee data.");
      setTimeout(() => setError(""), 5000);
    }
  };
  const handleFetchData = async () => {
    if (!selectedDate || !shiftTime) {
      alert("Please select both date and shift time");
      return;
    }

    try {
      // Fetch filtered data
      const response = await axios.post(`${url}/v1/api/attendance/summary`, {
        date: selectedDate,
        shift: shiftTime,
      });

      // Now we access the data directly from the response object, no need to call .json()
      const data = response.data;
      setSummary(data); // You can now use the data as needed

      console.log("summary", data);
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
      alert("There was an error fetching the attendance data.");
    }
  };
  async function navigateToDraft(id) {
    navigate(`/draft/${id}`);
  }
  // Fetch employee data when `date` or `statusFilter` changes
  useEffect(() => {
    const fetchData = async () => {
      await fetchAttendance();
      await handleFetchData();
    };
    fetchData();
  }, [selectedDate, shiftTime]); // only depend on selectedDate and shiftTime
  const timeAgo = (date) => {
    const now = new Date();
    const updatedDate = new Date(date);

    const seconds = Math.floor((now - updatedDate) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  console.log(tempEmpData);
  console.log(attendanceData);
  return (
    <div>
      <div>
        <div className="iuiuiweuiewueiwe">
          <div className="mpiu888888888">
            <div className="yrt454564565">
              <img
                className="j46436646363"
                src={profile}
                alt="accountsectionimage"
              />

              <div>
                <div className="msj3434jj785786">Hello, Sugumaran</div>
                <div className="nfi4j5j45">Accounts Department</div>
              </div>
            </div>
            <div>
              {/* bell icones */}
              {/* <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_2758_2595)">
                  <mask
                    id="mask0_2758_2595"
                    style={{ maskType: "luminance" }}
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width="36"
                    height="36"
                  >
                    <path d="M36 0H0V36H36V0Z" fill="white" />
                  </mask>
                  <g mask="url(#mask0_2758_2595)">
                    <path
                      d="M18.0003 34.28C18.6302 34.2655 19.2348 34.0287 19.7069 33.6114C20.1791 33.1942 20.4884 32.6234 20.5803 32H15.3203C15.4148 32.6403 15.7386 33.2245 16.2316 33.6439C16.7246 34.0633 17.3531 34.2894 18.0003 34.28Z"
                      fill="black"
                    />
                    <path
                      d="M32.8498 28.1304L32.5098 27.8304C31.5455 26.9707 30.7013 25.9852 29.9998 24.9004C29.2333 23.4032 28.7743 21.7678 28.6498 20.0904V15.1504C28.6454 14.5504 28.5919 13.9517 28.4898 13.3604C26.7959 13.0122 25.2744 12.0894 24.1828 10.7482C23.0912 9.40693 22.4967 7.72968 22.4998 6.00039V5.37039C21.4555 4.85709 20.3339 4.51924 19.1798 4.37039V3.11039C19.1798 2.75633 19.0392 2.41676 18.7888 2.1664C18.5384 1.91604 18.1989 1.77539 17.8448 1.77539C17.4907 1.77539 17.1512 1.91604 16.9008 2.1664C16.6505 2.41676 16.5098 2.75633 16.5098 3.11039V4.42039C13.9255 4.78494 11.5604 6.07213 9.85104 8.04432C8.14167 10.0165 7.20353 12.5405 7.2098 15.1504V20.0904C7.08536 21.7678 6.62634 23.4032 5.8598 24.9004C5.17069 25.9827 4.34 26.9681 3.3898 27.8304L3.0498 28.1304V30.9504H32.8498V28.1304Z"
                      fill="black"
                    />
                    <path
                      d="M30 11C32.7614 11 35 8.76142 35 6C35 3.23858 32.7614 1 30 1C27.2386 1 25 3.23858 25 6C25 8.76142 27.2386 11 30 11Z"
                      fill="#D72020"
                    />
                  </g>
                </g>
                <defs>
                  <clipPath id="clip0_2758_2595">
                    <rect width="36" height="36" fill="white" />
                  </clipPath>
                </defs>
              </svg> */}
            </div>
          </div>
        </div>

        <div className="iurooi435k45k5">
          <div className="ouieieirr">
            <div className="yeyy43344">
              <div className="jjjj3j34j4j34j4j">
                <div className="taskh7584554">Task</div>
                <div>
                  {/* <select name="" id="" className="dropdowndetsi2323">
                    <option value="">All</option>
                    <option value="">Onboard</option>
                    <option value="">Offboard</option>
                    <option value="">On board</option>
                  </select> */}
                </div>
              </div>

              <div className="lololl34434343443443">
                {tempEmpData &&
                  tempEmpData.map((employee, index) => (
                    <div
                      className="llllslslsl"
                      key={index}
                      onClick={() => navigateToDraft(employee.employeeId)}
                    >
                      <div className="jdhnfdjfnfnzz">
                        <img src="./images/TaskCheckIn.png" alt="" />
                        <div className="nkskkksks">
                          Employee Onboard Process in Draft.
                          <span className="kksuruur">
                            {employee.updatedAt && timeAgo(employee.updatedAt)}
                          </span>
                        </div>
                        <div>
                          {/* <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M7 4C7 3.46957 7.21071 2.96086 7.58579 2.58579C7.96086 2.21071 8.46957 2 9 2H15C15.5304 2 16.0391 2.21071 16.4142 2.58579C16.7893 2.96086 17 3.46957 17 4V6H21C21.2652 6 21.5196 6.10536 21.7071 6.29289C21.8946 6.48043 22 6.73478 22 7C22 7.26522 21.8946 7.51957 21.7071 7.70711C21.5196 7.89464 21.2652 8 21 8H19.931L19.064 20.142C19.0281 20.6466 18.8023 21.1188 18.4321 21.4636C18.0619 21.8083 17.5749 22 17.069 22H6.93C6.42414 22 5.93707 21.8083 5.56688 21.4636C5.1967 21.1188 4.97092 20.6466 4.935 20.142L4.07 8H3C2.73478 8 2.48043 7.89464 2.29289 7.70711C2.10536 7.51957 2 7.26522 2 7C2 6.73478 2.10536 6.48043 2.29289 6.29289C2.48043 6.10536 2.73478 6 3 6H7V4ZM9 6H15V4H9V6ZM6.074 8L6.931 20H17.07L17.927 8H6.074ZM10 10C10.2652 10 10.5196 10.1054 10.7071 10.2929C10.8946 10.4804 11 10.7348 11 11V17C11 17.2652 10.8946 17.5196 10.7071 17.7071C10.5196 17.8946 10.2652 18 10 18C9.73478 18 9.48043 17.8946 9.29289 17.7071C9.10536 17.5196 9 17.2652 9 17V11C9 10.7348 9.10536 10.4804 9.29289 10.2929C9.48043 10.1054 9.73478 10 10 10ZM14 10C14.2652 10 14.5196 10.1054 14.7071 10.2929C14.8946 10.4804 15 10.7348 15 11V17C15 17.2652 14.8946 17.5196 14.7071 17.7071C14.5196 17.8946 14.2652 18 14 18C13.7348 18 13.4804 17.8946 13.2929 17.7071C13.1054 17.5196 13 17.2652 13 17V11C13 10.7348 13.1054 10.4804 13.2929 10.2929C13.4804 10.1054 13.7348 10 14 10Z"
                              fill="black"
                            />
                          </svg> */}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="lsjkddkskdd">
              <div className="ieruy34u3u3">
                <div className="nncncnnccc">Attendance</div>
                <div className="ikno4k34343">
                  <div>
                    <input
                      className="itrutitititi"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    {/*                     
                    <select
                      className="shiftoptiondeiv"
                      value={shiftTime}
                      onChange={(e) => {
                        setShiftTime(e.target.value);
                      }}
                    >
                      <option value="">Select Shift Time</option>
                      {shiftOptions.map((shift, index) => (
                        <option key={index} value={shift}>
                          {shift}
                        </option>
                      ))}
                    </select> */}
                  </div>
                </div>
              </div>
              {summary && (
                <div className=" summary-container ">
                  {/* <div className="">
                    <p>Total: {summary.total}</p>
                    <p>Present: {summary.present}</p>
                    <p>Leave: {summary.leave}</p>
                    <p>Absent: {summary.absent}</p>
                    <p>Late: {summary.late}</p>
                    <p>Sunday: {summary.sunday}</p>
                    <p>Paid Leave: {summary.paidLeave}</p>
                    <p>Unpaid Leave: {summary.unPaidLeave}</p>
                    <p>Holiday: {summary.holiday}</p>
                    <p>C-Off: {summary.cOff}</p>
                    <p>Week Off: {summary.weekOff}</p>
                  </div> */}
                  <div>
                    <PieAnimation data={summary} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="vdhdgdgdvdvdv">
          <div className="ppposososos">
            <div className="nbbbbbdbddd">
              <div className="lowju434">Pay Run</div>
              <div className="lkdkkdkdkdkdjddj12">
                <div className="kkklskkksks">
                  <div className="diviejdjj43"></div>
                  <div>
                    <div className="mooooossssooo">No. of . Employees</div>
                    <div className="qioqiweie">70</div>
                  </div>
                </div>
                <div className="kkklskkksks">
                  <div className="diviejdjj43"></div>
                  <div>
                    <div className="mooooossssooo">Total Net Pay</div>
                    <div className="qioqiweie">Yet to Proceed</div>
                  </div>
                </div>
                <div className="kkklskkksks">
                  <div className="diviejdjj43"></div>
                  <div>
                    <div className="mooooossssooo">Pay Date</div>
                    <div className="qioqiweie">26/08/2024</div>
                  </div>
                </div>
              </div>

              <div className="iooioioerorro">
                <div className="mbvnvcsihwiejhjr">
                  <div className="lllp0ps02034244">
                    <svg
                      className="llkskskskkske344"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8.00032 6.00078V8.66744M8.00032 10.6674H8.00698M6.90898 2.39478L1.50498 11.4174C1.39358 11.6104 1.33463 11.8291 1.33399 12.0519C1.33335 12.2746 1.39105 12.4937 1.50135 12.6873C1.61164 12.8808 1.77069 13.0421 1.96268 13.1551C2.15466 13.2682 2.37289 13.3289 2.59565 13.3314H13.405C13.6276 13.3289 13.8458 13.2681 14.0377 13.1551C14.2295 13.0421 14.3885 12.8809 14.4988 12.6874C14.6091 12.494 14.6668 12.275 14.6663 12.0524C14.6657 11.8297 14.6069 11.611 14.4956 11.4181L9.09165 2.39411C8.97795 2.20645 8.81778 2.05127 8.62662 1.94358C8.43545 1.83588 8.21973 1.7793 8.00032 1.7793C7.7809 1.7793 7.56519 1.83588 7.37402 1.94358C7.18285 2.05127 7.02268 2.20645 6.90898 2.39411V2.39478Z"
                        stroke="#D50033"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="kkkkkkk2232332">
                      Please process your Payrun before 25/08/2024
                    </span>
                  </div>
                  <div>
                    <button onClick={()=>navigate('/payrun')} className="CreatePayRun">Create Pay Run</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="jjdjdjdjdjdjnfnfnfn">
              {/* <div>
                <select className="weweeshiftoptiondeiv" name="" id="">
                  <option value="">Last Pay Run</option>
                  <option value="">Last Pay Run dd</option>
                </select>
              </div> */}
            </div>
          </div>
        </div>

        {/* <div>
          <div>
            <div className="opoopopppp">
              <div className="iieyueyyrryryr">
                <div className="iiiyuyuyuyu">Pay Roll Summary</div>
                <div>
                  <select className="gdfhejrhuereuer" name="" id="">
                    <option className="kkkkkk" value="">
                      2024
                    </option>
                    <option className="kkkkkk" value="">
                      2024
                    </option>
                    <option className="kkkkkk" value="">
                      2024
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
