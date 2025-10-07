import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";

const SalesTrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="empty-state">
          <FontAwesomeIcon icon={faShoppingCart} size="2x" />
          <p>No sales trend data available</p>
        </div>
      </div>
    );
  }

  const displayData = data.slice(-14); // Show last 14 days

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`Date: ${label}`}</p>
          <p className="tooltip-value" style={{ color: "#82ca9d" }}>
            Orders: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format date for X-axis - show only day number for last 14 days
  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    return date.getDate().toString();
  };

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={displayData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            angle={0}
            textAnchor="middle"
            height={60}
            tick={{ fontSize: 12 }}
            label={{
              value: "Day of Month",
              position: "insideBottom",
              offset: 10,
            }}
          />
          <YAxis tick={{ fontSize: 12 }} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="orders" fill="#82ca9d" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="chart-summary">
        <span>Last 14 Days</span>
      </div>
    </div>
  );
};

export default SalesTrendChart;
