import React from "react";
import { addDummyOrders } from "../../utils/addDummyData";

const DummyDataButton = () => {
  const handleAddDummyData = async () => {
    if (
      window.confirm(
        "This will add 100 dummy orders with diverse dates (last 7 days to 3 years ago). Continue?"
      )
    ) {
      const success = await addDummyOrders(100);
      if (success) {
        alert(
          "Dummy data added successfully! Refresh the analytics page to see trends across different time periods."
        );
      } else {
        alert("Failed to add dummy data. Check console for errors.");
      }
    }
  };

  return (
    <button
      onClick={handleAddDummyData}
      style={{
        padding: "10px 20px",
        background: "var(--accent-color)",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        margin: "10px 0",
        fontSize: "14px",
      }}
    >
      📊 Add Diverse Dummy Data (100 Orders)
    </button>
  );
};

export default DummyDataButton;
