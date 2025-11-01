import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faEdit,
  faTimes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import "./CategoriesSettings.scss";

const CategoriesSettings = ({ categories, onCategoriesUpdate }) => {
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    await onCategoriesUpdate("add", { name: newCategory.trim() });
    setNewCategory("");
  };

  const handleStartEdit = (category) => {
    setEditingCategory(category.id);
    setEditCategoryName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditCategoryName("");
  };

  const handleSaveEdit = async (categoryId) => {
    if (!editCategoryName.trim()) return;
    await onCategoriesUpdate("edit", {
      id: categoryId,
      name: editCategoryName.trim(),
    });
    setEditingCategory(null);
    setEditCategoryName("");
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (
      window.confirm(
        `Delete category "${categoryName}"? Products will be set to "none".`
      )
    ) {
      await onCategoriesUpdate("delete", {
        id: categoryId,
        name: categoryName,
      });
    }
  };

  return (
    <div className="settings-tab-panel">
      <div className="panel-header">
        <h3>Product Categories</h3>
        <p>Manage and organize your product categories</p>
      </div>

      {/* Add Category Form */}
      <div className="add-category-section">
        <div className="input-group">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter new category name"
            className="category-input"
            onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
          />
          <button
            onClick={handleAddCategory}
            className="btn-primary"
            disabled={!newCategory.trim()}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Category
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="categories-table-container">
        <div className="table-header">
          <span>Category Name</span>
          <span>Actions</span>
        </div>

        <div className="table-body">
          {categories.length === 0 ? (
            <div className="empty-state">
              No categories found. Add your first category above.
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="table-row">
                {editingCategory === category.id ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      className="edit-input"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSaveEdit(category.id)
                      }
                    />
                    <div className="edit-actions">
                      <button
                        onClick={() => handleSaveEdit(category.id)}
                        className="btn-success btn-icon"
                        title="Save"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="btn-secondary btn-icon"
                        title="Cancel"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="category-name">{category.name}</span>
                    <div className="row-actions">
                      <button
                        onClick={() => handleStartEdit(category)}
                        className="btn-warning btn-icon"
                        title="Edit category"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteCategory(category.id, category.name)
                        }
                        className="btn-danger btn-icon"
                        title="Delete category"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesSettings;
