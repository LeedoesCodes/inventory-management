// ProductSearch.jsx
import { useState } from "react";

export default function ProductSearch({
  onSearch,
  categories = [],
  units = [],
  selectedCategory = "",
  selectedUnit = "",
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Default units if none provided
  const defaultUnits = ["piece", "bag", "pack", "bottle", "can", "box"];
  const availableUnits = units.length > 0 ? units : defaultUnits;

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term, selectedCategory, selectedUnit);
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    onSearch(searchTerm, category, selectedUnit);
  };

  const handleUnitChange = (e) => {
    const unit = e.target.value;
    onSearch(searchTerm, selectedCategory, unit);
  };

  return (
    <div className="search-filters-container">
      <div className="search-input-group">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      <div className="filter-select-group">
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={selectedUnit}
          onChange={handleUnitChange}
          className="filter-select"
        >
          <option value="">All Units</option>
          {availableUnits.map((unit, idx) => (
            <option key={idx} value={unit}>
              {unit.charAt(0).toUpperCase() + unit.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
