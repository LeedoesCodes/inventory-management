import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPalette,
  faBox,
  faChartBar,
  faTags,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import "./SettingsTabs.scss";
import GeneralSettings from "./GeneralSettings";
import CategoriesSettings from "./CategoriesSettings";
import InventorySettings from "./InventorySettings";
import AssociationSettings from "./AssociationSettings";
import ThemeSettings from "./ThemeSettings";

const SettingsTabs = ({
  settings,
  onSettingsChange,
  onSave,
  categories,
  onCategoriesUpdate,
  theme,
  onThemeToggle,
}) => {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    {
      id: "general",
      label: "General",
      icon: faGear,
      component: GeneralSettings,
    },
    {
      id: "categories",
      label: "Categories",
      icon: faTags,
      component: CategoriesSettings,
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: faBox,
      component: InventorySettings,
    },
    {
      id: "association",
      label: "Association Rules",
      icon: faChartBar,
      component: AssociationSettings,
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: faPalette,
      component: ThemeSettings,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="settings-tabs-container">
      {/* Tabs Navigation */}
      <div className="settings-tabs-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <FontAwesomeIcon icon={tab.icon} className="tab-icon" />
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="settings-tab-content">
        {ActiveComponent && (
          <ActiveComponent
            settings={settings}
            onSettingsChange={onSettingsChange}
            categories={categories}
            onCategoriesUpdate={onCategoriesUpdate}
            theme={theme}
            onThemeToggle={onThemeToggle}
          />
        )}
      </div>

      {/* Save Button - Only show for settings that can be saved */}
      {activeTab !== "categories" && (
        <div className="tab-actions">
          <button onClick={onSave} className="btn-primary save-tab-btn">
            Save {tabs.find((tab) => tab.id === activeTab)?.label} Settings
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsTabs;
