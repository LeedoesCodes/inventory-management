# Firestore Backup System

This backend now includes a backup script for exporting Firestore data to JSON files.

## What It Backs Up

- Top-level collections
- All documents in each collection
- Nested subcollections recursively
- A `manifest.json` file with export metadata

## Run Backup

From the `backend` folder:

```bash
npm run backup:firestore
```

If Firestore read quota is exhausted, run the command again after quota resets.

Output folder format:

- `backend/backups/firestore-backup-YYYYMMDD-HHMMSS/`

Files created:

- One JSON file per collection (example: `orders.json`)
- `manifest.json`

## Backup Only Core Collections

```bash
npm run backup:firestore:core
```

This exports only:

- `users`
- `orders`
- `products`

## Backup Specific Collections Manually

```bash
node scripts/backupFirestore.js customers userSettings
```

## Cleanup Old Backups

Keep the latest 14 backups by default:

```bash
npm run backup:cleanup
```

Keep a custom number (example: 30):

```bash
node scripts/cleanupBackups.js 30
```

## Restore from Backup

Restore from latest backup folder:

```bash
npm run restore:firestore
```

Restore from a specific backup folder:

```bash
node scripts/restoreFirestore.js firestore-backup-20260326-141856
```

Restore only selected collections from a folder:

```bash
node scripts/restoreFirestore.js firestore-backup-20260326-141856 users orders
```

Warning: restore overwrites existing documents with matching ids.

## Scheduling (Windows Task Scheduler)

1. Open Task Scheduler.
2. Create Basic Task.
3. Trigger: Daily (or as needed).
4. Action: Start a program.
5. Program/script: `powershell.exe`
6. Add arguments:

```powershell
-NoProfile -ExecutionPolicy Bypass -Command "cd 'C:\Users\lee\Desktop\Projects\inventory-management\backend'; npm run backup:firestore"
```

7. Save task.

## Notes

- The script uses `backend/serviceAccountKey.json`.
- Keep backups in a secure location.
- Consider syncing the `backend/backups` folder to cloud storage for offsite protection.
