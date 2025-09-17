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
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    // Role-based redirection
    if (role === "approved" || role === "admin") {
      navigate("/dashboard");
      return;
    }
  }, [user, role, loading, navigate]);

  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  if (loading) return <div className="lobby-page">Loading...</div>;

  return (
    <div className="lobby-page">
      <div className="hourglass-emoji">⏳</div>
      <h1> Waiting for Approval</h1>
      <p>
        Your account is pending approval from an administrator. Please check
        back later.
      </p>
      {user && (
        <p>
          Logged in as <strong>{user.email}</strong>
        </p>
      )}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Lobby;
