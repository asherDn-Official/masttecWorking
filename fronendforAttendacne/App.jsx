import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx'; // Import the xlsx library
import FileInput from './components/FileInput'; // Assuming you put FileInput in a components folder
import SummaryTable from './components/SummaryTable'; // Assuming you put SummaryTable in a components folder
import './index.css'; // Assuming your TailwindCSS styles are compiled here
import DetailsModal from './components/detailsModel';

function App() {
  // Renamed jsonFile to excelFile to reflect the change
  const [excelFile, setExcelFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [message, setMessage] = useState('');
  const [processedData, setProcessedData] = useState([]);
  const [dateHeadersMap, setDateHeadersMap] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleFileSelect = (file, type) => {
    if (type === 'excel') {
      setExcelFile(file);
    } else {
      setCsvFile(file);
    }
    setMessage('');
  };

  // --- Data Extraction and Parsing Functions (mostly unchanged, just for context) ---

  function extractEmployeeNamesFromCSV(csvContent) {
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
      setMessage('Error reading or parsing CSV file.');
      console.error(error);
      return [];
    }
  }

  function groupEmployeeData(data) {
    const cleanData = data.filter(row => {
      const rowValues = Object.values(row);
      if (rowValues.length === 0) return false;

      const isUselessRow = rowValues.some(val => 
        typeof val === 'string' && (
          val.includes('Monthly Attendance Performane Detail Report') ||
          val.includes('Page ') ||
          val.includes('Continue...') ||
          val === 'MASTTEC MOULDS'
        )
      );
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
        if (currentGroup.length > 0) {
          employeeGroups.push(currentGroup);
        }
        currentGroup = [];
      } else {
        currentGroup.push(row);
      }
    });
    
    if (currentGroup.length > 0) {
      employeeGroups.push(currentGroup);
    }

    return employeeGroups;
  }

  function extractSummary(employeeBlock) {
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
  }

  function extractDateHeaders(data) {
    const dateHeaderRow = data.find(row => row['MASTTEC MOULDS'] === 'Status' && row['__EMPTY_2']?.match(/\d{2}-\d{2}/));
    if (!dateHeaderRow) return null;
    const map = new Map();
    for (const key in dateHeaderRow) {
      if (key !== '__EMPTY' && key !== 'MASTTEC MOULDS') {
        const date = dateHeaderRow[key];
        if (typeof date === 'string' && date.match(/\d{2}-\d{2}/)) {
          map.set(date, key);
        }
      }
    }
    return map;
  }

  // --- Main Processing Logic (updated) ---

  const handleProcessClick = async () => {
    if (!excelFile || !csvFile) {
      setMessage('Please upload both Excel and CSV files.');
      return;
    }

    setMessage('Processing...');
    setProcessedData([]); // Clear previous results
    setDateHeadersMap(null); // Clear previous map

    try {
      // Read Excel File
      const excelReader = new FileReader();
      const excelReadPromise = new Promise((resolve, reject) => {
        excelReader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            // Assuming the attendance data is in the first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            resolve(jsonData);
          } catch (error) {
            reject(new Error('Error parsing Excel file. Please ensure it is a valid .xlsx or .xls file.'));
          }
        };
        excelReader.onerror = () => reject(new Error('Failed to read Excel file.'));
        excelReader.readAsArrayBuffer(excelFile);
      });
      const jsonData = await excelReadPromise;

      // Read CSV File
      const csvReader = new FileReader();
      const csvReadPromise = new Promise((resolve, reject) => {
        csvReader.onload = (e) => resolve(e.target.result);
        csvReader.onerror = () => reject(new Error('Failed to read CSV file.'));
        csvReader.readAsText(csvFile);
      });
      const csvContent = await csvReadPromise;

      // Process Data
      const employees = extractEmployeeNamesFromCSV(csvContent);
      const employeeDataGroups = groupEmployeeData(jsonData);
      const extractedDateMap = extractDateHeaders(jsonData);
      setDateHeadersMap(extractedDateMap);

      if (employees.length === 0 || employeeDataGroups.length === 0 || !extractedDateMap) {
        setMessage('Could not process files. Check format and ensure they correspond.');
        return;
      }

      const mergedData = [];
      employeeDataGroups.forEach((group, index) => {
        const summary = extractSummary(group);
        // Ensure there's a corresponding employee from CSV for this attendance block
        if (summary && employees[index]) {
          mergedData.push({
            ...employees[index], // Employee number and name from CSV
            summary: summary,    // Summary data from JSON (Excel)
            details: group,      // Detailed attendance block from JSON (Excel)
          });
        }
      });
      setProcessedData(mergedData);
      setMessage('');
    } catch (err) {
      setMessage(`Error: ${err.message || 'An unexpected error occurred during processing.'}`);
      console.error(err);
      setProcessedData([]);
    }
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  return (
    <div className="bg-gray-100 text-gray-800 min-h-screen flex flex-col items-center py-8">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Employee Attendance Extractor</h1>
            <p className="mt-2 text-md text-gray-600">Upload your Excel and CSV files to process the attendance data.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <FileInput
              id="excelFileInput"
              label="1. Upload Attendance Excel"
              fileType="excel" // Changed type to 'excel'
              onFileSelect={handleFileSelect}
            />
            <FileInput
              id="csvFileInput"
              label="2. Upload Employee Info CSV"
              fileType="csv"
              onFileSelect={handleFileSelect}
            />
          </div>

          <div className="text-center">
            <button
              id="processBtn"
              onClick={handleProcessClick}
              disabled={!excelFile || !csvFile} // Changed condition to excelFile
              className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition duration-300 ease-in-out disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Process Files
            </button>
          </div>
        </div>

        {processedData.length > 0 && <SummaryTable data={processedData} onViewDetails={handleViewDetails} />}
        
        {message && <div id="message" className="text-center mt-6 text-red-600 font-semibold">{message}</div>}

      </div>

      <DetailsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        employeeData={selectedEmployee}
        dateHeadersMap={dateHeadersMap}
      />
    </div>
  );
}

export default App;