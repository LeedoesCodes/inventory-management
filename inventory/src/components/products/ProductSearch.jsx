// ProductSearch.jsx
import { useState } from "react";

export default function ProductSearch({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = [
    "LARGE",
    "EXTRA SIZE (UA)",
    "FAMILY",
    "BEERMATCH",
    "SUNDAYS",
    "MARSHMALLOW",
    "BREADPAN 100/24G",
    "PINATSU",
    "FROOZE",
    "SMART C+ 500ML",
    "SMART C+LITER",
    "ROYAL DAICHI",
    "DKFPI",
    "LOADED 32X100",
    "NUTRI 25X100",
    "NUTRI 60X50",
    "NUTRI 90X25",
    "LONBISCO",
    "LESLIE'S",
    "PURESNACK",
  ];

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term, selectedCategory);
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    onSearch(searchTerm, category);
  };

  return (
    <>
      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <select value={selectedCategory} onChange={handleCategoryChange}>
        <option value="">All Categories</option>
        {categories.map((cat, idx) => (
          <option key={idx} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </>
  );
}
