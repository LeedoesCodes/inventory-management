import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import { readFile } from "fs/promises";

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  await readFile(new URL("./serviceAccountKey.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const scansCollection = db.collection("scans");

app.get("/", (req, res) => {
  res.send(`
    <h1>📦 Barcode Scanner Server (Firestore)</h1>
    <p>Server is running! Scans are being saved to Firestore.</p>
    <ul>
      <li><a href="/scans">View All Scans</a></li>
      <li><a href="/stats">View Statistics</a></li>
    </ul>
  `);
});

app.post("/scan", async (req, res) => {
  try {
    const scanData = {
      barcode: req.body.barcode,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      deviceId: req.body.deviceId || "Unknown Device",
      createdAt: new Date().toLocaleString(),
    };

    // Save to Firestore
    const docRef = await scansCollection.add(scanData);

    console.log("🎯 New Scan Saved to Firestore:");
    console.log("   Barcode:", scanData.barcode);
    console.log("   Device:", scanData.deviceId);
    console.log("   Firestore ID:", docRef.id);
    console.log("---");

    res.json({
      status: "success",
      message: "Scan saved to Firestore!",
      firestoreId: docRef.id,
    });
  } catch (error) {
    console.error("❌ Firestore Error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get all scans from Firestore
app.get("/scans", async (req, res) => {
  try {
    const snapshot = await scansCollection.orderBy("timestamp", "desc").get();
    const scans = [];

    snapshot.forEach((doc) => {
      scans.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(scans);
  } catch (error) {
    console.error("❌ Error fetching scans:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get scan count (useful for dashboards)
app.get("/stats", async (req, res) => {
  try {
    const snapshot = await scansCollection.get();
    res.json({
      totalScans: snapshot.size,
      lastUpdated: new Date().toLocaleString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Firestore Scanner Server running!`);
  console.log(`📍 Local: http://localhost:${port}`);
  console.log(`📍 Network: http://192.168.1.150:3000/scan:${port}`);
  console.log(`📁 Directory: ${process.cwd()}`);
});
