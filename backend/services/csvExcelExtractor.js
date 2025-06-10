const XLSX = require('xlsx');
const fs = require('fs');

class CSVExcelExtractor {
    
    /**
     * Process attendance data from frontend
     * @param {Array} attendanceData - Processed attendance data from frontend
     * @param {Array} dateHeaders - Array of date headers
     * @param {Object} reportPeriod - Report period with from and to dates
     * @returns {Object} Formatted data for database storage
     */
    processAttendanceData(attendanceData, dateHeaders, reportPeriod) {
        try {
            const processedEmployees = [];
            
            for (const employee of attendanceData) {
                // Convert the frontend data structure to match the database schema
                const processedEmployee = {
                    id: employee.number,
                    name: employee.name,
                    department: employee.department || '',
                    designation: employee.designation || '',
                    category: employee.category || '',
                    branch: employee.branch || '',
                    attendance: this.convertDetailsToAttendance(employee.details), // Pass only details, as it's pre-processed
                    summary: this.convertSummaryToDbFormat(employee.summary)
                };
                
                processedEmployees.push(processedEmployee);
            }
            
            return {
                employees: processedEmployees,
                reportOverallDate: new Date().toISOString().split('T')[0],
                reportPeriodFrom: reportPeriod.from,
                reportPeriodTo: reportPeriod.to,
                reportDates: dateHeaders
            };
            
        } catch (error) {
            console.error('Error processing attendance data:', error);
            throw error;
        }
    }
    
    /**
     * Convert frontend details structure to database attendance format
     * @param {Array} details - Details array from frontend
     * @returns {Array} Array of daily attendance records
     */
    convertDetailsToAttendance(details) { // dateHeaders is no longer needed here
        const attendanceRecords = [];
        
        if (details && Array.isArray(details)) {
            // 'details' is now an array of objects, each representing a day's attendance
            // e.g., { date: "01-05", status: "P", shift: "G", workedHrs: "8.00", ... }
            details.forEach(detailDay => {
                const record = {
                    date: detailDay.date, // Ensure this matches the DB schema's expected format
                    status: detailDay.status || '',
                    shift: detailDay.shift || '',
                    timeIn: detailDay.timeIn || '',
                    timeOut: detailDay.timeOut || '',
                    workedHrs: detailDay.workedHrs || '',
                    late: detailDay.late || '',
                    earlyOut: detailDay.earlyOut || '', // Make sure 'earlyOut' matches your frontend key
                    ot1: detailDay.ot1 || '',
                    ot2: detailDay.ot2 || ''
                };
                attendanceRecords.push(record);
            });
        }
        return attendanceRecords;
    }
    
    /**
     * Convert frontend summary to database format
     * @param {Object} summary - Summary object from frontend
     * @returns {Object} Formatted summary for database
     */
    convertSummaryToDbFormat(summary) {
        return {
            presentDays: summary['Present'] || '0',
            paidLeaveDays: summary['Paid Leave'] || '0',
            lopDays: summary['Lop'] || '0',
            weeklyOffDays: summary['Weekly Off'] || '0',
            holidays: summary['Holiday'] || '0',
            onDutyDays: summary['On Duty'] || '0',
            absentDays: summary['Absent'] || '0',
            totalWorkedHrs: summary['Worked Hrs.'] || '0:00',
            totalLate: summary['Late'] || '0:00',
            totalEarlyOut: summary['E.Out'] || '0:00',
            totalOT1: summary['OT 1'] || '0:00',
            totalOT2: summary['OT 2'] || '0:00',
            totalOT3: summary['OT All'] || '0:00'
        };
    }
    
    /**
     * Extract employee names from CSV content
     * @param {string} csvContent - CSV file content
     * @returns {Array} Array of employee objects with number and name
     */
    extractEmployeeNamesFromCSV(csvContent) {
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
            console.error('Error extracting employee names from CSV:', error);
            throw error;
        }
    }
    
    /**
     * Read and parse Excel file
     * @param {string} filePath - Path to Excel file
     * @returns {Array} Parsed JSON data from Excel
     */
    async readExcelFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`Excel file not found at path: ${filePath}`);
            }

            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            return jsonData;
        } catch (error) {
            console.error('Error reading Excel file:', error);
            throw error;
        }
    }
    
    /**
     * Read CSV file content
     * @param {string} filePath - Path to CSV file
     * @returns {string} CSV file content
     */
    async readCSVFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`CSV file not found at path: ${filePath}`);
            }

            const csvContent = fs.readFileSync(filePath, 'utf8');
            return csvContent;
        } catch (error) {
            console.error('Error reading CSV file:', error);
            throw error;
        }
    }
}

module.exports = new CSVExcelExtractor();