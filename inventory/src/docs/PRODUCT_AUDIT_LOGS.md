# Product Audit Logs - Firestore Security Rules

## Overview

The `productAuditLogs` collection stores immutable audit trail records for all product stock changes. This document provides the recommended Firestore security rules and usage guidelines.

## Firestore Security Rules

Add these rules to your Firestore Security Rules console:

```
match /productAuditLogs {
  // Logs are immutable - allow create and read, never update
  allow create: if request.auth != null;
  allow read: if request.auth != null;
  allow update, delete: if false; // Never allow updates or deletes

  match /{document=**} {
    // Only authenticated users can access
    allow read: if request.auth != null;

    // Only allow creating new logs, no modifications
    allow create: if request.auth != null
      && request.resource.data.userId == request.auth.uid
      && request.resource.data.timestamp != null
      && request.resource.data.productId != null
      && request.resource.data.action != null
      && request.resource.data.changes != null
      && request.resource.data.status == "completed";

    // Prevent any updates or deletes to maintain audit integrity
    allow update, delete: if false;
  }
}
```

## Collection Structure

```
productAuditLogs/
├── {logId}/
│   ├── productId (string) - Reference to the product
│   ├── productName (string) - Name of product at time of change
│   ├── action (string) - Type of action: "stock_add", "stock_edit", "price_change"
│   ├── changes (object)
│   │   ├── before (number) - Value before change
│   │   ├── after (number) - Value after change
│   │   └── difference (number) - Calculated difference
│   ├── userId (string) - ID of user who made the change
│   ├── userName (string) - Display name of user
│   ├── timestamp (Timestamp) - When the change was made
│   ├── notes (string) - Optional notes about the change
│   └── status (string) - "completed" (immutable)
```

## Indexes Required

To optimize query performance, create the following composite indexes in Firestore:

### 1. Product Changes by Date

- Collection: `productAuditLogs`
- Fields indexed:
  - `productId` (Ascending)
  - `timestamp` (Descending)

### 2. All Changes by Date

- Collection: `productAuditLogs`
- Fields indexed:
  - `timestamp` (Descending)

### 3. Changes by Action Type and Date

- Collection: `productAuditLogs`
- Fields indexed:
  - `action` (Ascending)
  - `timestamp` (Descending)

You can create these automatically by running the queries in production (Firestore will suggest index creation), or create them manually in the Firestore console.

## Best Practices

1. **Immutable Records**: Logs should never be updated or deleted to maintain audit integrity
2. **User Attribution**: Always log the userId and userName for accountability
3. **Timestamp Accuracy**: Use Firestore server timestamps to ensure consistency
4. **Error Handling**: Log failures don't block product operations (fail gracefully)
5. **Data Validation**: The security rules validate that required fields are present

## Querying Examples

### Get changes for a specific product on a date

```javascript
const changes = await getProductChangesForDate(productId, specificDate);
```

### Get all changes across products for a date

```javascript
const allChanges = await getAllProductChangesForDate(specificDate);
```

### Get recent history for a product

```javascript
const history = await getProductAuditHistory(productId, 50);
```

### Get changes by action type

```javascript
const stockAdditions = await getAuditLogsByAction(
  "stock_add",
  startDate,
  endDate,
);
```

## Maintenance Notes

- **Backups**: Consider backing up `productAuditLogs` separately as these are critical compliance records
- **Retention**: Define a retention policy (e.g., keep for 3 years) and implement archive procedures if needed
- **Monitoring**: Set up alerts for large bulk stock changes that might indicate errors
- **Access Control**: Only users with proper roles should access logs (can be enforced in security rules)

## Future Enhancements

1. Add revert capability with approval workflow
2. Add bulk operations grouping (scope multiple related changes)
3. Add email notifications for large changes
4. Create monthly reports of stock adjustments by user
5. Implement change reconciliation reports for accounting
