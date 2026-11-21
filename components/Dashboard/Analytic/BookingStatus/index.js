import React from 'react';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { Grid } from '@material-ui/core';
import './style.scss';

/**
 * Donut chart of the booked statuses.
 *
 * Props:
 *  - data:        `[{ name, value, color }]` (slices with value 0 are omitted)
 *  - total:       number shown in the middle
 *  - centerLabel: caption under the number
 */
const BookingStatus = ({ data = [], total = 0, centerLabel = 'Bookings' }) => (
  <Grid className="bookingStatusWrap">
    <Grid className="bookingStatusChart">
      <Grid className="bookingStatusInner">
        <h4>{total}</h4>
        <span>{centerLabel}</span>
      </Grid>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={62}
            outerRadius={82}
            dataKey="value"
            nameKey="name"
            paddingAngle={3}
            cornerRadius={7}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
          >
            {data.map(entry => (
              <Cell key={entry.name} stroke="#ffffff" strokeWidth={3} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Grid>
    {data.length > 0 ? (
      <ul className="bookingStatusInfo">
        {data.map(item => (
          <li key={item.name}>
            <span style={{ background: item.color }} />
            <p>{item.name}</p>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
    ) : (
      <p className="bookingStatusEmpty">No bookings yet.</p>
    )}
  </Grid>
);

export default BookingStatus;
