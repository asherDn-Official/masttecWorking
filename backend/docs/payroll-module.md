# Payroll Module Documentation

## Overview

The Payroll Module automatically generates payroll data from attendance records. When attendance data is uploaded via CSV/Excel or PDF, the system automatically creates or updates payroll records for each employee.

## Features

1. **Automatic Payroll Generation**: Payroll records are automatically created when attendance data is uploaded.
2. **OT Calculation**: 
   - OT1 (Regular day overtime): Calculated at 1.25x hourly rate for time worked beyond regular hours (after 5:30 PM).
   - OT2 (Holiday/Weekend overtime): Calculated at 1.75x hourly rate for time worked on holidays or weekends.
3. **Salary Calculation**: 
   - Basic salary is calculated based on present days.
   - Deductions for absent days.
   - OT payments added to the basic salary.
4. **Payroll History**: Maintains a history of payroll records for each employee by month and year.

## API Endpoints

### 1. Create Payroll Record

- **URL**: `/v1/api/payroll`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "employeeId": "EMP001",
    "payrunData": {
      "salaryMonth": "05",
      "salaryYear": "2023",
      "present": "22",
      "absent": "4",
      "basic": "15000",
      "houseRent": "0",
      "EPF": "0",
      "ESIC": "0",
      "incentives": "0",
      "allowances": "0",
      "advance": "0",
      "paymentLossDays": "4",
      "paymentLossAmount": "2307.69",
      "OT1Hours": "5.5",
      "OT1Amount": "330.00",
      "OT2Hours": "8.0",
      "OT2Amount": "672.00",
      "holdOT": "0",
      "totalBasicPayment": "12692.31",
      "totalOTPayment": "1002.00",
      "payableSalary": "13694.31",
      "balance": "13694.31",
      "workedHours": "176.0"
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Payroll record created successfully",
    "data": {
      "employeeId": "EMP001",
      "payrunHistory": [
        {
          "salaryMonth": "05",
          "salaryYear": "2023",
          "present": "22",
          "absent": "4",
          "basic": "15000",
          "houseRent": "0",
          "EPF": "0",
          "ESIC": "0",
          "incentives": "0",
          "allowances": "0",
          "advance": "0",
          "paymentLossDays": "4",
          "paymentLossAmount": "2307.69",
          "OT1Hours": "5.5",
          "OT1Amount": "330.00",
          "OT2Hours": "8.0",
          "OT2Amount": "672.00",
          "holdOT": "0",
          "totalBasicPayment": "12692.31",
          "totalOTPayment": "1002.00",
          "payableSalary": "13694.31",
          "balance": "13694.31",
          "workedHours": "176.0"
        }
      ],
      "_id": "60f1e5b3e6b3f32b8c9d4e5f",
      "createdAt": "2023-07-16T12:34:56.789Z",
      "updatedAt": "2023-07-16T12:34:56.789Z",
      "__v": 0
    }
  }
  ```

### 2. Process Payroll from Attendance

- **URL**: `/v1/api/payroll/process-from-attendance`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "periodFrom": "01-05-2023",
    "periodTo": "31-05-2023"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Successfully processed payroll for 10 employees",
    "data": [
      {
        "employeeId": "EMP001",
        "payrunHistory": [
          {
            "salaryMonth": "05",
            "salaryYear": "2023",
            "present": "22",
            "absent": "4",
            "basic": "15000",
            "houseRent": "0",
            "EPF": "0",
            "ESIC": "0",
            "incentives": "0",
            "allowances": "0",
            "advance": "0",
            "paymentLossDays": "4",
            "paymentLossAmount": "2307.69",
            "OT1Hours": "5.5",
            "OT1Amount": "330.00",
            "OT2Hours": "8.0",
            "OT2Amount": "672.00",
            "holdOT": "0",
            "totalBasicPayment": "12692.31",
            "totalOTPayment": "1002.00",
            "payableSalary": "13694.31",
            "balance": "13694.31",
            "workedHours": "176.0"
          }
        ],
        "_id": "60f1e5b3e6b3f32b8c9d4e5f",
        "createdAt": "2023-07-16T12:34:56.789Z",
        "updatedAt": "2023-07-16T12:34:56.789Z",
        "__v": 0
      },
      // More payroll records...
    ]
  }
  ```

### 3. Get All Payroll Records

- **URL**: `/v1/api/payroll`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "count": 10,
    "data": [
      {
        "employeeId": "EMP001",
        "payrunHistory": [
          {
            "salaryMonth": "05",
            "salaryYear": "2023",
            "present": "22",
            "absent": "4",
            "basic": "15000",
            "houseRent": "0",
            "EPF": "0",
            "ESIC": "0",
            "incentives": "0",
            "allowances": "0",
            "advance": "0",
            "paymentLossDays": "4",
            "paymentLossAmount": "2307.69",
            "OT1Hours": "5.5",
            "OT1Amount": "330.00",
            "OT2Hours": "8.0",
            "OT2Amount": "672.00",
            "holdOT": "0",
            "totalBasicPayment": "12692.31",
            "totalOTPayment": "1002.00",
            "payableSalary": "13694.31",
            "balance": "13694.31",
            "workedHours": "176.0"
          }
        ],
        "_id": "60f1e5b3e6b3f32b8c9d4e5f",
        "createdAt": "2023-07-16T12:34:56.789Z",
        "updatedAt": "2023-07-16T12:34:56.789Z",
        "__v": 0
      },
      // More payroll records...
    ]
  }
  ```

### 4. Get Payroll Record by Employee ID

- **URL**: `/v1/api/payroll/:employeeId`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "employeeId": "EMP001",
      "payrunHistory": [
        {
          "salaryMonth": "05",
          "salaryYear": "2023",
          "present": "22",
          "absent": "4",
          "basic": "15000",
          "houseRent": "0",
          "EPF": "0",
          "ESIC": "0",
          "incentives": "0",
          "allowances": "0",
          "advance": "0",
          "paymentLossDays": "4",
          "paymentLossAmount": "2307.69",
          "OT1Hours": "5.5",
          "OT1Amount": "330.00",
          "OT2Hours": "8.0",
          "OT2Amount": "672.00",
          "holdOT": "0",
          "totalBasicPayment": "12692.31",
          "totalOTPayment": "1002.00",
          "payableSalary": "13694.31",
          "balance": "13694.31",
          "workedHours": "176.0"
        }
      ],
      "_id": "60f1e5b3e6b3f32b8c9d4e5f",
      "createdAt": "2023-07-16T12:34:56.789Z",
      "updatedAt": "2023-07-16T12:34:56.789Z",
      "__v": 0
    }
  }
  ```

### 5. Update Payroll Record by Employee ID

- **URL**: `/v1/api/payroll/:employeeId`
- **Method**: `PUT`
- **Request Body**:
  ```json
  {
    "payrunIndex": 0,
    "payrunData": {
      "basic": "16000",
      "incentives": "1000",
      "allowances": "500"
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Payroll record updated successfully",
    "data": {
      "employeeId": "EMP001",
      "payrunHistory": [
        {
          "salaryMonth": "05",
          "salaryYear": "2023",
          "present": "22",
          "absent": "4",
          "basic": "16000",
          "houseRent": "0",
          "EPF": "0",
          "ESIC": "0",
          "incentives": "1000",
          "allowances": "500",
          "advance": "0",
          "paymentLossDays": "4",
          "paymentLossAmount": "2307.69",
          "OT1Hours": "5.5",
          "OT1Amount": "330.00",
          "OT2Hours": "8.0",
          "OT2Amount": "672.00",
          "holdOT": "0",
          "totalBasicPayment": "12692.31",
          "totalOTPayment": "1002.00",
          "payableSalary": "13694.31",
          "balance": "13694.31",
          "workedHours": "176.0"
        }
      ],
      "_id": "60f1e5b3e6b3f32b8c9d4e5f",
      "createdAt": "2023-07-16T12:34:56.789Z",
      "updatedAt": "2023-07-16T12:34:56.789Z",
      "__v": 0
    }
  }
  ```

### 6. Delete Payroll Record by Employee ID

- **URL**: `/v1/api/payroll/:employeeId`
- **Method**: `DELETE`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Payroll record deleted successfully",
    "data": {
      "employeeId": "EMP001",
      "payrunHistory": [
        {
          "salaryMonth": "05",
          "salaryYear": "2023",
          "present": "22",
          "absent": "4",
          "basic": "16000",
          "houseRent": "0",
          "EPF": "0",
          "ESIC": "0",
          "incentives": "1000",
          "allowances": "500",
          "advance": "0",
          "paymentLossDays": "4",
          "paymentLossAmount": "2307.69",
          "OT1Hours": "5.5",
          "OT1Amount": "330.00",
          "OT2Hours": "8.0",
          "OT2Amount": "672.00",
          "holdOT": "0",
          "totalBasicPayment": "12692.31",
          "totalOTPayment": "1002.00",
          "payableSalary": "13694.31",
          "balance": "13694.31",
          "workedHours": "176.0"
        }
      ],
      "_id": "60f1e5b3e6b3f32b8c9d4e5f",
      "createdAt": "2023-07-16T12:34:56.789Z",
      "updatedAt": "2023-07-16T12:34:56.789Z",
      "__v": 0
    }
  }
  ```

## Calculation Logic

### 1. OT1 (Regular Day Overtime)

- OT1 is calculated when an employee works beyond regular hours (after 5:30 PM) on a regular working day.
- Only counted if the employee works more than 29 minutes after regular hours.
- Calculated at 1.25x the hourly rate.

### 2. OT2 (Holiday/Weekend Overtime)

- OT2 is calculated when an employee works on a holiday or weekend (status is OFF, W, or H).
- All hours worked on these days are considered OT2.
- Calculated at 1.75x the hourly rate.

### 3. Hourly Rate Calculation

- Hourly rate is calculated as: Basic Salary / (8 hours * 26 working days)
- For example, with a basic salary of 15000:
  - Hourly rate = 15000 / (8 * 26) = 72.12 per hour

### 4. Payment Loss for Absent Days

- Payment loss is calculated as: (Absent Days * Daily Rate)
- Daily rate is calculated as: Basic Salary / 26 working days

### 5. Total Basic Payment

- Total basic payment = Basic Salary - Payment Loss Amount

### 6. Total OT Payment

- Total OT payment = OT1 Amount + OT2 Amount - Hold OT

### 7. Payable Salary

- Payable salary = Total Basic Payment + Total OT Payment

## Integration with Attendance Module

The payroll module is automatically triggered when attendance data is uploaded through:

1. **PDF Upload**: When attendance data is uploaded as a PDF file.
2. **CSV/Excel Upload**: When attendance data is uploaded as a CSV or Excel file.

The system extracts attendance information, including:
- Present/absent days
- Working hours
- OT hours
- Late hours
- Early out hours

This data is then used to calculate the payroll for each employee.

## Default Values

The following fields have default values and can be updated from the frontend:
- House Rent: 0
- EPF: 0
- ESIC: 0
- Incentives: 0
- Allowances: 0
- Advance: 0
- Hold OT: 0

## Basic Salary

The default basic salary is set to 15000, but this can be customized for each employee.