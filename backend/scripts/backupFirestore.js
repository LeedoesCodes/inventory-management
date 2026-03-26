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

function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate(),
  )}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function serializeFirestoreValue(value) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item));
  }

  if (value instanceof Date) {
    return { _type: "Date", value: value.toISOString() };
  }

  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      // Firestore Timestamp
      return {
        _type: "Timestamp",
        value: value.toDate().toISOString(),
      };
    }

    if (value.path && value.id && value.firestore) {
      // Firestore DocumentReference
      return {
        _type: "DocumentReference",
        path: value.path,
      };
    }

    if (
      Object.prototype.hasOwnProperty.call(value, "latitude") &&
      Object.prototype.hasOwnProperty.call(value, "longitude")
    ) {
      // Firestore GeoPoint
      return {
        _type: "GeoPoint",
        latitude: value.latitude,
        longitude: value.longitude,
      };
    }

    const serializedObject = {};
    for (const [key, objectValue] of Object.entries(value)) {
      serializedObject[key] = serializeFirestoreValue(objectValue);
    }
    return serializedObject;
  }

  return value;
}

async function backupDocument(docSnapshot) {
  const documentData = {
    id: docSnapshot.id,
    data: serializeFirestoreValue(docSnapshot.data()),
    subcollections: {},
  };

  const subcollections = await docSnapshot.ref.listCollections();

  for (const subcollection of subcollections) {
    const subcollectionSnapshot = await subcollection.get();
    documentData.subcollections[subcollection.id] = await Promise.all(
      subcollectionSnapshot.docs.map((subDoc) => backupDocument(subDoc)),
    );
  }

  return documentData;
}

async function backupCollection(collectionRef, outputPath) {
  const snapshot = await collectionRef.get();
  const documents = await Promise.all(
    snapshot.docs.map((docSnapshot) => backupDocument(docSnapshot)),
  );

  const collectionBackup = {
    collection: collectionRef.id,
    documentCount: documents.length,
    exportedAt: new Date().toISOString(),
    documents,
  };

  await fs.writeFile(
    path.join(outputPath, `${collectionRef.id}.json`),
    JSON.stringify(collectionBackup, null, 2),
    "utf8",
  );

  return {
    collection: collectionRef.id,
    documentCount: documents.length,
  };
}

async function run() {
  const selectedCollectionIds = process.argv.slice(2);
  const backupRoot = path.resolve(__dirname, "..", "backups");
  const folderName = `firestore-backup-${formatTimestamp()}`;
  const outputPath = path.join(backupRoot, folderName);

  await fs.mkdir(outputPath, { recursive: true });

  const allCollections = await db.listCollections();
  const targetCollections =
    selectedCollectionIds.length > 0
      ? allCollections.filter((col) => selectedCollectionIds.includes(col.id))
      : allCollections;

  if (targetCollections.length === 0) {
    throw new Error("No matching Firestore collections were found for backup.");
  }

  console.log(`Starting Firestore backup to: ${outputPath}`);
  console.log(
    `Collections: ${targetCollections.map((col) => col.id).join(", ")}`,
  );

  const results = [];

  for (const collectionRef of targetCollections) {
    console.log(`Backing up collection: ${collectionRef.id}`);
    const result = await backupCollection(collectionRef, outputPath);
    results.push(result);
  }

  const manifest = {
    projectId: serviceAccount.project_id,
    exportedAt: new Date().toISOString(),
    outputPath,
    collections: results,
  };

  await fs.writeFile(
    path.join(outputPath, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  console.log("Firestore backup completed successfully.");
  console.log(`Manifest: ${path.join(outputPath, "manifest.json")}`);
}

run().catch((error) => {
  console.error("Firestore backup failed:", error.message);
  process.exit(1);
});
