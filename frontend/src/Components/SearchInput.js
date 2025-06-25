import React from 'react';
import { Search } from 'lucide-react';


export default function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search className=" search-icons" />
      <input
        type="text"
        className=" search-input   search-featues "
        placeholder={placeholder || "Search..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}