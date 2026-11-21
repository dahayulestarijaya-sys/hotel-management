/**
 * Dashboard helpers.
 *
 * Pure functions that turn the booking documents stored in Firestore into the
 * numbers shown on the dashboard. Keeping them out of the component makes them
 * easy to unit test (see utils/tests/dashboard.test.js).
 */
import moment from 'moment';

import { DATE_FORMAT, STATUS_OPTIONS, bookingBalance, bookingPaid, bookingTotal } from './bookings';

const STATUS_COLORS = {
  confirmed: '#2F5BEA',
  arrived: '#1F9D6B',
  departed: '#8A93A8',
  pending: '#D99425',
  cancelled: '#D14343',
};

const asMoment = value => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return moment(value.toDate());
  if (typeof value.seconds === 'number') return moment(value.seconds * 1000);

  const parsed = moment(value, DATE_FORMAT);
  if (parsed.isValid()) return parsed;

  const fallback = moment(value);
  return fallback.isValid() ? fallback : null;
};

export const calculatePercentage = (part, total) =>
  (total > 0 ? Math.round((part / total) * 100) : 0);

export const calculateBookingMetrics = (bookings = [], now = moment()) => {
  const today = now.clone().startOf('day');
  const isToday = value => {
    const date = asMoment(value);
    return Boolean(date && date.isSame(today, 'day'));
  };

  const arrivalsToday = bookings.filter(booking => isToday(booking.arrivalDate));
  const departuresToday = bookings.filter(booking => isToday(booking.departureDate));

  const statusCount = status =>
    bookings.filter(booking => booking.statusValue === status).length;

  return {
    totalBookings: bookings.length,
    totalGuests: bookings.reduce(
      (sum, booking) => sum + (Number(booking.guestno) || 0),
      0,
    ),
    arrivalsToday: arrivalsToday.length,
    arrivalsTodayArrived: arrivalsToday.filter(
      booking => booking.statusValue === 'arrived',
    ).length,
    departuresToday: departuresToday.length,
    departuresTodayDeparted: departuresToday.filter(
      booking => booking.statusValue === 'departed',
    ).length,
    pendingBookings: statusCount('pending'),
    confirmedBookings: statusCount('confirmed'),
    arrivedBookings: statusCount('arrived'),
    departedBookings: statusCount('departed'),
    cancelledBookings: statusCount('cancelled'),
  };
};

/**
 * Folio totals across the (non-cancelled) bookings:
 * `billed` = room revenue, `collected` = payments received,
 * `outstanding` = what guests still owe.
 */
export const calculateRevenueMetrics = (bookings = []) => {
  const billable = bookings.filter(booking => booking.statusValue !== 'cancelled');

  return billable.reduce(
    (totals, booking) => ({
      billed: totals.billed + bookingTotal(booking),
      collected: totals.collected + bookingPaid(booking),
      outstanding: totals.outstanding + bookingBalance(booking),
    }),
    { billed: 0, collected: 0, outstanding: 0 },
  );
};

/** Donut data: one slice per status that actually has bookings. */
export const bookingStatusDistribution = (bookings = []) =>
  STATUS_OPTIONS.map(option => ({
    name: option.label,
    value: bookings.filter(booking => booking.statusValue === option.value).length,
    color: STATUS_COLORS[option.value],
  })).filter(item => item.value > 0);

const bookingMonth = booking => {
  if (booking.arrivalDate) {
    const arrival = moment(booking.arrivalDate, DATE_FORMAT);
    if (arrival.isValid()) return arrival;
  }

  return asMoment(booking.createdAt);
};

/**
 * How many months the growth chart should show: from the month of the earliest
 * booking up to the current month, clamped to `min`–`max` so the chart is never
 * cramped and never padded with years of empty columns.
 */
export const bookingGrowthMonths = (
  bookings = [],
  { min = 6, max = 12, now = moment() } = {},
) => {
  const months = bookings
    .map(bookingMonth)
    .filter(date => date && !date.isAfter(now, 'month'));

  if (months.length === 0) return min;

  const earliest = months.reduce((oldest, date) => (date.isBefore(oldest) ? date : oldest));
  const span = now.clone().startOf('month').diff(earliest.clone().startOf('month'), 'months') + 1;

  return Math.min(max, Math.max(min, span));
};

/**
 * Bookings/guests per month for the last `months` months (oldest first).
 * The booking month is taken from the arrival date, falling back to createdAt
 * for documents that do not have dates yet.
 */
export const bookingGrowthByMonth = (bookings = [], months = 8, now = moment()) => {
  const buckets = [];
  const start = now
    .clone()
    .startOf('month')
    .subtract(months - 1, 'months');

  for (let index = 0; index < months; index += 1) {
    const month = start.clone().add(index, 'months');
    buckets.push({
      key: month.format('YYYY-MM'),
      name: month.format('MMM'),
      bookings: 0,
      guests: 0,
    });
  }

  const byKey = buckets.reduce(
    (acc, bucket) => ({ ...acc, [bucket.key]: bucket }),
    {},
  );

  bookings.forEach(booking => {
    const date = bookingMonth(booking);
    if (!date) return;

    const bucket = byKey[date.format('YYYY-MM')];
    if (!bucket) return;

    bucket.bookings += 1;
    bucket.guests += Number(booking.guestno) || 0;
  });

  return buckets;
};

/**
 * Room revenue per month (arrival month), ignoring cancelled bookings.
 * Returns the same `{ key, name }` buckets as the booking growth chart so both
 * charts share an x axis.
 */
export const bookingRevenueByMonth = (bookings = [], months = 8, now = moment()) => {
  const buckets = bookingGrowthByMonth(bookings, months, now).map(bucket => ({
    key: bucket.key,
    name: bucket.name,
    revenue: 0,
  }));

  const byKey = buckets.reduce((acc, bucket) => ({ ...acc, [bucket.key]: bucket }), {});

  bookings
    .filter(booking => booking.statusValue !== 'cancelled')
    .forEach(booking => {
      const date = bookingMonth(booking);
      if (!date) return;

      const bucket = byKey[date.format('YYYY-MM')];
      if (bucket) bucket.revenue += bookingTotal(booking);
    });

  return buckets;
};

