import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import API_URL from '../global'; // Corrected import for API base URL
// You might want to create a simpler FileInput or reuse/adapt your existing one.
// For this example, I'll use basic HTML file inputs.

// Helper functions (these are similar to what you had in 3.EmployeeAttendanceList.js and DetailsModal)
const extractEmployeeNamesFromCSV = (csvContent) => {
    try {
      const lines = csvContent.split('\n');
      const employees = [];
      const employeeInfoRegex = /(\d+)\s*-\s*(.+)/;
      for (const line of lines) {
        if (line.includes('Staff :') && line.includes('-')) {
          const columns = line.split(',');
          for (const column of columns) {
            const match = column.match(employeeInfoRegex);
            if (match) {
              const employeeNumber = match[1];
              const employeeName = match[2].trim().replace(/"/g, '');
              employees.push({ number: employeeNumber, name: employeeName });
              break;
            }
          }
        }
      }
      return employees;
    } catch (error) {
      console.error("Error parsing CSV:", error);
      return [];
    }
  };

const groupEmployeeData = (data) => {
    const cleanData = data.filter(row => {
      const rowValues = Object.values(row);
      if (rowValues.length === 0) return false;
      const isUselessRow = rowValues.some(val => typeof val === 'string' && (val.includes('Monthly Attendance Performane Detail Report') || val.includes('Page ') || val.includes('Continue...') || val === 'MASTTEC MOULDS'));
      if (isUselessRow) return false;
      const isDateHeader = row['MASTTEC MOULDS'] === 'Status' && row['__EMPTY'] === '#';
      if (isDateHeader) return false;
      return true;
    });
    const employeeGroups = [];
    let currentGroup = [];
    cleanData.forEach(row => {
      const isNewEmployeeHeader = Object.values(row).some(val => typeof val === 'string' && val.includes('Department :'));
      if (isNewEmployeeHeader) {
        if (currentGroup.length > 0) employeeGroups.push(currentGroup);
        currentGroup = [];
      } else {
        currentGroup.push(row);
      }
    });
    if (currentGroup.length > 0) employeeGroups.push(currentGroup);
    return employeeGroups;
  };

const extractSummary = (employeeBlock) => {
    const summary = {};
    const summaryDataRow = employeeBlock[employeeBlock.length - 1];
    const summaryHeaderRow = employeeBlock[employeeBlock.length - 2];
    if (!summaryDataRow || !summaryHeaderRow) return null;
    const headerKeys = Object.keys(summaryHeaderRow);
    const dataKeys = Object.keys(summaryDataRow);
    headerKeys.forEach((key, index) => {
      const header = summaryHeaderRow[key];
      const dataKey = dataKeys[index];
      if (header && typeof header === 'string' && summaryDataRow[dataKey] !== undefined) {
        summary[header.trim()] = summaryDataRow[dataKey];
      }
    });
    return Object.keys(summary).length > 0 ? summary : null;
  };

const extractDateHeadersMap = (jsonData) => {
    const dateHeaderRow = jsonData.find(row => row['MASTTEC MOULDS'] === 'Status' && row['__EMPTY_2']?.match(/\d{2}-\d{2}/));
    if (!dateHeaderRow) return null;
    const map = new Map();
    for (const key in dateHeaderRow) {
      if (key !== '__EMPTY' && key !== 'MASTTEC MOULDS') {
        const date = dateHeaderRow[key];
        if (typeof date === 'string' && date.match(/\d{2}-\d{2}/)) {
          map.set(date, key); // date ("DD-MM") -> excelKey ("__EMPTY_2")
        }
      }
    }
    return map.size > 0 ? map : null;
  };

// Helper to parse various date formats into YYYY-MM-DD
const parseAndFormatDateToYYYYMMDD = (dateString) => {
  if (!dateString) return null;
  // Try parsing DD-MMM-YYYY (e.g., 01-May-2025)
  let parts = dateString.match(/(\d{2})-([A-Za-z]{3})-(\d{4})/);
  if (parts) {
    const day = parts[1];
    const monthStr = parts[2];
    const year = parts[3];
    const monthMap = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
    const month = monthMap[monthStr.charAt(0).toUpperCase() + monthStr.slice(1).toLowerCase()];
    if (month) return `${year}-${month}-${day}`;
  }
  // Try parsing DD-MM-YYYY (e.g., 01-05-2025)
  parts = dateString.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (parts) {
    return `${parts[3]}-${parts[2]}-${parts[1]}`;
  }
  // Add more parsers if needed or use a library like date-fns or dayjs for robust parsing
  console.warn(`Could not parse date: ${dateString}. Returning as is or null.`);
  return dateString; // Fallback or return null
};

const extractReportPeriodFromExcel = (jsonData, defaultDate) => {
    let fromDate = defaultDate;
    let toDate = defaultDate;
    for (const row of jsonData) {
        for (const key in row) {
            const cellValue = String(row[key]);
            const periodMatch = cellValue.match(/Period From\s*:\s*(\d{2}-(?:[A-Za-z]{3}|\d{2})-\d{4})\s*-\s*(\d{2}-(?:[A-Za-z]{3}|\d{2})-\d{4})/i);
            if (periodMatch) {
                const parsedFrom = parseAndFormatDateToYYYYMMDD(periodMatch[1]);
                const parsedTo = parseAndFormatDateToYYYYMMDD(periodMatch[2]);
                return { from: parsedFrom || defaultDate, to: parsedTo || defaultDate }; // Return as soon as found
            }
        }
    }
    return { from: fromDate, to: toDate };
  };

// Parses details for display on this page
const parseDetailsForDisplay = (employeeBlockDetails, dateMapObject) => {
    if (!dateMapObject || Object.keys(dateMapObject).length === 0) return [];
    const dataByCategory = new Map();
    employeeBlockDetails.forEach(row => {
        if (row['MASTTEC MOULDS']) {
            dataByCategory.set(row['MASTTEC MOULDS'].trim(), row);
        }
    });
    const detailedRecords = [];
    const categories = ['Status', 'Shift', 'Time In', 'Time Out', 'Worked Hrs.', 'Late', 'E.Out', 'OT 1', 'OT 2'];
    const sortedDates = Object.keys(dateMapObject).sort((a, b) => {
        const [dayA, monthA] = a.split('-').map(Number);
        const [dayB, monthB] = b.split('-').map(Number);
        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
    });
    sortedDates.forEach(dateStr => {
        const excelColumnKey = dateMapObject[dateStr];
        const record = { date: dateStr };
        categories.forEach(category => {
            const rowData = dataByCategory.get(category);
            record[category.toLowerCase().replace(/\s/g, '').replace('.', '')] = rowData && rowData[excelColumnKey] ? String(rowData[excelColumnKey]) : '—';
        });
        detailedRecords.push(record);
    });
    return detailedRecords;
};

// Parses details for backend payload
const parseDetailsForBackendPayload = (employeeBlockDetails, dateMapObject, reportYear) => {
    // This function is similar to parseEmployeeDetailsForBackend from 3.EmployeeAttendanceList.js
    // It structures the 'details' part of the payload for the backend.
    if (!dateMapObject || Object.keys(dateMapObject).length === 0) return [];
    const dataByCategory = new Map();
    employeeBlockDetails.forEach(row => {
        if (row['MASTTEC MOULDS']) {
            dataByCategory.set(row['MASTTEC MOULDS'].trim(), row);
        }
    });
    const detailedRecords = [];
    const frontendCategories = ['Status', 'Shift', 'Time In', 'Time Out', 'Worked Hrs.', 'Late', 'E.Out', 'OT 1', 'OT 2'];
    const sortedDates = Object.keys(dateMapObject).sort((a, b) => {
        const [dayA, monthA] = a.split('-').map(Number);
        const [dayB, monthB] = b.split('-').map(Number);
        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
    });

    sortedDates.forEach(dateStr => {
        const excelColumnKey = dateMapObject[dateStr];
        // dateStr is "DD-MM". Combine with reportYear for "YYYY-MM-DD"
        const [day, month] = dateStr.split('-');
        const fullDateForPayload = reportYear && day && month ? `${reportYear}-${month}-${day}` : dateStr; // Fallback to DD-MM if year is missing

        const record = { date: fullDateForPayload };

        frontendCategories.forEach(category => {
            const rowData = dataByCategory.get(category);
            let backendKey = category.toLowerCase().replace('.', ''); // Basic key conversion
            if (category === 'Worked Hrs.') backendKey = 'workedHrs';
            else if (category === 'E.Out') backendKey = 'earlyOut';
            else if (category === 'OT 1') backendKey = 'ot1';
            else if (category === 'OT 2') backendKey = 'ot2';
            else if (category === 'Time In') backendKey = 'timeIn';
            else if (category === 'Time Out') backendKey = 'timeOut';
            
            record[backendKey] = rowData && rowData[excelColumnKey] ? String(rowData[excelColumnKey]) : ''; // Default to empty string instead of '—'
        });
        detailedRecords.push(record);
    });
    return detailedRecords;
};


export default function UploadAttendancePage() {
  const [excelFile, setExcelFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processedAttendanceData, setProcessedAttendanceData] = useState([]); // To store data for display and saving
  const [reportPeriod, setReportPeriod] = useState({ from: '', to: '' });
  const [dateHeadersForPayload, setDateHeadersForPayload] = useState([]); // For backend payload
  const [dateMapForDisplay, setDateMapForDisplay] = useState(null); // For display parsing
  const [processedData, setProcessedData] = useState([]);
  const [dateHeadersMap, setDateHeadersMap] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleFileChange = (event, type) => {
    const file = event.target.files[0];
    if (type === 'excel') {
      setExcelFile(file);
    } else if (type === 'csv') {
      setCsvFile(file);
    }
    setMessage('');
    setProcessedAttendanceData([]); // Clear previous processed data
  };

  const handleProcessFiles = async () => {
    if (!excelFile || !csvFile) {
      setMessage('Please upload both Excel and CSV files.');
      return;
    }
    setIsProcessing(true);
    setMessage('Processing files...');
    setProcessedAttendanceData([]);

    try {
      const excelReader = new FileReader();
      const excelReadPromise = new Promise((resolve, reject) => {
        excelReader.onload = (e) => { try { const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, { type: 'array' }); const sheetName = workbook.SheetNames[0]; const worksheet = workbook.Sheets[sheetName]; resolve(XLSX.utils.sheet_to_json(worksheet)); } catch (error) { reject(new Error('Error parsing Excel file.')); }};
        excelReader.onerror = () => reject(new Error('Failed to read Excel file.'));
        excelReader.readAsArrayBuffer(excelFile);
      });
      const jsonDataFromExcel = await excelReadPromise;

      const csvReader = new FileReader();
      const csvReadPromise = new Promise((resolve, reject) => { csvReader.onload = (e) => resolve(e.target.result); csvReader.onerror = () => reject(new Error('Failed to read CSV file.')); csvReader.readAsText(csvFile); });
      const csvContent = await csvReadPromise;

      const employeesFromCSV = extractEmployeeNamesFromCSV(csvContent);
      const employeeDataGroupsFromExcel = groupEmployeeData(jsonDataFromExcel);
      const extractedDateMap = extractDateHeadersMap(jsonDataFromExcel); // This is a Map

      // Set date map for display functions
      setDateMapForDisplay(extractedDateMap);

      const today = new Date().toISOString().split("T")[0];
      const extractedReportPeriod = extractReportPeriodFromExcel(jsonDataFromExcel, today);
      setReportPeriod(extractedReportPeriod);

      // Set date headers for backend payload, now including the year
      if(extractedDateMap && extractedReportPeriod.from) {
        const reportYear = extractedReportPeriod.from.split('-')[0]; // Extract YYYY from "YYYY-MM-DD"
        const fullDateHeaders = Array.from(extractedDateMap.keys()).map(ddmm => `${reportYear}-${ddmm.split('-')[1]}-${ddmm.split('-')[0]}`); // YYYY-MM-DD
        setDateHeadersForPayload(fullDateHeaders);
      }


      if (employeesFromCSV.length === 0 || employeeDataGroupsFromExcel.length === 0 || !extractedDateMap || extractedDateMap.size === 0) {
        throw new Error('Could not process files. Check format, content, or date headers.');
      }

      const mergedData = [];
      employeeDataGroupsFromExcel.forEach((group, index) => {
        const summary = extractSummary(group);
        if (summary && employeesFromCSV[index]) {
          mergedData.push({ 
            ...employeesFromCSV[index], // number, name
            summary: summary, // Raw summary from excel
            rawDetails: group, // Raw detail block from excel for this employee
          });
        }
      });
      
      const reportYearForPayload = extractedReportPeriod.from ? extractedReportPeriod.from.split('-')[0] : new Date().getFullYear().toString();
      // Now, structure the data for display and for the backend payload
      const finalProcessedData = mergedData.map(emp => ({
        ...emp,
        // Details structured for display on this page
        displayDetails: parseDetailsForDisplay(emp.rawDetails, Object.fromEntries(extractedDateMap)),
        // Details structured for the backend payload
        payloadDetails: parseDetailsForBackendPayload(emp.rawDetails, Object.fromEntries(extractedDateMap), reportYearForPayload)
      }));

      setProcessedAttendanceData(finalProcessedData);
      setMessage('Files processed successfully. Review the data below and click "Save Attendance".');

    } catch (err) {
      setMessage(`Error processing files: ${err.message || 'Unexpected error.'}`);
      setProcessedAttendanceData([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveData = async () => {
    if (processedAttendanceData.length === 0) {
      setMessage('No processed data to save.');
      return;
    }
    setIsSaving(true);
    setMessage('Saving data to backend...');

    try {
      // Prepare the payload for the backend
      // The backend expects 'attendanceData' where each item has 'number', 'name', 'summary', and 'details'
      // 'details' should be the structured daily records.
      const payloadData = processedAttendanceData.map(emp => ({
        number: emp.number,
        name: emp.name,
        summary: emp.summary, // Assuming summary is already in a good format or backend handles it
        details: emp.payloadDetails, // Use the details structured for the backend
        // department, designation, category, branch might be needed if your backend expects them at this level
        // If they are part of the CSV and extracted into emp.number, emp.name, etc., ensure they are included.
        // For now, assuming backend's csvExcelExtractor.processAttendanceData handles this.
      }));

      const payload = {
        attendanceData: payloadData,
        dateHeaders: dateHeadersForPayload, // Now an array of "YYYY-MM-DD" date strings
        reportPeriod: reportPeriod, // { from: "YYYY-MM-DD", to: "YYYY-MM-DD" }
      };
      const response = await axios.post(`${API_URL}/v1/api/uploads/upload-csv-excel`, payload);

      if (response.data.success) {
        setMessage('Attendance data saved successfully!');
        setProcessedAttendanceData([]); // Clear data after saving
        setExcelFile(null);
        setCsvFile(null);
        // Optionally, reset file input fields
        document.getElementById('excel-file-input').value = null;
        document.getElementById('csv-file-input').value = null;
      } else {
        setMessage(`Backend Error: ${response.data.message || 'Failed to save data.'}`);
      }
    } catch (error) {
      setMessage(`Save Error: ${error.response?.data?.message || error.message || 'Unknown error.'}`);
      console.error('Save error:', error.response?.data || error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Define summary headers based on a typical summary structure
  const summaryHeaders = ['Present', 'Paid Leave', 'Lop', 'Weekly Off', 'Holiday', 'On Duty', 'Absent', 'Worked Hrs.', 'Late', 'E.Out', 'OT 1', 'OT 2', 'OT All'];
  // Define detail headers for the daily records table
  const detailDisplayHeaders = ['Date', 'Status', 'Shift', 'Time In', 'Time Out', 'Worked Hrs.', 'Late', 'E.Out', 'OT 1', 'OT 2'];

  
  const UploadBox = ({ label, accept, onFileSelect, file }) => {
    const handleDrop = useCallback((e) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        onFileSelect(droppedFile);
      }
    }, [onFileSelect]);

    const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        onFileSelect(selectedFile);
      }
    };

    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    return (
      <div
        onDragEnter={preventDefaults}
        onDragOver={preventDefaults}
        onDrop={handleDrop}
        style={{
          width: 300,
          height: 250,
          backgroundColor: '#f9f9f9',
          border: '2px dashed #3c3b6e',
          borderRadius: '15px',
          textAlign: 'center',
          padding: '20px',
          margin: '10px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          transition: '0.3s ease-in-out'
        }}
      >
        <div style={{ fontSize: '48px', color: '#3c3b6e', marginBottom: '15px' }}>
          <FontAwesomeIcon icon={faUpload} />
        </div>
        <p style={{ fontSize: '14px', color: '#1b2356' }}>Drag file to upload, or</p>
        <label
          style={{
            display: 'inline-block',
            marginTop: '10px',
            padding: '10px 20px',
            backgroundColor: '#1b2356',
            color: 'white',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          Choose File
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
        <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#333' }}>
          {file ? file.name : label}
        </p>
      </div>
    );
  };


 return (
  <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
    <h1 style={{ fontSize: '1.8rem', marginBottom: '20px', textAlign: 'center' }}>
      Upload and Process Attendance
    </h1>

    {/* Upload Section */}
    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
      <UploadBox
        label="Upload Attendance Excel (.xls)"
        accept=".xlsx,.xls"
        file={excelFile}
        onFileSelect={(file) => handleFileChange({ target: { files: [file] } }, 'excel')}
      />
      <UploadBox
        label="Upload Employee Info CSV (.csv)"
        accept=".csv"
        file={csvFile}
        onFileSelect={(file) => handleFileChange({ target: { files: [file] } }, 'csv')}
      />
    </div>

    {/* Process Button */}
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
      <button
        onClick={handleProcessFiles}
        disabled={isProcessing || !excelFile || !csvFile}
        style={{
          padding: '10px 25px',
          backgroundColor: '#1b2356',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          fontSize: '15px',
          cursor: 'pointer',
          minWidth: '180px'
        }}
      >
        {isProcessing ? 'Processing...' : 'Process Files'}
      </button>
    </div>

    {/* Message Feedback */}
    {message && (
      <p style={{
        marginTop: '15px',
        textAlign: 'center',
        color: message.startsWith('Error') || message.startsWith('Backend Error') ? 'red' : 'green',
        fontWeight: 'bold',
        fontSize: '15px'
      }}>
        {message}
      </p>
    )}

    {/* Data Table Output */}
    {processedAttendanceData.length > 0 && (
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '10px' }}>Processed Attendance Data</h2>

        {/* Save Button */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <button
            onClick={handleSaveData}
            disabled={isSaving}
            style={{
              padding: '10px 25px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              borderRadius: '5px',
              border: '1px solid #ccc',
              backgroundColor: '#f5f5f5',
              color: '#333'
            }}
          >
            {isSaving ? 'Saving...' : 'Save All Attendance Data'}
          </button>
        </div>

        {/* Individual Employee Reports */}
        {processedAttendanceData.map((employee, empIndex) => (
          <div
            key={empIndex}
            style={{
              marginBottom: '40px',
              border: '2px solid #ddd',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}
          >
            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
              <span style={{ color: '#1b2356', fontWeight: 600 }}>
                {employee.name} ({employee.number})
              </span>
            </h3>

            {/* Summary Table */}
            <h4 style={{ marginTop: '10px', marginBottom: '5px', fontWeight: '600' }}>Summary:</h4>
            <table
              border="1"
              cellPadding="6"
              cellSpacing="0"
              style={{ width: '100%', marginBottom: '20px', fontSize: '0.9em', borderCollapse: 'collapse' }}
            >
              <thead style={{ backgroundColor: '#f0f0f0' }}>
                <tr>
                  {summaryHeaders.map(header => (
                    <th key={header} style={{ padding: '8px', textAlign: 'center' }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {summaryHeaders.map(header => (
                    <td key={header} style={{ textAlign: 'center' }}>
                      {employee.summary[header] !== undefined ? employee.summary[header] : '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* Detailed Table */}
            <h4 style={{ marginTop: '10px', marginBottom: '5px', fontWeight: '600' }}>Daily Details:</h4>
            {employee.displayDetails && employee.displayDetails.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table
                  border="1"
                  cellPadding="6"
                  cellSpacing="0"
                  style={{ width: '100%', fontSize: '0.88em', borderCollapse: 'collapse' }}
                >
                  <thead style={{ backgroundColor: '#fafafa' }}>
                    <tr>
                      {detailDisplayHeaders.map(header => (
                        <th key={header} style={{ padding: '8px', textAlign: 'center' }}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employee.displayDetails.map((detailRecord, recIndex) => (
                      <tr key={recIndex}>
                        {detailDisplayHeaders.map(header => {
                          const key = header.toLowerCase().replace(/\s/g, '').replace('.', '');
                          const value = detailRecord[key] || '—';
                          const isLate = header.toLowerCase().includes('late') && value !== '—';
                          const isOT = header.toLowerCase().includes('ot') && value !== '—';

                          return (
                            <td
                              key={header}
                              style={{
                                textAlign: 'center',
                                color: isLate ? 'red' : isOT ? 'green' : '#333',
                                fontWeight: isLate || isOT ? 'bold' : 'normal'
                              }}
                            >
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No daily details to display for this employee.</p>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

}
