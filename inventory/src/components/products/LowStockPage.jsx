import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../Firebase/firebase";
import { useSidebar } from "../../context/SidebarContext";
import { useNavigate } from "react-router-dom";
import Header from "../../components/UI/Headers";
import "../../styles/lowStock.scss";

const LowStockPage = () => {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLowStockProducts = async () => {
    try {
      setError(null);
      setLoading(true);

      const productsSnap = await getDocs(collection(db, "products"));
      const products = productsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const lowStock = products
        .filter((p) => p.stock <= 5)
        .sort((a, b) => a.stock - b.stock);

      setLowStockProducts(lowStock);
    } catch (err) {
      console.error("Error fetching low stock products:", err);
      setError("Failed to load low stock products");
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId, newStock) => {
    try {
      await updateDoc(doc(db, "products", productId), {
        stock: parseInt(newStock),
      });
      fetchLowStockProducts();
    } catch (err) {
      console.error("Error updating stock:", err);
      alert("Failed to update stock");
    }
  };

  const handleQuickReorder = (product) => {
    alert(
      `Quick reorder for ${product.name}. This could integrate with your supplier system.`
    );
  };

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const getStockLevelClass = (stock) => {
    if (stock === 0) return "out-of-stock";
    if (stock <= 2) return "critical-stock";
    if (stock <= 5) return "low-stock";
    return "";
  };

  const getStockLevelText = (stock) => {
    if (stock === 0) return "Out of Stock";
    if (stock <= 2) return "Critical";
    if (stock <= 5) return "Low";
    return "Adequate";
  };

  return (
    <div className={`low-stock-page ${isCollapsed ? "collapsed" : ""}`}>
      <Header />

      <div className="page-header">
        <div className="header-content">
          <h1>Low Stock Products</h1>
          <p>Products that need immediate attention</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchLowStockProducts} className="refresh-btn">
            Refresh
          </button>
          <button onClick={() => navigate("/products")} className="back-btn">
            View All Products
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading low stock products...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchLowStockProducts} className="retry-btn">
            Try Again
          </button>
        </div>
      ) : (
        <div className="low-stock-content">
          <div className="summary-card">
            <div className="summary-item">
              <span className="count">{lowStockProducts.length}</span>
              <span className="label">Products Need Restocking</span>
            </div>
            <div className="summary-item">
              <span className="count critical">
                {lowStockProducts.filter((p) => p.stock === 0).length}
              </span>
              <span className="label">Out of Stock</span>
            </div>
            <div className="summary-item">
              <span className="count low">
                {
                  lowStockProducts.filter((p) => p.stock > 0 && p.stock <= 2)
                    .length
                }
              </span>
              <span className="label">Critical Stock</span>
            </div>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="no-products">
              <div className="success-icon">✅</div>
              <h3>All products are well-stocked!</h3>
              <p>No products need immediate restocking.</p>
            </div>
          ) : (
            <div className="products-table">
              <div className="table-header">
                <span>Product</span>
                <span>Current Stock</span>
                <span>Status</span>
                <span>Price</span>
                <span>Category</span>
                <span>Actions</span>
              </div>

              <div className="table-body">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`table-row ${getStockLevelClass(product.stock)}`}
                  >
                    <div className="product-info">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="product-image"
                        />
                      )}
                      <div className="product-details">
                        <span className="product-name">{product.name}</span>
                        {product.description && (
                          <span className="product-description">
                            {product.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="stock-info">
                      <span className="stock-count">{product.stock}</span>
                      <div className="stock-input">
                        <input
                          type="number"
                          min="0"
                          defaultValue={product.stock}
                          onBlur={(e) =>
                            updateStock(product.id, e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="status-info">
                      <span
                        className={`status-badge ${getStockLevelClass(
                          product.stock
                        )}`}
                      >
                        {getStockLevelText(product.stock)}
                      </span>
                    </div>

                    <div className="price-info">
                      ₱{product.price?.toFixed(2)}
                    </div>

                    <div className="category-info">
                      {product.category || "Uncategorized"}
                    </div>

                    <div className="action-buttons">
                      <button
                        onClick={() => handleQuickReorder(product)}
                        className="action-btn reorder-btn"
                      >
                        Reorder
                      </button>
                      <button
                        onClick={() => navigate("/products")}
                        className="action-btn view-btn"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LowStockPage;
