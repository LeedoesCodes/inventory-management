const fs = require("fs/promises");
const path = require("path");
const admin = require("firebase-admin");

const serviceAccountPath = path.resolve(
  __dirname,
  "..",
  "serviceAccountKey.json",
);
// eslint-disable-next-line import/no-dynamic-require, global-require
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

function deserializeFirestoreValue(value) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => deserializeFirestoreValue(item));
  }

  if (typeof value === "object") {
    if (value._type === "Timestamp") {
      return admin.firestore.Timestamp.fromDate(new Date(value.value));
    }

    if (value._type === "Date") {
      return new Date(value.value);
    }

    if (value._type === "GeoPoint") {
      return new admin.firestore.GeoPoint(value.latitude, value.longitude);
    }

    if (value._type === "DocumentReference") {
      return db.doc(value.path);
    }

    const output = {};
    for (const [key, objectValue] of Object.entries(value)) {
      output[key] = deserializeFirestoreValue(objectValue);
    }
    return output;
  }

  return value;
}

async function restoreDocuments(documents, parentCollectionRef) {
  for (const doc of documents) {
    const docRef = parentCollectionRef.doc(doc.id);
    const documentData = deserializeFirestoreValue(doc.data || {});

    await docRef.set(documentData, { merge: false });

    const subcollections = doc.subcollections || {};
    for (const [subcollectionName, subDocs] of Object.entries(subcollections)) {
      const subcollectionRef = docRef.collection(subcollectionName);
      await restoreDocuments(subDocs, subcollectionRef);
    }
  }
}

async function resolveBackupFolder() {
  const backupArg = process.argv[2];
  const backupRoot = path.resolve(__dirname, "..", "backups");

  if (backupArg) {
    const resolved = path.isAbsolute(backupArg)
      ? backupArg
      : path.resolve(backupRoot, backupArg);
    return resolved;
  }

  const entries = await fs.readdir(backupRoot, { withFileTypes: true });
  const latest = entries
    .filter(
      (entry) =>
        entry.isDirectory() && entry.name.startsWith("firestore-backup-"),
    )
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a))[0];

  if (!latest) {
    throw new Error("No backup folders found.");
  }

  return path.resolve(backupRoot, latest);
}

async function run() {
  const backupFolder = await resolveBackupFolder();
  const requestedCollections = process.argv.slice(3);

  const files = await fs.readdir(backupFolder);
  const collectionFiles = files.filter(
    (name) => name.endsWith(".json") && name !== "manifest.json",
  );

  const filteredFiles =
    requestedCollections.length > 0
      ? collectionFiles.filter((fileName) =>
          requestedCollections.includes(path.basename(fileName, ".json")),
        )
      : collectionFiles;

  if (filteredFiles.length === 0) {
    throw new Error("No matching collection backup files found to restore.");
  }

  console.log(`Restoring backup from: ${backupFolder}`);
  console.log(
    `Collections: ${filteredFiles
      .map((fileName) => path.basename(fileName, ".json"))
      .join(", ")}`,
  );

  for (const fileName of filteredFiles) {
    const fullPath = path.join(backupFolder, fileName);
    const raw = await fs.readFile(fullPath, "utf8");
    const payload = JSON.parse(raw);

    const collectionName =
      payload.collection || path.basename(fileName, ".json");
    const documents = Array.isArray(payload.documents) ? payload.documents : [];

    console.log(
      `Restoring collection: ${collectionName} (${documents.length} docs)`,
    );

    const collectionRef = db.collection(collectionName);
    await restoreDocuments(documents, collectionRef);
  }

  console.log("Firestore restore completed successfully.");
}

run().catch((error) => {
  console.error("Firestore restore failed:", error.message);
  process.exit(1);
});
