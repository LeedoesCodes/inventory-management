import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
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
  faChartBar,
  faBox,
  faReceipt,
  faCalendarAlt,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faUsers,
  faShoppingCart,
  faDollarSign,
} from "@fortawesome/free-solid-svg-icons";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, role, updateProfile } = useContext(AuthContext);
  const { isCollapsed } = useSidebar();
  const [showConfirm, setShowConfirm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchUserData();
    fetchUserStats();
  }, [user]);

  const fetchUserData = async () => {
    if (!user?.uid) return;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setEditForm({
          displayName: data.displayName || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user?.uid) return;

    try {
      // Fetch admin/employee specific stats
      const productsQuery = query(
        collection(db, "products"),
        where("addedBy", "==", user.uid)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const userProducts = productsSnapshot.docs.map((doc) => doc.data());

      // Fetch orders processed by this user
      const ordersQuery = query(
        collection(db, "orders"),
        where("processedBy", "==", user.uid)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const processedOrders = ordersSnapshot.docs.map((doc) => doc.data());

      // Calculate total sales from processed orders
      const totalSales = processedOrders.reduce(
        (sum, order) => sum + (order.totalAmount || 0),
        0
      );

      // Fetch total customers (for admin view)
      let totalCustomers = 0;
      if (role === "admin" || role === "owner") {
        const customersSnapshot = await getDocs(collection(db, "users"));
        totalCustomers = customersSnapshot.docs
          .map((doc) => doc.data())
          .filter((userData) => userData.role === "customer").length;
      }

      setStats({
        productsAdded: userProducts.length,
        ordersProcessed: processedOrders.length,
        totalSales: totalSales,
        totalCustomers: totalCustomers,
        memberSince: userData?.createdAt?.toDate?.() || new Date(),
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      const storageRef = ref(
        storage,
        `profile-images/${user.uid}/${file.name}`
      );
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: downloadURL,
      });

      // Update in Auth context
      await updateProfile({ photoURL: downloadURL });

      setUserData((prev) => ({ ...prev, photoURL: downloadURL }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await updateDoc(doc(db, "users", user.uid), {
        displayName: editForm.displayName,
        phone: editForm.phone,
        address: editForm.address,
        updatedAt: new Date(),
      });

      if (editForm.displayName !== user.displayName) {
        await updateProfile({ displayName: editForm.displayName });
      }

      setUserData((prev) => ({ ...prev, ...editForm }));
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    } finally {
      setSaving(false);
    }
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
    };
    return roleMap[role] || "User";
  };

  if (loading) {
    return (
      <div className="page-container">
        <Sidebar />
        <div className={`profile-page ${isCollapsed ? "collapsed" : ""}`}>
          <Header />
          <div className="profile-content">
            <div className="loading">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`profile-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        <div className="profile-content">
          <div className="profile-header">
            <h1>My Profile</h1>
            <button
              className={`edit-toggle-btn ${isEditing ? "editing" : ""}`}
              onClick={() => setIsEditing(!isEditing)}
            >
              <FontAwesomeIcon icon={isEditing ? faTimes : faUserPen} />
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          <div className="profile-grid">
            {/* Profile Card */}
            <div className="profile-card">
              <div className="avatar-section">
                <div className="avatar-wrapper">
                  <img
                    src={userData?.photoURL || user?.photoURL || avatar}
                    alt="User Avatar"
                    className="profile-avatar"
                  />
                  <label className="avatar-upload">
                    <FontAwesomeIcon icon={faCamera} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={saving}
                    />
                  </label>
                </div>
                {saving && <div className="saving-overlay">Uploading...</div>}
              </div>

              {isEditing ? (
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
                    />
                  </div>
                  <button
                    className="save-btn"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    <FontAwesomeIcon icon={faSave} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              ) : (
                <div className="profile-info">
                  <h2 className="profile-name">
                    {userData?.displayName || user?.displayName || user?.email}
                  </h2>
                  <p className="profile-role">
                    <FontAwesomeIcon icon={faUserPen} />
                    {getRoleDisplayName(role)}
                  </p>

                  <div className="contact-info">
                    <div className="contact-item">
                      <FontAwesomeIcon icon={faEnvelope} />
                      <span>{userData?.email || user?.email}</span>
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

            {/* Statistics Card */}
            <div className="stats-card">
              <h3>Work Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <FontAwesomeIcon icon={faBox} />
                  <div className="stat-content">
                    <span className="stat-number">
                      {stats.productsAdded || 0}
                    </span>
                    <span className="stat-label">Products Added</span>
                  </div>
                </div>
                <div className="stat-item">
                  <FontAwesomeIcon icon={faShoppingCart} />
                  <div className="stat-content">
                    <span className="stat-number">
                      {stats.ordersProcessed || 0}
                    </span>
                    <span className="stat-label">Orders Processed</span>
                  </div>
                </div>
                <div className="stat-item">
                  <FontAwesomeIcon icon={faDollarSign} />
                  <div className="stat-content">
                    <span className="stat-number">
                      ₱{(stats.totalSales || 0).toFixed(2)}
                    </span>
                    <span className="stat-label">Total Sales</span>
                  </div>
                </div>
                {(role === "admin" || role === "owner") && (
                  <div className="stat-item">
                    <FontAwesomeIcon icon={faUsers} />
                    <div className="stat-content">
                      <span className="stat-number">
                        {stats.totalCustomers || 0}
                      </span>
                      <span className="stat-label">Total Customers</span>
                    </div>
                  </div>
                )}
                {!(role === "admin" || role === "owner") && (
                  <div className="stat-item">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <div className="stat-content">
                      <span className="stat-date">
                        {stats.memberSince?.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span className="stat-label">Member Since</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Card */}
            <div className="actions-card">
              <h3>Account Actions</h3>
              <div className="button-group">
                <button className="logout-btn" onClick={handleLogoutClick}>
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
                  <span className="status-active">Active</span>
                </div>
                <div className="info-item">
                  <span>Permissions:</span>
                  <span>{getRoleDisplayName(role)}</span>
                </div>
              </div>
            </div>
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
