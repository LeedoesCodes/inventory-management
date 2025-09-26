import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../../styles/userCard.scss";
import {
  faEnvelope,
  faPhone,
  faCalendar,
  faUser,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

const UserCard = ({
  user,
  onEdit,
  onDelete,
  onStatusToggle,
  getRoleInfo,
  getPermissionLabel,
}) => {
  const roleInfo = getRoleInfo(user.role);

  return (
    <div className={`user-card ${user.status}`}>
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
            <span className="user-role" style={{ color: roleInfo.color }}>
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
            onClick={() => onStatusToggle(user)}
            title={user.status === "active" ? "Deactivate" : "Activate"}
          >
            {user.status === "active" ? "Active" : "Inactive"}
          </button>
          <button
            className="action-btn edit-btn"
            onClick={() => onEdit(user)}
            title="Edit User"
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => onDelete(user.id)}
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
            {user.position && <span className="position">{user.position}</span>}
          </div>
        )}

        <div className="user-stats">
          <div className="stat-item">
            <FontAwesomeIcon icon={faCalendar} />
            <span>
              Created:{" "}
              {user.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
            </span>
          </div>
          {user.lastLogin && (
            <div className="stat-item">
              <FontAwesomeIcon icon={faUser} />
              <span>
                Last Login:{" "}
                {user.lastLogin.toDate?.().toLocaleDateString() || "Never"}
              </span>
            </div>
          )}
        </div>

        <div className="permissions-section">
          <h4>Permissions</h4>
          <div className="permissions-grid">
            {Object.entries(user.permissions || {}).map(([key, value]) => (
              <div
                key={key}
                className={`permission-item ${value ? "granted" : "denied"}`}
              >
                {getPermissionLabel(key)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
