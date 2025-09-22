import { useEffect, useState } from "react";
import { db } from "../Firebase/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Sidebar from "../components/UI/Sidebar";
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

  const rejectUser = async (userId) => {
    await deleteDoc(doc(db, "users", userId));
    setUsers(users.filter((u) => u.id !== userId));
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
                  <div className="button-group">
                    <button
                      className="btn-approve"
                      onClick={() => approveUser(u.id)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => rejectUser(u.id)}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
