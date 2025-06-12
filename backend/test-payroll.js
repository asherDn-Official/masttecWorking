const axios = require('axios');

// Test the payroll API
async function testPayrollAPI() {
    try {
        // Test getting all payrolls
        const response = await axios.get('http://localhost:4000/v1/api/payroll');
        console.log('All payrolls:', response.data);
        
        // Test processing payroll from attendance
        // const processResponse = await axios.post('http://localhost:4000/v1/api/payroll/process-from-attendance', {
        //     periodFrom: '01-05-2023',
        //     periodTo: '31-05-2023'
        // });
        // console.log('Process payroll response:', processResponse.data);
        
    } catch (error) {
        console.error('Error testing payroll API:', error.response ? error.response.data : error.message);
    }
}

testPayrollAPI();