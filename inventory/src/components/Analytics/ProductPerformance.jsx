import React from "react";

const ProductPerformance = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏆</div>
        <p>No product performance data available</p>
      </div>
    );
  }

  const maxSales = Math.max(...data.map((item) => item.sales));

  return (
    <div className="product-list">
      {data.map((product, index) => (
        <div key={index} className="product-item">
          <div className="product-info">
            <div className="product-rank">#{index + 1}</div>
            <div className="product-name">{product.name}</div>
          </div>
          <div className="product-stats">
            <div className="stat">
              <div className="value">{product.sales}</div>
              <div className="label">Sold</div>
            </div>
            <div className="stat">
              <div className="value">₱{product.revenue.toFixed(2)}</div>
              <div className="label">Revenue</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductPerformance;
