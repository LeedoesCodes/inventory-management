import React from "react";

const SalesTrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="empty-state">
          <div className="empty-icon">📈</div>
          <p>No sales trend data available</p>
        </div>
      </div>
    );
  }

  const maxOrders = Math.max(...data.map((item) => item.orders));
  const chartHeight = 200;

  return (
    <div className="chart-container">
      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: "4px",
          height: `${chartHeight}px`,
          padding: "20px 0",
        }}
      >
        {data.slice(-14).map((item, index) => {
          // Show last 14 days
          const height =
            maxOrders > 0 ? (item.orders / maxOrders) * (chartHeight - 40) : 0;
          return (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
              }}
            >
              <div
                style={{
                  height: `${height}px`,
                  backgroundColor: "var(--success-color)",
                  width: "100%",
                  maxWidth: "20px",
                  borderRadius: "4px 4px 0 0",
                }}
                title={`${item.date}: ${item.orders} orders`}
              />
              <div
                style={{
                  fontSize: "9px",
                  marginTop: "8px",
                  color: "var(--text-secondary)",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
              >
                {new Date(item.date).getDate()}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          textAlign: "center",
          marginTop: "10px",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
      >
        Last 14 Days
      </div>
    </div>
  );
};

export default SalesTrendChart;
