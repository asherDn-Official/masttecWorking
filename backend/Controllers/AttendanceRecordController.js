const AttendanceRecord = require('../Models/AttendanceRecord');

const YYYYMM_PATTERN = /^\d{4}-\d{2}$/; // For YYYY-MM
const YYYYMMDD_PATTERN = /^\d{4}-\d{2}-\d{2}$/; // For YYYY-MM-DD

// GET /api/attendance-records?employeeId=...&specificDate=YYYY-MM-DD
// GET /api/attendance-records?employeeId=...&reportMonth=YYYY-MM
exports.getAttendanceDetails = async (req, res) => {
    const { employeeId, specificDate, reportMonth } = req.query;

    if (!employeeId) {
        return res.status(400).json({ message: 'Employee ID is required.' });
    }

    try {
        if (specificDate) {
            if (!YYYYMMDD_PATTERN.test(specificDate)) {
                return res.status(400).json({ message: 'Invalid specificDate format. Use YYYY-MM-DD.' });
            }
            // Find record where specificDate is within the report period
            const record = await AttendanceRecord.findOne({
                employeeId,
                reportPeriodFrom: { $lte: specificDate },
                reportPeriodTo: { $gte: specificDate }
            });

            if (!record) {
                return res.status(404).json({ message: `Attendance record for employee ${employeeId} on date ${specificDate} not found.` });
            }

            // dailyAttendance.date is now YYYY-MM-DD, so direct comparison with specificDate
            const dailyEntry = record.dailyAttendance.find(d => d.date === specificDate);

            if (!dailyEntry) {
                return res.status(404).json({ message: `Attendance entry for employee ${employeeId} for date ${specificDate} not found in daily records for report date ${specificDate}.` });
            }
            return res.json(dailyEntry);

        } else if (reportMonth) {
            if (!YYYYMM_PATTERN.test(reportMonth)) {
                return res.status(400).json({ message: 'Invalid reportMonth format. Use YYYY-MM.' });
            }
            // Find record where reportPeriodFrom starts with the given YYYY-MM
            const record = await AttendanceRecord.findOne({
                employeeId,
                reportPeriodFrom: { $regex: `^${reportMonth}` } 
            });

            if (!record) {
                return res.status(404).json({ message: `Attendance record for employee ${employeeId} in month ${reportMonth} not found.` });
            }
            return res.json(record); // Returns the whole monthly record
        } else {
            return res.status(400).json({ message: 'Please provide specificDate (YYYY-MM-DD) or reportMonth (YYYY-MM) for filtering.' });
        }
    } catch (error) {
        console.error('Error fetching attendance details:', error);
        res.status(500).json({ message: 'Server error while fetching attendance details.' });
    }
};

// GET /api/attendance-records/by-date?specificDate=YYYY-MM-DD
exports.getAttendanceByDateForAllEmployees = async (req, res) => {
    const { specificDate } = req.query;

    if (!specificDate) {
        return res.status(400).json({ message: 'Specific date (YYYY-MM-DD) is required.' });
    }
    if (!YYYYMMDD_PATTERN.test(specificDate)) {
        return res.status(400).json({ message: 'Invalid specificDate format. Use YYYY-MM-DD.' });
    }

    try {
        // Find records where specificDate is within the report period
        const monthlyRecords = await AttendanceRecord.find({
            reportPeriodFrom: { $lte: specificDate },
            reportPeriodTo: { $gte: specificDate }
        }).select('employeeId employeeName dailyAttendance'); 

        if (!monthlyRecords || monthlyRecords.length === 0) {
            return res.status(404).json({ message: `No attendance records found for any employee on date ${specificDate}.` });
        }

        // dailyAttendance.date is now YYYY-MM-DD, so direct comparison with specificDate
        const attendanceForDate = monthlyRecords.map(record => {
            const dailyEntry = record.dailyAttendance.find(d => d.date === specificDate);
            if (dailyEntry) {
                return {
                    employeeId: record.employeeId,
                    employeeName: record.employeeName,
                    // Spread the daily entry fields, converting Mongoose doc to plain object
                    ...dailyEntry.toObject() 
                };
            }
            return null; 
        }).filter(entry => entry !== null); 

        if (attendanceForDate.length === 0) {
            return res.status(404).json({ message: `No daily attendance entries found for date ${specificDate} for report date ${specificDate}.` });
        }

        res.json(attendanceForDate);
    } catch (error) {
        console.error('Error fetching attendance by date for all employees:', error);
        res.status(500).json({ message: 'Server error while fetching attendance data.' });
    }
};

// PUT /api/attendance-records/daily-entry
// Body: { employeeId, reportOverallDate (YYYY-MM), date (YYYY-MM-DD of entry), updateData: { ... } }
exports.updateDailyAttendanceEntry = async (req, res) => {
    const { employeeId, reportOverallDate, date, updateData } = req.body; 

    if (!employeeId || !reportOverallDate || !date || !updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'Missing or invalid fields: employeeId, reportOverallDate (YYYY-MM), date (YYYY-MM-DD), or non-empty updateData object are required.' });
    }

    if (!YYYYMM_PATTERN.test(reportOverallDate)) { // reportOverallDate from client is YYYY-MM
        return res.status(400).json({ message: 'Invalid reportOverallDate format. Use YYYY-MM.' });
    }
    if (!YYYYMMDD_PATTERN.test(date)) { // date of daily entry from client is YYYY-MM-DD
        return res.status(400).json({ message: 'Invalid date format for daily entry. Use YYYY-MM-DD.' });
    }

    try {
        const updateFields = {};
        const validKeys = ['status', 'shift', 'timeIn', 'timeOut', 'workedHrs', 'late', 'earlyOut', 'ot1', 'ot2'];
        let hasValidUpdate = false;
        for (const key in updateData) {
            if (validKeys.includes(key)) {
                updateFields[`dailyAttendance.$.${key}`] = updateData[key];
                hasValidUpdate = true;
            }
        }

        if (!hasValidUpdate) {
            return res.status(400).json({ message: 'No valid fields provided in updateData. Valid fields are: ' + validKeys.join(', ') });
        }

        // Find the record where reportPeriodFrom starts with reportOverallDate (YYYY-MM)
        const result = await AttendanceRecord.updateOne(
            { 
                employeeId,
                reportPeriodFrom: { $regex: `^${reportOverallDate}` }, 
                "dailyAttendance.date": date // date is YYYY-MM-DD
            },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: `Attendance record for employee ${employeeId}, month ${reportOverallDate}, with daily entry for date ${date} not found.` });
        }
        if (result.modifiedCount === 0 && result.matchedCount > 0) {
             const currentRecord = await AttendanceRecord.findOne({ employeeId, reportPeriodFrom: { $regex: `^${reportOverallDate}` } });
             const currentEntry = currentRecord ? currentRecord.dailyAttendance.find(d => d.date === date) : null;
            return res.status(200).json({ message: 'No changes applied to the daily attendance entry (data might be the same).', entry: currentEntry });
        }
        
        const updatedRecord = await AttendanceRecord.findOne({ employeeId, reportPeriodFrom: { $regex: `^${reportOverallDate}` } });
        const updatedEntry = updatedRecord.dailyAttendance.find(d => d.date === date);

        res.json({ message: 'Daily attendance entry updated successfully.', updatedEntry });
    } catch (error) {
        console.error('Error updating daily attendance entry:', error);
        res.status(500).json({ message: 'Server error while updating daily attendance entry.' });
    }
};

// DELETE /api/attendance-records?employeeId=...&reportOverallDate=YYYY-MM (deletes whole month record)
exports.deleteMonthlyAttendanceRecord = async (req, res) => {
    const { employeeId, reportOverallDate } = req.query;

    if (!employeeId || !reportOverallDate) {
        return res.status(400).json({ message: 'employeeId and reportOverallDate (YYYY-MM) are required.' });
    }
    if (!YYYYMM_PATTERN.test(reportOverallDate)) {
        return res.status(400).json({ message: 'Invalid reportOverallDate format. Use YYYY-MM.' });
    }

    try {
        // Delete records where reportPeriodFrom starts with the given YYYY-MM
        const result = await AttendanceRecord.deleteOne({ 
            employeeId, 
            reportPeriodFrom: { $regex: `^${reportOverallDate}` } 
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: `Monthly attendance record for employee ${employeeId} and month ${reportOverallDate} not found.` });
        }
        res.json({ message: 'Monthly attendance record deleted successfully.' });
    } catch (error) {
        console.error('Error deleting monthly attendance record:', error);
        res.status(500).json({ message: 'Server error while deleting monthly attendance record.' });
    }
};

// DELETE /api/attendance-records/daily-entry?employeeId=...&reportOverallDate=YYYY-MM&date=YYYY-MM-DD (deletes one daily entry)
exports.deleteDailyAttendanceEntry = async (req, res) => {
    const { employeeId, reportOverallDate, date } = req.query;

    if (!employeeId || !reportOverallDate || !date) {
        return res.status(400).json({ message: 'employeeId, reportOverallDate (YYYY-MM), and date (YYYY-MM-DD) are required.' });
    }
    if (!YYYYMM_PATTERN.test(reportOverallDate)) { // reportOverallDate from client is YYYY-MM
        return res.status(400).json({ message: 'Invalid reportOverallDate format. Use YYYY-MM.' });
    }
    if (!YYYYMMDD_PATTERN.test(date)) { // date of daily entry from client is YYYY-MM-DD
        return res.status(400).json({ message: 'Invalid date format for daily entry. Use YYYY-MM-DD.' });
    }

    try {
        // Find the record where reportPeriodFrom starts with reportOverallDate (YYYY-MM)
        const result = await AttendanceRecord.updateOne(
            { 
                employeeId, 
                reportPeriodFrom: { $regex: `^${reportOverallDate}` } 
            },
            { $pull: { dailyAttendance: { date: date } } } // date is YYYY-MM-DD
        );

        if (result.matchedCount === 0) { // No monthly record found
            return res.status(404).json({ message: `Attendance record for employee ${employeeId} and month ${reportOverallDate} not found.` });
        }
        // matchedCount > 0 but modifiedCount === 0 means the monthly record was found, but the daily entry to pull was not.
        if (result.modifiedCount === 0) { 
            return res.status(404).json({ message: `Daily attendance entry for date ${date} not found within the record for employee ${employeeId}, month ${reportOverallDate}.` });
        }
        res.json({ message: 'Daily attendance entry deleted successfully.' });
    } catch (error) {
        console.error('Error deleting daily attendance entry:', error);
        res.status(500).json({ message: 'Server error while deleting daily attendance entry.' });
    }
};
