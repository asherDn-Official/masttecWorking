// src/components/DetailsModal.js
import React from 'react';

const DetailsModal = ({ isOpen, onClose, employeeData, dateHeadersMap }) => {
  if (!isOpen) return null;

  const parseDetailedData = (employeeBlock, dateMap) => {
    if (!dateMap) return [];
    
    const dataByCategory = new Map();
    employeeBlock.forEach(row => {
        if (row['MASTTEC MOULDS']) {
            dataByCategory.set(row['MASTTEC MOULDS'].trim(), row);
        }
    });
    
    const detailedRecords = [];
    const categories = ['Status', 'Shift', 'Time In', 'Time Out', 'Worked Hrs.', 'Late', 'E.Out', 'OT 1', 'OT 2'];
    
    // Sort dates to ensure consistent order in the modal table
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
        const [dayA, monthA] = a.split('-').map(Number);
        const [dayB, monthB] = b.split('-').map(Number);
        // Assuming dates are from the same year for simple comparison
        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
    });

    sortedDates.forEach(date => {
        const dataKey = dateMap.get(date);
        const record = { date };
        categories.forEach(category => {
            const rowData = dataByCategory.get(category);
            record[category] = rowData && rowData[dataKey] ? rowData[dataKey] : '—';
        });
        detailedRecords.push(record);
    });
    return detailedRecords;
  };

  const detailedRecords = employeeData ? parseDetailedData(employeeData.details, dateHeadersMap) : [];
  const modalTitle = employeeData ? `Details for ${employeeData.name} (${employeeData.number})` : 'Attendance Details';

  const headers = detailedRecords.length > 0 ? Object.keys(detailedRecords[0]) : [];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col transform scale-95 transition-transform duration-300 ease-out">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 id="modalTitle" className="text-2xl font-bold text-gray-900">{modalTitle}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {detailedRecords.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detailedRecords.map((record, index) => (
                  <tr key={index}>
                    {headers.map((header) => (
                      <td key={header} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {record[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No detailed records found for this employee.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;