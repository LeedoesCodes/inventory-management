import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../Firebase/firebase";

function Lobby() {
  const { user, role, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // wait until role is known

    if (!user) {
      navigate("/login");
      return;
    }

    // Role-based redirection
    if (role === "approved" || role === "admin") {
      navigate("/dashboard"); // admins & approved users go to dashboard
      return;
    }

    // pending users stay in Lobby
  }, [user, role, loading, navigate]);

  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-2xl font-bold mb-4">⏳ Waiting for Approval</h1>
      <p className="mb-6">
        Your account is pending approval from an administrator. Please check
        back later.
      </p>
      {user && (
        <p className="text-gray-500">
          Logged in as <strong>{user.email}</strong>
        </p>
      )}
      <button
        onClick={handleLogout}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg"
      >
        Logout
      </button>
    </div>
  );
}

export default Lobby;
