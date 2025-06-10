// src/components/FileInput.js
import React, { useState } from 'react';

const FileInput = ({ id, label, fileType, onFileSelect }) => {
  const [fileName, setFileName] = useState('');
  const [isUploaded, setIsUploaded] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      setIsUploaded(true);
      onFileSelect(file, fileType);
    } else {
      setFileName('');
      setIsUploaded(false);
      onFileSelect(null, fileType);
    }
  };

  let defaultLabel;
  let acceptAttribute;

  if (fileType === 'excel') {
    defaultLabel = 'Click to upload `attendance.xlsx`';
    acceptAttribute = '.xlsx,.xls';
  } else if (fileType === 'csv') {
    defaultLabel = 'Click to upload `.csv` file';
    acceptAttribute = '.csv';
  } else {
    defaultLabel = 'Select a file';
    acceptAttribute = '*'; // Fallback for unknown type
  }

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-2 font-semibold text-gray-700">{label}</label>
      <label
        htmlFor={id}
        className={`file-input-label w-full bg-gray-50 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
          isUploaded ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        }`}
      >
        <span className="text-gray-500">{fileName || defaultLabel}</span>
        <input type="file" id={id} className="hidden" accept={acceptAttribute} onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default FileInput;