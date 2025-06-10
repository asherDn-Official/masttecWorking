import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
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

const extractReportPeriodFromExcel = (jsonData, defaultDate) => {
    let fromDate = defaultDate;
    let toDate = defaultDate;
    for (const row of jsonData) {
        for (const key in row) {
            const cellValue = String(row[key]);
            const periodMatch = cellValue.match(/Period From\s*:\s*(\d{2}-[A-Za-z]{3}-\d{4}|\d{2}-\d{2}-\d{4})\s*-\s*(\d{2}-[A-Za-z]{3}-\d{4}|\d{2}-\d{2}-\d{4})/i);
            if (periodMatch) {
                // Placeholder: In a real scenario, parse and format these dates to YYYY-MM-DD
                console.warn("Excel period found. Implement proper date parsing. Using default for now.", periodMatch[1], periodMatch[2]);
                // fromDate = parseAndFormatDate(periodMatch[1]);
                // toDate = parseAndFormatDate(periodMatch[2]);
                return { from: fromDate, to: toDate }; // Return as soon as found
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
const parseDetailsForBackendPayload = (employeeBlockDetails, dateMapObject) => {
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
        const record = { date: dateStr };
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
      // Set date headers for backend payload
      if(extractedDateMap) {
        setDateHeadersForPayload(Array.from(extractedDateMap.keys()));
      }


      const today = new Date().toISOString().split("T")[0];
      const extractedReportPeriod = extractReportPeriodFromExcel(jsonDataFromExcel, today);
      setReportPeriod(extractedReportPeriod);


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
      
      // Now, structure the data for display and for the backend payload
      const finalProcessedData = mergedData.map(emp => ({
        ...emp,
        // Details structured for display on this page
        displayDetails: parseDetailsForDisplay(emp.rawDetails, Object.fromEntries(extractedDateMap)),
        // Details structured for the backend payload
        payloadDetails: parseDetailsForBackendPayload(emp.rawDetails, Object.fromEntries(extractedDateMap))
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
        dateHeaders: dateHeadersForPayload, // Array of "DD-MM" date strings
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


  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Upload and Process Attendance</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
        <div>
          <label htmlFor="excel-file-input" style={{ display: 'block', marginBottom: '5px' }}>Upload Attendance Excel (.xlsx, .xls):</label>
          <input id="excel-file-input" type="file" accept=".xlsx,.xls" onChange={(e) => handleFileChange(e, 'excel')} />
        </div>
        <div>
          <label htmlFor="csv-file-input" style={{ display: 'block', marginBottom: '5px' }}>Upload Employee Info CSV (.csv):</label>
          <input id="csv-file-input" type="file" accept=".csv" onChange={(e) => handleFileChange(e, 'csv')} />
        </div>
      </div>

      <button onClick={handleProcessFiles} disabled={isProcessing || !excelFile || !csvFile} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        {isProcessing ? 'Processing...' : 'Process Files'}
      </button>
      
      {message && <p style={{ marginTop: '15px', color: message.startsWith('Error') || message.startsWith('Backend Error') ? 'red' : 'green', fontWeight: 'bold' }}>{message}</p>}

      {processedAttendanceData.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h2>Processed Attendance Data</h2>
          <button onClick={handleSaveData} disabled={isSaving} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>
            {isSaving ? 'Saving...' : 'Save All Attendance Data'}
          </button>

          {processedAttendanceData.map((employee, empIndex) => (
            <div key={empIndex} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
              <h3>{employee.name} ({employee.number})</h3>
              
              <h4>Summary:</h4>
              <table border="1" cellPadding="5" cellSpacing="0" style={{ width: '100%', marginBottom: '15px', fontSize: '0.9em' }}>
                <thead>
                  <tr>
                    {summaryHeaders.map(header => <th key={header}>{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {summaryHeaders.map(header => (
                      <td key={header}>{employee.summary[header] !== undefined ? employee.summary[header] : '—'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>

              <h4>Daily Details:</h4>
              {employee.displayDetails && employee.displayDetails.length > 0 ? (
                <table border="1" cellPadding="5" cellSpacing="0" style={{ width: '100%', fontSize: '0.9em' }}>
                  <thead>
                    <tr>
                      {detailDisplayHeaders.map(header => <th key={header}>{header}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {employee.displayDetails.map((detailRecord, recIndex) => (
                      <tr key={recIndex}>
                        {detailDisplayHeaders.map(header => (
                           <td key={header}>{detailRecord[header.toLowerCase().replace(/\s/g, '').replace('.', '')] || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p>No daily details to display for this employee.</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
