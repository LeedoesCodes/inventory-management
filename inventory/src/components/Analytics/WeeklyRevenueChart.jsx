import React, { memo, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarWeek } from "@fortawesome/free-solid-svg-icons";

const WeeklyRevenueChart = memo(
  ({ data, enableAnimation = true, isMobile = false }) => {
    const emptyState = useMemo(
      () => (
        <div className="chart-container">
          <div className="empty-state">
            <FontAwesomeIcon icon={faCalendarWeek} size="2x" />
            <p>No weekly revenue data available</p>
          </div>
        </div>
      ),
      [],
    );

    if (!data || data.length === 0) {
      return emptyState;
    }

    const CustomTooltip = useCallback(({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="custom-tooltip">
            <p className="tooltip-label">Week: {label}</p>
            <p className="tooltip-value" style={{ color: "#4e79a7" }}>
              Revenue: ₱{payload[0].value.toLocaleString()}
            </p>
          </div>
        );
      }
      return null;
    }, []);

    const formatYAxis = useCallback((value) => {
      return `₱${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`;
    }, []);

    const chartData = useMemo(() => {
      if (data.length > 20) {
        return data.slice(-20);
      }
      return data;
    }, [data]);

    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
          <BarChart
            data={chartData}
            margin={{
              top: 12,
              right: isMobile ? 8 : 30,
              left: isMobile ? 0 : 20,
              bottom: isMobile ? 48 : 70,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis
              dataKey="weekLabel"
              angle={isMobile ? -35 : -25}
              textAnchor="end"
              height={isMobile ? 48 : 70}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              interval={isMobile ? "preserveStartEnd" : 0}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 48 : 60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="revenue"
              fill="#4e79a7"
              radius={[4, 4, 0, 0]}
              isAnimationActive={enableAnimation}
              animationDuration={350}
              name="Weekly Revenue"
            />
          </BarChart>
        </ResponsiveContainer>

        <div className="chart-summary">
          <span>Comparing {chartData.length} weeks</span>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
  },
);

WeeklyRevenueChart.displayName = "WeeklyRevenueChart";

export default WeeklyRevenueChart;
