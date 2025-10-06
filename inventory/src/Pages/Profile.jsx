import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore"; // Add onSnapshot
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../Firebase/firebase";
import avatar from "../assets/images/avatar-default.png";
import "../styles/profile.scss";
import ConfirmModal from "../components/UI/ConfirmModal.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import Sidebar from "../components/UI/Sidebar.jsx";
import Header from "../components/UI/Headers.jsx";
import { useSidebar } from "../context/SidebarContext.jsx";
import UserAccountDeletion from "../components/UI/UserAccountDeletion.jsx";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPen,
  faCamera,
  faSave,
  faTimes,
  faCalendarAlt,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faArrowLeft,
  faCheckCircle,
  faTimesCircle,
  faSync,
} from "@fortawesome/free-solid-svg-icons";

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams(); // Get userId from URL params
  const { user, logout, role, updateProfile } = useContext(AuthContext);
  const { isCollapsed } = useSidebar();
  const [showConfirm, setShowConfirm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [targetUserRole, setTargetUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    address: "",
  });

  // Determine if we're viewing current user or another user
  const isCurrentUser = !userId || userId === user?.uid;
  const targetUserId = userId || user?.uid;

  // Real-time listener for user data
  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      doc(db, "users", targetUserId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setUserData(data);
          setTargetUserRole(data.role || "");
          setEditForm({
            displayName: data.displayName || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
          });
        } else {
          console.error("User not found");
          setUserData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error in real-time listener:", error);
        setLoading(false);
      }
    );

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [targetUserId]);

  const handleImageUpload = async (event) => {
    // Only allow image upload for current user
    if (!isCurrentUser) {
      alert("You can only update your own profile picture");
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      const storageRef = ref(storage, `profile-images/${user.uid}/avatar`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: downloadURL,
        updatedAt: new Date(),
      });

      // Update in Auth context
      await updateProfile({ photoURL: downloadURL });

      // No need to setUserData manually - real-time listener will update it
      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    // Only allow editing for current user
    if (!isCurrentUser) {
      alert("You can only edit your own profile");
      return;
    }

    try {
      setSaving(true);
      setSyncing(true);

      await updateDoc(doc(db, "users", user.uid), {
        displayName: editForm.displayName,
        phone: editForm.phone,
        address: editForm.address,
        updatedAt: new Date(),
      });

      if (editForm.displayName !== user.displayName) {
        await updateProfile({ displayName: editForm.displayName });
      }

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    } finally {
      setSaving(false);
      setSyncing(false);
    }
  };

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  const handleLogoutClick = () => setShowConfirm("logout");
  const confirmLogout = () => {
    logout();
    setShowConfirm(null);
    navigate("/login");
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      admin: "Administrator",
      owner: "Owner",
      employee: "Employee",
      manager: "Manager",
      customer: "Customer",
      approved: "Approved User",
      pending: "Pending Approval",
    };
    return roleMap[role] || "User";
  };

  // Get status display information
  const getStatusInfo = (status) => {
    const statusMap = {
      active: {
        label: "Active",
        class: "status-active",
        icon: faCheckCircle,
        color: "#10b981",
      },
      inactive: {
        label: "Inactive",
        class: "status-inactive",
        icon: faTimesCircle,
        color: "#ef4444",
      },
      pending: {
        label: "Pending",
        class: "status-pending",
        icon: faSync,
        color: "#f59e0b",
      },
    };
    return statusMap[status] || statusMap.active;
  };

  if (loading) {
    return (
      <div className="page-container">
        <Sidebar />
        <div className={`profile-page ${isCollapsed ? "collapsed" : ""}`}>
          <Header />
          <div className="profile-content">
            <div className="loading">
              <FontAwesomeIcon icon={faSync} className="spinning" />
              Loading profile...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="page-container">
        <Sidebar />
        <div className={`profile-page ${isCollapsed ? "collapsed" : ""}`}>
          <Header />
          <div className="profile-content">
            <div className="error-message">
              <h2>User Not Found</h2>
              <p>The user profile you're looking for doesn't exist.</p>
              <button className="back-btn" onClick={handleBackClick}>
                <FontAwesomeIcon icon={faArrowLeft} />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(userData.status || "active");

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`profile-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        <div className="profile-content">
          <div className="profile-header">
            <div className="header-left">
              {!isCurrentUser && (
                <button className="back-btn" onClick={handleBackClick}>
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Back
                </button>
              )}
              <h1>
                {isCurrentUser
                  ? "My Profile"
                  : `${userData.displayName || "User"} Profile`}
              </h1>
            </div>

            <div className="header-right">
              {syncing && (
                <div className="sync-indicator">
                  <FontAwesomeIcon icon={faSync} className="spinning" />
                  <span>Syncing...</span>
                </div>
              )}

              {isCurrentUser && (
                <button
                  className={`edit-toggle-btn ${isEditing ? "editing" : ""}`}
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={saving}
                >
                  <FontAwesomeIcon icon={isEditing ? faTimes : faUserPen} />
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              )}
            </div>
          </div>

          <div className="profile-grid">
            {/* Profile Card */}
            <div className="profile-card">
              <div className="avatar-section">
                <div className="avatar-wrapper">
                  <img
                    src={userData?.photoURL || avatar}
                    alt="User Avatar"
                    className="profile-avatar"
                  />
                  {isCurrentUser && (
                    <label className="avatar-upload">
                      <FontAwesomeIcon icon={faCamera} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={saving}
                      />
                    </label>
                  )}
                  <div className={`status-indicator ${statusInfo.class}`}>
                    <FontAwesomeIcon icon={statusInfo.icon} />
                  </div>
                </div>
                {saving && <div className="saving-overlay">Uploading...</div>}
              </div>

              {isEditing && isCurrentUser ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          displayName: e.target.value,
                        }))
                      }
                      placeholder="Enter your full name"
                      disabled={saving}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      disabled
                      className="disabled"
                      placeholder="Email cannot be changed"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="Enter your phone number"
                      disabled={saving}
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Enter your address"
                      rows="3"
                      disabled={saving}
                    />
                  </div>
                  <button
                    className="save-btn"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <FontAwesomeIcon icon={faSync} className="spinning" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="profile-info">
                  <div className="profile-header-info">
                    <h2 className="profile-name">
                      {userData?.displayName || userData?.email}
                    </h2>
                    <span className={`status-badge ${statusInfo.class}`}>
                      <FontAwesomeIcon icon={statusInfo.icon} />
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="profile-role">
                    <FontAwesomeIcon icon={faUserPen} />
                    {getRoleDisplayName(isCurrentUser ? role : targetUserRole)}
                  </p>

                  <div className="contact-info">
                    <div className="contact-item">
                      <FontAwesomeIcon icon={faEnvelope} />
                      <span>{userData?.email}</span>
                    </div>
                    {userData?.phone && (
                      <div className="contact-item">
                        <FontAwesomeIcon icon={faPhone} />
                        <span>{userData.phone}</span>
                      </div>
                    )}
                    {userData?.address && (
                      <div className="contact-item">
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        <span>{userData.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Card - Only show for current user */}
            {isCurrentUser && (
              <div className="actions-card">
                <h3>Account Actions</h3>
                <div className="button-group">
                  <button
                    className="logout-btn"
                    onClick={handleLogoutClick}
                    disabled={saving}
                  >
                    Logout
                  </button>
                  <UserAccountDeletion user={user} />
                </div>

                <div className="account-info">
                  <h4>Account Information</h4>
                  <div className="info-item">
                    <span>User ID:</span>
                    <code>{user?.uid}</code>
                  </div>
                  <div className="info-item">
                    <span>Last Login:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <span>Account Status:</span>
                    <span className={statusInfo.class}>
                      <FontAwesomeIcon icon={statusInfo.icon} />
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="info-item">
                    <span>Permissions:</span>
                    <span>{getRoleDisplayName(role)}</span>
                  </div>
                  <div className="info-item">
                    <span>Member Since:</span>
                    <span className="stat-date">
                      {userData?.createdAt
                        ?.toDate?.()
                        ?.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        }) || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* View-only info for other users */}
            {!isCurrentUser && (
              <div className="actions-card view-only-card">
                <h3>User Information</h3>
                <div className="account-info">
                  <div className="info-item">
                    <span>User ID:</span>
                    <code>{targetUserId}</code>
                  </div>
                  <div className="info-item">
                    <span>Account Status:</span>
                    <span className={statusInfo.class}>
                      <FontAwesomeIcon icon={statusInfo.icon} />
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="info-item">
                    <span>Role:</span>
                    <span>{getRoleDisplayName(targetUserRole)}</span>
                  </div>
                  <div className="info-item">
                    <span>Member Since:</span>
                    <span className="stat-date">
                      {userData?.createdAt
                        ?.toDate?.()
                        ?.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        }) || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showConfirm === "logout" && (
          <ConfirmModal
            message="Are you sure you want to log out?"
            onConfirm={confirmLogout}
            onCancel={() => setShowConfirm(null)}
          />
        )}
      </div>
    </div>
  );
}
