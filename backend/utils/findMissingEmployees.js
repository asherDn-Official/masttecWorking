const mongoose = require('mongoose');
const AttendanceRecord = require('../Models/AttendanceRecord');
const Employee = require('../Models/EmployeeModel');

/**
 * Utility script to find employee IDs that exist in attendance records 
 * but don't exist in the Employee collection
 */

async function findMissingEmployees() {
    try {
        console.log('Finding missing employees...');
        
        // Get all unique employee IDs from attendance records
        const attendanceEmployeeIds = await AttendanceRecord.distinct('employeeId');
        console.log(`Found ${attendanceEmployeeIds.length} unique employee IDs in attendance records`);
        
        // Get all employee IDs from Employee collection
        const existingEmployeeIds = await Employee.distinct('employeeId');
        console.log(`Found ${existingEmployeeIds.length} employees in Employee collection`);
        
        // Find missing employee IDs
        const missingEmployeeIds = attendanceEmployeeIds.filter(
            id => !existingEmployeeIds.includes(id)
        );
        
        console.log(`\nMissing employee IDs (${missingEmployeeIds.length}):`);
        missingEmployeeIds.forEach(id => console.log(`- ${id}`));
        
        return {
            attendanceCount: attendanceEmployeeIds.length,
            employeeCount: existingEmployeeIds.length,
            missingCount: missingEmployeeIds.length,
            missingIds: missingEmployeeIds,
            attendanceIds: attendanceEmployeeIds,
            existingIds: existingEmployeeIds
        };
        
    } catch (error) {
        console.error('Error finding missing employees:', error);
        throw error;
    }
}

/**
 * Create basic employee records for missing employee IDs
 * @param {Array} missingIds - Array of missing employee IDs
 */
async function createMissingEmployeeRecords(missingIds) {
    try {
        console.log(`\nCreating ${missingIds.length} missing employee records...`);
        
        const createdEmployees = [];
        const errors = [];
        
        for (const employeeId of missingIds) {
            try {
                // Check if employee already exists (double-check)
                const existingEmployee = await Employee.findOne({ employeeId });
                
                if (existingEmployee) {
                    console.log(`Employee ${employeeId} already exists, skipping...`);
                    continue;
                }
                
                // Create basic employee record
                const newEmployee = new Employee({
                    employeeId: employeeId,
                    employeeName: `Employee ${employeeId}`,
                    salary: "0",
                    epf: "0", 
                    esic: "0",
                    status: true,
                    department: "Unknown",
                    designation: "Unknown"
                });
                
                await newEmployee.save();
                createdEmployees.push(employeeId);
                console.log(`✓ Created employee record for ID: ${employeeId}`);
                
            } catch (error) {
                console.error(`✗ Error creating employee ${employeeId}:`, error.message);
                errors.push({ employeeId, error: error.message });
            }
        }
        
        console.log(`\nSummary:`);
        console.log(`- Successfully created: ${createdEmployees.length}`);
        console.log(`- Errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log(`\nErrors:`);
            errors.forEach(err => console.log(`- ${err.employeeId}: ${err.error}`));
        }
        
        return {
            created: createdEmployees,
            errors: errors
        };
        
    } catch (error) {
        console.error('Error creating missing employee records:', error);
        throw error;
    }
}

/**
 * Main function to find and optionally create missing employees
 * @param {boolean} createRecords - Whether to create missing employee records
 */
async function main(createRecords = false) {
    try {
        const results = await findMissingEmployees();
        
        if (results.missingCount === 0) {
            console.log('\n✓ No missing employees found!');
            return;
        }
        
        if (createRecords && results.missingIds.length > 0) {
            const createResults = await createMissingEmployeeRecords(results.missingIds);
            console.log('\n✓ Missing employee creation process completed!');
            return { findResults: results, createResults };
        } else {
            console.log('\nTo create these missing employee records, run:');
            console.log('node findMissingEmployees.js --create');
            return { findResults: results };
        }
        
    } catch (error) {
        console.error('Error in main process:', error);
        process.exit(1);
    }
}

// Export functions for use in other modules
module.exports = {
    findMissingEmployees,
    createMissingEmployeeRecords,
    main
};

// Run if called directly
if (require.main === module) {
    const createRecords = process.argv.includes('--create');
    
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
        require('dotenv').config();
        mongoose.connect(process.env.MongoDb_Url || 'mongodb://localhost:27017/attendance_system')
            .then(() => {
                console.log('Connected to MongoDB');
                return main(createRecords);
            })
            .then(() => {
                console.log('Process completed successfully');
                process.exit(0);
            })
            .catch((error) => {
                console.error('Process failed:', error);
                process.exit(1);
            });
    } else {
        main(createRecords)
            .then(() => {
                console.log('Process completed successfully');
            })
            .catch((error) => {
                console.error('Process failed:', error);
            });
    }
}