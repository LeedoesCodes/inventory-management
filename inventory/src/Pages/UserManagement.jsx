import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../Firebase/firebase";
import Sidebar from "../components/UI/Sidebar";
import Header from "../components/UI/Headers";
import { useSidebar } from "../context/SidebarContext";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faUserShield,
  faCode,
  faUserTie,
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faEnvelope,
  faPhone,
  faCalendar,
  faKey,
  faEye,
  faEyeSlash,
  faFilter,
  faSort,
  faLock,
  faExternalLinkAlt,
  faCheckCircle,
  faTimesCircle,
  faSync,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/userManagement.scss";

export default function UserManagement() {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordChangeStep, setPasswordChangeStep] = useState("idle");
  const [syncing, setSyncing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "employee",
    department: "",
    position: "",
    status: "active",
    permissions: {
      products: true,
      orders: true,
      customers: true,
      reports: false,
      settings: false,
    },
  });

  const [password, setPassword] = useState("");

  const userRoles = [
    {
      value: "admin",
      label: "Administrator",
      icon: faUserShield,
      color: "#ef4444",
    },
    { value: "developer", label: "Developer", icon: faCode, color: "#8b5cf6" },
    { value: "employee", label: "Employee", icon: faUserTie, color: "#009feb" },
  ];

  const departments = [
    "Sales",
    "Inventory",
    "Customer Service",
    "Management",
    "IT",
    "Operations",
  ];

  // Real-time listener for users collection
  useEffect(() => {
    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error in real-time listener:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getRoleInfo = (role) => {
    return userRoles.find((r) => r.value === role) || userRoles[2];
  };

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const verifyCurrentPassword = async () => {
    if (!currentPassword) {
      alert("Please enter your current password");
      return false;
    }

    try {
      setPasswordChangeStep("verifying");
      const userDoc = await getDocs(
        query(collection(db, "users"), where("id", "==", editingUser.id))
      );

      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        if (userData.password === currentPassword) {
          setPasswordChangeStep("changing");
          return true;
        } else {
          alert("Current password is incorrect");
          setCurrentPassword("");
          setPasswordChangeStep("idle");
          return false;
        }
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      alert("Error verifying password. Please try again.");
      setPasswordChangeStep("idle");
      return false;
    }

    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Name and email are required");
      return;
    }

    if (!editingUser && !password) {
      alert("Password is required for new users");
      return;
    }

    if (editingUser && password) {
      if (passwordChangeStep !== "changing") {
        const verified = await verifyCurrentPassword();
        if (!verified) return;
      }
    }

    try {
      setSyncing(true);
      const userData = {
        ...formData,
        updatedAt: new Date(),
        lastLogin: null,
        loginCount: 0,
      };

      if (editingUser) {
        if (password) {
          userData.password = password;
        }
        await updateDoc(doc(db, "users", editingUser.id), userData);
        alert("User updated successfully!");
      } else {
        await addDoc(collection(db, "users"), {
          ...userData,
          password: password,
          createdAt: new Date(),
          createdBy: "current-user-id",
        });
        alert("User created successfully!");
      }

      setShowForm(false);
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "employee",
        department: "",
        position: "",
        status: "active",
        permissions: {
          products: true,
          orders: true,
          customers: true,
          reports: false,
          settings: false,
        },
      });
      setPassword("");
      setCurrentPassword("");
      setPasswordChangeStep("idle");
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Error saving user. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "employee",
      department: user.department || "",
      position: user.position || "",
      status: user.status || "active",
      permissions: user.permissions || {
        products: true,
        orders: true,
        customers: true,
        reports: false,
        settings: false,
      },
    });
    setPassword("");
    setCurrentPassword("");
    setPasswordChangeStep("idle");
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        setSyncing(true);
        await deleteDoc(doc(db, "users", userId));
        alert("User deleted successfully!");
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Error deleting user. Please try again.");
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleStatusToggle = async (user, newStatus) => {
    try {
      setSyncing(true);
      await updateDoc(doc(db, "users", user.id), {
        status: newStatus,
        updatedAt: new Date(),
      });

      // Removed the alert confirmation for status toggle
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Error updating user status. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterRole === "all" || user.role === filterRole)
  );

  const getPermissionLabel = (key) => {
    const labels = {
      products: "Manage Products",
      orders: "Process Orders",
      customers: "Manage Customers",
      reports: "View Reports",
      settings: "System Settings",
    };
    return labels[key] || key;
  };

  const resetPasswordFields = () => {
    setPassword("");
    setCurrentPassword("");
    setPasswordChangeStep("idle");
  };

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`users-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        <div className="users-content">
          <div className="page-header">
            <div className="header-title">
              <h1>User Management</h1>
            </div>
            <p>Manage system users, and roles</p>
            {syncing && (
              <div className="sync-indicator">
                <FontAwesomeIcon icon={faSync} className="spinning" />
                <span>Syncing changes...</span>
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon total-users">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <div className="stat-info">
                <h3>{users.length}</h3>
                <p>Total Users</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon active-users">
                <FontAwesomeIcon icon={faUserShield} />
              </div>
              <div className="stat-info">
                <h3>{users.filter((u) => u.status === "active").length}</h3>
                <p>Active Users</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon admin-users">
                <FontAwesomeIcon icon={faUserTie} />
              </div>
              <div className="stat-info">
                <h3>{users.filter((u) => u.role === "admin").length}</h3>
                <p>Administrators</p>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="controls-bar">
            <div className="search-container">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Search users by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-controls">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="role-filter"
              >
                <option value="all">All Roles</option>
                {userRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <button
                className="add-user-btn"
                onClick={() => setShowForm(true)}
                disabled={syncing}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add User
              </button>
            </div>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="loading">
              <FontAwesomeIcon icon={faSync} className="spinning" />
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="no-users">
              <FontAwesomeIcon icon={faUser} size="3x" />
              <p>No users found</p>
              <button
                className="add-user-btn"
                onClick={() => setShowForm(true)}
                disabled={syncing}
              >
                Add Your First User
              </button>
            </div>
          ) : (
            <div className="users-grid">
              {filteredUsers.map((user) => {
                const roleInfo = getRoleInfo(user.role);

                return (
                  <div key={user.id} className={`user-card ${user.status}`}>
                    <div className="user-header">
                      <div
                        className={`user-avatar ${
                          user.photoURL ? "has-photo" : ""
                        }`}
                        onClick={() => handleProfileClick(user.id)}
                        style={{
                          backgroundColor: user.photoURL
                            ? "transparent"
                            : roleInfo.color,
                          cursor: "pointer",
                        }}
                        title="Click to view profile"
                      >
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={`${user.name}'s profile`}
                            className="profile-photo"
                          />
                        ) : (
                          <FontAwesomeIcon icon={roleInfo.icon} />
                        )}
                        <div className="profile-overlay">
                          <FontAwesomeIcon icon={faExternalLinkAlt} />
                        </div>
                        <div className={`status-indicator ${user.status}`}>
                          <FontAwesomeIcon
                            icon={
                              user.status === "active"
                                ? faCheckCircle
                                : faTimesCircle
                            }
                          />
                        </div>
                      </div>
                      <div className="user-info">
                        <h3
                          className="user-name clickable"
                          onClick={() => handleProfileClick(user.id)}
                          title="Click to view profile"
                        >
                          {user.name}
                          <span className={`status-badge ${user.status}`}>
                            {user.status === "active" ? "Active" : "Inactive"}
                          </span>
                          <FontAwesomeIcon
                            icon={faExternalLinkAlt}
                            className="name-link-icon"
                          />
                        </h3>
                        <div className="user-meta">
                          <span
                            className="user-role"
                            style={{ color: roleInfo.color }}
                          >
                            {roleInfo.label}
                          </span>
                          <span className="user-email">
                            <FontAwesomeIcon icon={faEnvelope} />
                            {user.email}
                          </span>
                          {user.phone && (
                            <span className="user-phone">
                              <FontAwesomeIcon icon={faPhone} />
                              {user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="user-details">
                      {(user.department || user.position) && (
                        <div className="detail-row">
                          <span>{user.department}</span>
                          {user.position && (
                            <span className="position">{user.position}</span>
                          )}
                        </div>
                      )}

                      <div className="user-stats">
                        <div className="stat-item">
                          <FontAwesomeIcon icon={faCalendar} />
                          <span>
                            Created:{" "}
                            {user.createdAt?.toDate?.().toLocaleDateString() ||
                              "N/A"}
                          </span>
                        </div>
                        {user.lastLogin && (
                          <div className="stat-item">
                            <FontAwesomeIcon icon={faUser} />
                            <span>
                              Last Login:{" "}
                              {user.lastLogin.toDate?.().toLocaleDateString() ||
                                "Never"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="user-actions">
                      {/* Sliding Toggle Switch - Now without confirmation */}
                      <div className="toggle-switch">
                        <input
                          type="checkbox"
                          id={`user-status-${user.id}`}
                          checked={user.status === "active"}
                          onChange={(e) => {
                            const newStatus = e.target.checked
                              ? "active"
                              : "inactive";
                            handleStatusToggle(user, newStatus);
                          }}
                          className="toggle-input"
                          disabled={syncing}
                        />
                        <label
                          htmlFor={`user-status-${user.id}`}
                          className="toggle-label"
                        >
                          <span className="toggle-handle"></span>
                          <span className="toggle-text active">Active</span>
                          <span className="toggle-text inactive">Inactive</span>
                        </label>
                      </div>

                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(user)}
                        title="Edit User"
                        disabled={syncing}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(user.id)}
                        title="Delete User"
                        disabled={syncing}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User Form Modal - Keep the existing form */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    setFormData({
                      name: "",
                      email: "",
                      phone: "",
                      role: "employee",
                      department: "",
                      position: "",
                      status: "active",
                      permissions: {
                        products: true,
                        orders: true,
                        customers: true,
                        reports: false,
                        settings: false,
                      },
                    });
                    setPassword("");
                    setCurrentPassword("");
                    setPasswordChangeStep("idle");
                  }}
                  disabled={syncing}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="user-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter full name"
                      required
                      disabled={syncing}
                    />
                  </div>

                  <div className="form-group"></div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="Enter phone number"
                      disabled={syncing}
                    />
                  </div>

                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      required
                      disabled={syncing}
                    >
                      {userRoles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      disabled={syncing}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Position</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      placeholder="Enter job position"
                      disabled={syncing}
                    />
                  </div>
                </div>

                {/* Password Section */}
                <div className="password-section">
                  <h4>
                    <FontAwesomeIcon icon={faLock} />
                    Password {!editingUser && "*"}
                  </h4>

                  {editingUser ? (
                    <>
                      {/* Current Password Verification */}
                      {passwordChangeStep === "idle" && password && (
                        <div className="form-group">
                          <label>Current Password *</label>
                          <div className="password-input">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) =>
                                setCurrentPassword(e.target.value)
                              }
                              placeholder="Enter your current password to change password"
                              required
                              disabled={syncing}
                            />
                            <button
                              type="button"
                              className="password-toggle"
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                              disabled={syncing}
                            >
                              <FontAwesomeIcon
                                icon={showCurrentPassword ? faEyeSlash : faEye}
                              />
                            </button>
                          </div>
                          <small className="password-hint">
                            You must verify your current password to set a new
                            one
                          </small>
                        </div>
                      )}

                      {/* New Password Field */}
                      <div className="form-group">
                        <label>New Password</label>
                        <div className="password-input">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave blank to keep current password"
                            disabled={
                              passwordChangeStep === "verifying" || syncing
                            }
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            disabled={
                              passwordChangeStep === "verifying" || syncing
                            }
                          >
                            <FontAwesomeIcon
                              icon={showNewPassword ? faEyeSlash : faEye}
                            />
                          </button>
                        </div>
                        {password && passwordChangeStep === "idle" && (
                          <small className="password-warning">
                            ⚠️ You'll need to verify your current password above
                          </small>
                        )}
                        {passwordChangeStep === "verifying" && (
                          <small className="password-verifying">
                            🔄 Verifying current password...
                          </small>
                        )}
                        {passwordChangeStep === "changing" && (
                          <small className="password-success">
                            ✅ Current password verified. You can now save
                            changes.
                          </small>
                        )}
                      </div>

                      {/* Cancel Password Change Button */}
                      {passwordChangeStep !== "idle" && (
                        <button
                          type="button"
                          className="btn-cancel-password"
                          onClick={resetPasswordFields}
                          disabled={syncing}
                        >
                          Cancel Password Change
                        </button>
                      )}
                    </>
                  ) : (
                    /* New User Password Field */
                    <div className="form-group">
                      <label>Password *</label>
                      <div className="password-input">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password for new user"
                          required
                          disabled={syncing}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={syncing}
                        >
                          <FontAwesomeIcon
                            icon={showPassword ? faEyeSlash : faEye}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Toggle Switch */}
                <div className="form-group">
                  <label>Status</label>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      id="user-status"
                      checked={formData.status === "active"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.checked ? "active" : "inactive",
                        })
                      }
                      className="toggle-input"
                      disabled={syncing}
                    />
                    <label htmlFor="user-status" className="toggle-label">
                      <span className="toggle-handle"></span>
                      <span className="toggle-text active">Active</span>
                      <span className="toggle-text inactive">Inactive</span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowForm(false);
                      setEditingUser(null);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        role: "employee",
                        department: "",
                        position: "",
                        status: "active",
                        permissions: {
                          products: true,
                          orders: true,
                          customers: true,
                          reports: false,
                          settings: false,
                        },
                      });
                      setPassword("");
                      setCurrentPassword("");
                      setPasswordChangeStep("idle");
                    }}
                    disabled={syncing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={passwordChangeStep === "verifying" || syncing}
                  >
                    {syncing ? (
                      <>
                        <FontAwesomeIcon icon={faSync} className="spinning" />
                        {passwordChangeStep === "verifying"
                          ? "Verifying..."
                          : "Saving..."}
                      </>
                    ) : passwordChangeStep === "verifying" ? (
                      "Verifying..."
                    ) : editingUser ? (
                      "Update User"
                    ) : (
                      "Create User"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
