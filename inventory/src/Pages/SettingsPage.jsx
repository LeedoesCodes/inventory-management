import { useState, useEffect, useContext, useRef, useCallback } from "react";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { AuthContext } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { useTheme } from "../context/ThemeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faExclamationTriangle,
  faCheckCircle,
  faGear,
} from "@fortawesome/free-solid-svg-icons";

import SettingsTabs from "../components/settings/SettingsTabs";
import Header from "../components/UI/Headers";
import "../styles/settings.scss";

const SettingsPage = () => {
  const { user } = useContext(AuthContext);
  const { isCollapsed } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  const [settings, setSettings] = useState({
    lowStockThreshold: 5,
    minSupport: 0.05,
    minConfidence: 0.3,
    minLift: 1.0,
    autoSave: true,
    autoSaveDelay: 2000,
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState(""); // "saving", "saved", "error"

  const autoSaveTimeoutRef = useRef(null);
  const previousSettingsRef = useRef(settings);

  // Auto-save function
  const autoSaveSettings = useCallback(
    async (newSettings) => {
      if (!user || !newSettings.autoSave) return;

      setSaveStatus("saving");
      try {
        await setDoc(doc(db, "userSettings", user.uid), newSettings);
        setSaveStatus("saved");
        console.log("✅ Settings auto-saved");

        // Clear success status after 2 seconds
        setTimeout(() => setSaveStatus(""), 2000);
      } catch (error) {
        console.error("🔴 Auto-save failed:", error);
        setSaveStatus("error");
        setMessage("Auto-save failed: " + error.message);
      }
    },
    [user]
  );

  // Enhanced settings change handler with auto-save
  const handleSettingsChange = useCallback(
    (key, value) => {
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value };

        // Only auto-save if the setting actually changed and auto-save is enabled
        if (prev[key] !== value && prev.autoSave) {
          // Clear previous timeout
          if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
          }

          // Set new timeout for auto-save
          autoSaveTimeoutRef.current = setTimeout(() => {
            autoSaveSettings(newSettings);
          }, prev.autoSaveDelay);
        }

        return newSettings;
      });
    },
    [autoSaveSettings]
  );

  // Manual save function (for when auto-save is off or explicit save)
  const handleSave = async () => {
    if (!user) return;

    setSaveStatus("saving");
    try {
      await setDoc(doc(db, "userSettings", user.uid), settings);
      setSaveStatus("saved");
      setMessage("Settings saved successfully!");
      setTimeout(() => {
        setMessage("");
        setSaveStatus("");
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveStatus("error");
      setMessage("Error saving settings: " + error.message);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Load categories from Firestore
  const loadCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort categories alphabetically
      const sortedCategories = categoriesData.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setCategories(sortedCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  // FIXED: Handle categories operations with proper document references
  const handleCategoriesUpdate = async (operation, data) => {
    try {
      switch (operation) {
        case "add":
          // Check if category already exists
          const existingCategory = categories.find(
            (cat) => cat.name.toLowerCase() === data.name.toLowerCase()
          );
          if (existingCategory) {
            setMessage("Category already exists");
            return;
          }

          await addDoc(collection(db, "categories"), {
            name: data.name,
            createdAt: new Date(),
            createdBy: user.uid,
            updatedAt: new Date(),
          });
          setMessage("Category added successfully!");
          break;

        case "edit":
          // Check if category name already exists (excluding the current one)
          const existingName = categories.find(
            (cat) =>
              cat.id !== data.id &&
              cat.name.toLowerCase() === data.name.toLowerCase()
          );

          if (existingName) {
            setMessage("Category name already exists");
            return;
          }

          // Update the category in Firestore
          await updateDoc(doc(db, "categories", data.id), {
            name: data.name,
            updatedAt: new Date(),
            updatedBy: user.uid,
          });

          // Update all products with the old category name to the new name
          const productsSnapshot = await getDocs(collection(db, "products"));
          const batch = writeBatch(db);
          const oldCategory = categories.find((cat) => cat.id === data.id);

          productsSnapshot.docs.forEach((docSnap) => {
            const product = docSnap.data();
            if (product.category === oldCategory.name) {
              // FIX: Use docSnap.ref instead of recreating the document reference
              const productRef = docSnap.ref;
              batch.update(productRef, { category: data.name });
            }
          });

          await batch.commit();
          setMessage("Category updated successfully!");
          break;

        case "delete":
          // FIXED: Category deletion with proper document references
          const productsSnap = await getDocs(collection(db, "products"));
          const deleteBatch = writeBatch(db);

          productsSnap.docs.forEach((docSnap) => {
            const product = docSnap.data();
            if (product.category === data.name) {
              // FIX: Use docSnap.ref instead of recreating the document reference
              const productRef = docSnap.ref;
              deleteBatch.update(productRef, { category: "none" });
            }
          });

          await deleteBatch.commit();
          await deleteDoc(doc(db, "categories", data.id));
          setMessage(
            `Category "${data.name}" deleted. Related products set to "none".`
          );
          break;
      }

      // Reload categories
      await loadCategories();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error(`Error ${operation} category:`, error);
      setMessage(`Error ${operation} category: ${error.message}`);
    }
  };

  // Load settings and categories
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      try {
        // Load user settings
        const settingsDoc = await getDoc(doc(db, "userSettings", user.uid));
        if (settingsDoc.exists()) {
          const userSettings = settingsDoc.data();
          const loadedSettings = {
            lowStockThreshold: userSettings.lowStockThreshold || 5,
            minSupport: userSettings.minSupport || 0.05,
            minConfidence: userSettings.minConfidence || 0.3,
            minLift: userSettings.minLift || 1.0,
            autoSave:
              userSettings.autoSave !== undefined
                ? userSettings.autoSave
                : true,
            autoSaveDelay: userSettings.autoSaveDelay || 2000,
          };
          setSettings(loadedSettings);
          previousSettingsRef.current = loadedSettings;
        }

        // Load categories
        await loadCategories();
      } catch (error) {
        console.error("Error loading settings:", error);
        setMessage("Error loading settings: " + error.message);
      }
      setLoading(false);
    };

    loadSettings();
  }, [user]);

  // Save status indicator component - FIXED POSITION
  const SaveStatusIndicator = () => {
    if (!saveStatus) return null;

    return (
      <div className="save-status-container">
        <div className={`save-status-indicator ${saveStatus}`}>
          {saveStatus === "saving" && (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className="status-icon" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <FontAwesomeIcon icon={faCheckCircle} className="status-icon" />
              <span>Settings saved!</span>
            </>
          )}
          {saveStatus === "error" && (
            <>
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="status-icon"
              />
              <span>Save failed</span>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className={`settings-page ${isCollapsed ? "sidebar-collapsed" : ""}`}
      >
        <Header />
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} className="loading-spinner" spin />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`settings-page ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <Header />
      <div className="page-header">
        <h1 className="page-title">
          <FontAwesomeIcon icon={faGear} className="header-icon" />
          Settings
        </h1>
        <p className="page-subtitle">
          Manage your application preferences and configurations
        </p>
      </div>

      {/* Save Status Indicator - FIXED POSITION */}
      <SaveStatusIndicator />

      {/* Message Alert */}
      {message && (
        <div
          className={`message-alert ${
            message.includes("Error") || message.includes("failed")
              ? "error"
              : "success"
          }`}
        >
          <FontAwesomeIcon
            icon={
              message.includes("Error") || message.includes("failed")
                ? faExclamationTriangle
                : faCheckCircle
            }
            className="alert-icon"
          />
          {message}
        </div>
      )}

      {/* Settings Container with Tabs */}
      <div className="settings-container">
        <SettingsTabs
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onSave={handleSave}
          categories={categories}
          onCategoriesUpdate={handleCategoriesUpdate}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
      </div>
    </div>
  );
};

export default SettingsPage;
