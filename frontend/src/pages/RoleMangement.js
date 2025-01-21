import { useEffect, useState } from "react";
import "../CSS/roleassignment.css";
import UserSearch from "../Components/UserSearch";
import axios from "axios";
import url from "../Components/global";
import { toast } from "react-toastify";

const initialRoles = [
  { id: "1", name: "SuperAdmin"},
  { id: "2", name: "Accountant"},
  { id: "3", name: "Supervisor"},
];

export default function RoleMangement() {
  const [roles, setRoles] = useState(initialRoles);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [autherizedUser, setautherizedUser] = useState([]);

  async function getauthEmployee() {
    try {
      const response = await axios.get(`${url}/v1/api/role/getallroles`);

      const userRolesMap = {};
      response.data.roles.forEach(({ role, authorizedPersons }) => {
        authorizedPersons.forEach((empId) => {
          // If empId doesn't exist in the map, create an entry
          if (!userRolesMap[empId]) {
            userRolesMap[empId] = [];
          }
          // Add the role to the empId's roles array
          userRolesMap[empId].push(role);
        });

        const initialUsers = Object.entries(userRolesMap).map(
          ([empId, roles]) => ({
            empId,
            roles,
          })
        );

        setautherizedUser(initialUsers);
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function getemployee() {
    try {
      const response = await axios.get(`${url}/v1/api/employees`);
      const data = await response.data;

      if (data) {
        const alldata = data.map((emp, index) => {
          return {
            id: index,
            name: emp.employeeName,
            email: emp.mailId,
            empId: emp.employeeId,
            roles: [],
            profileUrl: emp.employeePicture,
          };
        });
        setUsers(alldata);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  useEffect(() => {
    getemployee();
    getauthEmployee();
  }, []);

  const handleAssignRole = async () => {
    try {
      const response = await axios.put(
        `${url}/v1/api/role/addAuthorizedPerson`,
        {
          role: selectedRole,
          employeeId: selectedUser.empId,
        }
      );

      toast.success(response.data || "Role assigned successfully!", {
        position: "top-right",
      });

      getauthEmployee();
      //  empty the data after click
      setSelectedUser("");
      setSelectedRole("");
    } catch (err) {
      console.log(err);
      toast.error(err.response || "Role assigned successfully!", {
        position: "top-right",
      });
    }
  };

  const handleRemoveUserRole = async (userId, roleName) => {
    try {
      const response = await axios.put(
        `${url}/v1/api/role/removeAuthorizedPerson`,
        {
          role: roleName,
          employeeId: userId,
        }
      );
      console.log(response.data);

      getauthEmployee();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="digital-container ">
      <h1>Role Management</h1>


      {/* assign role */}
      <div className="section">
        <h2 className=" h-2">Assign Role</h2>
        <div className="add-new-role">
          <UserSearch
            users={users}
            onUserSelect={setSelectedUser}
            selectedUser={selectedUser}
            onClearSelection={() => setSelectedUser(null)}
          />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="select-role"
          >
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
          <button onClick={handleAssignRole} className="assign-role-button">
            Assign Role
          </button>
        </div>
      </div>

      {/* users roles */}
      <div className="section space">
        <h2 className=" h-2">Users by Role</h2>

        {roles.map((role) => (
          <div key={role.id} className="  roles-container ">
            <h3 className=" h-3">{role.name}</h3>
            <div className="added-users">
              {autherizedUser
                .filter((user) => user.roles.includes(role.name))
                .map((user,index) => (
                  <div key={index} className=" user-item ">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="user-email">Employee ID: {user.empId}</p>
                    </div>
                    <button
                      onClick={() =>
                        handleRemoveUserRole(user.empId, role.name)
                      }
                      className=" remove-role-button"
                      title="Remove role from user"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9h4q.425 0 .713.288T22 10t-.288.713T21 11h-4q-.425 0-.712-.288T16 10t.288-.712T17 9m-8 3q-1.65 0-2.825-1.175T5 8t1.175-2.825T9 4t2.825 1.175T13 8t-1.175 2.825T9 12m-8 6v-.8q0-.85.438-1.562T2.6 14.55q1.55-.775 3.15-1.162T9 13t3.25.388t3.15 1.162q.725.375 1.163 1.088T17 17.2v.8q0 .825-.587 1.413T15 20H3q-.825 0-1.412-.587T1 18m2 0h12v-.8q0-.275-.137-.5t-.363-.35q-1.35-.675-2.725-1.012T9 15t-2.775.338T3.5 16.35q-.225.125-.363.35T3 17.2zm6-8q.825 0 1.413-.587T11 8t-.587-1.412T9 6t-1.412.588T7 8t.588 1.413T9 10m0 8"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
