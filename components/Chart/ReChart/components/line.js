import React from 'react';
import {
  Tooltip,
  Area,
  AreaChart,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { Grid } from '@material-ui/core';

const CustomTooltip = ({ active, payload, label, valuePrefix = '$' }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="chartTooltip">
      <strong className="chartTooltip__label">{label}</strong>
      <span className="chartTooltip__row">
        <i style={{ background: '#2F5BEA' }} />
        <em>Value</em>
        <b>
          {valuePrefix}
          {payload[0].value}
        </b>
      </span>
    </div>
  );
};

/**
 * Line/area chart.
 *
 * Props:
 *  - data:        rows with a `name` (x axis) and the `dataKey` value
 *  - dataKey:     field plotted on the line
 *  - valuePrefix: prefix shown in the tooltip (e.g. '$')
 *  - showDots:    draw a marker per data point (useful for sparse series)
 */
const LineRechart = ({
  data = [],
  dataKey = 'conversion',
  valuePrefix = '$',
  stroke = '#2F5BEA',
  showDots = false,
  animate = true,
}) => {
  const gradientId = `hqLine-${dataKey}`;

  return (
    <Grid className="lineRechart">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
              <stop offset="70%" stopColor={stroke} stopOpacity={0.08} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#eceff9" strokeDasharray="4 6" />
          <XAxis
            axisLine={false}
            tickMargin={10}
            tickLine={false}
            dataKey="name"
            tick={{ fill: '#8791a9', fontSize: 12 }}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            axisLine={false}
            tickMargin={10}
            tickLine={false}
            width={42}
            tick={{ fill: '#8791a9', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: 'rgba(47, 91, 234, 0.25)', strokeDasharray: '4 4' }}
            content={<CustomTooltip valuePrefix={valuePrefix} />}
          />
          <Area
            type="monotone"
            isAnimationActive={animate}
            animationDuration={700}
            dataKey={dataKey}
            stroke={stroke}
            strokeWidth={3}
            fill={`url(#${gradientId})`}
            dot={
              showDots
                ? { r: 3.5, fill: '#ffffff', stroke, strokeWidth: 2 }
                : { strokeWidth: 0, r: 0 }
            }
            activeDot={{ stroke: '#ffffff', strokeWidth: 3, r: 6, fill: stroke }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Grid>
  );
};

export default LineRechart;
