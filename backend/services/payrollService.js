const Payroll = require('../Models/PayRollModel');
const AttendanceRecord = require('../models/AttendanceRecord');

class PayrollService {
    /**
     * Calculate OT1 hours (overtime on regular working days)
     * @param {string} timeIn - Time in (format: HH:MM)
     * @param {string} timeOut - Time out (format: HH:MM)
     * @param {string} status - Attendance status
     * @returns {number} OT1 hours
     */
    calculateOT1Hours(timeIn, timeOut, status, ot1) {
        // If OT1 is already calculated in attendance record, use that
        if (ot1 && ot1.trim() !== '') {
            // Handle different time formats (HH:MM or decimal)
            if (ot1.includes(':')) {
                const [hours, minutes] = ot1.split(':').map(Number);
                return isNaN(hours) || isNaN(minutes) ? 0 : hours + (minutes / 60);
            } else {
                const hours = parseFloat(ot1);
                return isNaN(hours) ? 0 : hours;
            }
        }

        // If status is not present, return 0
        if (status !== 'PRE' && status !== 'P') {
            return 0;
        }

        // Regular working hours: 9:30 to 17:30 (5:30 PM)
        const regularEndTime = { hours: 17, minutes: 30 };
        
        // Parse timeOut
        if (!timeOut || timeOut.trim() === '') {
            return 0;
        }
        
        try {
            const [outHours, outMinutes] = timeOut.split(':').map(Number);
            
            // Check if parsing was successful
            if (isNaN(outHours) || isNaN(outMinutes)) {
                console.log(`Invalid timeOut format: ${timeOut}`);
                return 0;
            }
            
            // Calculate minutes after regular end time
            const totalOutMinutes = outHours * 60 + outMinutes;
            const totalRegularEndMinutes = regularEndTime.hours * 60 + regularEndTime.minutes;
            
            // Only count OT if worked more than 29 minutes after regular end time
            if (totalOutMinutes > totalRegularEndMinutes + 29) {
                const overtimeMinutes = totalOutMinutes - totalRegularEndMinutes;
                return parseFloat((overtimeMinutes / 60).toFixed(2));
            }
        } catch (error) {
            console.error(`Error calculating OT1 hours for timeOut ${timeOut}:`, error);
        }
        
        return 0;
    }

    /**
     * Calculate OT2 hours (overtime on holidays/weekends)
     * @param {string} workedHrs - Hours worked
     * @param {string} status - Attendance status
     * @returns {number} OT2 hours
     */
    calculateOT2Hours(workedHrs, status, ot2) {
        // If OT2 is already calculated in attendance record, use that
        if (ot2 && ot2.trim() !== '') {
            // Handle different time formats (HH:MM or decimal)
            if (ot2.includes(':')) {
                const [hours, minutes] = ot2.split(':').map(Number);
                return isNaN(hours) || isNaN(minutes) ? 0 : hours + (minutes / 60);
            } else {
                const hours = parseFloat(ot2);
                return isNaN(hours) ? 0 : hours;
            }
        }

        // If status is OFF, W, or H (weekend or holiday), all hours are OT2
        if (status === 'OFF' || status === 'W' || status === 'H') {
            if (workedHrs && workedHrs.trim() !== '') {
                try {
                    // Handle different time formats (HH:MM or decimal)
                    if (workedHrs.includes(':')) {
                        const [hours, minutes] = workedHrs.split(':').map(Number);
                        return isNaN(hours) || isNaN(minutes) ? 0 : hours + (minutes / 60);
                    } else {
                        const hours = parseFloat(workedHrs);
                        return isNaN(hours) ? 0 : hours;
                    }
                } catch (error) {
                    console.error(`Error calculating OT2 hours for workedHrs ${workedHrs}:`, error);
                    return 0;
                }
            }
        }
        
        return 0;
    }

    /**
     * Calculate worked hours from time in and time out
     * @param {string} timeIn - Time in (format: HH:MM)
     * @param {string} timeOut - Time out (format: HH:MM)
     * @returns {number} Worked hours
     */
    calculateWorkedHours(timeIn, timeOut, workedHrs) {
        // If workedHrs is already calculated in attendance record, use that
        if (workedHrs && workedHrs.trim() !== '') {
            try {
                // Handle different time formats (HH:MM or decimal)
                if (workedHrs.includes(':')) {
                    const [hours, minutes] = workedHrs.split(':').map(Number);
                    return isNaN(hours) || isNaN(minutes) ? 0 : hours + (minutes / 60);
                } else {
                    const hours = parseFloat(workedHrs);
                    return isNaN(hours) ? 0 : hours;
                }
            } catch (error) {
                console.error(`Error parsing workedHrs ${workedHrs}:`, error);
                return 0;
            }
        }

        // If timeIn or timeOut is missing, return 0
        if (!timeIn || !timeOut || timeIn.trim() === '' || timeOut.trim() === '') {
            return 0;
        }
        
        try {
            // Parse timeIn and timeOut
            const [inHours, inMinutes] = timeIn.split(':').map(Number);
            const [outHours, outMinutes] = timeOut.split(':').map(Number);
            
            // Check if parsing was successful
            if (isNaN(inHours) || isNaN(inMinutes) || isNaN(outHours) || isNaN(outMinutes)) {
                console.log(`Invalid time format: timeIn=${timeIn}, timeOut=${timeOut}`);
                return 0;
            }
            
            // Calculate total minutes
            const totalInMinutes = inHours * 60 + inMinutes;
            const totalOutMinutes = outHours * 60 + outMinutes;
            
            // Handle case where timeOut is on the next day
            let diffMinutes = totalOutMinutes - totalInMinutes;
            if (diffMinutes < 0) {
                diffMinutes += 24 * 60; // Add 24 hours in minutes
            }
            
            return parseFloat((diffMinutes / 60).toFixed(2));
        } catch (error) {
            console.error(`Error calculating worked hours for timeIn=${timeIn}, timeOut=${timeOut}:`, error);
            return 0;
        }
    }

    /**
     * Calculate OT1 amount based on hourly rate
     * @param {number} ot1Hours - OT1 hours
     * @param {number} hourlyRate - Hourly rate
     * @returns {number} OT1 amount
     */
    calculateOT1Amount(ot1Hours, hourlyRate) {
        // Check for NaN values
        if (isNaN(ot1Hours) || isNaN(hourlyRate)) {
            console.log(`Invalid values for OT1 calculation: ot1Hours=${ot1Hours}, hourlyRate=${hourlyRate}`);
            return 0;
        }
        
        // OT1 is calculated at 1.25x the hourly rate
        return parseFloat((ot1Hours * hourlyRate * 1.25).toFixed(2));
    }

    /**
     * Calculate OT2 amount based on hourly rate
     * @param {number} ot2Hours - OT2 hours
     * @param {number} hourlyRate - Hourly rate
     * @returns {number} OT2 amount
     */
    calculateOT2Amount(ot2Hours, hourlyRate) {
        // Check for NaN values
        if (isNaN(ot2Hours) || isNaN(hourlyRate)) {
            console.log(`Invalid values for OT2 calculation: ot2Hours=${ot2Hours}, hourlyRate=${hourlyRate}`);
            return 0;
        }
        
        // OT2 is calculated at 1.75x the hourly rate
        return parseFloat((ot2Hours * hourlyRate * 1.75).toFixed(2));
    }

    /**
     * Calculate hourly rate based on basic salary
     * @param {number} basicSalary - Basic salary
     * @returns {number} Hourly rate
     */
    calculateHourlyRate(basicSalary) {
        // Assuming 8 hours per day, 26 working days per month
        const workingHoursPerMonth = 8 * 26;
        return parseFloat((basicSalary / workingHoursPerMonth).toFixed(2));
    }

    /**
     * Generate payroll data from attendance record
     * @param {Object} attendanceRecord - Attendance record
     * @param {number} basicSalary - Basic salary (default: 15000)
     * @returns {Object} Payroll data
     */
    generatePayrollFromAttendance(attendanceRecord, basicSalary = 15000) {
        try {
            const { employeeId, employeeName, reportPeriodFrom, reportPeriodTo, dailyAttendance, monthlySummary } = attendanceRecord;
            
            // Extract month and year from report period
            const [day, month, year] = reportPeriodFrom.split('-');
            const salaryMonth = month;
            const salaryYear = year;
            
            // Calculate hourly rate
            const hourlyRate = this.calculateHourlyRate(basicSalary);
            console.log(`Hourly rate for employee ${employeeId}: ${hourlyRate}`);
            
            // Calculate present and absent days
            const presentDays = parseInt(monthlySummary.presentDays || '0');
            const absentDays = parseInt(monthlySummary.absentDays || '0');
            console.log(`Present days: ${presentDays}, Absent days: ${absentDays}`);
            
            // Calculate OT hours and amounts
            let totalOT1Hours = 0;
            let totalOT2Hours = 0;
            let totalWorkedHours = 0;
            
            console.log(`Processing ${dailyAttendance.length} attendance records for employee ${employeeId}`);
            
            dailyAttendance.forEach(day => {
                try {
                    const ot1Hours = this.calculateOT1Hours(day.timeIn, day.timeOut, day.status, day.ot1);
                    const ot2Hours = this.calculateOT2Hours(day.workedHrs, day.status, day.ot2);
                    const workedHours = this.calculateWorkedHours(day.timeIn, day.timeOut, day.workedHrs);
                    
                    console.log(`Day ${day.date}: status=${day.status}, timeIn=${day.timeIn}, timeOut=${day.timeOut}, workedHrs=${day.workedHrs}, ot1=${day.ot1}, ot2=${day.ot2}`);
                    console.log(`Calculated: ot1Hours=${ot1Hours}, ot2Hours=${ot2Hours}, workedHours=${workedHours}`);
                    
                    totalOT1Hours += ot1Hours;
                    totalOT2Hours += ot2Hours;
                    totalWorkedHours += workedHours;
                } catch (error) {
                    console.error(`Error processing day ${day.date} for employee ${employeeId}:`, error);
                }
            });
            
            console.log(`Total OT1 Hours: ${totalOT1Hours}, Total OT2 Hours: ${totalOT2Hours}, Total Worked Hours: ${totalWorkedHours}`);
            
            // Ensure values are not NaN
            totalOT1Hours = isNaN(totalOT1Hours) ? 0 : totalOT1Hours;
            totalOT2Hours = isNaN(totalOT2Hours) ? 0 : totalOT2Hours;
            totalWorkedHours = isNaN(totalWorkedHours) ? 0 : totalWorkedHours;
            
            const ot1Amount = this.calculateOT1Amount(totalOT1Hours, hourlyRate);
            const ot2Amount = this.calculateOT2Amount(totalOT2Hours, hourlyRate);
            
            console.log(`OT1 Amount: ${ot1Amount}, OT2 Amount: ${ot2Amount}`);
            
            // Calculate payment loss for absent days
            const paymentLossDays = absentDays.toString();
            const dailyRate = basicSalary / 26; // Assuming 26 working days per month
            const paymentLossAmount = (absentDays * dailyRate).toFixed(2);
            
            // Calculate total payments
            const totalBasicPayment = (basicSalary - (absentDays * dailyRate)).toFixed(2);
            const totalOTPayment = (ot1Amount + ot2Amount).toFixed(2);
            const payableSalary = (parseFloat(totalBasicPayment) + parseFloat(totalOTPayment)).toFixed(2);
            
            console.log(`Payment Loss Amount: ${paymentLossAmount}, Total Basic Payment: ${totalBasicPayment}, Total OT Payment: ${totalOTPayment}, Payable Salary: ${payableSalary}`);
            
            // Create payroll data
            const payrollData = {
                salaryMonth,
                salaryYear,
                present: presentDays.toString(),
                absent: absentDays.toString(),
                basic: basicSalary.toString(),
                houseRent: '0', // Default values, to be updated from frontend
                EPF: '0',
                ESIC: '0',
                incentives: '0',
                allowances: '0',
                advance: '0',
                paymentLossDays,
                paymentLossAmount,
                OT1Hours: totalOT1Hours.toFixed(2),
                OT1Amount: ot1Amount.toString(),
                OT2Hours: totalOT2Hours.toFixed(2),
                OT2Amount: ot2Amount.toString(),
                holdOT: '0',
                totalBasicPayment,
                totalOTPayment,
                payableSalary,
                balance: payableSalary, // Initially, balance equals payable salary
                workedHours: totalWorkedHours.toFixed(2)
            };
            
            return payrollData;
        } catch (error) {
            console.error('Error generating payroll from attendance:', error);
            throw error;
        }
    }

    /**
     * Create or update payroll record from attendance record
     * @param {Object} attendanceRecord - Attendance record
     * @returns {Object} Created or updated payroll record
     */
    async createOrUpdatePayrollFromAttendance(attendanceRecord) {
        try {
            if (!attendanceRecord || !attendanceRecord.employeeId) {
                console.error('Invalid attendance record:', attendanceRecord);
                throw new Error('Invalid attendance record');
            }
            
            const { employeeId } = attendanceRecord;
            console.log(`Creating/updating payroll for employee ${employeeId}`);
            
            // Generate payroll data
            const payrollData = this.generatePayrollFromAttendance(attendanceRecord);
            
            if (!payrollData) {
                console.error('Failed to generate payroll data for employee:', employeeId);
                throw new Error('Failed to generate payroll data');
            }
            
            // Check if payroll record exists for this employee
            let payrollRecord = await Payroll.findOne({ employeeId });
            
            if (payrollRecord) {
                console.log(`Found existing payroll record for employee ${employeeId}`);
                
                // Check if payrun for this month and year already exists
                const existingPayrunIndex = payrollRecord.payrunHistory.findIndex(
                    payrun => payrun.salaryMonth === payrollData.salaryMonth && 
                             payrun.salaryYear === payrollData.salaryYear
                );
                
                if (existingPayrunIndex !== -1) {
                    console.log(`Updating existing payrun for ${payrollData.salaryMonth}/${payrollData.salaryYear}`);
                    // Update existing payrun
                    payrollRecord.payrunHistory[existingPayrunIndex] = payrollData;
                } else {
                    console.log(`Adding new payrun for ${payrollData.salaryMonth}/${payrollData.salaryYear}`);
                    // Add new payrun to history
                    payrollRecord.payrunHistory.push(payrollData);
                }
                
                await payrollRecord.save();
                console.log(`Payroll record updated for employee ${employeeId}`);
            } else {
                console.log(`Creating new payroll record for employee ${employeeId}`);
                // Create new payroll record
                payrollRecord = new Payroll({
                    employeeId,
                    payrunHistory: [payrollData]
                });
                
                await payrollRecord.save();
                console.log(`New payroll record created for employee ${employeeId}`);
            }
            
            return payrollRecord;
        } catch (error) {
            console.error(`Error creating/updating payroll from attendance for employee ${attendanceRecord?.employeeId}:`, error);
            // Return a default payroll record with error information instead of throwing
            return {
                error: true,
                message: error.message,
                employeeId: attendanceRecord?.employeeId || 'unknown'
            };
        }
    }

    /**
     * Process payroll for all attendance records in a period
     * @param {string} periodFrom - Start date of period
     * @param {string} periodTo - End date of period
     * @returns {Array} Processed payroll records
     */
    async processPayrollForPeriod(periodFrom, periodTo) {
        try {
            console.log(`Processing payroll for period ${periodFrom} to ${periodTo}`);
            
            // Get all attendance records for the period
            const attendanceRecords = await AttendanceRecord.find({
                reportPeriodFrom: periodFrom,
                reportPeriodTo: periodTo
            });
            
            console.log(`Found ${attendanceRecords.length} attendance records for the period`);
            
            if (!attendanceRecords || attendanceRecords.length === 0) {
                throw new Error(`No attendance records found for period ${periodFrom} to ${periodTo}`);
            }
            
            // Process payroll for each attendance record
            const processedPayrolls = [];
            const errors = [];
            
            for (const record of attendanceRecords) {
                try {
                    console.log(`Processing payroll for employee ${record.employeeId}`);
                    const payroll = await this.createOrUpdatePayrollFromAttendance(record);
                    
                    if (payroll.error) {
                        console.log(`Error processing payroll for employee ${record.employeeId}: ${payroll.message}`);
                        errors.push({
                            employeeId: record.employeeId,
                            error: payroll.message
                        });
                    } else {
                        processedPayrolls.push(payroll);
                    }
                } catch (recordError) {
                    console.error(`Error processing payroll for employee ${record.employeeId}:`, recordError);
                    errors.push({
                        employeeId: record.employeeId,
                        error: recordError.message
                    });
                }
            }
            
            console.log(`Successfully processed ${processedPayrolls.length} payroll records`);
            if (errors.length > 0) {
                console.log(`Failed to process ${errors.length} payroll records`);
            }
            
            return {
                success: processedPayrolls.length > 0,
                processedCount: processedPayrolls.length,
                errorCount: errors.length,
                payrolls: processedPayrolls,
                errors: errors
            };
        } catch (error) {
            console.error('Error processing payroll for period:', error);
            return {
                success: false,
                message: error.message,
                processedCount: 0,
                errorCount: 0,
                payrolls: [],
                errors: [{
                    error: error.message
                }]
            };
        }
    }

    /**
     * Get all payroll records
     * @returns {Array} All payroll records
     */
    async getAllPayrolls() {
        try {
            return await Payroll.find();
        } catch (error) {
            console.error('Error getting all payrolls:', error);
            throw error;
        }
    }

    /**
     * Get payroll record by employee ID
     * @param {string} employeeId - Employee ID
     * @returns {Object} Payroll record
     */
    async getPayrollByEmployeeId(employeeId) {
        try {
            return await Payroll.findOne({ employeeId });
        } catch (error) {
            console.error(`Error getting payroll for employee ${employeeId}:`, error);
            throw error;
        }
    }

    /**
     * Update payroll record by employee ID
     * @param {string} employeeId - Employee ID
     * @param {Object} updateData - Data to update
     * @returns {Object} Updated payroll record
     */
    async updatePayrollByEmployeeId(employeeId, updateData) {
        try {
            const { payrunIndex, payrunData } = updateData;
            
            const payrollRecord = await Payroll.findOne({ employeeId });
            
            if (!payrollRecord) {
                throw new Error(`Payroll record not found for employee ${employeeId}`);
            }
            
            if (payrunIndex !== undefined && payrunData) {
                // Update specific payrun in history
                if (payrunIndex >= 0 && payrunIndex < payrollRecord.payrunHistory.length) {
                    // Update only the fields provided in payrunData
                    Object.keys(payrunData).forEach(key => {
                        payrollRecord.payrunHistory[payrunIndex][key] = payrunData[key];
                    });
                } else {
                    throw new Error(`Invalid payrun index: ${payrunIndex}`);
                }
            } else if (payrunData) {
                // Add new payrun to history
                payrollRecord.payrunHistory.push(payrunData);
            }
            
            return await payrollRecord.save();
        } catch (error) {
            console.error(`Error updating payroll for employee ${employeeId}:`, error);
            throw error;
        }
    }

    /**
     * Delete payroll record by employee ID
     * @param {string} employeeId - Employee ID
     * @returns {Object} Deleted payroll record
     */
    async deletePayrollByEmployeeId(employeeId) {
        try {
            return await Payroll.findOneAndDelete({ employeeId });
        } catch (error) {
            console.error(`Error deleting payroll for employee ${employeeId}:`, error);
            throw error;
        }
    }
}

module.exports = new PayrollService();