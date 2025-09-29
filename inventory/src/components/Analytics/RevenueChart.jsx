import React from "react";

const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>No revenue data available</p>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((item) => item.revenue));
  const chartHeight = 200;

  return (
    <div className="chart-container">
      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: "8px",
          height: `${chartHeight}px`,
          padding: "20px 0",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        {data.map((item, index) => {
          const height =
            maxRevenue > 0
              ? (item.revenue / maxRevenue) * (chartHeight - 40)
              : 0;
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
                  backgroundColor: "var(--accent-color)",
                  width: "100%",
                  maxWidth: "30px",
                  borderRadius: "4px 4px 0 0",
                  transition: "all 0.3s ease",
                }}
                title={`${item.date}: ₱${item.revenue}`}
              />
              <div
                style={{
                  fontSize: "10px",
                  marginTop: "8px",
                  color: "var(--text-secondary)",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  textAlign: "center",
                }}
              >
                {new Date(item.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
      >
        <span>Start: {data[0]?.date}</span>
        <span>End: {data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};

export default RevenueChart;
