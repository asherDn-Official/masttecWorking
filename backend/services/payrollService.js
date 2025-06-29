const Payroll = require('../Models/PayRollModel');
const AttendanceRecord = require('../models/AttendanceRecord');
const Employee = require('../Models/EmployeeModel');

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
     * Generate payroll data from attendance record and employee data
     * @param {Object} attendanceRecord - Attendance record
     * @param {Object} employeeData - Employee data from Employee model
     * @returns {Object} Payroll data
     */
    async generatePayrollFromAttendance(attendanceRecord, employeeData = null) {
        try {
            const { employeeId, employeeName, department, designation, reportPeriodFrom, reportPeriodTo, dailyAttendance, monthlySummary } = attendanceRecord;
            
            // Get employee data if not provided
            if (!employeeData) {
                employeeData = await Employee.findOne({ employeeId });
                if (!employeeData) {
                    console.warn(`Employee data not found for employeeId: ${employeeId}. Creating basic employee record.`);
                    
                    // Create basic employee record using the attendance data
                    try {
                        employeeData = new Employee({
                            employeeId: employeeId,
                            employeeName: employeeName || `Employee ${employeeId}`,
                            salary: '0',
                            epf: '0',
                            esic: '0',
                            status: true,
                            department: attendanceRecord.department || '', // Use department from attendance record
                            designation: attendanceRecord.designation || '', // Use designation from attendance record
                            // Other fields will have default values
                        });
                        
                        await employeeData.save();
                        console.log(`✓ Created basic employee record for ID: ${employeeId}, Name: ${employeeName}`);
                    } catch (createError) {
                        console.error(`Error creating employee record for ${employeeId}:`, createError);
                        // Fall back to using a temporary employee data structure
                        employeeData = {
                            employeeId: employeeId,
                            salary: '0',
                            epf: '0',
                            esic: '0',
                            employeeName: employeeName || `Employee ${employeeId}`
                        };
                    }
                }
            }
            
            // Extract month and year from report period
            // Handle both YYYY-MM-DD and DD-MM-YYYY formats
            let salaryMonth, salaryYear;
            const dateParts = reportPeriodFrom.split('-');
            
            if (dateParts[0].length === 4) {
                // YYYY-MM-DD format
                const [year, month, day] = dateParts;
                salaryMonth = month;
                salaryYear = year;
            } else {
                // DD-MM-YYYY format
                const [day, month, year] = dateParts;
                salaryMonth = month;
                salaryYear = year;
            }
            
            // Get salary, EPF, and ESIC from employee model
            const basicSalary = parseFloat(employeeData.salary || '0');
            const epfAmount = parseFloat(employeeData.epf || '0');
            const esicAmount = parseFloat(employeeData.esic || '0');
            
            // Calculate hourly rate
            const hourlyRate = this.calculateHourlyRate(basicSalary);
            console.log(`Employee ${employeeId}: Basic Salary: ${basicSalary}, EPF: ${epfAmount}, ESIC: ${esicAmount}, Hourly rate: ${hourlyRate}`);
            
            // Get present and absent days from attendance summary
            const presentDays = parseInt(monthlySummary.presentDays || '0');
            const absentDays = parseInt(monthlySummary.absentDays || '0');
            console.log(`Present days: ${presentDays}, Absent days: ${absentDays}`);
            
            // CALCULATIONS DISABLED - All calculated fields will be set to empty/zero
            // Frontend will handle all calculations manually
            console.log(`Skipping calculations for employee ${employeeId} - frontend will handle calculations`);
            
            // Create payroll data with basic info only - calculations will be done on frontend
            const payrollData = {
                salaryMonth,
                salaryYear,
                present: presentDays.toString(),
                absent: absentDays.toString(),
                basic: basicSalary.toString(),
                houseRent: '0', // Default value for admin update
                EPF: epfAmount.toString(), // From Employee model
                ESIC: esicAmount.toString(), // From Employee model
                incentives: '0', // Default value for admin update
                allowances: '0', // Default value for admin update
                advance: '0', // Default value for admin update
                paymentLossDays: '0', // Frontend will calculate
                paymentLossAmount: '0.00', // Frontend will calculate
                OT1Hours: '0.00', // Frontend will calculate
                OT1Amount: '0', // Frontend will calculate
                OT2Hours: '0.00', // Frontend will calculate
                OT2Amount: '0', // Frontend will calculate
                holdOT: '0', // Default value for admin update
                totalBasicPayment: '0.00', // Frontend will calculate
                totalOTPayment: '0.00', // Frontend will calculate
                payableSalary: '0.00', // Frontend will calculate
                balance: '0' // Frontend will calculate
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
            const payrollData = await this.generatePayrollFromAttendance(attendanceRecord);
            
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
                employeeId: attendanceRecord?.employeeId || 'unknown',
                details: `Failed to process payroll for employee ${attendanceRecord?.employeeId}. ${error.message}`
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
     * Get payroll records filtered by month and year
     * @param {string} month - Month (MM format)
     * @param {string} year - Year (YYYY format)
     * @returns {Array} Payroll records for the specified month
     */
    async getPayrollByMonth(month, year) {
        try {
            const payrolls = await Payroll.find({
                'payrunHistory.salaryMonth': month,
                'payrunHistory.salaryYear': year
            });

            // Filter to return only the relevant payrun data for the specified month
            const filteredPayrolls = payrolls.map(payroll => {
                const relevantPayruns = payroll.payrunHistory.filter(
                    payrun => payrun.salaryMonth === month && payrun.salaryYear === year
                );
                
                return {
                    ...payroll.toObject(),
                    payrunHistory: relevantPayruns
                };
            }).filter(payroll => payroll.payrunHistory.length > 0);

            return filteredPayrolls;
        } catch (error) {
            console.error(`Error getting payroll for month ${month}/${year}:`, error);
            throw error;
        }
    }

    /**
     * Get all payroll records for a specific month with employee details
     * @param {string} month - Month (MM format)
     * @param {string} year - Year (YYYY format)
     * @returns {Array} Payroll records with employee details
     */
    async getPayrollWithEmployeeDetailsByMonth(month, year) {
        try {
            const payrolls = await this.getPayrollByMonth(month, year);
            
            // Populate employee details for each payroll
            const payrollsWithDetails = await Promise.all(
                payrolls.map(async (payroll) => {
                    try {
                        const employee = await Employee.findOne({ employeeId: payroll.employeeId });
                        return {
                            ...payroll,
                            employeeDetails: employee || null
                        };
                    } catch (error) {
                        console.error(`Error fetching employee details for ${payroll.employeeId}:`, error);
                        return {
                            ...payroll,
                            employeeDetails: null
                        };
                    }
                })
            );

            return payrollsWithDetails;
        } catch (error) {
            console.error(`Error getting payroll with employee details for month ${month}/${year}:`, error);
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