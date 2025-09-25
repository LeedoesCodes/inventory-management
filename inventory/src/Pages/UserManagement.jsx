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
} from "firebase/firestore";
import { db } from "../Firebase/firebase";
import Sidebar from "../components/UI/Sidebar";
import Header from "../components/UI/Headers";
import { useSidebar } from "../context/SidebarContext";
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
} from "@fortawesome/free-solid-svg-icons";
import "../styles/userManagement.scss";

export default function UserManagement() {
  const { isCollapsed } = useSidebar();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "users"));
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleInfo = (role) => {
    return userRoles.find((r) => r.value === role) || userRoles[2]; // Default to employee
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

    try {
      const userData = {
        ...formData,
        updatedAt: new Date(),
        lastLogin: null,
        loginCount: 0,
      };

      if (editingUser) {
        // Update existing user
        if (password) {
          userData.password = password; // In real app, hash this password
        }
        await updateDoc(doc(db, "users", editingUser.id), userData);
        alert("User updated successfully!");
      } else {
        // Create new user
        await addDoc(collection(db, "users"), {
          ...userData,
          password: password, // In real app, hash this password
          createdAt: new Date(),
          createdBy: "current-user-id", // You'd get this from auth context
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
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Error saving user. Please try again.");
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
    setPassword(""); // Don't show existing password
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        await deleteDoc(doc(db, "users", userId));
        alert("User deleted successfully!");
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Error deleting user. Please try again.");
      }
    }
  };

  const handleStatusToggle = async (user) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      await updateDoc(doc(db, "users", user.id), {
        status: newStatus,
        updatedAt: new Date(),
      });
      alert(
        `User ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully!`
      );
      fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Error updating user status. Please try again.");
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

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`users-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        <div className="users-content">
          <div className="page-header">
            <h1>User Management</h1>
            <p>Manage system users, roles, and permissions</p>
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
              <div className="filter-group">
                <FontAwesomeIcon icon={faFilter} />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  {userRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="add-user-btn"
                onClick={() => setShowForm(true)}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add User
              </button>
            </div>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="loading">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="no-users">
              <FontAwesomeIcon icon={faUser} size="3x" />
              <p>No users found</p>
              <button
                className="add-user-btn"
                onClick={() => setShowForm(true)}
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
                        className="user-avatar"
                        style={{ backgroundColor: roleInfo.color }}
                      >
                        <FontAwesomeIcon icon={roleInfo.icon} />
                      </div>
                      <div className="user-info">
                        <h3>{user.name}</h3>
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
                      <div className="user-actions">
                        <button
                          className={`status-btn ${user.status}`}
                          onClick={() => handleStatusToggle(user)}
                          title={
                            user.status === "active" ? "Deactivate" : "Activate"
                          }
                        >
                          {user.status === "active" ? "Active" : "Inactive"}
                        </button>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(user)}
                          title="Edit User"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(user.id)}
                          title="Delete User"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
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

                      <div className="permissions-section">
                        <h4>Permissions</h4>
                        <div className="permissions-grid">
                          {Object.entries(user.permissions || {}).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className={`permission-item ${
                                  value ? "granted" : "denied"
                                }`}
                              >
                                {getPermissionLabel(key)}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User Form Modal */}
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
                  }}
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
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter email address"
                      required
                    />
                  </div>
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
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password {!editingUser && "*"}</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        editingUser
                          ? "Leave blank to keep current password"
                          : "Enter password"
                      }
                      required={!editingUser}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                      />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <div className="status-options">
                    <label className="radio-option">
                      <input
                        type="radio"
                        value="active"
                        checked={formData.status === "active"}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                      />
                      <span className="radio-label">Active</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        value="inactive"
                        checked={formData.status === "inactive"}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                      />
                      <span className="radio-label">Inactive</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Permissions</label>
                  <div className="permissions-grid-form">
                    {Object.entries(formData.permissions).map(
                      ([key, value]) => (
                        <label key={key} className="permission-option">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permissions: {
                                  ...formData.permissions,
                                  [key]: e.target.checked,
                                },
                              })
                            }
                          />
                          <span>{getPermissionLabel(key)}</span>
                        </label>
                      )
                    )}
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
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    {editingUser ? "Update User" : "Create User"}
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
