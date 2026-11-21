import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList,
} from 'recharts';
import { Grid } from '@material-ui/core';

import '../style.scss';

const ChartTooltip = ({ active, payload, label, series = [], formatter }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="chartTooltip">
      <strong className="chartTooltip__label">{label}</strong>
      {payload.map(entry => {
        const item = series.find(seriesItem => seriesItem.key === entry.dataKey);
        const color = item ? item.color : '#2F5BEA';

        return (
          <span className="chartTooltip__row" key={entry.dataKey}>
            <i style={{ background: color }} />
            <em>{entry.name}</em>
            <b>{formatter ? formatter(entry.value) : entry.value}</b>
          </span>
        );
      })}
    </div>
  );
};

/**
 * Bar chart.
 *
 * Props:
 *  - data:            rows with a `name` (x axis) and the keys referenced by `series`
 *  - series:          `[{ key, name, color }]`
 *  - stacked:         stack the bars instead of grouping them
 *  - showLegend:      render the recharts legend inside the plot area
 *  - showLabels:      print the value above each bar
 *  - maxBarSize:      cap the bar width (bars stay readable with few categories)
 *  - tooltipFormatter: formats values inside the custom tooltip
 */
const BarRechart = ({
  data = [],
  series = [],
  stacked = true,
  showLegend = true,
  showLabels = false,
  maxBarSize = 28,
  height,
  animate = true,
  yTickFormatter,
  labelFormatter,
  tooltipFormatter,
}) => (
  <Grid className="responsiveRechart" style={height ? { height } : undefined}>
    <ResponsiveContainer>
      <BarChart
        data={data}
        barGap={4}
        barCategoryGap="26%"
        margin={{ top: 22, right: 16, left: yTickFormatter ? 4 : 0, bottom: 0 }}
      >
        <defs>
          {series.map(item => (
            <linearGradient
              key={item.key}
              id={`hqBar-${item.key}-${String(item.color).replace('#', '')}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={item.color} stopOpacity={1} />
              <stop offset="100%" stopColor={item.color} stopOpacity={0.62} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="#eceff9" strokeDasharray="4 6" />
        <XAxis
          axisLine={false}
          tickLine={false}
          tickMargin={10}
          dataKey="name"
          tick={{ fill: '#8791a9', fontSize: 12 }}
          padding={{ left: 8, right: 8 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tickMargin={10}
          width={yTickFormatter ? 70 : 52}
          tick={{ fill: '#8791a9', fontSize: 12 }}
          allowDecimals={false}
          tickFormatter={yTickFormatter}
        />
        <Tooltip
          cursor={{ fill: 'rgba(47, 91, 234, 0.06)', radius: 8 }}
          content={<ChartTooltip series={series} formatter={tooltipFormatter} />}
        />
        {showLegend && (
          <Legend
            align="right"
            verticalAlign="top"
            iconType="circle"
            iconSize={9}
            wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
          />
        )}
        {series.map(item => (
          <Bar
            key={item.key}
            isAnimationActive={animate}
            animationDuration={650}
            dataKey={item.key}
            name={item.name || item.key}
            fill={`url(#hqBar-${item.key}-${String(item.color).replace('#', '')})`}
            maxBarSize={maxBarSize}
            stackId={stacked ? 'a' : undefined}
            radius={[7, 7, 0, 0]}
          >
            {showLabels && (
              <LabelList
                dataKey={item.key}
                position="top"
                offset={8}
                fill="#526083"
                fontSize={11}
                formatter={labelFormatter || (value => (value ? value : ''))}
              />
            )}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  </Grid>
);

export default BarRechart;
