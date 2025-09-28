# Post-Installation Instructions

## Configuration Complete!

Your enhanced inventory chatbot extension has been installed successfully.

## Next Steps:

1. **Test the extension:** Send a message to the 'chats' collection in Firestore
2. **Configure security rules:** Update Firestore rules if needed
3. **Integrate with your app:** Use the provided React components

## Usage Example:

Add a document to the 'chats' collection:

```javascript
await addDoc(collection(db, "chats"), {
  prompt: "Hello, how can you help with inventory?",
  sessionId: "test-session",
  userId: "user-123",
  timestamp: new Date(),
});
```
