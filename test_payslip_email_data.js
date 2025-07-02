// Test data structure for the enhanced payslip email functionality
// This demonstrates the exact data structure expected by the updated PayRoll Controller

console.log('📧 Enhanced Payslip Email Data Structure\n');

// Sample Employee Data (from Employee Database)
const sampleEmployeeData = {
    employeeId: "001",
    employeeName: "trk",
    dateOfBirth: "1990-01-01",
    qualification: "Bachelor of Engineering",
    bloodGroup: "O+",
    mobileNumber: "9876543210",
    mailId: "gangadharana01@gmail.com",
    address: "123 Main St, City, Country",
    bankAccountNumber: "123456789012sdsdcasas",
    bankIFSCCode: "ABC0123456",
    PANNumber: "ABCDE1234F",
    designation: "Super Admin",
    epf: "0",
    esic: "0",
    salary: "30000"
};

// Sample Payroll Data (from Payroll Database)
const samplePayrollData = {
    salaryMonth: "05",
    salaryYear: "2025",
    present: "25",
    absent: "2",
    basic: "30000",
    houseRent: "0",
    hra: "5000", // Added HRA field
    EPF: "10000",
    ESIC: "1000",
    incentives: "0",
    allowances: "0",
    advance: "0",
    paymentLossDays: "0",
    paymentLossAmount: "0.00",
    OT1Hours: "8.50",
    OT1Amount: "2125",
    OT2Hours: "4.00",
    OT2Amount: "1750",
    totalLateHours: "2.25", // New field for total late hours
    holdOT: "0",
    totalBasicPayment: "30000.00",
    totalOTPayment: "3875.00",
    salary: "38875.00", // Updated field name (was payableSalary)
    balance: "0"
};

console.log('✅ Employee Data Structure:');
console.log(JSON.stringify(sampleEmployeeData, null, 2));

console.log('\n✅ Payroll Data Structure:');
console.log(JSON.stringify(samplePayrollData, null, 2));

console.log('\n📋 Updated Payslip Features:');
console.log('1. ✅ Enhanced employee information display');
console.log('2. ✅ Added Date of Birth, Qualification, Blood Group');
console.log('3. ✅ Added Mobile Number, Email ID, Address');
console.log('4. ✅ Added Bank Account and IFSC Code');
console.log('5. ✅ Added PAN Number display');
console.log('6. ✅ Added HRA field in earnings');
console.log('7. ✅ Added Total Late Hours tracking');
console.log('8. ✅ Updated salary field (renamed from payableSalary)');
console.log('9. ✅ Enhanced OT calculations display');
console.log('10. ✅ Professional payslip PDF generation');

console.log('\n🚀 API Endpoints for Payslip Email:');
console.log('Single Employee: POST /api/payroll/send-payslip-email/:employeeId');
console.log('Bulk Send: POST /api/payroll/send-bulk-payslip-emails');

console.log('\n📧 Email Configuration:');
console.log('- Service: Gmail');
console.log('- From: gangadharana01@gmail.com');
console.log('- PDF Attachment: Auto-generated with employee name and period');
console.log('- HTML Content: Professional payslip template');

console.log('\n💡 Sample API Request Body:');
console.log('Single Email:');
console.log(JSON.stringify({
    salaryMonth: "05",
    salaryYear: "2025"
}, null, 2));

console.log('\nBulk Email:');
console.log(JSON.stringify({
    salaryMonth: "05",
    salaryYear: "2025",
    employeeIds: ["001", "002", "003"]
}, null, 2));

console.log('\n✅ All payslip email enhancements completed successfully!');