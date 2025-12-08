import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../Firebase/firebase";
import "../styles/lobby.scss";

function Lobby() {
  const { user, role, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      console.log("Lobby: Still loading...");
      return;
    }

    if (!user) {
      console.log("Lobby: No user, redirecting to login");
      navigate("/login", { replace: true });
      return;
    }

    // Only redirect approved users and admins to dashboard
    if (role === "approved" || role === "admin") {
      console.log("Lobby: User has approved role, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
      return;
    }

    // Redirect customers to orders page
    if (role === "customer") {
      console.log("Lobby: User is customer, redirecting to orders");
      navigate("/orderspage", { replace: true });
      return;
    }

    console.log("Lobby: User role is", role, "- staying in lobby");
  }, [user, role, loading, navigate]);

  // Manual check for approval
  const checkApproval = () => {
    console.log("Manual check - Current role:", role);
    if (role === "approved" || role === "admin") {
      navigate("/dashboard", { replace: true });
    } else if (role === "customer") {
      navigate("/orderspage", { replace: true });
    } else {
      alert("Still not approved. Current role is: " + role);
    }
  };

  async function handleLogout() {
    await signOut(auth);
    navigate("/login", { replace: true });
  }

  if (loading) return <div className="lobby-page">Loading...</div>;

  // Different content based on user role
  const isCustomer = role === "customer";
  const isPending = role === "pending";
  const isApproved = role === "approved" || role === "admin";

  return (
    <div className="lobby-page">
      {isCustomer ? (
        // Customer View - Waiting for approval
        <>
          <div className="hourglass-emoji">⏳</div>
          <h1>Waiting for Customer Approval</h1>
          <p>
            Your customer account is waiting for approval from an administrator.
            Please check back later.
          </p>
          {user && (
            <p>
              Logged in as <strong>{user.email}</strong> (Customer)
            </p>
          )}
          <div className="lobby-actions">
            <button onClick={checkApproval}>Check Approval Status</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </>
      ) : isPending ? (
        // Staff Pending Approval View
        <>
          <div className="hourglass-emoji">⏳</div>
          <h1>Waiting for Staff Approval</h1>
          <p>
            Your staff account is waiting for approval from an administrator.
            Please check back later.
          </p>
          {user && (
            <p>
              Logged in as <strong>{user.email}</strong> (Staff)
            </p>
          )}
          <div className="lobby-actions">
            <button onClick={checkApproval}>Check Approval Status</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </>
      ) : isApproved ? (
        // Approved Staff View (should redirect automatically, but just in case)
        <>
          <div className="success-emoji">✅</div>
          <h1>Welcome!</h1>
          <p>
            Your account has been approved. Redirecting you to the dashboard...
          </p>
          {user && (
            <p>
              Logged in as <strong>{user.email}</strong>
            </p>
          )}
          <div className="lobby-actions">
            <button onClick={() => navigate("/dashboard")}>
              Go to Dashboard Now
            </button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </>
      ) : (
        // Unknown role
        <>
          <div className="warning-emoji">⚠️</div>
          <h1>Account Status Unknown</h1>
          <p>
            There seems to be an issue with your account status. Please contact
            support if this continues.
          </p>
          {user && (
            <p>
              Logged in as <strong>{user.email}</strong> (Role:{" "}
              {role || "unknown"})
            </p>
          )}
          <div className="lobby-actions">
            <button onClick={handleLogout}>Logout</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Lobby;
