# Payslip Email API Documentation

## Overview
This API allows you to send payslips via email to employees. The payslip data is fetched from the payrolls database and employee email addresses are retrieved from the employee collection.

## Prerequisites
1. Configure email settings in `.env` file:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```
2. For Gmail, you need to:
   - Enable 2-factor authentication
   - Generate an "App Password" (not your regular Gmail password)
   - Use the App Password in EMAIL_PASS

## API Endpoints

### 1. Send Single Payslip Email

**Endpoint:** `POST /api/payrolls/send-payslip-email`

**Description:** Sends a payslip email to a single employee for a specific month and year.

**Request Body:**
```json
{
  "employeeId": "123",
  "salaryMonth": "05",
  "salaryYear": "2025"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payslip sent successfully to employee@example.com",
  "data": {
    "employeeId": "123",
    "employeeName": "John Doe",
    "email": "employee@example.com",
    "period": "May 2025",
    "payableSalary": "27500"
  }
}
```

**Error Responses:**
- `400`: Missing required fields or employee has no email
- `404`: Employee not found or payroll record not found
- `500`: Server error or email sending failed

### 2. Send Bulk Payslip Emails

**Endpoint:** `POST /api/payrolls/send-bulk-payslip-emails`

**Description:** Sends payslips to multiple employees for a specific month and year.

**Request Body:**
```json
{
  "employeeIds": ["123", "124", "125"],
  "salaryMonth": "05",
  "salaryYear": "2025"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bulk payslip sending completed. Sent: 2, Failed: 1",
  "data": {
    "successful": [
      {
        "employeeId": "123",
        "employeeName": "John Doe",
        "email": "john@example.com",
        "payableSalary": "27500"
      }
    ],
    "failed": [
      {
        "employeeId": "124",
        "employeeName": "Jane Smith",
        "error": "Email address not found"
      }
    ],
    "total": 3
  }
}
```

## Email Template Features

The payslip email includes:

### Header Information
- Company name: "Massetec Technology Solutions"
- Payslip title and period
- Professional styling

### Employee Information
- Employee ID and Name
- Department and Designation
- Days Present/Absent
- Bank Account and PAN Number

### Earnings Section
- Basic Salary
- House Rent Allowance
- Incentives
- Allowances  
- OT1 Payment (with hours)
- OT2 Payment (with hours)

### Deductions Section
- EPF
- ESIC
- Advance
- Payment Loss

### Summary
- Total Earnings
- Total Deductions
- Net Salary (highlighted)

### Footer
- Computer-generated disclaimer
- Generation timestamp

## Frontend Usage Examples

### Send Single Payslip
```javascript
const sendPayslip = async (employeeId, month, year) => {
  try {
    const response = await fetch('/api/payrolls/send-payslip-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: employeeId,
        salaryMonth: month,
        salaryYear: year
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`Payslip sent successfully to ${result.data.email}`);
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error('Error sending payslip:', error);
    alert('Failed to send payslip');
  }
};
```

### Send Bulk Payslips
```javascript
const sendBulkPayslips = async (employeeIds, month, year) => {
  try {
    const response = await fetch('/api/payrolls/send-bulk-payslip-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeIds: employeeIds,
        salaryMonth: month,
        salaryYear: year
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`Sent: ${result.data.successful.length}, Failed: ${result.data.failed.length}`);
      console.log('Successful:', result.data.successful);
      console.log('Failed:', result.data.failed);
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error('Error sending bulk payslips:', error);
    alert('Failed to send bulk payslips');
  }
};
```

## Data Requirements

### Employee Collection Must Have:
- `employeeId`: Unique identifier
- `employeeName`: Employee name
- `mailId`: Email address (required for sending)
- `department`: Department name (optional)
- `designation`: Job title (optional)
- `bankAccountNumber`: Bank account (optional)
- `PANNumber`: PAN number (optional)

### Payroll Collection Must Have:
- `employeeId`: Reference to employee
- `payrunHistory`: Array of payrun records
  - `salaryMonth`: Month (e.g., "05")
  - `salaryYear`: Year (e.g., "2025")
  - `present`: Days present
  - `absent`: Days absent
  - All salary components (basic, allowances, deductions, etc.)

## Error Handling

The API handles various error scenarios:
- Employee not found
- Missing email address
- Payroll record not found
- Email sending failures
- Invalid month/year format

## Security Considerations
- Email credentials are stored in environment variables
- No sensitive payroll data is logged
- Email addresses are validated before sending
- Rate limiting (500ms delay between bulk emails)

## Testing
Use the single payslip endpoint first to test email configuration before sending bulk emails.