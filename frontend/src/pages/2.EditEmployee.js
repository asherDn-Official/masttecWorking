import React, { useState, useEffect } from "react";
import axios from "axios";
import url from "../Components/global";
import ErrorPopup from "../Components/errorPopup";
import { useNavigate, useParams } from "react-router-dom";
import "../CSS/AddEmployeeCss.css";

export default function EditEmployee() {
  const { id: empID } = useParams();
  const Navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
  
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [touched, setTouched] = useState({});

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/v1/api/employees/${empID}`);
      setEmployee(response.data);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setErrorMessage("Error fetching employee data.");
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleImageUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("File size exceeds 2MB limit");
      setShowErrorPopup(true);
      return;
    }
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validImageTypes.includes(file.type)) {
      setErrorMessage("Only JPEG, JPG and PNG files are allowed");
      setShowErrorPopup(true);
      return;
    }

    if (!employee.employeeId) {
      setErrorMessage("Please enter Employee ID first");
      setShowErrorPopup(true);
      return;
    }

    const formData = new FormData();
    formData.append("employeeId", employee.employeeId);
    formData.append("additionalText", fieldName);
    formData.append("file", file);

    try {
      setLoading(true);
      const response = await axios.post(`${url}/v1/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      if (response.data.url) {
        setEmployee((prev) => ({ ...prev, [fieldName]: response.data.url }));
      } else {
        setErrorMessage("No URL returned from backend.");
        setShowErrorPopup(true);
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      setErrorMessage("Image upload failed. Please try again.");
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const validateField = (name, value) => {
    let error = "";
    
    switch (name) {
      case "employeeName":
        if (!value?.trim()) error = "Employee name is required";
        else if (!/^[a-zA-Z\s]+$/.test(value)) error = "Name can only contain letters and spaces";
        break;
      case "employeeId":
        if (!value?.trim()) error = "Employee ID is required";
        else if (errorMessage) error = "Employee ID is already taken";
        break;
      case "mailId":
        if (!value?.trim()) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email format";
        break;
      case "mobileNumber":
        if (!value?.trim()) error = "Mobile number is required";
        else if (!/^\d{10}$/.test(value)) error = "Mobile number must be 10 digits";
        break;
      case "dateOfBirth":
        if (!value) error = "Date of birth is required";
        else if (new Date(value) >= new Date()) error = "Date of birth must be in the past";
        break;
      case "dateofJoining":
        if (!value) error = "Date of joining is required";
        break;
      case "bankAccountNumber":
        if (!value?.trim()) error = "Bank account number is required";
        else if (!/^\d{9,18}$/.test(value)) error = "Invalid bank account number";
        break;
      case "bankIFSCCode":
        if (!value?.trim()) error = "IFSC code is required";
        else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) error = "Invalid IFSC code format";
        break;
      case "aadhaarNo":
        if (!value?.trim()) error = "Aadhaar number is required";
        else if (!/^\d{12}$/.test(value)) error = "Aadhaar must be 12 digits";
        break;
      case "PANNumber":
        if (!value?.trim()) error = "PAN number is required";
        else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) error = "Invalid PAN format";
        break;
      case "salary":
      case "hra":
      case "allowance":
        if (!value?.trim()) error = "This field is required";
        else if (!/^\d+$/.test(value)) error = "Must be a valid number";
        break;
      default:
        if (!value?.trim()) error = "This field is required";
    }
    
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee({ ...employee, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    
    // Special handling for employeeId to check uniqueness
    if (name === "employeeId") {
      const formattedValue = value.replace(/\s+/g, "");
      setEmployee((prev) => ({ ...prev, employeeId: formattedValue }));
      checkEmployeeId(formattedValue);
    }
  };

  const checkEmployeeId = async (employeeId) => {
    try {
      if (!employeeId) {
        setErrorMessage("");
        return;
      }
      
      const response = await axios.post(`${url}/v1/api/employees/check`, {
        employeeId: employeeId,
      });
      
      setErrorMessage(response.data.exists ? "Employee ID already exists" : "");
      
      if (response.data.exists) {
        setErrors({ ...errors, employeeId: "Employee ID already exists" });
      }
    } catch (error) {
      console.error("Error checking employeeId:", error);
      setErrorMessage("Failed to check employee ID");
      setShowErrorPopup(true);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      "employeeName", "employeeId", "designation", "dateOfBirth", 
      "qualification", "bloodGroup", "mobileNumber", "mailId", "address",
      "bankAccountNumber", "bankIFSCCode", "PANNumber", "department", 
      "departmentCode", "aadhaarNo", "bankName", "bankBranch", "dateofJoining",
      "salary", "hra", "allowance", "esicId", "esic", "epfId", "UANNo"
    ];

    requiredFields.forEach(field => {
      const error = validateField(field, employee[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    setTouched(
      requiredFields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {})
    );

    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    setErrorMessage("Please fix the errors in the form");
    setShowErrorPopup(true);
    return;
  }

  try {
    setLoading(true);
    // Remove password from the data since backend generates it from DOB
    const { password, ...employeeData } = employee;
    await axios.put(`${url}/v1/api/employees/${empID}`, {
      employee: employeeData  // Nest data under "employee" key
    });
    
    alert("Employee data updated successfully");
    Navigate("/employeeDatails");
  } catch (error) {
    console.error("Failed to update employee:", error);
    setErrorMessage("Failed to update employee data. Please try again.");
    setShowErrorPopup(true);
  } finally {
    setLoading(false);
  }
};

  const handleDeleteImage = (fieldName) => {
    setEmployee((prev) => ({ ...prev, [fieldName]: "" }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading employee data...</p>
      </div>
    );
  }

  return (
    <div className="employee-edit-container">
      {showErrorPopup && (
        <ErrorPopup 
          error={errorMessage} 
          onClose={() => setShowErrorPopup(false)} 
        />
      )}
      
      <div className="form-header">
        <h1>Edit Employee</h1>
        <p>Update employee information below</p>
      </div>

      <form onSubmit={handleSubmit} className="employee-form">
        {/* Profile Picture Section */}
        <div className="form-section">
          <h2 className="section-title">Profile Picture</h2>
          <div className="profile-picture-container">
            <div className="image-upload-container">
              {employee.employeePicture ? (
                <div className="image-preview">
                  <img 
                    src={`https://attendance.masttecmoulds.com/api${employee.employeePicture}`} 
                    alt="Employee's Profile" 
                    className="profile-image"
                  />
                  <button 
                    type="button"
                    className="delete-image-btn"
                    onClick={() => handleDeleteImage("employeePicture")}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <label htmlFor="file-upload1" className="file-upload-label">
                    <div className="upload-icon">
                      <img src="/images/InputPhotoAdd.png" alt="Add Profile" />
                    </div>
                    <span className="upload-text">Add Photo</span>
                    <span className="upload-subtext">Max size 2MB</span>
                  </label>
                  <input 
                    id="file-upload1" 
                    type="file" 
                    accept="image/jpeg, image/png, image/jpg"
                    onChange={(e) => handleImageUpload(e, "employeePicture")} 
                    className="file-input"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Details Section */}
        <div className="form-section">
          <h2 className="section-title">Personal Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="employeeName">Employee Name *</label>
              <input
                id="employeeName"
                name="employeeName"
                type="text"
                value={employee.employeeName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.employeeName ? "error" : ""}
              />
              {errors.employeeName && <span className="error-text">{errors.employeeName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="employeeId">Employee ID *</label>
              <input
                id="employeeId"
                name="employeeId"
                type="text"
                value={employee.employeeId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.employeeId ? "error" : ""}
              />
              {errors.employeeId && <span className="error-text">{errors.employeeId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={employee.dateOfBirth}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.dateOfBirth ? "error" : ""}
              />
              {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="bloodGroup">Blood Group</label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                value={employee.bloodGroup}
                onChange={handleChange}
                className={errors.bloodGroup ? "error" : ""}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              {errors.bloodGroup && <span className="error-text">{errors.bloodGroup}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="qualification">Qualification *</label>
              <input
                id="qualification"
                name="qualification"
                type="text"
                value={employee.qualification}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.qualification ? "error" : ""}
              />
              {errors.qualification && <span className="error-text">{errors.qualification}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="designation">Designation *</label>
              <input
                id="designation"
                name="designation"
                type="text"
                value={employee.designation}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.designation ? "error" : ""}
              />
              {errors.designation && <span className="error-text">{errors.designation}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="department">Department *</label>
              <input
                id="department"
                name="department"
                type="text"
                value={employee.department}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.department ? "error" : ""}
              />
              {errors.department && <span className="error-text">{errors.department}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="departmentCode">Department Code *</label>
              <input
                id="departmentCode"
                name="departmentCode"
                type="text"
                value={employee.departmentCode}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.departmentCode ? "error" : ""}
              />
              {errors.departmentCode && <span className="error-text">{errors.departmentCode}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="mobileNumber">Mobile Number *</label>
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                value={employee.mobileNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.mobileNumber ? "error" : ""}
              />
              {errors.mobileNumber && <span className="error-text">{errors.mobileNumber}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="mailId">Email ID *</label>
              <input
                id="mailId"
                name="mailId"
                type="email"
                value={employee.mailId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.mailId ? "error" : ""}
              />
              {errors.mailId && <span className="error-text">{errors.mailId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="dateofJoining">Date of Joining *</label>
              <input
                id="dateofJoining"
                name="dateofJoining"
                type="date"
                value={employee.dateofJoining}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.dateofJoining ? "error" : ""}
              />
              {errors.dateofJoining && <span className="error-text">{errors.dateofJoining}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={employee.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="form-section">
          <h2 className="section-title">Address</h2>
          <div className="form-group full-width">
            <label htmlFor="address">Address *</label>
            <textarea
              id="address"
              name="address"
              value={employee.address}
              onChange={handleChange}
              onBlur={handleBlur}
              rows="3"
              className={errors.address ? "error" : ""}
            />
            {errors.address && <span className="error-text">{errors.address}</span>}
          </div>
        </div>

        {/* Account Details Section */}
        <div className="form-section">
          <h2 className="section-title">Account Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="bankAccountNumber">Bank Account Number *</label>
              <input
                id="bankAccountNumber"
                name="bankAccountNumber"
                type="text"
                value={employee.bankAccountNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.bankAccountNumber ? "error" : ""}
              />
              {errors.bankAccountNumber && <span className="error-text">{errors.bankAccountNumber}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="bankName">Bank Name *</label>
              <input
                id="bankName"
                name="bankName"
                type="text"
                value={employee.bankName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.bankName ? "error" : ""}
              />
              {errors.bankName && <span className="error-text">{errors.bankName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="bankIFSCCode">IFSC Code *</label>
              <input
                id="bankIFSCCode"
                name="bankIFSCCode"
                type="text"
                value={employee.bankIFSCCode}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.bankIFSCCode ? "error" : ""}
              />
              {errors.bankIFSCCode && <span className="error-text">{errors.bankIFSCCode}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="bankBranch">Bank Branch *</label>
              <input
                id="bankBranch"
                name="bankBranch"
                type="text"
                value={employee.bankBranch}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.bankBranch ? "error" : ""}
              />
              {errors.bankBranch && <span className="error-text">{errors.bankBranch}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="aadhaarNo">Aadhaar Number *</label>
              <input
                id="aadhaarNo"
                name="aadhaarNo"
                type="text"
                value={employee.aadhaarNo}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.aadhaarNo ? "error" : ""}
              />
              {errors.aadhaarNo && <span className="error-text">{errors.aadhaarNo}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="PANNumber">PAN Number *</label>
              <input
                id="PANNumber"
                name="PANNumber"
                type="text"
                value={employee.PANNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.PANNumber ? "error" : ""}
              />
              {errors.PANNumber && <span className="error-text">{errors.PANNumber}</span>}
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="form-section">
          <h2 className="section-title">Documents</h2>
          <div className="documents-grid">
            <DocumentUpload 
              title="Address Proof"
              fieldName="addressProof"
              documentUrl={employee.addressProof}
              onUpload={handleImageUpload}
              onDelete={handleDeleteImage}
            />
            
            <DocumentUpload 
              title="Bank Passbook/Checkbook"
              fieldName="passbookProof"
              documentUrl={employee.passbookProof}
              onUpload={handleImageUpload}
              onDelete={handleDeleteImage}
            />
            
            <DocumentUpload 
              title="Education Certificate"
              fieldName="educationCertificate"
              documentUrl={employee.educationCertificate}
              onUpload={handleImageUpload}
              onDelete={handleDeleteImage}
            />
            
            <DocumentUpload 
              title="PAN Card"
              fieldName="PANCardProof"
              documentUrl={employee.PANCardProof}
              onUpload={handleImageUpload}
              onDelete={handleDeleteImage}
            />
          </div>
        </div>

        {/* Salary Details Section */}
        <div className="form-section">
          <h2 className="section-title">Salary Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="salary">Salary *</label>
              <input
                id="salary"
                name="salary"
                type="text"
                value={employee.salary}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.salary ? "error" : ""}
              />
              {errors.salary && <span className="error-text">{errors.salary}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="hra">HRA *</label>
              <input
                id="hra"
                name="hra"
                type="text"
                value={employee.hra}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.hra ? "error" : ""}
              />
              {errors.hra && <span className="error-text">{errors.hra}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="allowance">Allowance *</label>
              <input
                id="allowance"
                name="allowance"
                type="text"
                value={employee.allowance}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.allowance ? "error" : ""}
              />
              {errors.allowance && <span className="error-text">{errors.allowance}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="esic">ESIC *</label>
              <input
                id="esic"
                name="esic"
                type="text"
                value={employee.esic}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.esic ? "error" : ""}
              />
              {errors.esic && <span className="error-text">{errors.esic}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="esicId">ESIC ID *</label>
              <input
                id="esicId"
                name="esicId"
                type="text"
                value={employee.esicId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.esicId ? "error" : ""}
              />
              {errors.esicId && <span className="error-text">{errors.esicId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="epfId">EPF ID *</label>
              <input
                id="epfId"
                name="epfId"
                type="text"
                value={employee.epfId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.epfId ? "error" : ""}
              />
              {errors.epfId && <span className="error-text">{errors.epfId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="UANNo">UAN Number *</label>
              <input
                id="UANNo"
                name="UANNo"
                type="text"
                value={employee.UANNo}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.UANNo ? "error" : ""}
              />
              {errors.UANNo && <span className="error-text">{errors.UANNo}</span>}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => Navigate("/employee-list")}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading || Object.keys(errors).some(key => errors[key])}
          >
            {loading ? "Updating..." : "Update Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Document Upload Component
function DocumentUpload({ title, fieldName, documentUrl, onUpload, onDelete }) {
  return (
    <div className="document-upload">
      <h3>{title}</h3>
      <div className="document-preview">
        {documentUrl ? (
          <>
            <img 
              src={`https://attendance.masttecmoulds.com/api${documentUrl}`} 
              alt={title}
              className="document-image"
            />
            <button 
              type="button"
              className="delete-document-btn"
              onClick={() => onDelete(fieldName)}
            >
              ×
            </button>
          </>
        ) : (
          <label htmlFor={`file-upload-${fieldName}`} className="document-upload-label">
            <div className="document-upload-icon">
              <img src="/images/DocumenstIMAGE.png" alt="Upload document" />
            </div>
            <span className="document-upload-text">Upload Document</span>
            <span className="document-upload-subtext">Max size 2MB</span>
          </label>
        )}
        <input
          id={`file-upload-${fieldName}`}
          type="file"
          accept="image/jpeg, image/png, image/jpg"
          onChange={(e) => onUpload(e, fieldName)}
          className="document-file-input"
        />
      </div>
    </div>
  );
}