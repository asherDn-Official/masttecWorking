import React, { useState, useEffect } from "react";
import axios from "axios";
import url from "../Components/global";
import ErrorPopup from "../Components/errorPopup";
import { useNavigate, useParams } from "react-router-dom";
import "../CSS/AddEmployeeCss.css";
import EmployeeData from "./4.EmployeeData";

export default function DraftEmployee() {
  const [employee, setEmployee] = useState({});
  const [password, setPassword] = useState(""); // Added password state
  const Navigate = useNavigate();
  const { id: empID } = useParams();
  const [error, setError] = useState("");
  const [errorMessage, setErrorMessage] = useState(false);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${url}/v1/api/tempEmployee/${empID}`);
      setEmployee(response.data);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setError("Error fetching employee data.");
      setTimeout(() => setError(""), 5000);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleImageUpload = async (e, additionalText) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("employeeId", employee.employeeId);
    formData.append("additionalText", additionalText);
    formData.append("file", file);

    try {
      const response = await axios.post(`${url}/v1/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.url) {
        setEmployee((prev) => ({
          ...prev,
          [additionalText]: response.data.url,
        }));
        alert("File uploaded successfully");
      } else {
        console.error("No URL returned from backend.");
      }
    } catch (error) {
      console.error("Image upload failed:", error);
    }

    e.target.value = null;
  };

  const isEmployeeComplete = () => {
    const requiredFields = [
      "employeePicture",
      "employeeName",
      "dateOfBirth",
      "qualification",
      "department",
      "mobileNumber",
      "employeeId",
      "bloodGroup",
      "designation",
      "departmentCode",
      "mailId",
      "address",
      "bankAccountNumber",
      "bankIFSCCode",
      "addressProof",
      "passbookProof",
      "educationCertificate",
      "PANCardProof",
      "salary",
      "hra",
      "allowance",
      "esicId",
      "esic",
      "epfId",
      "UANNo",
      "PANNumber",
      "aadhaarNo",
      "bankName",
      "bankBranch",
      "dateofJoining",
    ];

    return requiredFields.every(
      (field) => employee[field] && employee[field].trim() !== ""
    );
  };

  const checkEmployeeId = async (employeeId) => {
    try {
      if (!employeeId) {
        setErrorMessage(false);
      }
      const response = await axios.post(`${url}/v1/api/employees/check`, {
        employeeId: employeeId,
      });
      if (response.data.exists) {
        setErrorMessage(true);
      } else {
        setErrorMessage(false);
      }
    } catch (error) {
      console.error("Error checking employeeId:", error);
      setErrorMessage("Failed to check employee ID");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEmployeeComplete()) {
      try {
        const response = await axios.post(`${url}/v1/api/employees`, {
          ...employee,
          password: password,
        });
        setEmployee(response.data);
        alert("Employee data submitted successfully");
        Navigate("/");
      } catch (error) {
        console.error("Failed to update employee:", error);
        setError("Failed to update employee data. Please try again.");
      }
    } else {
      const confirmSave = window.confirm(
        "Some fields are not filled. Do you want to save as draft?"
      );
      if (confirmSave) {
        const response = await axios.post(`${url}/v1/api/tempEmployee`, {
          employeeId: empID,
          EmployeeData: {
            ...employee,
            password: password,
          },
        });
        alert("Employee saved as draft.");
        Navigate("/");
      }
    }
  };

  return (
    <div className="maigdfffff">
      <div>
        <div className="formksjkskskskksksksk">
          <form onSubmit={handleSubmit}>
            <div className="doemrerjerer">
              <div>
                <div className="addpinpuaeehehdiv">
                  {employee && employee.employeePicture ? (
                    <img
                      className="addpinpuaeehehdiv"
                      src={`https://attendance.masttecmoulds.com/api${employee.employeePicture}`}
                      alt="Employee's Profile Photo"
                    />
                  ) : (
                    <div>
                      <label
                        htmlFor="file-upload1"
                        className="custom-file-upload"
                      >
                        <img
                          src="/images/InputPhotoAdd.png"
                          alt="Add Profile Photo Icon"
                        />
                      </label>
                      <input
                        id="file-upload1"
                        type="file"
                        value={employee.employeePicture}
                        onClick={(e) => (e.target.value = null)}
                        onChange={(e) =>
                          handleImageUpload(e, "employeePicture")
                        }
                      />
                      <div className="ADDPHOTOTOT">Add Photo</div>
                    </div>
                  )}
                </div>

                <div className="maxsixwee23444">Max size 2 Mb</div>
                <div>
                  <button
                    className="deleteimagebuttdodnd"
                    onClick={(e) => {
                      e.preventDefault();
                      setEmployee((prev) => ({
                        ...prev,
                        employeePicture: "",
                      }));
                    }}
                  >
                    Delete Image
                  </button>
                </div>
              </div>
              <div className="scrolldididdidi">
                <div className="Azcxcffcgfgf">Personal Details</div>
                <div className="sgsgsgsggs">
                  <div className="fsiwjejjewe">
                    <div className="mainduidhdb3b434">
                      <div>
                        <div className="zzMainogthencolciwejre">
                          <div className="eimplosusu3344h4">Employee Name</div>
                          <div>
                            <input
                              className="inputddidjdj"
                              type="text"
                              value={employee.employeeName || ""}
                              required
                              onChange={(e) =>
                                setEmployee((prev) => ({
                                  ...prev,
                                  employeeName: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Date of Birth</div>
                          <div>
                            <input
                              className="inputddidjdj"
                              type="date"
                              value={employee.dateOfBirth || ""}
                              required
                              onChange={(e) =>
                                setEmployee((prev) => ({
                                  ...prev,
                                  dateOfBirth: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Qualification</div>
                          <div>
                            <input
                              className="inputddidjdj"
                              type="text"
                              value={employee.qualification || ""}
                              onChange={(e) =>
                                setEmployee((prev) => ({
                                  ...prev,
                                  qualification: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Department</div>
                          <div>
                            <input
                              className="inputddidjdj"
                              type="text"
                              value={employee.department || ""}
                              onChange={(e) =>
                                setEmployee((prev) => ({
                                  ...prev,
                                  department: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Mobile Number</div>
                          <div>
                            <input
                              className="inputddidjdj"
                              type="tel"
                              value={employee.mobileNumber || ""}
                              onChange={(e) =>
                                setEmployee((prev) => ({
                                  ...prev,
                                  mobileNumber: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Password</div>
                          <div>
                            <input
                              className="inputddidjdj"
                              type="password"
                              value={password || ""}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <div>
                          <div className="zzMainogthencolciwejre">
                            <div className="eimplosusu3344h4">
                              Employee ID
                              {errorMessage && (
                                <span>{" - "} its already taken</span>
                              )}
                            </div>
                            <div>
                              <input
                                className="inputddidjdj"
                                type="number"
                                value={employee.employeeId || ""}
                                required
                                onChange={(e) => {
                                  const trimmedValue = e.target.value.replace(
                                    /\s+/g,
                                    ""
                                  );
                                  setEmployee((prev) => ({
                                    ...prev,
                                    employeeId: trimmedValue,
                                  }));
                                  checkEmployeeId(trimmedValue);
                                }}
                              />
                            </div>
                          </div>

                          <div className="Mainogthencolciwejre">
                            <div className="eimplosusu3344h4">Blood Group</div>
                            <div>
                              <input
                                className="inputddidjdj"
                                type="text"
                                value={employee.bloodGroup || ""}
                                onChange={(e) =>
                                  setEmployee((prev) => ({
                                    ...prev,
                                    bloodGroup: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className="Mainogthencolciwejre">
                            <div className="eimplosusu3344h4">Designation</div>
                            <div>
                              <input
                                className="inputddidjdj"
                                type="text"
                                value={employee.designation || ""}
                                onChange={(e) =>
                                  setEmployee((prev) => ({
                                    ...prev,
                                    designation: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className="Mainogthencolciwejre">
                            <div className="eimplosusu3344h4">
                              Department Code
                            </div>
                            <div>
                              <input
                                className="inputddidjdj"
                                type="text"
                                value={employee.departmentCode || ""}
                                onChange={(e) =>
                                  setEmployee((prev) => ({
                                    ...prev,
                                    departmentCode: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className="Mainogthencolciwejre">
                            <div className="eimplosusu3344h4">Mail Id</div>
                            <div>
                              <input
                                className="inputddidjdj"
                                type="email"
                                value={employee.mailId || ""}
                                onChange={(e) =>
                                  setEmployee((prev) => ({
                                    ...prev,
                                    mailId: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className="Mainogthencolciwejre">
                            <div className="eimplosusu3344h4">
                              Date of Joining
                            </div>
                            <div>
                              <input
                                className="inputddidjdj"
                                type="date"
                                value={employee.dateofJoining || ""}
                                onChange={(e) =>
                                  setEmployee((prev) => ({
                                    ...prev,
                                    dateofJoining: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="msisnsnjwj32434">
                      <div className="Mainogthencolciwejre">
                        <div className="eimplosusu3344h4">Address</div>
                        <div>
                          <textarea
                            className="sssinputddssidjdj"
                            name=""
                            id=""
                            value={employee.address || ""}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="docuenejhjwj343">Account Details</div>
                    <div className="mainduidhdb3b434">
                      <div>
                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">
                            Bank Account Number
                          </div>
                          <div>
                            <input
                              className="inputddidjdj"
                              type="text"
                              value={employee.bankAccountNumber || ""}
                              onChange={(e) =>
                                setEmployee((prev) => ({
                                  ...prev,
                                  bankAccountNumber: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Bank Branch</div>
                          <div>
                            <input
                              className="inputddidjdj"
                              type="text"
                              value={employee.bankBranch || ""}
                              onChange={(e) =>
                                setEmployee((prev) => ({
                                  ...prev,
                                  bankBranch: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Aadhaar No.</div>
                          <div>
                            <input
                              className="inputddidjdj"
                              type="text"
                              value={employee.aadhaarNo || ""}
                              onChange={(e) =>
                                setEmployee((prev) => ({
                                  ...prev,
                                  aadhaarNo: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <div>
                          <div className="Mainogthencolciwejre">
                            <div className="eimplosusu3344h4">Bank Name</div>
                            <div>
                              <input
                                className="inputddidjdj"
                                type="text"
                                value={employee.bankName || ""}
                                onChange={(e) =>
                                  setEmployee((prev) => ({
                                    ...prev,
                                    bankName: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className="Mainogthencolciwejre">
                            <div className="eimplosusu3344h4">IFSC Code</div>
                            <div>
                              <input
                                className="inputddidjdj"
                                type="text"
                                value={employee.bankIFSCCode || ""}
                                onChange={(e) =>
                                  setEmployee((prev) => ({
                                    ...prev,
                                    bankIFSCCode: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className="Mainogthencolciwejre">
                            <div className="eimplosusu3344h4">PAN Number</div>
                            <div>
                              <input
                                className="inputddidjdj"
                                type="text"
                                value={employee.PANNumber || ""}
                                onChange={(e) =>
                                  setEmployee((prev) => ({
                                    ...prev,
                                    PANNumber: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="docuenejhjwj343">Documents</div>
                      <div className="docyuwejj3jjflexsss">
                        <div>
                          {/* Address Proof */}
                          <div className="nsnsbssbbsvss">
                            <div className="adressshjssjj">Address Proof</div>
                            <div className="msaissbdfvdvdvdv">
                              {employee && employee.addressProof ? (
                                <img
                                  src={`https://attendance.masttecmoulds.com/api${employee.addressProof}`}
                                  alt="Address Proof"
                                  className="document-image"
                                />
                              ) : (
                                <>
                                  <div>
                                    <label
                                      htmlFor="file-upload-address"
                                      className="custom-file-upload"
                                    >
                                      <img
                                        src="/images/DocumenstIMAGE.png"
                                        alt="Upload Address Proof"
                                      />
                                    </label>
                                    <input
                                      id="file-upload-address"
                                      type="file"
                                      onClick={(e) => (e.target.value = null)}
                                      onChange={(e) =>
                                        handleImageUpload(e, "addressProof")
                                      }
                                    />
                                  </div>
                                  <div className="addphotototo">Add Photo</div>
                                </>
                              )}
                            </div>
                            <button
                              className="deleteimagebuttdodnd"
                              onClick={(e) => {
                                e.preventDefault();
                                setEmployee((prev) => ({
                                  ...prev,
                                  addressProof: "",
                                }));
                              }}
                            >
                              Delete Image
                            </button>
                          </div>

                          {/* Bank Passbook */}
                          <div className="nsnsbssbbsvss">
                            <div className="adressshjssjj">
                              Bank Passbook / Checkbook
                            </div>
                            <div className="msaissbdfvdvdvdv">
                              {employee && employee.passbookProof ? (
                                <img
                                  src={`https://attendance.masttecmoulds.com/api${employee.passbookProof}`}
                                  alt="Bank Passbook"
                                  className="document-image"
                                />
                              ) : (
                                <>
                                  <div>
                                    <label
                                      htmlFor="file-upload-passbook"
                                      className="custom-file-upload"
                                    >
                                      <img
                                        src="/images/DocumenstIMAGE.png"
                                        alt="Upload Bank Passbook"
                                      />
                                    </label>
                                    <input
                                      id="file-upload-passbook"
                                      type="file"
                                      onClick={(e) => (e.target.value = null)}
                                      onChange={(e) =>
                                        handleImageUpload(e, "passbookProof")
                                      }
                                    />
                                  </div>
                                  <div className="addphotototo">Add Photo</div>
                                </>
                              )}
                            </div>
                            <button
                              className="deleteimagebuttdodnd"
                              onClick={(e) => {
                                e.preventDefault();
                                setEmployee((prev) => ({
                                  ...prev,
                                  passbookProof: "",
                                }));
                              }}
                            >
                              Delete Image
                            </button>
                          </div>
                        </div>

                        <div>
                          {/* Education Certificate */}
                          <div className="nsnsbssbbsvss">
                            <div className="adressshjssjj">
                              Degree Certificate / Education Certificate
                            </div>
                            <div className="msaissbdfvdvdvdv">
                              {employee && employee.educationCertificate ? (
                                <img
                                  src={`${url}${employee.educationCertificate}`}
                                  alt="Education Certificate"
                                  className="document-image"
                                />
                              ) : (
                                <>
                                  <div>
                                    <label
                                      htmlFor="file-upload-education"
                                      className="custom-file-upload"
                                    >
                                      <img
                                        src="/images/DocumenstIMAGE.png"
                                        alt="Upload Education Certificate"
                                      />
                                    </label>
                                    <input
                                      id="file-upload-education"
                                      type="file"
                                      onClick={(e) => (e.target.value = null)}
                                      onChange={(e) =>
                                        handleImageUpload(
                                          e,
                                          "educationCertificate"
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="addphotototo">Add Photo</div>
                                </>
                              )}
                            </div>
                            <button
                              className="deleteimagebuttdodnd"
                              onClick={(e) => {
                                e.preventDefault();
                                setEmployee((prev) => ({
                                  ...prev,
                                  educationCertificate: "",
                                }));
                              }}
                            >
                              Delete Image
                            </button>
                          </div>

                          {/* PAN Card */}
                          <div className="nsnsbssbbsvss">
                            <div className="adressshjssjj">Pan Card</div>
                            <div className="msaissbdfvdvdvdv">
                              {employee && employee.PANCardProof ? (
                                <img
                                  src={`https://attendance.masttecmoulds.com/api${employee.PANCardProof}`}
                                  alt="PAN Card"
                                  className="document-image"
                                />
                              ) : (
                                <>
                                  <div>
                                    <label
                                      htmlFor="file-upload-pan"
                                      className="custom-file-upload"
                                    >
                                      <img
                                        src="/images/DocumenstIMAGE.png"
                                        alt="Upload PAN Card"
                                      />
                                    </label>
                                    <input
                                      id="file-upload-pan"
                                      type="file"
                                      onClick={(e) => (e.target.value = null)}
                                      onChange={(e) =>
                                        handleImageUpload(e, "PANCardProof")
                                      }
                                    />
                                  </div>
                                  <div className="addphotototo">Add Photo</div>
                                </>
                              )}
                            </div>
                            <button
                              className="deleteimagebuttdodnd"
                              onClick={(e) => {
                                e.preventDefault();
                                setEmployee((prev) => ({
                                  ...prev,
                                  PANCardProof: "",
                                }));
                              }}
                            >
                              Delete Image
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="docuenejhjwj343">Salary Details</div>
                    <div className="mainduidhdb3b434">
                      <div>
                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Salary</div>
                          <div>
                            <input
                              className="inputddidjdj"
                              type="text"
                              value={employee.salary || ""}
                              onChange={(e) =>
                                setEmployee((prev) => ({
                                  ...prev,
                                  salary: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">HRA</div>
                          <div>
                            <input
                              className="inputddidjdj"
                              type="text"
                              value={employee.hra || ""}
                              onChange={(e) =>
                                setEmployee((prev) => ({
                                  ...prev,
                                  hra: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">ESIC NO.</div>
                          <div>
                            <input
                              className="inputddidjdj"
                              type="text"
                              value={employee.esicId || ""}
                              onChange={(e) =>
                                setEmployee((prev) => ({
                                  ...prev,
                                  esicId: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">ALLOWANCE</div>
                          <div>
                            <input
                              className="inputddidjdj"
                              type="text"
                              value={employee.allowance || ""}
                              onChange={(e) =>
                                setEmployee((prev) => ({
                                  ...prev,
                                  allowance: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <div>
                          <div className="Mainogthencolciwejre">
                            <div className="eimplosusu3344h4">ESIC</div>
                            <div>
                              <input
                                className="inputddidjdj"
                                type="text"
                                value={employee.esic || ""}
                                onChange={(e) =>
                                  setEmployee((prev) => ({
                                    ...prev,
                                    esic: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className="Mainogthencolciwejre">
                            <div className="eimplosusu3344h4">EPF ID</div>
                            <div>
                              <input
                                className="inputddidjdj"
                                type="text"
                                value={employee.epfId || ""}
                                onChange={(e) =>
                                  setEmployee((prev) => ({
                                    ...prev,
                                    epfId: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div className="Mainogthencolciwejre">
                            <div className="eimplosusu3344h4">UAN No.</div>
                            <div>
                              <input
                                className="inputddidjdj"
                                type="text"
                                value={employee.UANNo || ""}
                                onChange={(e) =>
                                  setEmployee((prev) => ({
                                    ...prev,
                                    UANNo: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="buauuauauaghs">
                      <button
                        className="butsssonsubmitdivv"
                        disabled={errorMessage ? true : false}
                        style={
                          errorMessage
                            ? {
                                backgroundColor: "#ccc",
                                color: "#666",
                                cursor: "not-allowed",
                              }
                            : {}
                        }
                      >
                        Update Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
