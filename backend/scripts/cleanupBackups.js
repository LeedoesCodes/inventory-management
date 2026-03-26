const fs = require("fs/promises");
const path = require("path");

const DEFAULT_KEEP_COUNT = 14;

async function run() {
  const keepCountArg = Number.parseInt(process.argv[2], 10);
  const keepCount = Number.isNaN(keepCountArg)
    ? DEFAULT_KEEP_COUNT
    : keepCountArg;

  if (keepCount < 1) {
    throw new Error("Keep count must be at least 1.");
  }

  const backupRoot = path.resolve(__dirname, "..", "backups");
  await fs.mkdir(backupRoot, { recursive: true });

  const entries = await fs.readdir(backupRoot, { withFileTypes: true });
  const backupDirs = entries
    .filter(
      (entry) =>
        entry.isDirectory() && entry.name.startsWith("firestore-backup-"),
    )
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  if (backupDirs.length <= keepCount) {
    console.log(
      `No cleanup needed. Found ${backupDirs.length} backup folders, keep count is ${keepCount}.`,
    );
    return;
  }

  const dirsToDelete = backupDirs.slice(keepCount);

  for (const dirName of dirsToDelete) {
    const targetPath = path.join(backupRoot, dirName);
    await fs.rm(targetPath, { recursive: true, force: true });
    console.log(`Deleted old backup: ${targetPath}`);
  }

  console.log(
    `Cleanup completed. Kept ${keepCount} most recent backups, removed ${dirsToDelete.length}.`,
  );
}

run().catch((error) => {
  console.error("Backup cleanup failed:", error.message);
  process.exit(1);
});
