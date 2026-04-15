"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartProps {
  data: Array<{ label: string; value: number }>;
  type?: "bar" | "line";
}

const CHART_COLOR = "hsl(263, 70%, 50%)";
const GRID_COLOR = "hsl(217, 33%, 17%)";
const TEXT_COLOR = "hsl(215, 20%, 65%)";

export function Chart({ data, type = "bar" }: ChartProps) {
  const commonProps = {
    data,
    margin: { top: 8, right: 8, bottom: 0, left: -12 },
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      {type === "bar" ? (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis
            dataKey="label"
            tick={{ fill: TEXT_COLOR, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
          />
          <YAxis
            tick={{ fill: TEXT_COLOR, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 84%, 5%)",
              border: `1px solid ${GRID_COLOR}`,
              borderRadius: 8,
              color: TEXT_COLOR,
            }}
          />
          <Bar dataKey="value" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis
            dataKey="label"
            tick={{ fill: TEXT_COLOR, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
          />
          <YAxis
            tick={{ fill: TEXT_COLOR, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 84%, 5%)",
              border: `1px solid ${GRID_COLOR}`,
              borderRadius: 8,
              color: TEXT_COLOR,
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={CHART_COLOR}
            strokeWidth={2}
            dot={{ fill: CHART_COLOR, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
