import { useEffect, useState } from "react";
import { db } from "../Firebase/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import Sidebar from "../components/UI/Sidebar";
import Header from "../components/UI/Headers";
import { useSidebar } from "../context/SidebarContext";
import "../styles/user-approvals.scss";

export default function UserApprovals() {
  const { isCollapsed } = useSidebar();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("pending"); // "pending", "customers", "workers"

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date(),
      }));
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    try {
      setActionLoading(userId);
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        role: "approved", // Consistent with existing users
        approvedAt: new Date(),
      });
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: "approved" } : u))
      );
      console.log("User approved:", userId);
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Error approving user. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectUser = async (userId) => {
    if (
      window.confirm(
        "Are you sure you want to reject this user? This action cannot be undone."
      )
    ) {
      try {
        setActionLoading(userId);
        await deleteDoc(doc(db, "users", userId));
        setUsers(users.filter((u) => u.id !== userId));
      } catch (error) {
        console.error("Error rejecting user:", error);
        alert("Error rejecting user. Please try again.");
      } finally {
        setActionLoading(null);
      }
    }
  };

  // Filter users based on role and intendedRole
  const pendingUsers = users.filter((u) => u.role === "pending");
  const approvedUsers = users.filter(
    (u) => u.role === "approved" || u.role === "admin"
  );

  // Separate customers and workers based on intendedRole
  const customerUsers = users.filter((u) => u.intendedRole === "customer");
  const workerUsers = users.filter((u) => u.intendedRole === "worker");
  const unknownRoleUsers = users.filter(
    (u) => !u.intendedRole || u.intendedRole === "unknown"
  );

  // Filter based on search term
  const filterUsers = (userList) => {
    return userList.filter(
      (user) =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderPendingUsers = () => (
    <div className="users-section">
      <h2>Pending Users ({pendingUsers.length})</h2>

      {pendingUsers.length === 0 ? (
        <div className="empty-state">
          <p>No pending user approvals</p>
          <span>All users have been processed</span>
        </div>
      ) : (
        <div className="users-grid">
          {filterUsers(pendingUsers).map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <div className="user-avatar">
                  {user.displayName && user.displayName.length > 0
                    ? user.displayName.charAt(0).toUpperCase()
                    : user.email && user.email.length > 0
                    ? user.email.charAt(0).toUpperCase()
                    : "?"}
                </div>
                <div className="user-details">
                  <h3>{user.displayName || "No Name"}</h3>
                  <p className="user-email">{user.email}</p>
                  <p className="user-date">
                    Requested: {formatDate(user.createdAt)}
                  </p>
                  {user.intendedRole && (
                    <p className="user-role">
                      Role:{" "}
                      <span className="role-badge">{user.intendedRole}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="user-actions">
                <button
                  className="btn-approve"
                  onClick={() => approveUser(user.id)}
                  disabled={actionLoading === user.id}
                >
                  {actionLoading === user.id ? "Approving..." : "Approve"}
                </button>
                <button
                  className="btn-reject"
                  onClick={() => rejectUser(user.id)}
                  disabled={actionLoading === user.id}
                >
                  {actionLoading === user.id ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCustomerUsers = () => (
    <div className="users-section">
      <h2>Customer Users ({customerUsers.length})</h2>

      {customerUsers.length === 0 ? (
        <div className="empty-state">
          <p>No customer users found</p>
          <span>Users who selected "Customer" will appear here</span>
        </div>
      ) : (
        <div className="users-grid">
          {filterUsers(customerUsers).map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <div className="user-avatar">
                  {user.displayName && user.displayName.length > 0
                    ? user.displayName.charAt(0).toUpperCase()
                    : user.email && user.email.length > 0
                    ? user.email.charAt(0).toUpperCase()
                    : "?"}
                </div>
                <div className="user-details">
                  <h3>{user.displayName || "No Name"}</h3>
                  <p className="user-email">{user.email}</p>
                  <p className="user-role">
                    Status:{" "}
                    <span className={`status-badge ${user.role}`}>
                      {user.role === "pending"
                        ? "Pending Approval"
                        : user.role === "approved"
                        ? "Approved"
                        : user.role === "admin"
                        ? "Admin"
                        : user.role}
                    </span>
                  </p>
                  <p className="user-date">
                    Registered: {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
              {user.role === "pending" && (
                <div className="user-actions">
                  <button
                    className="btn-approve"
                    onClick={() => approveUser(user.id)}
                    disabled={actionLoading === user.id}
                  >
                    {actionLoading === user.id ? "Approving..." : "Approve"}
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => rejectUser(user.id)}
                    disabled={actionLoading === user.id}
                  >
                    {actionLoading === user.id ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderWorkerUsers = () => (
    <div className="users-section">
      <h2>Worker Users ({workerUsers.length})</h2>

      {workerUsers.length === 0 ? (
        <div className="empty-state">
          <p>No worker users found</p>
          <span>Users who selected "Worker" will appear here</span>
        </div>
      ) : (
        <div className="users-grid">
          {filterUsers(workerUsers).map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <div className="user-avatar">
                  {user.displayName && user.displayName.length > 0
                    ? user.displayName.charAt(0).toUpperCase()
                    : user.email && user.email.length > 0
                    ? user.email.charAt(0).toUpperCase()
                    : "?"}
                </div>
                <div className="user-details">
                  <h3>{user.displayName || "No Name"}</h3>
                  <p className="user-email">{user.email}</p>
                  <p className="user-role">
                    Status:{" "}
                    <span className={`status-badge ${user.role}`}>
                      {user.role === "pending"
                        ? "Pending Approval"
                        : user.role === "approved"
                        ? "Approved"
                        : user.role === "admin"
                        ? "Admin"
                        : user.role}
                    </span>
                  </p>
                  <p className="user-date">
                    Registered: {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
              {user.role === "pending" && (
                <div className="user-actions">
                  <button
                    className="btn-approve"
                    onClick={() => approveUser(user.id)}
                    disabled={actionLoading === user.id}
                  >
                    {actionLoading === user.id ? "Approving..." : "Approve"}
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => rejectUser(user.id)}
                    disabled={actionLoading === user.id}
                  >
                    {actionLoading === user.id ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderApprovedUsers = () => (
    <div className="users-section">
      <h2>Approved Users ({approvedUsers.length})</h2>
      {approvedUsers.length > 0 ? (
        <div className="approved-users-list">
          {filterUsers(approvedUsers).map((user) => (
            <div key={user.id} className="approved-user-item">
              <div className="user-details">
                <span className="user-name">
                  {user.displayName || "No Name"}
                </span>
                <span className="user-email">{user.email}</span>
                {user.intendedRole && (
                  <span className="user-role-tag">{user.intendedRole}</span>
                )}
              </div>
              <span className="approved-badge">Approved</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No approved users found</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="page-container">
        <Sidebar />
        <div
          className={`user-approvals-page ${isCollapsed ? "collapsed" : ""}`}
        >
          <Header />
          <div className="user-approvals-content">
            <div className="loading">Loading users...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`user-approvals-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        <div className="user-approvals-content">
          <div className="page-header">
            <h1>User Management</h1>
            <div className="stats">
              <div className="stat-card pending">
                <span className="stat-number">{pendingUsers.length}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-card customers">
                <span className="stat-number">{customerUsers.length}</span>
                <span className="stat-label">Customers</span>
              </div>
              <div className="stat-card workers">
                <span className="stat-number">{workerUsers.length}</span>
                <span className="stat-label">Workers</span>
              </div>
              <div className="stat-card approved">
                <span className="stat-number">{approvedUsers.length}</span>
                <span className="stat-label">Approved</span>
              </div>
            </div>
          </div>

          <div className="search-container">
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="tabs-container">
            <div className="tabs">
              <button
                className={`tab ${activeTab === "pending" ? "active" : ""}`}
                onClick={() => setActiveTab("pending")}
              >
                Pending Approval
              </button>
              <button
                className={`tab ${activeTab === "customers" ? "active" : ""}`}
                onClick={() => setActiveTab("customers")}
              >
                Customers
              </button>
              <button
                className={`tab ${activeTab === "workers" ? "active" : ""}`}
                onClick={() => setActiveTab("workers")}
              >
                Workers
              </button>
              <button
                className={`tab ${activeTab === "approved" ? "active" : ""}`}
                onClick={() => setActiveTab("approved")}
              >
                Approved Users
              </button>
            </div>
          </div>

          <div className="tab-content">
            {activeTab === "pending" && renderPendingUsers()}
            {activeTab === "customers" && renderCustomerUsers()}
            {activeTab === "workers" && renderWorkerUsers()}
            {activeTab === "approved" && renderApprovedUsers()}
          </div>
        </div>
      </div>
    </div>
  );
}
