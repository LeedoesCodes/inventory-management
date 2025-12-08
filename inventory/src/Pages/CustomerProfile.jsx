import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/firebase.js";
import avatar from "../assets/images/avatar-default.png";
import "../styles/CustomerProfile.scss";
import ConfirmModal from "../components/UI/ConfirmModal.jsx";
import { AuthContext } from "../context/AuthContext.jsx";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faCalendar,
  faSignOutAlt,
  faSync,
  faEdit,
  faSave,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, role } = useContext(AuthContext);
  const [showConfirm, setShowConfirm] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Customer info fields for orders
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) {
        navigate("/");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);

          // Set customer info fields from user data
          setCustomerName(data.displayName || user.displayName || "");
          setCustomerEmail(data.email || user.email || "");
          setCustomerPhone(data.phone || "");
          setCustomerAddress(data.address || "");
          setOrderNotes(data.orderNotes || "");
          setDeliveryMethod(data.deliveryMethod || "pickup");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.uid, navigate]);

  const handleLogoutClick = () => setShowConfirm("logout");
  const confirmLogout = async () => {
    await logout();
    setShowConfirm(null);
    navigate("/");
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (saveSuccess) {
      setSaveSuccess(false);
    }
  };

  const saveCustomerInfo = async () => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        // Keep existing data and update customer info
        displayName: customerName.trim() || userData?.displayName,
        phone: customerPhone.trim(),
        address: customerAddress.trim(),
        orderNotes: orderNotes.trim(),
        deliveryMethod: deliveryMethod,
        // Update the timestamp
        updatedAt: new Date(),
      });

      // Update local userData
      setUserData((prev) => ({
        ...prev,
        displayName: customerName.trim() || prev?.displayName,
        phone: customerPhone.trim(),
        address: customerAddress.trim(),
        orderNotes: orderNotes.trim(),
        deliveryMethod: deliveryMethod,
      }));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving customer info:", error);
      alert("Failed to save customer information. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    // Reset fields to original user data
    if (userData) {
      setCustomerName(userData.displayName || user.displayName || "");
      setCustomerPhone(userData.phone || "");
      setCustomerAddress(userData.address || "");
      setOrderNotes(userData.orderNotes || "");
      setDeliveryMethod(userData.deliveryMethod || "pickup");
    }
    setIsEditing(false);
    setSaveSuccess(false);
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      admin: "Administrator",
      approved: "Employee",
      customer: "Customer",
      pending: "Pending Approval",
      owner: "Owner",
      employee: "Employee",
      manager: "Manager",
    };
    return roleMap[role] || "User";
  };

  // Check if user is a Google user
  const isGoogleUser = user?.providerData?.some(
    (provider) => provider.providerId === "google.com"
  );

  // Check if user is a customer who needs order info
  const isCustomer = role === "customer";

  // Get the profile picture URL
  const getProfilePicture = () => {
    if (isGoogleUser && user?.photoURL) {
      return user.photoURL;
    }
    return userData?.photoURL || avatar;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className={`profile-page`}>
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

  const profilePicture = getProfilePicture();

  return (
    <div className="page-container">
      <div className={`profile-page`}>
        <div className="profile-content">
          <div className="profile-header">
            <div className="header-left">
              <h1>My Profile</h1>
            </div>
            <div className="header-right">
              {isCustomer && (
                <button
                  className={`edit-toggle-btn ${isEditing ? "editing" : ""}`}
                  onClick={isEditing ? cancelEdit : toggleEditMode}
                  disabled={isSaving}
                >
                  <FontAwesomeIcon icon={isEditing ? faTimes : faEdit} />
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
                    src={profilePicture}
                    alt="User Avatar"
                    className="profile-avatar"
                    onError={(e) => {
                      e.target.src = avatar;
                    }}
                  />
                  <div className={`status-indicator status-active`}>
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                </div>

                {/* Google User Badge */}
                {isGoogleUser && (
                  <div className="google-badge" style={{ marginTop: "10px" }}>
                    <FontAwesomeIcon icon={faGoogle} />
                    <span>Google Account</span>
                  </div>
                )}
              </div>

              {saveSuccess && (
                <div className="save-success-message">
                  <FontAwesomeIcon icon={faSave} />
                  Customer information saved successfully!
                </div>
              )}

              {isEditing ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label htmlFor="customerName">
                      Full Name *<small>For order identification</small>
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="John Doe"
                      className="form-input"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="customerEmail">
                      Email Address
                      <small>For order updates and receipts</small>
                    </label>
                    <input
                      type="email"
                      id="customerEmail"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="form-input disabled"
                      disabled={true}
                      title="Email cannot be changed"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="customerPhone">
                      Phone Number *<small>Required for delivery orders</small>
                    </label>
                    <input
                      type="tel"
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0912 345 6789"
                      className="form-input"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="customerAddress">
                      Delivery Address
                      <small>Complete address including landmarks</small>
                    </label>
                    <textarea
                      id="customerAddress"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="123 Main Street, Barangay, City, Province"
                      rows="3"
                      className="form-textarea"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Delivery Method Preference */}
                  <div className="form-group">
                    <label>
                      Preferred Delivery Method
                      <small>Default method for orders</small>
                    </label>
                    <div className="delivery-method-options">
                      <label
                        className={`delivery-option ${
                          deliveryMethod === "pickup" ? "selected" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="pickup"
                          checked={deliveryMethod === "pickup"}
                          onChange={(e) => setDeliveryMethod(e.target.value)}
                          disabled={isSaving}
                        />
                        <div className="option-content">
                          <FontAwesomeIcon icon={faMapMarkerAlt} />
                          <div>
                            <span className="option-title">Pickup</span>
                            <small>Pick up at our store</small>
                          </div>
                        </div>
                      </label>

                      <label
                        className={`delivery-option ${
                          deliveryMethod === "delivery" ? "selected" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="delivery"
                          checked={deliveryMethod === "delivery"}
                          onChange={(e) => setDeliveryMethod(e.target.value)}
                          disabled={isSaving}
                        />
                        <div className="option-content">
                          <FontAwesomeIcon icon={faMapMarkerAlt} />
                          <div>
                            <span className="option-title">Delivery</span>
                            <small>We'll deliver to you</small>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="orderNotes">
                      Order Notes Preference
                      <small>Default notes for your orders</small>
                    </label>
                    <textarea
                      id="orderNotes"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g., Leave at gate, Call before delivery, Special packaging..."
                      rows="3"
                      className="form-textarea"
                      disabled={isSaving}
                    />
                  </div>

                  <button
                    className="save-btn"
                    onClick={saveCustomerInfo}
                    disabled={
                      isSaving || !customerName.trim() || !customerPhone.trim()
                    }
                  >
                    {isSaving ? (
                      <>
                        <FontAwesomeIcon icon={faSync} className="spinning" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} />
                        Save Customer Information
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="profile-info">
                  <div className="profile-header-info">
                    <h2 className="profile-name">
                      {customerName ||
                        userData?.displayName ||
                        user?.displayName ||
                        "No Name Set"}
                    </h2>
                    <span className={`status-badge status-active`}>Active</span>
                  </div>
                  <p className="profile-role">
                    <FontAwesomeIcon icon={faUser} />
                    {getRoleDisplayName(role)}
                  </p>

                  <div className="contact-info">
                    <div className="contact-item">
                      <FontAwesomeIcon icon={faEnvelope} />
                      <span>{customerEmail || user?.email}</span>
                    </div>

                    {customerPhone && (
                      <div className="contact-item">
                        <FontAwesomeIcon icon={faPhone} />
                        <span>{customerPhone}</span>
                      </div>
                    )}

                    {customerAddress && (
                      <div className="contact-item">
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        <span>{customerAddress}</span>
                      </div>
                    )}

                    {deliveryMethod && (
                      <div className="contact-item">
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        <span>
                          Preferred:{" "}
                          {deliveryMethod === "delivery"
                            ? "Delivery"
                            : "Pickup"}
                        </span>
                      </div>
                    )}

                    {orderNotes && (
                      <div className="contact-item">
                        <FontAwesomeIcon icon={faEdit} />
                        <span>Order Notes: {orderNotes}</span>
                      </div>
                    )}

                    {userData?.createdAt && (
                      <div className="contact-item">
                        <FontAwesomeIcon icon={faCalendar} />
                        <span>
                          Member since:{" "}
                          {userData.createdAt.toDate().toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {isCustomer && (
                    <div className="customer-order-info">
                      <h4>Order Information</h4>
                      <p className="info-note">
                        This information will be used when placing orders. Keep
                        it updated for faster checkout.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions Card */}
            <div className="actions-card">
              <h3>Account Actions</h3>
              <div className="button-group">
                <button className="logout-btn" onClick={handleLogoutClick}>
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  Logout
                </button>
              </div>

              <div className="account-info">
                <h4>Account Information</h4>
                <div className="info-item">
                  <span>User ID:</span>
                  <code>{user?.uid?.substring(0, 8)}...</code>
                </div>
                <div className="info-item">
                  <span>Role:</span>
                  <span>{getRoleDisplayName(role)}</span>
                </div>
                <div className="info-item">
                  <span>Account Type:</span>
                  <span>
                    {isGoogleUser ? "Google Account" : "Email/Password"}
                  </span>
                </div>
                <div className="info-item">
                  <span>Account Status:</span>
                  <span className="status-active">Active</span>
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

                {/* Customer-specific info */}
                {isCustomer && (
                  <>
                    <div className="info-item">
                      <span>Order Preferences:</span>
                      <span>
                        {deliveryMethod === "delivery" ? "Delivery" : "Pickup"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span>Contact Info:</span>
                      <span>
                        {customerPhone ? "Provided ✓" : "Not provided"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span>Address:</span>
                      <span>
                        {customerAddress ? "Provided ✓" : "Not provided"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Logout Confirmation Modal */}
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
