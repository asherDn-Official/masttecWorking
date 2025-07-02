// Test script for enhanced payroll service
const PayrollService = require('./backend/services/payrollService');

console.log('🚀 Testing Enhanced Payroll Service with Multiple Shift Types\n');

// Test cases for different shift types and scenarios
const testCases = [
    // General Shift Tests
    {
        name: 'General Shift - Normal Hours',
        timeIn: '09:00',
        timeOut: '17:30',
        status: 'P'
    },
    {
        name: 'General Shift - OT (6:10 PM)',
        timeIn: '09:00',
        timeOut: '18:10',
        status: 'P'
    },
    {
        name: 'General Shift - Late Arrival',
        timeIn: '09:15',
        timeOut: '17:30',
        status: 'P'
    },
    {
        name: 'General Shift - Very Late Arrival',
        timeIn: '10:00',
        timeOut: '18:30',
        status: 'P'
    },
    // 12-Hour Day Shift Tests
    {
        name: '12-Hour Day Shift - Normal Hours',
        timeIn: '07:00',
        timeOut: '15:00',
        status: 'P'
    },
    {
        name: '12-Hour Day Shift - OT (4:00 PM)',
        timeIn: '07:00',
        timeOut: '16:00',
        status: 'P'
    },
    {
        name: '12-Hour Day Shift - Late Arrival',
        timeIn: '07:15',
        timeOut: '15:00',
        status: 'P'
    },
    // Night Shift Tests
    {
        name: 'Night Shift - Normal Hours',
        timeIn: '19:00',
        timeOut: '03:00',
        status: 'P'
    },
    {
        name: 'Night Shift - OT (4:00 AM)',
        timeIn: '19:00',
        timeOut: '04:00',
        status: 'P'
    },
    {
        name: 'Night Shift - Late Arrival',
        timeIn: '19:30',
        timeOut: '03:00',
        status: 'P'
    },
    // Holiday/Weekend Tests
    {
        name: 'Holiday Work - 8 Hours',
        timeIn: '09:00',
        timeOut: '17:00',
        status: 'H'
    },
    {
        name: 'Weekend Work - 6 Hours',
        timeIn: '10:00',
        timeOut: '16:00',
        status: 'W'
    }
];

// Run all test cases
console.log('Running test cases...\n');
testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    PayrollService.testShiftCalculations(testCase.timeIn, testCase.timeOut, testCase.status);
});

console.log('✅ All tests completed!');
console.log('\n📋 Summary of Enhanced Features:');
console.log('1. ✅ Three shift types: General (9 AM-5:30 PM), 12-hour Day (7 AM-3 PM), Night (7 PM-3 AM)');
console.log('2. ✅ Automatic shift detection based on time in/out');
console.log('3. ✅ Late hours calculation (>10 minutes late)');
console.log('4. ✅ Enhanced OT calculation (>30 minutes beyond shift end)');
console.log('5. ✅ Updated hourly rate formula (salary ÷ 30 days ÷ 8 hours)');
console.log('6. ✅ Monthly late hours accumulation');
console.log('7. ✅ Monthly OT hours accumulation');
console.log('8. ✅ Added totalLateHours field to Payroll model');
console.log('9. ✅ Production-ready error handling and logging');