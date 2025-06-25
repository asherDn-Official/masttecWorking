import React, { useState } from "react";

import SearchResults from "./SearchResults";
import SearchInput from "./SearchInput";
import UserCard from "./UserCard";

export default function UserSearch({
  users,
  onUserSelect,
  selectedUser,
  onClearSelection,
}) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const handleSearch = (query) => {
    setSearch(query);
    if (query.trim() === "") {
      setSuggestions([]);
      return;
    }

    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.empId.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(filtered);
  };

  const handleSelect = (user) => {
    onUserSelect(user);
    setSearch("");
    setSuggestions([]);
  };

  return (
    <div className=" space-y-4">
      {selectedUser ? (
        <UserCard user={selectedUser} onClose={onClearSelection} />
      ) : (
        <div className=" search-container">
          <SearchInput
            value={search}
            onChange={handleSearch}
            placeholder="Search by name, email, or employee ID"
          />
          <SearchResults results={suggestions} onSelect={handleSelect} />
        </div>
      )}
    </div>
  );
}
