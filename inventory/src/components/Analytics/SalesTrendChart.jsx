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
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";

const SalesTrendChart = memo(
  ({ data, enableAnimation = true, isMobile = false }) => {
    const emptyState = useMemo(
      () => (
        <div className="chart-container">
          <div className="empty-state">
            <FontAwesomeIcon icon={faShoppingCart} size="2x" />
            <p>No sales trend data available</p>
          </div>
        </div>
      ),
      [],
    );

    if (!data || data.length === 0) {
      return emptyState;
    }

    const displayData = useMemo(() => data.slice(-14), [data]);

    const CustomTooltip = useCallback(({ active, payload, label }) => {
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
    }, []);

    const formatXAxis = useCallback((tickItem) => {
      const date = new Date(tickItem);
      return date.getDate().toString();
    }, []);

    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
          <BarChart
            data={displayData}
            margin={{
              top: 12,
              right: isMobile ? 8 : 30,
              left: isMobile ? 0 : 20,
              bottom: isMobile ? 30 : 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              angle={0}
              textAnchor="middle"
              height={isMobile ? 34 : 60}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              interval={isMobile ? "preserveStartEnd" : 0}
              label={
                isMobile
                  ? undefined
                  : {
                      value: "Day of Month",
                      position: "insideBottom",
                      offset: 10,
                    }
              }
            />
            <YAxis
              tick={{ fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 32 : 40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="orders"
              fill="#82ca9d"
              radius={[4, 4, 0, 0]}
              isAnimationActive={enableAnimation}
              animationDuration={350}
            />
          </BarChart>
        </ResponsiveContainer>

        <div className="chart-summary">
          <span>Last 14 Days</span>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
  },
);

SalesTrendChart.displayName = "SalesTrendChart";

export default SalesTrendChart;
