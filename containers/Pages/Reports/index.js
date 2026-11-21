import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Grid } from '@material-ui/core';
import { Badge } from 'reactstrap';
import {
  BedDouble,
  CalendarCheck2,
  TriangleAlert,
  Users,
} from 'lucide-react';
import Card from 'components/Card/Loadable';
import AnalyticFeatured from 'components/Dashboard/Analytic/Featured';
import BookingStatus from 'components/Dashboard/Analytic/BookingStatus';
import BarRechart from 'components/Chart/ReChart/components/bar';
import { db } from 'utils/firebase';
import { BOOKINGS_COLLECTION } from 'utils/bookings';
import { ROOMS_COLLECTION, roomStatusColor, roomStatusLabel } from 'utils/rooms';
import {
  INVENTORY_COLLECTION,
  stockColor,
  stockLabel,
  stockLevel,
} from 'utils/inventory';
import {
  bookingGrowthByMonth,
  bookingGrowthMonths,
  bookingRevenueByMonth,
  bookingStatusDistribution,
  calculateBookingMetrics,
  calculateRevenueMetrics,
} from 'utils/dashboard';
import { formatCompactCurrency, formatCurrency } from 'utils/currency';
import './style.scss';

const BOOKINGS_SERIES = [{ key: 'bookings', name: 'Bookings', color: '#1B2A5F' }];
const REVENUE_SERIES = [{ key: 'revenue', name: 'Revenue', color: '#6B5BD2' }];

const ROOM_STATUSES = ['available', 'occupied', 'maintenance'];

export const Reports = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(0);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const sources = [
      [BOOKINGS_COLLECTION, setBookings],
      [ROOMS_COLLECTION, setRooms],
      [INVENTORY_COLLECTION, setItems],
    ];

    const unsubscribes = sources.map(([collection, setter]) =>
      db.collection(collection).onSnapshot(
        snapshot => {
          setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoadError('');
          setLoaded(count => count + 1);
        },
        error => {
          console.error(`Could not load ${collection}:`, error);
          setLoadError(error.message);
          setLoaded(count => count + 1);
        },
      ),
    );

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, []);

  const loading = loaded < 3;

  const metrics = useMemo(() => calculateBookingMetrics(bookings), [bookings]);
  const growthMonths = useMemo(() => bookingGrowthMonths(bookings), [bookings]);
  const growth = useMemo(
    () => bookingGrowthByMonth(bookings, growthMonths),
    [bookings, growthMonths],
  );
  const statusData = useMemo(() => bookingStatusDistribution(bookings), [bookings]);
  const revenue = useMemo(() => calculateRevenueMetrics(bookings), [bookings]);
  const revenueMonths = useMemo(
    () => bookingRevenueByMonth(bookings, growthMonths),
    [bookings, growthMonths],
  );

  const roomCounts = useMemo(
    () =>
      ROOM_STATUSES.reduce(
        (acc, status) => ({
          ...acc,
          [status]: rooms.filter(room => room.status === status).length,
        }),
        {},
      ),
    [rooms],
  );

  const lowStockItems = useMemo(
    () => items.filter(item => stockLevel(item.quantity) !== 'in'),
    [items],
  );

  const display = value => (loading ? '—' : value);

  const kpis = [
    {
      key: 'bookings',
      name: 'Total Bookings',
      value: display(metrics.totalBookings),
      icon: CalendarCheck2,
      tone: 'bookings',
      hint: `${display(metrics.confirmedBookings)} confirmed`,
    },
    {
      key: 'guests',
      name: 'Total Guests',
      value: display(metrics.totalGuests),
      icon: Users,
      tone: 'guests',
      hint: `${display(metrics.arrivedBookings)} in-house`,
    },
    {
      key: 'available-rooms',
      name: 'Available Rooms',
      value: display(roomCounts.available || 0),
      icon: BedDouble,
      tone: 'available-rooms',
      hint: `${rooms.length} room${rooms.length === 1 ? '' : 's'} total`,
    },
    {
      key: 'low-stock',
      name: 'Low Stock Items',
      value: display(lowStockItems.length),
      icon: TriangleAlert,
      tone: 'low-stock',
      hint: loading
        ? 'loading…'
        : lowStockItems.length > 0
          ? 'needs attention'
          : 'all stocked',
    },
  ];

  return (
    <Fragment>
      <Helmet>
        <title>Reports</title>
      </Helmet>

      {loadError && (
        <Grid className="pageError">Could not load reports: {loadError}</Grid>
      )}

      <Grid container spacing={3}>
        <AnalyticFeatured items={kpis} />

        <Grid item lg={8} xs={12}>
          <Card title="Booking Growth">
            <BarRechart
              data={growth}
              series={BOOKINGS_SERIES}
              showLegend={false}
              showLabels
              animate={false}
            />
            <p className="dashboardHint">
              Bookings per month by arrival date (range follows the oldest booking).
            </p>
          </Card>
        </Grid>

        <Grid item lg={4} xs={12}>
          <Card title="Booking Status">
            <BookingStatus
              data={statusData}
              total={loading ? '—' : metrics.totalBookings}
            />
          </Card>
        </Grid>

        <Grid item lg={4} sm={12} xs={12}>
          <Card title="Rooms by Status">
            {rooms.length === 0 ? (
              <p className="uiMuted">No rooms yet — add rooms to see the breakdown.</p>
            ) : (
              <ul className="reportsStats">
                {ROOM_STATUSES.map(status => (
                  <li key={status}>
                    <span>{roomStatusLabel(status)}</span>
                    <Badge color={roomStatusColor(status)}>
                      {roomCounts[status] || 0}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <p className="dashboardHint">
              {rooms.length} room{rooms.length === 1 ? '' : 's'} registered.
            </p>
          </Card>
        </Grid>

        <Grid item lg={8} sm={12} xs={12}>
          <Card title="Low Stock Items">
            {lowStockItems.length === 0 ? (
              <p className="uiMuted">
                Every inventory item is above its reorder threshold.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table reportsTable">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Quantity</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map(item => {
                      const level = stockLevel(item.quantity);

                      return (
                        <tr key={item.id}>
                          <td>
                            <span className="pageMainValue">{item.name || '—'}</span>
                            <span className="pageSubValue">{item.itemCode || ''}</span>
                          </td>
                          <td>{item.category || '—'}</td>
                          <td>{item.location || '—'}</td>
                          <td>{item.quantity === null || item.quantity === undefined
                            ? '—'
                            : item.quantity}
                          </td>
                          <td>
                            <Badge color={stockColor(level)}>{stockLabel(level)}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </Grid>

        <Grid item lg={8} sm={12} xs={12}>
          <Card title="Monthly Revenue">
            <BarRechart
              data={revenueMonths}
              series={REVENUE_SERIES}
              showLegend={false}
              showLabels
              animate={false}
              yTickFormatter={value => formatCompactCurrency(value)}
              labelFormatter={value => (value ? formatCompactCurrency(value).replace('Rp ', '') : '')}
              tooltipFormatter={value => formatCurrency(value)}
              maxBarSize={48}
            />
            <p className="dashboardHint">
              Room revenue (nights × rate) by arrival month, cancelled bookings excluded.
            </p>
          </Card>
        </Grid>

        <Grid item lg={4} sm={12} xs={12}>
          <Card title="Revenue Summary">
            <ul className="reportsStats reportsStats--money">
              <li>
                <span>Billed</span>
                <strong>{formatCurrency(revenue.billed)}</strong>
              </li>
              <li>
                <span>Collected</span>
                <strong>{formatCurrency(revenue.collected)}</strong>
              </li>
              <li>
                <span>Outstanding</span>
                <strong className={revenue.outstanding > 0 ? 'isDue' : ''}>
                  {formatCurrency(revenue.outstanding)}
                </strong>
              </li>
            </ul>
            <p className="dashboardHint">
              Collected + outstanding = billed. Update a booking&apos;s paid amount to
              record a payment.
            </p>
          </Card>
        </Grid>
      </Grid>
    </Fragment>
  );
};

export default Reports;

