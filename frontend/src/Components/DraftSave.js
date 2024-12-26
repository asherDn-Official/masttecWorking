import React, { useState, useEffect } from "react";
import axios from "axios";
import url from "./global";
import ErrorPopup from "./errorPopup";
import { useNavigate, useParams } from "react-router-dom";
import "../CSS/AddEmployeeCss.css";
import EmployeeData from "./4.EmployeeData";

export default function DraftEmployee() {
  const [employee, setEmployee] = useState({});
  const Navigate = useNavigate();
  const { id: empID } = useParams();
  const [error, setError] = useState("");
  const [errorMessage, setErrorMessage] = useState(false);
  //console.log(empID);
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
        // Update employee state with the uploaded image URL
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

    // Reset the input file value after upload
    e.target.value = null;
  };

  const isEmployeeComplete = () => {
    // Check if all required fields are filled
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
      "epf",
      "esicId",
      "esic",
      "epfId",
      "UANNo",
    ];

    // Ensure all required fields are present and not empty
    return requiredFields.every(
      (field) => employee[field] && employee[field].trim() !== ""
    );
  };
  const checkEmployeeId = async (employeeId) => {
    try {
      if (!employeeId) {
        setErrorMessage(false);
      }
      //setLoading(true);
      const response = await axios.post(`${url}/v1/api/employees/check`, {
        employeeId: employeeId,
      });
      if (response.data.exists) {
        setErrorMessage(true);
      } else {
        setErrorMessage(false); // No error if employeeId is unique
      }
    } catch (error) {
      console.error("Error checking employeeId:", error);
      setErrorMessage("Failed to check employee ID");
    } finally {
      //setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Fix: Invoke `isEmployeeComplete` function
    if (isEmployeeComplete()) {
      try {
        // Send updated employee data to the backend
        const response = await axios.post(`${url}/v1/api/employees`, employee);
        //console.log(response.data);
        setEmployee(response.data); // Update the state with the updated employee data
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
          EmployeeData: employee, // Changed to match the function
        });

        //console.log(response.data);
        // Logic to save the employee as a draft
        //console.log("Employee saved as draft:", employee);
        alert("Employee saved as draft.");
        Navigate("/");
      }
    }
  };

  //console.log(employee);
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
                      src={`http://localhost:4000${employee.employeePicture}`}
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
                                  setEmployee((prev) => ({
                                    ...prev,
                                    employeeId: e.target.value,
                                  }));

                                  checkEmployeeId(e.target.value);
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
                                  src={`http://localhost:4000${employee.addressProof}`}
                                  alt="Address Proof"
                                  class="document-image"
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
                                  src={`http://localhost:4000${employee.passbookProof}`}
                                  alt="Bank Passbook"
                                  class="document-image"
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
                                  src={`http://localhost:4000${employee.educationCertificate}`}
                                  alt="Education Certificate"
                                  class="document-image"
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
                                  src={`http://localhost:4000${employee.PANCardProof}`}
                                  alt="PAN Card"
                                  class="document-image"
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
                          <div className="eimplosusu3344h4">EPF</div>
                          <div>
                            <input
                              className="inputddidjdj"
                              type="text"
                              value={employee.epf || ""}
                              onChange={(e) =>
                                setEmployee((prev) => ({
                                  ...prev,
                                  epf: e.target.value,
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
                        //onClick={handleSubmit}
                        disabled={errorMessage ? true : false}
                        style={
                          errorMessage
                            ? {
                                backgroundColor: "#ccc", // Grey background
                                color: "#666", // Grey text color
                                cursor: "not-allowed", // Not-allowed cursor
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
