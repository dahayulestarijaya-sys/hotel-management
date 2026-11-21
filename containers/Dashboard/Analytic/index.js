import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { compose } from 'redux';
import { Grid } from '@material-ui/core';
import {
  Building2,
  CalendarCheck2,
  LogIn,
  LogOut,
  Sparkles,
  Users,
} from 'lucide-react';
import moment from 'moment';

import Card from 'components/Card';
import AnalyticFeatured from 'components/Dashboard/Analytic/Featured';
import BookingStatus from 'components/Dashboard/Analytic/BookingStatus';
import ReactCircleSlider from 'components/Dashboard/Analytic/ReactCircleSlider';
import BarRechart from 'components/Chart/ReChart/components/bar';
import LineRechart from 'components/Chart/ReChart/components/line';
import { db } from 'utils/firebase';
import { BOOKINGS_COLLECTION } from 'utils/bookings';
import {
  bookingGrowthByMonth,
  bookingGrowthMonths,
  bookingStatusDistribution,
  calculateBookingMetrics,
  calculatePercentage,
} from 'utils/dashboard';

import './style.scss';

const BOOKINGS_SERIES = [
  { key: 'bookings', name: 'Bookings', color: '#1B2A5F' },
];

export const DashboardAnalytic = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    // Live dashboard: every booking change updates the counters and charts.
    const unsubscribe = db.collection(BOOKINGS_COLLECTION).onSnapshot(
      snapshot => {
        setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadError('');
        setLoading(false);
      },
      error => {
        // Usually a Firestore rules problem or a database that was never created.
        console.error('Could not load dashboard data:', error);
        setLoadError(error.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const metrics = useMemo(() => calculateBookingMetrics(bookings), [bookings]);
  // Range grows with the data (6–12 months) so the chart never shows years of
  // empty columns or cramps a single bar.
  const growthMonths = useMemo(() => bookingGrowthMonths(bookings), [bookings]);
  const growth = useMemo(
    () => bookingGrowthByMonth(bookings, growthMonths),
    [bookings, growthMonths],
  );
  const statusData = useMemo(() => bookingStatusDistribution(bookings), [bookings]);

  const display = value => (loading ? '—' : value);

  const hour = moment().hour();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const kpis = [
    {
      key: 'bookings',
      name: 'Total Booking',
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
      key: 'arrivals',
      name: 'CheckIn Today',
      value: display(metrics.arrivalsToday),
      icon: LogIn,
      tone: 'arrivals',
      hint: `${display(metrics.arrivalsTodayArrived)} arrived`,
    },
    {
      key: 'departures',
      name: 'CheckOut Today',
      value: display(metrics.departuresToday),
      icon: LogOut,
      tone: 'departures',
      hint: `${display(metrics.departuresTodayDeparted)} departed`,
    },
  ];

  const checkInPercentage = calculatePercentage(
    metrics.arrivalsTodayArrived,
    metrics.arrivalsToday,
  );
  const checkOutPercentage = calculatePercentage(
    metrics.departuresTodayDeparted,
    metrics.departuresToday,
  );

  return (
    <Fragment>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>

      {loadError && (
        <Grid className="dashboardError">
          Could not load bookings: {loadError}
        </Grid>
      )}

      <section className="dashboardHero hqReveal">
        <span className="dashboardHero__orb dashboardHero__orb--one" aria-hidden="true" />
        <span className="dashboardHero__orb dashboardHero__orb--two" aria-hidden="true" />

        <div className="dashboardHero__content">
          <span className="dashboardHero__eyebrow">
            <Sparkles size={13} />
            Front desk overview · {moment().format('MMMM YYYY')}
          </span>
          <h2>
            {greeting}, <span>welcome back</span>
          </h2>
          <p>
            {loading
              ? 'Loading today’s arrivals and departures…'
              : `${metrics.arrivalsToday} arrival${metrics.arrivalsToday === 1 ? '' : 's'} and ${metrics.departuresToday} departure${metrics.departuresToday === 1 ? '' : 's'} are scheduled for today.`}
          </p>

          <div className="dashboardHero__chips">
            <span>
              <LogIn size={14} /> {display(metrics.arrivalsToday)} arrivals
            </span>
            <span>
              <LogOut size={14} /> {display(metrics.departuresToday)} departures
            </span>
            <span>
              <CalendarCheck2 size={14} /> {display(metrics.totalBookings)} bookings
            </span>
          </div>
        </div>

        <div className="dashboardHero__aside">
          <div className="dashboardHero__mark" aria-hidden="true">
            <Building2 size={30} />
          </div>
          <div className="dashboardHero__stats">
            <div>
              <span>Checked in</span>
              <strong>{display(`${checkInPercentage}%`)}</strong>
            </div>
            <div>
              <span>Checked out</span>
              <strong>{display(`${checkOutPercentage}%`)}</strong>
            </div>
          </div>
        </div>
      </section>

      <Grid container spacing={3}>
        <AnalyticFeatured items={kpis} />

        <Grid item lg={9} xs={12}>
          <Card title="Booking Growth">
            <BarRechart
              data={growth}
              series={BOOKINGS_SERIES}
              showLegend={false}
              showLabels
              animate={false}
            />
            <p className="dashboardHint">
              Bookings per month, grouped by arrival date. The range follows the
              oldest booking (6–12 months).
            </p>
          </Card>
        </Grid>

        <Grid item lg={3} xs={12}>
          <Card title="Booking Status">
            <BookingStatus
              data={statusData}
              total={loading ? '—' : metrics.totalBookings}
            />
          </Card>
        </Grid>

        <Grid item lg={3} xs={12}>
          <Grid container spacing={3}>
            <Grid item lg={12} sm={6} xs={12}>
              <Card title="CheckIn Progress">
                <ReactCircleSlider
                  percentage={checkInPercentage}
                  clicks={display(`${metrics.arrivalsTodayArrived} / ${metrics.arrivalsToday}`)}
                  label="arrived today"
                  progressColor="#2F5BEA"
                  circleColor="#E9EFFF"
                />
              </Card>
            </Grid>
            <Grid item lg={12} sm={6} xs={12}>
              <Card title="CheckOut Progress">
                <ReactCircleSlider
                  percentage={checkOutPercentage}
                  clicks={display(`${metrics.departuresTodayDeparted} / ${metrics.departuresToday}`)}
                  label="departed today"
                  progressColor="#12A594"
                  circleColor="#E5F7F3"
                />
              </Card>
            </Grid>
          </Grid>
        </Grid>

        <Grid item lg={9} xs={12}>
          <Card title="Guests per Month">
            <LineRechart data={growth} dataKey="guests" valuePrefix="" showDots animate={false} />
            <p className="dashboardHint">
              Number of guests arriving each month.
            </p>
          </Card>
        </Grid>
      </Grid>
    </Fragment>
  );
};

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

const withConnect = connect(null, mapDispatchToProps);

export default compose(withConnect)(DashboardAnalytic);
