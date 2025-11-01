import { useState, useEffect } from "react";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "../Firebase/firebase";

export const useCategoryMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  const migrateCategories = async () => {
    try {
      setIsMigrating(true);
      console.log("🔄 Starting automatic category migration...");

      // Check if categories collection exists and has data
      const categoriesSnapshot = await getDocs(collection(db, "categories"));

      // If categories already exist, no migration needed
      if (!categoriesSnapshot.empty) {
        console.log("✅ Categories already exist, no migration needed");
        setMigrationComplete(true);
        return;
      }

      // Get all products to extract categories
      const productsSnapshot = await getDocs(collection(db, "products"));
      const products = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Extract unique categories from products (excluding "none")
      const productCategories = [
        ...new Set(
          products
            .map((p) => p.category)
            .filter((cat) => cat && cat !== "none" && cat.trim() !== "")
        ),
      ];

      console.log("📦 Found product categories to migrate:", productCategories);

      if (productCategories.length === 0) {
        console.log("ℹ️ No categories found in products to migrate");
        setMigrationComplete(true);
        return;
      }

      // Create batch to add all categories at once
      const batch = writeBatch(db);

      productCategories.forEach((categoryName) => {
        const newCategoryRef = doc(collection(db, "categories"));
        batch.set(newCategoryRef, {
          name: categoryName,
          createdAt: new Date(),
          createdBy: "system-migration",
          migrated: true,
        });
      });

      // Commit the batch
      await batch.commit();

      console.log(
        `✅ Successfully migrated ${productCategories.length} categories:`,
        productCategories
      );
      setMigrationComplete(true);

      // Store migration completion in localStorage to prevent future runs
      localStorage.setItem("categoryMigrationComplete", "true");
    } catch (error) {
      console.error("🔴 Category migration failed:", error);
      // Don't block the app if migration fails
      setMigrationComplete(true);
    } finally {
      setIsMigrating(false);
    }
  };

  useEffect(() => {
    // Check if migration was already completed
    const alreadyMigrated = localStorage.getItem("categoryMigrationComplete");

    if (!alreadyMigrated) {
      migrateCategories();
    } else {
      setMigrationComplete(true);
      console.log("✅ Category migration was already completed");
    }
  }, []);

  return { isMigrating, migrationComplete };
};
