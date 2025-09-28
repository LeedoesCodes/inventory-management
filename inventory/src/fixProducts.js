import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./Firebase/firebase.js";

// Helper: recursively fix fields with awareness of expected types
function fixField(key, value) {
  if (typeof value === "object" && value !== null) {
    // If it's exactly { increment: X }, replace with type-appropriate fallback
    if (Object.keys(value).length === 1 && "increment" in value) {
      if (key === "price" || key === "stock") return 0; // numbers
      if (key === "name" || key === "category" || key === "imgUrl") return ""; // strings
      return null; // safe fallback if unknown
    }

    // If it's a nested object, scan deeper
    const fixedObj = {};
    for (const subKey in value) {
      fixedObj[subKey] = fixField(subKey, value[subKey]);
    }
    return fixedObj;
  }
  return value; // leave good numbers/strings/arrays untouched
}

async function fixProducts() {
  const productsRef = collection(db, "products");
  const snapshot = await getDocs(productsRef);

  for (const productDoc of snapshot.docs) {
    const data = productDoc.data();
    const fixedData = {};
    let updateNeeded = false;

    for (const key in data) {
      const fixedValue = fixField(key, data[key]);
      if (fixedValue !== data[key]) {
        fixedData[key] = fixedValue;
        updateNeeded = true;
      }
    }

    if (updateNeeded) {
      await updateDoc(doc(db, "products", productDoc.id), fixedData);
      console.log(`✅ Fixed product: ${productDoc.id}`);
    }
  }

  console.log("🎉 Done fixing all products!");
}

fixProducts();
