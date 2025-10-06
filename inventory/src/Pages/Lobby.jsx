import { useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../Firebase/firebase";
import "../styles/lobby.scss";

function Lobby() {
  const { user, role, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("Lobby Debug - Current state:", {
      user: user?.email,
      role,
      loading,
    });

    if (loading) {
      console.log("Lobby: Still loading...");
      return;
    }

    if (!user) {
      console.log("Lobby: No user, redirecting to login");
      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
      return;
    }

    // Role-based redirection
    if (
      (role === "approved" || role === "admin") &&
      location.pathname !== "/dashboard"
    ) {
      console.log("Lobby: User has approved role, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
      return;
    }

    console.log("Lobby: User role is", role, "- staying in lobby");
  }, [user, role, loading, navigate, location]);

  // Manual check for approval
  const checkApproval = () => {
    console.log("Manual check - Current role:", role);
    if (role === "approved" || role === "admin") {
      navigate("/dashboard", { replace: true });
    } else {
      alert("Still not approved. Current role is: " + role);
    }
  };

  async function handleLogout() {
    await signOut(auth);
    navigate("/login", { replace: true });
  }

  if (loading) return <div className="lobby-page">Loading...</div>;

  return (
    <div className="lobby-page">
      <div className="hourglass-emoji">⏳</div>
      <h1> Waiting for Approval</h1>
      <p>
        Your account is waiting for approval from an administrator. Please check
        back later.
      </p>
      {user && (
        <p>
          Logged in as <strong>{user.email},</strong>
        </p>
      )}
      <div className="lobby-actions">
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Lobby;
