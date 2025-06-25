import React from "react";
import { UserCircle } from "lucide-react";
import url from "./global";
import userImage from '../assets/images/profile.png'

export default function UserCard({ user, onClose }) {
  return (
    <div className=" card-container">
      <div className="card-start">
        <div className=" alignment">
          <div className="  circle  ">
           
          {/* <UserCircle className=" user-circle" /> */}
            <img
              src={user.profileUrl ? url + user.profileUrl : userImage}
              alt="iser"
              style={{height: "34px !important"}}
              className=" profile-image "
            />
          </div>
          <div>
            <h3 className=" user-name ">{user.name}</h3>
            {/* <p className=" user-email">{user.email}</p> */}
            <p className="user-email">Employee ID: {user.empId}</p>
          </div>
        </div>
        <button onClick={onClose} className=" close-button ">
          ×
        </button>
      </div>
    </div>
  );
}
