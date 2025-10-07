import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDollarSign } from "@fortawesome/free-solid-svg-icons";

const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="empty-state">
          <FontAwesomeIcon icon={faDollarSign} size="2x" />
          <p>No revenue data available</p>
        </div>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`Date: ${label}`}</p>
          <p className="tooltip-value" style={{ color: "#8884d8" }}>
            Revenue: ₱{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format date for X-axis
  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    if (data.length > 30) {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: data.length > 30 ? 80 : 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            angle={data.length > 30 ? -45 : 0}
            textAnchor={data.length > 30 ? "end" : "middle"}
            height={data.length > 30 ? 80 : 60}
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) =>
              `₱${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
            }
            tick={{ fontSize: 12 }}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: data.length > 30 ? 2 : 4 }}
            activeDot={{ r: data.length > 30 ? 4 : 6 }}
            name="Revenue"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="chart-summary">
        <span>Start: {data[0]?.date}</span>
        <span>End: {data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};

export default RevenueChart;
