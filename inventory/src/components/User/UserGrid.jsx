import React from "react";
import UserCard from "./UserCard";

const UsersGrid = ({
  users,
  onEdit,
  onDelete,
  onStatusToggle,
  getRoleInfo,
  getPermissionLabel,
}) => {
  return (
    <div className="users-grid">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusToggle={onStatusToggle}
          getRoleInfo={getRoleInfo}
          getPermissionLabel={getPermissionLabel}
        />
      ))}
    </div>
  );
};

export default UsersGrid;
