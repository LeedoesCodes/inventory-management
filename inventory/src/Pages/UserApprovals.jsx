import { useEffect, useState } from "react";
import { db } from "../Firebase/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import Sidebar from "../components/UI/sidebar";
import "../styles/user-approvals.scss";

export default function UserApprovals() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      setUsers(querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchUsers();
  }, []);

  const approveUser = async (userId) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { role: "approved" });
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, role: "approved" } : u))
    );
  };

  return (
    <div className="user-approvals-page">
      <Sidebar />
      <div className="content">
        <h1>Pending Users</h1>
        {users.filter((u) => u.role === "pending").length === 0 ? (
          <p>No pending users</p>
        ) : (
          <ul>
            {users
              .filter((u) => u.role === "pending")
              .map((u) => (
                <li key={u.id}>
                  <span>{u.email}</span>
                  <button onClick={() => approveUser(u.id)}>Approve</button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
