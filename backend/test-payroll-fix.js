const axios = require('axios');

// Test the payroll API
async function testPayrollAPI() {
    try {
        // Test processing payroll from attendance
        const processResponse = await axios.post('http://localhost:4000/v1/api/payroll/process-from-attendance', {
            periodFrom: '01-06-2023',
            periodTo: '30-06-2023'
        });
        console.log('Process payroll response:', JSON.stringify(processResponse.data, null, 2));
        
        // Test getting all payrolls
        const response = await axios.get('http://localhost:4000/v1/api/payroll');
        console.log('All payrolls count:', response.data.count);
        
    } catch (error) {
        console.error('Error testing payroll API:', error.response ? error.response.data : error.message);
    }
}

testPayrollAPI();