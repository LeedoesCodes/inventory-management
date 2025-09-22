const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // your downloaded key

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json()); // allow JSON body

// Test root
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Get all pending users
app.get("/api/users", async (req, res) => {
  try {
    const snapshot = await db
      .collection("users")
      .where("role", "==", "pending")
      .get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Approve a user
app.put("/api/users/approve/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const userRef = db.collection("users").doc(userId);
    await userRef.update({ role: "approved" });
    res.json({ message: "User approved successfully", id: userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to approve user" });
  }
});

// Reject (delete) a user
app.delete("/api/users/reject/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    await db.collection("users").doc(userId).delete();
    res.json({ message: "User rejected successfully", id: userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to reject user" });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
