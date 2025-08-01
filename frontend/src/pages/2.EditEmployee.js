import React, { useState, useEffect } from "react";
import axios from "axios";
import url from "../Components/global";
import ErrorPopup from "../Components/errorPopup";
import { useNavigate, useParams } from "react-router-dom";
import "../CSS/AddEmployeeCss.css";

export default function EditEmployee() {
  const { id: empID } = useParams();
  const Navigate = useNavigate();
  const [employee, setEmployee] = useState({
    employeePicture: "",
    employeeName: "",
    employeeId: "",
    designation: "",
    dateOfBirth: "",
    allowance: "",
    qualification: "",
    bloodGroup: "",
    mobileNumber: "",
    mailId: "",
    address: "",
    bankAccountNumber: "",
    bankIFSCCode: "",
    PANNumber: "",
    addressProof: "",
    educationCertificate: "",
    passbookProof: "",
    PANCardProof: "",
    department: "",
    departmentCode: "",
    aadhaarNo: "",
    bankName: "",
    bankBranch: "",
    dateofJoining: "",
    salary: "",
    hra: "",
    esic: "",
    esicId: "",
    epfId: "",
    UANNo: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [errorMessage, setErrorMessage] = useState(false);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${url}/v1/api/employees/${empID}`);
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
    if (!employee.employeeId) return alert("Enter Employee Id");

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
      setError("Image upload failed. Please try again.");
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
      (field) => employee[field] && employee[field].toString().trim() !== ""
    );
  };

  const checkEmployeeId = async (employeeId) => {
    try {
      if (!employeeId) {
        setErrorMessage(false);
        return;
      }

      const response = await axios.post(`${url}/v1/api/employees/check`, {
        employeeId: employeeId,
      });

      setErrorMessage(response.data.exists);
    } catch (error) {
      console.error("Error checking employeeId:", error);
      setErrorMessage("Failed to check employee ID");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${url}/v1/api/employees/${empID}`, {
        ...employee,
        password: employee.password,
      });

      alert("Employee data updated successfully");
      Navigate("/employee-list");
    } catch (error) {
      console.error("Failed to update employee:", error);
      setError("Failed to update employee data. Please try again.");
    }
  };

  return (
    <div className="maigdfffff">
      {error && <ErrorPopup error={error} setError={setError} />}

      <div>
        <div className="formksjkskskskksksksk">
          <form onSubmit={handleSubmit}>
            <div className="doemrerjerer">
              {/* Profile Picture Section */}
              <div>
                <div className="addpinpuaeehehdiv">
                  {employee.employeePicture ? (
                    <img
                      className="addpinpuaeehehdiv"
                      src={`https://attendance.masttecmoulds.com/api${employee.employeePicture}`}
                      alt="Employee's Profile"
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
                      setEmployee((prev) => ({ ...prev, employeePicture: "" }));
                    }}
                  >
                    Delete Image
                  </button>
                </div>
              </div>

              {/* Form Fields Section */}
              <div className="scrolldididdidi">
                <div className="Azcxcffcgfgf">Personal Details</div>

                <div className="sgsgsgsggs">
                  <div className="fsiwjejjewe">
                    {/* Personal Details Columns */}
                    <div className="mainduidhdb3b434">
                      {/* Left Column */}
                      <div>
                        <div className="zzMainogthencolciwejre">
                          <div className="eimplosusu3344h4">Employee Name</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.employeeName}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                employeeName: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Date of Birth</div>
                          <input
                            className="inputddidjdj"
                            type="date"
                            value={employee.dateOfBirth}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                dateOfBirth: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Qualification</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.qualification}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                qualification: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Department</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.department}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                department: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Mobile Number</div>
                          <input
                            className="inputddidjdj"
                            type="tel"
                            value={employee.mobileNumber}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                mobileNumber: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Password</div>
                          <input
                            className="inputddidjdj"
                            type="password"
                            value={employee.password}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                password: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      {/* Right Column */}
                      <div>
                        <div className="zzMainogthencolciwejre">
                          <div className="eimplosusu3344h4">
                            Employee ID {errorMessage && "(Already taken)"}
                          </div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.employeeId}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\s+/g, "");
                              setEmployee((prev) => ({
                                ...prev,
                                employeeId: value,
                              }));
                              checkEmployeeId(value);
                            }}
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Blood Group</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.bloodGroup}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                bloodGroup: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Designation</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.designation}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                designation: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">
                            Department Code
                          </div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.departmentCode}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                departmentCode: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Mail Id</div>
                          <input
                            className="inputddidjdj"
                            type="email"
                            value={employee.mailId}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                mailId: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">
                            Date of Joining
                          </div>
                          <input
                            className="inputddidjdj"
                            type="date"
                            value={employee.dateofJoining}
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

                    {/* Address Section */}
                    <div className="msisnsnjwj32434">
                      <div className="Mainogthencolciwejre">
                        <div className="eimplosusu3344h4">Address</div>
                        <textarea
                          className="sssinputddssidjdj"
                          value={employee.address}
                          onChange={(e) =>
                            setEmployee((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    {/* Account Details Section */}
                    <div className="docuenejhjwj343">Account Details</div>
                    <div className="mainduidhdb3b434">
                      <div>
                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">
                            Bank Account Number
                          </div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.bankAccountNumber}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                bankAccountNumber: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Bank Branch</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.bankBranch}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                bankBranch: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Aadhaar No.</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.aadhaarNo}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                aadhaarNo: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Bank Name</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.bankName}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                bankName: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">IFSC Code</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.bankIFSCCode}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                bankIFSCCode: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">PAN Number</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.PANNumber}
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

                    {/* Documents Section */}
                    <div>
                      <div className="docuenejhjwj343">Documents</div>
                      <div className="docyuwejj3jjflexsss">
                        {/* Left Documents Column */}
                        <div>
                          <div className="nsnsbssbbsvss">
                            <div className="adressshjssjj">Address Proof</div>
                            <div className="msaissbdfvdvdvdv">
                              {employee.addressProof ? (
                                <img
                                  src={`https://attendance.masttecmoulds.com/api${employee.addressProof}`}
                                  alt="Address Proof"
                                  className="document-image"
                                />
                              ) : (
                                <>
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

                          <div className="nsnsbssbbsvss">
                            <div className="adressshjssjj">
                              Bank Passbook / Checkbook
                            </div>
                            <div className="msaissbdfvdvdvdv">
                              {employee.passbookProof ? (
                                <img
                                  src={`https://attendance.masttecmoulds.com/api${employee.passbookProof}`}
                                  alt="Bank Passbook"
                                  className="document-image"
                                />
                              ) : (
                                <>
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

                        {/* Right Documents Column */}
                        <div>
                          <div className="nsnsbssbbsvss">
                            <div className="adressshjssjj">
                              Degree Certificate / Education Certificate
                            </div>
                            <div className="msaissbdfvdvdvdv">
                              {employee.educationCertificate ? (
                                <img
                                  src={`${url}${employee.educationCertificate}`}
                                  alt="Education Certificate"
                                  className="document-image"
                                />
                              ) : (
                                <>
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

                          <div className="nsnsbssbbsvss">
                            <div className="adressshjssjj">Pan Card</div>
                            <div className="msaissbdfvdvdvdv">
                              {employee.PANCardProof ? (
                                <img
                                  src={`https://attendance.masttecmoulds.com/api${employee.PANCardProof}`}
                                  alt="PAN Card"
                                  className="document-image"
                                />
                              ) : (
                                <>
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

                    {/* Salary Details Section */}
                    <div className="docuenejhjwj343">Salary Details</div>
                    <div className="mainduidhdb3b434">
                      <div>
                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">Salary</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.salary}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                salary: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">HRA</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.hra}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                hra: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">ESIC NO.</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.esicId}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                esicId: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">ALLOWANCE</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.allowance}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                allowance: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">ESIC</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.esic}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                esic: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">EPF ID</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.epfId}
                            onChange={(e) =>
                              setEmployee((prev) => ({
                                ...prev,
                                epfId: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="Mainogthencolciwejre">
                          <div className="eimplosusu3344h4">UAN No.</div>
                          <input
                            className="inputddidjdj"
                            type="text"
                            value={employee.UANNo}
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

                    {/* Submit Button */}
                    <div className="buauuauauaghs">
                      <button
                        className="butsssonsubmitdivv"
                        type="submit"
                        disabled={errorMessage}
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
