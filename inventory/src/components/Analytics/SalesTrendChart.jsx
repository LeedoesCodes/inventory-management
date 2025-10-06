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

  const displayData = data.slice(-14); // Show last 14 days
  const maxOrders = Math.max(...displayData.map((item) => item.orders));
  const chartHeight = 200;

  // Calculate Y-axis values (reversed order for proper display)
  const yAxisSteps = 5;
  const yAxisValues = Array.from({ length: yAxisSteps }, (_, i) => {
    return Math.round((maxOrders / (yAxisSteps - 1)) * i);
  }).reverse(); // Reverse to put 0 at bottom

  return (
    <div className="chart-container">
      <div className="chart-scroll-wrapper">
        <div className="chart-inner">
          <div
            style={{
              display: "flex",
              height: `${chartHeight}px`,
              minWidth: "500px",
            }}
          >
            {/* Y-axis with labels */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                paddingRight: "10px",
                minWidth: "40px",
                flexShrink: 0,
              }}
            >
              {yAxisValues.map((value, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: "10px",
                    color: "var(--text-secondary)",
                    textAlign: "right",
                    padding: "2px 0",
                  }}
                >
                  {value}
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div
              style={{
                display: "flex",
                alignItems: "end",
                gap: "4px",
                flex: 1,
                padding: "20px 0",
                position: "relative",
                minWidth: "400px",
              }}
            >
              {/* Y-axis line */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "1px",
                  backgroundColor: "var(--border-color)",
                }}
              />

              {displayData.map((item, index) => {
                const height =
                  maxOrders > 0
                    ? (item.orders / maxOrders) * (chartHeight - 40)
                    : 0;
                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flex: 1,
                      minWidth: "25px",
                    }}
                  >
                    <div
                      style={{
                        height: `${height}px`,
                        backgroundColor: "var(--success-color)",
                        width: "100%",
                        maxWidth: "20px",
                        borderRadius: "4px 4px 0 0",
                        minWidth: "15px",
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
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(item.date).getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* X-axis label */}
      <div
        style={{
          textAlign: "center",
          marginTop: "10px",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
      >
        Date (Day of Month)
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: "5px",
          fontSize: "10px",
          color: "var(--text-secondary)",
        }}
      >
        Last 14 Days
      </div>

      {/* Scroll hint for mobile */}
    </div>
  );
};

export default SalesTrendChart;
