import moment from 'moment';

import {
  bookingGrowthByMonth,
  bookingGrowthMonths,
  bookingRevenueByMonth,
  bookingStatusDistribution,
  calculateBookingMetrics,
  calculatePercentage,
  calculateRevenueMetrics,
} from '../dashboard';

const now = moment('2026-05-15', 'YYYY-MM-DD');

const bookings = [
  { id: '1', guestno: 2, statusValue: 'arrived', arrivalDate: '2026-05-15', departureDate: '2026-05-18' },
  { id: '2', guestno: 1, statusValue: 'confirmed', arrivalDate: '2026-05-15', departureDate: '2026-05-16' },
  { id: '3', guestno: 3, statusValue: 'departed', arrivalDate: '2026-05-10', departureDate: '2026-05-15' },
  { id: '4', guestno: 2, statusValue: 'pending', arrivalDate: '2026-04-02', departureDate: '2026-04-04' },
];

describe('calculatePercentage', () => {
  it('guards against a zero total', () => {
    expect(calculatePercentage(0, 0)).toBe(0);
    expect(calculatePercentage(3, 0)).toBe(0);
  });

  it('rounds to a whole percentage', () => {
    expect(calculatePercentage(1, 4)).toBe(25);
    expect(calculatePercentage(2, 3)).toBe(67);
    expect(calculatePercentage(3, 3)).toBe(100);
  });
});

describe('calculateBookingMetrics', () => {
  it('counts bookings, guests and statuses', () => {
    expect(calculateBookingMetrics(bookings, now)).toEqual({
      totalBookings: 4,
      totalGuests: 8,
      arrivalsToday: 2,
      arrivalsTodayArrived: 1,
      departuresToday: 1,
      departuresTodayDeparted: 1,
      pendingBookings: 1,
      confirmedBookings: 1,
      arrivedBookings: 1,
      departedBookings: 1,
      cancelledBookings: 0,
    });
  });

  it('handles an empty collection', () => {
    expect(calculateBookingMetrics([], now)).toEqual({
      totalBookings: 0,
      totalGuests: 0,
      arrivalsToday: 0,
      arrivalsTodayArrived: 0,
      departuresToday: 0,
      departuresTodayDeparted: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      arrivedBookings: 0,
      departedBookings: 0,
      cancelledBookings: 0,
    });
  });

  it('ignores bookings without a valid arrival/departure date', () => {
    const metrics = calculateBookingMetrics(
      [{ id: 'x', guestno: 1, statusValue: 'pending', arrivalDate: '', departureDate: undefined }],
      now,
    );

    expect(metrics.arrivalsToday).toBe(0);
    expect(metrics.departuresToday).toBe(0);
    expect(metrics.totalBookings).toBe(1);
  });
});

describe('bookingStatusDistribution', () => {
  it('returns one slice per status that has bookings', () => {
    const data = bookingStatusDistribution(bookings);

    expect(data).toEqual([
      { name: 'Confirmed', value: 1, color: '#2F5BEA' },
      { name: 'Arrived', value: 1, color: '#1F9D6B' },
      { name: 'Departed', value: 1, color: '#8A93A8' },
      { name: 'Pending', value: 1, color: '#D99425' },
    ]);
  });

  it('omits statuses without bookings', () => {
    const data = bookingStatusDistribution([bookings[1]]);

    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ name: 'Confirmed', value: 1 });
  });

  it('returns an empty list for an empty collection', () => {
    expect(bookingStatusDistribution([])).toEqual([]);
  });
});

describe('bookingGrowthByMonth', () => {
  it('builds a bucket per month ending with the current month', () => {
    const growth = bookingGrowthByMonth(bookings, 3, now);

    expect(growth.map(month => month.name)).toEqual(['Mar', 'Apr', 'May']);
    expect(growth).toEqual([
      { key: '2026-03', name: 'Mar', bookings: 0, guests: 0 },
      { key: '2026-04', name: 'Apr', bookings: 1, guests: 2 },
      { key: '2026-05', name: 'May', bookings: 3, guests: 6 },
    ]);
  });

  it('falls back to createdAt for legacy bookings without dates', () => {
    const growth = bookingGrowthByMonth(
      [
        {
          id: 'legacy',
          guestno: 4,
          statusValue: 'pending',
          createdAt: { toDate: () => new Date(2026, 4, 3) },
        },
      ],
      3,
      now,
    );

    expect(growth[2]).toMatchObject({ name: 'May', bookings: 1, guests: 4 });
  });

  it('ignores bookings outside the requested window', () => {
    const growth = bookingGrowthByMonth(
      [{ id: 'old', guestno: 9, arrivalDate: '2024-01-10' }],
      3,
      now,
    );

    expect(growth.reduce((sum, month) => sum + month.bookings, 0)).toBe(0);
  });
});

describe('bookingGrowthMonths', () => {
  it('falls back to the minimum range without bookings', () => {
    expect(bookingGrowthMonths([], { now })).toBe(6);
  });

  it('keeps the minimum range for recent bookings', () => {
    const recent = [
      { arrivalDate: '2026-05-10' },
      { arrivalDate: '2026-04-02' },
    ];

    expect(bookingGrowthMonths(recent, { now })).toBe(6);
  });

  it('grows with the oldest booking', () => {
    const bookings = [
      { arrivalDate: '2026-05-10' },
      { arrivalDate: '2025-09-14' },
    ];

    // Sep 2025 -> May 2026 = 9 months
    expect(bookingGrowthMonths(bookings, { now })).toBe(9);
  });

  it('caps the range at twelve months', () => {
    expect(bookingGrowthMonths([{ arrivalDate: '2023-01-10' }], { now })).toBe(12);
  });

  it('ignores future bookings and honours custom bounds', () => {
    const future = [{ arrivalDate: '2026-09-01' }];

    expect(bookingGrowthMonths(future, { now })).toBe(6);
    expect(bookingGrowthMonths(future, { now, min: 3 })).toBe(3);
    expect(bookingGrowthMonths([{ arrivalDate: '2025-01-01' }], { now, max: 10 })).toBe(10);
  });

  it('understands createdAt for legacy bookings', () => {
    const legacy = [{ createdAt: { toDate: () => new Date(2025, 7, 15) } }];

    expect(bookingGrowthMonths(legacy, { now })).toBe(10);
  });
});


describe('calculateRevenueMetrics', () => {
  const folios = [
    { id: '1', statusValue: 'arrived', rate: 500000, paid: 500000, arrivalDate: '2026-05-15', departureDate: '2026-05-17' },
    { id: '2', statusValue: 'confirmed', rate: 300000, paid: 0, arrivalDate: '2026-05-15', departureDate: '2026-05-16' },
    { id: '3', statusValue: 'departed', rate: 250000, paid: 100000, arrivalDate: '2026-05-10', departureDate: '2026-05-13' },
    { id: '4', statusValue: 'cancelled', rate: 900000, paid: 0, arrivalDate: '2026-05-10', departureDate: '2026-05-12' },
  ];

  it('sums billed, collected and outstanding amounts', () => {
    expect(calculateRevenueMetrics(folios)).toEqual({
      billed: 1000000 + 300000 + 750000,
      collected: 600000,
      outstanding: 500000 + 300000 + 650000,
    });
  });

  it('ignores cancelled bookings and empty collections', () => {
    expect(calculateRevenueMetrics([folios[3]])).toEqual({
      billed: 0,
      collected: 0,
      outstanding: 0,
    });
    expect(calculateRevenueMetrics([])).toEqual({
      billed: 0,
      collected: 0,
      outstanding: 0,
    });
  });
});

describe('bookingRevenueByMonth', () => {
  it('buckets room revenue per arrival month', () => {
    const months = bookingRevenueByMonth(
      [
        { id: '1', statusValue: 'arrived', rate: 500000, paid: 0, arrivalDate: '2026-05-15', departureDate: '2026-05-17' },
        { id: '2', statusValue: 'confirmed', rate: 300000, paid: 0, arrivalDate: '2026-04-02', departureDate: '2026-04-04' },
        { id: '3', statusValue: 'cancelled', rate: 900000, paid: 0, arrivalDate: '2026-04-02', departureDate: '2026-04-05' },
      ],
      2,
      now,
    );

    expect(months).toEqual([
      { key: '2026-04', name: 'Apr', revenue: 600000 },
      { key: '2026-05', name: 'May', revenue: 1000000 },
    ]);
  });

  it('returns zeroed buckets without bookings', () => {
    expect(bookingRevenueByMonth([], 2, now)).toEqual([
      { key: '2026-04', name: 'Apr', revenue: 0 },
      { key: '2026-05', name: 'May', revenue: 0 },
    ]);
  });
});

