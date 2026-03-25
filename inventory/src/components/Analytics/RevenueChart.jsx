import React, { memo, useMemo, useCallback } from "react";
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

const RevenueChart = memo(
  ({ data, enableAnimation = true }) => {
    // Memoize the empty state to prevent unnecessary re-renders
    const emptyState = useMemo(
      () => (
        <div className="chart-container">
          <div className="empty-state">
            <FontAwesomeIcon icon={faDollarSign} size="2x" />
            <p>No revenue data available</p>
          </div>
        </div>
      ),
      [],
    );

    if (!data || data.length === 0) {
      return emptyState;
    }

    // Memoize custom tooltip component
    const CustomTooltip = useCallback(({ active, payload, label }) => {
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
    }, []);

    // Memoize X-axis formatter
    const formatXAxis = useCallback(
      (tickItem) => {
        const date = new Date(tickItem);
        if (data.length > 30) {
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      },
      [data.length],
    );

    // Memoize Y-axis formatter
    const formatYAxis = useCallback((value) => {
      return `₱${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`;
    }, []);

    // Memoize chart configuration
    const chartConfig = useMemo(() => {
      const isLargeDataset = data.length > 30;

      return {
        margin: {
          top: 20,
          right: 30,
          left: 20,
          bottom: isLargeDataset ? 80 : 60,
        },
        xAxisConfig: {
          angle: isLargeDataset ? -45 : 0,
          textAnchor: isLargeDataset ? "end" : "middle",
          height: isLargeDataset ? 80 : 60,
        },
        lineConfig: {
          dot: { r: isLargeDataset ? 2 : 4 },
          activeDot: { r: isLargeDataset ? 4 : 6 },
        },
      };
    }, [data.length]);

    // Memoize chart summary
    const chartSummary = useMemo(
      () => (
        <div className="chart-summary">
          <span>Start: {data[0]?.date}</span>
          <span>End: {data[data.length - 1]?.date}</span>
        </div>
      ),
      [data],
    );

    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={chartConfig.margin}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              angle={chartConfig.xAxisConfig.angle}
              textAnchor={chartConfig.xAxisConfig.textAnchor}
              height={chartConfig.xAxisConfig.height}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatYAxis}
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
              isAnimationActive={enableAnimation}
              animationDuration={350}
              dot={chartConfig.lineConfig.dot}
              activeDot={chartConfig.lineConfig.activeDot}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
        {chartSummary}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    // Only re-render if data actually changed
    if (prevProps.data?.length !== nextProps.data?.length) {
      return false; // re-render if array length changed
    }

    if (prevProps.data === nextProps.data) {
      return true; // same reference, no re-render needed
    }

    // Deep compare data arrays
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
  },
);

// Add display name for better debugging
RevenueChart.displayName = "RevenueChart";

export default RevenueChart;
