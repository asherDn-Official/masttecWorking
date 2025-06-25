import React from "react";
import url from "./global";
import userImage from '../assets/images/profile.png'

export default function SearchResults({ results, onSelect }) {
  if (results.length === 0) return null;

  return (
    <div className=" result-container ">
      {results.map((user) => (
        <div className="search-container">
          <button
            key={user.id}
            className=" result-btn "
            onClick={() => onSelect(user)}
          >
            <div className=" suggestion-list">
              <div>
                <img
                  src={user.profileUrl ? url + user.profileUrl : userImage}
                  alt="user"
                  className=" user-image "
                />
              </div>
              <div>
                <div className="font-medium">{user.name}</div>
                <div className=" text-sm">Employee ID: {user.empId}</div>
              </div>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}
