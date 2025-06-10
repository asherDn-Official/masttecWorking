// src/components/SummaryTable.js
import React from 'react';

const SummaryTable = ({ data, onViewDetails }) => {
  if (data.length === 0) {
    return null;
  }

  // Define all the headers in the desired order
  const headers = [
    'ID',
    'Name',
    'Paid Leave', // New
    'Lop',        // New
    'Weekly Off', // New
    'Holiday',    // New
    'On Duty',    // New
    'Present',
    'Absent',
    'Worked Hrs.',
    'Late',       // New (assuming 'Late' is present in summary)
    'E.Out',      // New (assuming 'E.Out' for Early Out is present in summary)
    'OT 1',
    'OT 2',       // New (assuming 'OT 2' is present in summary)
    'OT All',     // New (assuming 'OT All' is present in summary)
    'Details'
  ];

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Processed Attendance Summary</h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((employee, index) => (
              <tr key={employee.number}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.name}</td>
                {/* Render new summary fields */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.summary['Paid Leave'] ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.summary['Lop'] ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.summary['Weekly Off'] ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.summary['Holiday'] ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.summary['On Duty'] ?? 'N/A'}</td>
                {/* Existing summary fields */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.summary['Present'] ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.summary['Absent'] ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.summary['Worked Hrs.'] ?? 'N/A'}</td>
                {/* New summary fields from existing data */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.summary['Late'] ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.summary['E.Out'] ?? 'N/A'}</td> {/* Assuming 'E.Out' is the key */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.summary['OT 1'] ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.summary['OT 2'] ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.summary['OT All'] ?? 'N/A'}</td> {/* Assuming 'OT All' is the key */}
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900" onClick={() => onViewDetails(employee)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SummaryTable;