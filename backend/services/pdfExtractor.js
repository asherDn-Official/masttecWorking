const fs = require('node:fs');
const pdf = require('pdf-parse');

class PDFExtractor {
    async extractTextFromPdf(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found at path: ${filePath}`);
            }

            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);

            return data.text;
        } catch (error) {
            console.error('Error parsing PDF:', error);
            throw error;
        }
    }

    // Helper function to parse strings with variable-length items that are concatenated
    parseVariableLengthItems(rawData, patterns) {
        const items = [];
        let remainingData = rawData;
        const sortedPatterns = [...patterns].sort((a, b) => b.length - a.length);

        while (remainingData.length > 0) {
            let matched = false;
            for (const pattern of sortedPatterns) {
                if (remainingData.startsWith(pattern)) {
                    items.push(pattern);
                    remainingData = remainingData.substring(pattern.length);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                break;
            }
        }
        return items;
    }

    parseAttendanceData(text) {
        const lines = text.split('\n');
        const employeesData = [];
        let currentEmployee = null;
        let reportDates = [];
        let reportOverallDate = '';
        let reportPeriodFrom = '';
        let reportPeriodTo = '';

        // Extract report period and dates
        for (const line of lines) {
            const periodMatch = line.match(/Period From : (\d{2}-[A-Za-z]{3}-\d{4})\s*-\s*(\d{2}-[A-Za-z]{3}-\d{4})/);
            if (periodMatch) {
                reportPeriodFrom = periodMatch[1];
                reportPeriodTo = periodMatch[2];
            }
            
            const dateMatch = line.match(/Date : (\d{2}-[A-Za-z]{3}-\d{4})/);
            if (dateMatch) {
                reportOverallDate = dateMatch[1];
            }
            
            if (reportPeriodFrom && reportOverallDate && reportDates.length > 0) break;

            // Extract column dates - they are concatenated like "02-0503-0504-05..."
            if (reportDates.length === 0) {
                const trimmedLine = line.trim();
                // Look for lines with concatenated dates
                if (trimmedLine.match(/^\d{2}-\d{2}/) && trimmedLine.match(/\d{2}-\d{2}/g)?.length > 10) {
                    // Extract all date patterns from the concatenated string
                    const dateMatches = trimmedLine.match(/\d{2}-\d{2}/g);
                    if (dateMatches && dateMatches.length > 15) {
                        reportDates = dateMatches;
                        console.log(`Found ${reportDates.length} date columns:`, reportDates.slice(0, 5), '...');
                    }
                }
            }
        }

        if (reportDates.length === 0) {
            console.warn("Could not reliably determine report column dates. Attendance data alignment might be affected.");
        }

        // Parse employee data
        for (let i = 0; i < lines.length; i++) {
            const lineContent = lines[i].trim();
            const normalizedLine = lineContent.replace(/\s+/g, ' ');

            // Check for staff information
            const staffMatch = normalizedLine.match(/Staff :(\d+)\s*-\s*(.+)/);
            if (staffMatch) {
                if (currentEmployee && currentEmployee.id) {
                    employeesData.push(currentEmployee);
                }
                
                currentEmployee = {
                    id: staffMatch[1].trim(),
                    name: staffMatch[2].trim(),
                    department: '',
                    designation: '',
                    category: '',
                    branch: '',
                    attendance: reportDates.map(date => ({ 
                        date: date, 
                        status: '', 
                        shift: '', 
                        timeIn: '', 
                        timeOut: '', 
                        workedHrs: '', 
                        late: '', 
                        earlyOut: '', 
                        ot1: '', 
                        ot2: '' 
                    })),
                    summary: {}
                };

                // Extract department details from next line
                if (i + 1 < lines.length) {
                    const detailLineRaw = lines[i + 1].trim();
                    const deptMatch = detailLineRaw.match(/Department\s*:\s*(.*?)\s*Designation\s*:\s*(.*?)\s*Category\s*:\s*(.*?)\s*Branch\s*:\s*(.*)/);
                    if (deptMatch) {
                        currentEmployee.department = deptMatch[1].trim();
                        currentEmployee.designation = deptMatch[2].trim();
                        currentEmployee.category = deptMatch[3].trim();
                        currentEmployee.branch = deptMatch[4].trim();
                        i++;
                    }
                }
                continue;
            }

            if (currentEmployee) {
                const dataLineContentNoSpace = lineContent.replace(/\s+/g, '');

                // Helper function to parse time entries (5 characters each: HH:MM)
                const parseTimeEntries = (rawData, numEntries) => {
                    const entries = [];
                    const entryLength = 5; // HH:MM format
                    for (let k = 0; k < numEntries; k++) {
                        const startPos = k * entryLength;
                        if (startPos + entryLength <= rawData.length) {
                            const entry = rawData.substring(startPos, startPos + entryLength);
                            entries.push(entry);
                        } else {
                            entries.push('');
                        }
                    }
                    return entries;
                };

                // Helper function to parse worked hours entries (4 characters each: H.HH)
                const parseWorkedHoursEntries = (rawData, numEntries) => {
                    const entries = [];
                    const entryLength = 4; // H.HH format like 8.30
                    for (let k = 0; k < numEntries; k++) {
                        const startPos = k * entryLength;
                        if (startPos + entryLength <= rawData.length) {
                            let entry = rawData.substring(startPos, startPos + entryLength);
                            // Clean up malformed entries
                            if (entry.startsWith('.')) {
                                entry = '0' + entry.substring(1);
                            }
                            entries.push(entry);
                        } else {
                            entries.push('');
                        }
                    }
                    return entries;
                };

                // Parse different data rows based on the debug output patterns
                if (dataLineContentNoSpace.startsWith('1Status')) {
                    const statusesRaw = dataLineContentNoSpace.substring('1Status'.length);
                    const statusPatterns = ["PRE/ABS", "ABS/PRE", "PRE", "ABS", "OFF", "H", "W"];
                    const statuses = this.parseVariableLengthItems(statusesRaw, statusPatterns);
                    console.log(`Parsed ${statuses.length} statuses for employee ${currentEmployee.id}:`, statuses.slice(0, 5));
                    statuses.forEach((status, index) => {
                        if (currentEmployee.attendance[index]) currentEmployee.attendance[index].status = status;
                    });
                } else if (dataLineContentNoSpace.startsWith('2Shift')) {
                    const shiftsRaw = dataLineContentNoSpace.substring('2Shift'.length);
                    const shiftPatterns = ["12HRS", "SECOND", "8HRS", "COOK", "GEN", "SPL", "NIGHT", "OFF"];
                    const shifts = this.parseVariableLengthItems(shiftsRaw, shiftPatterns);
                    console.log(`Parsed ${shifts.length} shifts for employee ${currentEmployee.id}:`, shifts.slice(0, 5));
                    shifts.forEach((shift, index) => {
                        if (currentEmployee.attendance[index]) currentEmployee.attendance[index].shift = shift;
                    });
                } else if (dataLineContentNoSpace.startsWith('3TimeIn')) {
                    const timesRaw = dataLineContentNoSpace.substring('3TimeIn'.length);
                    const times = parseTimeEntries(timesRaw, reportDates.length);
                    console.log(`Parsed ${times.length} time-in entries for employee ${currentEmployee.id}:`, times.slice(0, 5));
                    times.forEach((time, index) => {
                        if (currentEmployee.attendance[index]) currentEmployee.attendance[index].timeIn = time;
                    });
                } else if (dataLineContentNoSpace.startsWith('4TimeOut')) {
                    const timesRaw = dataLineContentNoSpace.substring('4TimeOut'.length);
                    const times = parseTimeEntries(timesRaw, reportDates.length);
                    console.log(`Parsed ${times.length} time-out entries for employee ${currentEmployee.id}:`, times.slice(0, 5));
                    times.forEach((time, index) => {
                        if (currentEmployee.attendance[index]) currentEmployee.attendance[index].timeOut = time;
                    });
                } else if (dataLineContentNoSpace.startsWith('5WorkedHrs')) {
                    const rawData = dataLineContentNoSpace.substring('5WorkedHrs'.length);
                    const entries = parseWorkedHoursEntries(rawData, reportDates.length);
                    console.log(`Parsed ${entries.length} worked hours for employee ${currentEmployee.id}:`, entries.slice(0, 5));
                    entries.forEach((entry, index) => {
                        if (currentEmployee.attendance[index]) currentEmployee.attendance[index].workedHrs = entry;
                    });
                } else if (dataLineContentNoSpace.startsWith('6Late')) {
                    const rawData = dataLineContentNoSpace.substring('6Late'.length);
                    const entries = parseWorkedHoursEntries(rawData, reportDates.length);
                    console.log(`Parsed ${entries.length} late entries for employee ${currentEmployee.id}:`, entries.slice(0, 5));
                    entries.forEach((entry, index) => {
                        if (currentEmployee.attendance[index]) currentEmployee.attendance[index].late = entry;
                    });
                } else if (dataLineContentNoSpace.startsWith('7E.Out')) {
                    const rawData = dataLineContentNoSpace.substring('7E.Out'.length);
                    const entries = parseWorkedHoursEntries(rawData, reportDates.length);
                    console.log(`Parsed ${entries.length} early out entries for employee ${currentEmployee.id}:`, entries.slice(0, 5));
                    entries.forEach((entry, index) => {
                        if (currentEmployee.attendance[index]) currentEmployee.attendance[index].earlyOut = entry;
                    });
                } else if (dataLineContentNoSpace.startsWith('8OT1')) {
                    const rawData = dataLineContentNoSpace.substring('8OT1'.length);
                    const entries = parseWorkedHoursEntries(rawData, reportDates.length);
                    console.log(`Parsed ${entries.length} OT1 entries for employee ${currentEmployee.id}:`, entries.slice(0, 5));
                    entries.forEach((entry, index) => {
                        if (currentEmployee.attendance[index]) currentEmployee.attendance[index].ot1 = entry;
                    });
                } else if (dataLineContentNoSpace.startsWith('9OT2')) {
                    const rawData = dataLineContentNoSpace.substring('9OT2'.length);
                    const entries = parseWorkedHoursEntries(rawData, reportDates.length);
                    console.log(`Parsed ${entries.length} OT2 entries for employee ${currentEmployee.id}:`, entries.slice(0, 5));
                    entries.forEach((entry, index) => {
                        if (currentEmployee.attendance[index]) currentEmployee.attendance[index].ot2 = entry;
                    });
                } else if (lineContent.includes(':') && !/^\s*\d/.test(lineContent.trimStart())) {
                    // Parse summary data - look for the summary line with numbers
                    const summaryNumberMatch = lineContent.match(/^([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
                    if (summaryNumberMatch) {
                        currentEmployee.summary.presentDays = summaryNumberMatch[1];
                        currentEmployee.summary.paidLeaveDays = summaryNumberMatch[2];
                        currentEmployee.summary.lopDays = summaryNumberMatch[3];
                        currentEmployee.summary.weeklyOffDays = summaryNumberMatch[4];
                        currentEmployee.summary.holidays = summaryNumberMatch[5];
                        currentEmployee.summary.absentDays = summaryNumberMatch[6];
                        currentEmployee.summary.totalLate = summaryNumberMatch[7];
                        currentEmployee.summary.totalEarlyOut = summaryNumberMatch[8];
                        currentEmployee.summary.totalWorkedHrs = summaryNumberMatch[9];
                        currentEmployee.summary.totalOT1 = summaryNumberMatch[10];
                        currentEmployee.summary.totalOT2 = summaryNumberMatch[11];
                        currentEmployee.summary.totalOT3 = summaryNumberMatch[12];
                        console.log(`Parsed summary for employee ${currentEmployee.id}:`, currentEmployee.summary);
                    }
                    
                    // Also look for "On Duty" value in next line
                    if (lineContent.includes('On Duty') && i + 1 < lines.length) {
                        const onDutyMatch = lines[i + 1].trim().match(/^([\d.]+)/);
                        if (onDutyMatch) {
                            currentEmployee.summary.onDutyDays = onDutyMatch[1];
                        }
                    }
                }
            }
        }

        if (currentEmployee && currentEmployee.id) {
            employeesData.push(currentEmployee);
        }

        console.log(`Total employees parsed: ${employeesData.length}`);
        return { 
            reportOverallDate, 
            reportPeriodFrom, 
            reportPeriodTo, 
            columnDates: reportDates, 
            employees: employeesData 
        };
    }
}

module.exports = new PDFExtractor();