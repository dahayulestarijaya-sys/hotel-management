import moment from 'moment';

import {
  bookingBalance,
  bookingNights,
  bookingPaid,
  bookingRoomType,
  bookingTotal,
  canCancel,
  canCheckIn,
  canCheckOut,
  createEmptyBookingForm,
  deserializeBooking,
  filterBookings,
  availableRoomsFor,
  formatBookingDate,
  formatBookingTime,
  formatGuestName,
  isRoomAvailable,
  paymentStatus,
  paymentStatusColor,
  paymentStatusLabel,
  rangesOverlap,
  roomStatusForBooking,
  serializeBooking,
  sortBookings,
  stayNights,
  stayTotal,
  statusColor,
  statusLabel,
  validateBooking,
} from '../bookings';

const validForm = () => ({
  ...createEmptyBookingForm(),
  bkId: '  BK-100  ',
  fname: 'Ada',
  lname: 'Lovelace',
  email: '  Ada@Example.com ',
  phone: '+44 20 7946 0958',
  guestno: '2',
  gender: 'female',
  roomType: 'double',
  statusValue: 'confirmed',
  arrivalDate: moment('2026-05-01', 'YYYY-MM-DD'),
  arrivalTime: moment('14:30', 'HH:mm'),
  departureDate: moment('2026-05-03', 'YYYY-MM-DD'),
  departureTime: moment('11:00', 'HH:mm'),
});

describe('validateBooking', () => {
  it('accepts a complete booking', () => {
    expect(validateBooking(validForm())).toEqual({});
  });

  it('reports the required fields of an empty form', () => {
    const errors = validateBooking(createEmptyBookingForm());

    expect(errors.bkId).toBeDefined();
    expect(errors.fname).toBeDefined();
    expect(errors.lname).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.phone).toBeDefined();
    expect(errors.guestno).toBeDefined();
    expect(errors.gender).toBeDefined();
    expect(errors.roomType).toBeDefined();
  });

  it('rejects malformed email addresses and phone numbers', () => {
    const errors = validateBooking({
      ...validForm(),
      email: 'not-an-email',
      phone: 'abc',
    });

    expect(errors.email).toMatch(/valid email/i);
    expect(errors.phone).toMatch(/valid phone/i);
  });

  it('requires at least one guest', () => {
    expect(validateBooking({ ...validForm(), guestno: '' }).guestno).toBeDefined();
    expect(validateBooking({ ...validForm(), guestno: '0' }).guestno).toBeDefined();
    expect(validateBooking({ ...validForm(), guestno: '1.5' }).guestno).toBeDefined();
    expect(validateBooking({ ...validForm(), guestno: '1' }).guestno).toBeUndefined();
  });

  it('rejects a departure date before the arrival date', () => {
    const errors = validateBooking({
      ...validForm(),
      departureDate: moment('2026-04-30', 'YYYY-MM-DD'),
    });

    expect(errors.departureDate).toMatch(/departure/i);
  });
});

describe('serializeBooking', () => {
  it('trims text, lowercases the email and formats dates/times', () => {
    expect(serializeBooking(validForm())).toEqual({
      bkId: 'BK-100',
      fname: 'Ada',
      lname: 'Lovelace',
      email: 'ada@example.com',
      phone: '+44 20 7946 0958',
      guestno: 2,
      selectedValue: 'female',
      roomType: 'double',
      statusValue: 'confirmed',
      roomId: '',
      roomNumber: '',
      rate: null,
      paid: 0,
      arrivalDate: '2026-05-01',
      arrivalTime: '14:30',
      departureDate: '2026-05-03',
      departureTime: '11:00',
    });
  });

  it('stores null for an empty guest count', () => {
    expect(serializeBooking({ ...validForm(), guestno: '' }).guestno).toBeNull();
  });

  it('keeps the assigned room, rate and payment', () => {
    const payload = serializeBooking({
      ...validForm(),
      roomId: 'room-1',
      roomNumber: ' 101 ',
      rate: '450000',
      paid: '150000',
    });

    expect(payload.roomId).toBe('room-1');
    expect(payload.roomNumber).toBe('101');
    expect(payload.rate).toBe(450000);
    expect(payload.paid).toBe(150000);
  });

  it('defaults an empty payment to zero', () => {
    expect(serializeBooking({ ...validForm(), paid: '' }).paid).toBe(0);
  });
});

describe('deserializeBooking', () => {
  it('maps a stored document back into form state', () => {
    const form = deserializeBooking({
      bkId: 'BK-100',
      fname: 'Ada',
      lname: 'Lovelace',
      email: 'ada@example.com',
      phone: '+44 20 7946 0958',
      guestno: 2,
      selectedValue: 'female',
      roomType: 'double',
      statusValue: 'arrived',
      arrivalDate: '2026-05-01',
      arrivalTime: '14:30',
      departureDate: '2026-05-03',
      departureTime: '11:00',
    });

    expect(form.bkId).toBe('BK-100');
    expect(form.guestno).toBe('2');
    expect(form.gender).toBe('female');
    expect(form.roomType).toBe('double');
    expect(form.statusValue).toBe('arrived');
    expect(moment(form.arrivalDate).format('YYYY-MM-DD')).toBe('2026-05-01');
    expect(moment(form.arrivalTime).format('HH:mm')).toBe('14:30');
  });

  it('keeps legacy documents (values.room, no dates) working', () => {
    const form = deserializeBooking({
      bkId: 'OLD-1',
      selectedValue: 'male',
      statusValue: 'pending',
      values: { room: 'king' },
    });

    expect(form.roomType).toBe('king');
    expect(form.statusValue).toBe('pending');
    expect(form.guestno).toBe('');
    expect(moment.isMoment(form.arrivalDate)).toBe(true);
  });

  it('falls back to safe defaults for missing fields', () => {
    const form = deserializeBooking();

    expect(form.bkId).toBe('');
    expect(form.gender).toBe('');
    expect(form.statusValue).toBe('confirmed');
  });
});

describe('formatting helpers', () => {
  it('formats dates and times for the table', () => {
    expect(formatBookingDate('2026-05-01')).toBe('01 May 2026');
    expect(formatBookingTime('14:30')).toBe('02:30 PM');
    expect(formatBookingDate('')).toBe('—');
    expect(formatBookingTime(undefined)).toBe('—');
  });

  it('formats guest names', () => {
    expect(formatGuestName({ fname: 'Ada', lname: 'Lovelace' })).toBe('Ada Lovelace');
    expect(formatGuestName({})).toBe('—');
  });

  it('reads the room type from new and legacy documents', () => {
    expect(bookingRoomType({ roomType: 'king' })).toBe('king');
    expect(bookingRoomType({ values: { room: 'double' } })).toBe('double');
    expect(bookingRoomType({})).toBe('');
  });

  it('maps statuses to labels and badge colours', () => {
    expect(statusLabel('arrived')).toBe('Arrived');
    expect(statusLabel('')).toBe('Unknown');
    expect(statusColor('arrived')).toBe('success');
    expect(statusColor('pending')).toBe('warning');
    expect(statusColor('departed')).toBe('secondary');
    expect(statusColor('confirmed')).toBe('info');
    expect(statusColor('whatever')).toBe('info');
  });
});

describe('filterBookings', () => {
  const bookings = [
    { id: '1', bkId: 'BK-100', fname: 'Ada', lname: 'Lovelace', email: 'ada@example.com' },
    { id: '2', bkId: 'BK-200', fname: 'Alan', lname: 'Turing', email: 'alan@example.com' },
  ];

  it('returns every booking for an empty term', () => {
    expect(filterBookings(bookings, '   ')).toHaveLength(2);
  });

  it('matches booking id, guest name and email, ignoring case', () => {
    expect(filterBookings(bookings, 'bk-200').map(b => b.id)).toEqual(['2']);
    expect(filterBookings(bookings, 'lovelace').map(b => b.id)).toEqual(['1']);
    expect(filterBookings(bookings, 'ALAN@').map(b => b.id)).toEqual(['2']);
    expect(filterBookings(bookings, 'nobody')).toHaveLength(0);
  });
});

describe('sortBookings', () => {
  it('puts the newest booking first', () => {
    const sorted = sortBookings([
      { id: 'old', createdAt: { seconds: 100 } },
      { id: 'new', createdAt: { seconds: 300 } },
      { id: 'mid', createdAt: { seconds: 200 } },
    ]);

    expect(sorted.map(b => b.id)).toEqual(['new', 'mid', 'old']);
  });

  it('falls back to the arrival date for legacy documents', () => {
    const sorted = sortBookings([
      { id: 'a', arrivalDate: '2026-05-01' },
      { id: 'b', arrivalDate: '2026-06-01' },
    ]);

    expect(sorted.map(b => b.id)).toEqual(['b', 'a']);
  });
});

describe('stay and folio helpers', () => {
  const stay = {
    rate: 500000,
    paid: 200000,
    arrivalDate: '2026-05-01',
    departureDate: '2026-05-04',
  };

  it('counts the nights of a stay', () => {
    expect(stayNights('2026-05-01', '2026-05-04')).toBe(3);
    expect(stayNights('2026-05-01', '2026-05-01')).toBe(1);
    expect(stayNights('2026-05-04', '2026-05-01')).toBe(0);
    expect(stayNights('', '')).toBe(0);
    expect(stayNights(moment('2026-05-01'), moment('2026-05-03'))).toBe(2);
  });

  it('computes the stay total from the nightly rate', () => {
    expect(stayTotal(500000, '2026-05-01', '2026-05-04')).toBe(1500000);
    expect(stayTotal('250000', '2026-05-01', '2026-05-03')).toBe(500000);
    expect(stayTotal('', '2026-05-01', '2026-05-03')).toBe(0);
    expect(stayTotal('abc', '2026-05-01', '2026-05-03')).toBe(0);
  });

  it('computes total, paid and balance of a booking', () => {
    expect(bookingNights(stay)).toBe(3);
    expect(bookingTotal(stay)).toBe(1500000);
    expect(bookingPaid(stay)).toBe(200000);
    expect(bookingBalance(stay)).toBe(1300000);
    expect(bookingTotal({})).toBe(0);
    expect(bookingPaid({})).toBe(0);
    expect(
      bookingBalance({
        rate: 100000,
        paid: 400000,
        arrivalDate: '2026-05-01',
        departureDate: '2026-05-02',
      }),
    ).toBe(0);
  });

  it('derives the payment state', () => {
    expect(paymentStatus({ ...stay, paid: 0 })).toBe('unpaid');
    expect(paymentStatus(stay)).toBe('partial');
    expect(paymentStatus({ ...stay, paid: 1500000 })).toBe('paid');
    expect(
      paymentStatus({ arrivalDate: '2026-05-01', departureDate: '2026-05-03' }),
    ).toBe('unbilled');
    expect(paymentStatus({ ...stay, statusValue: 'cancelled' })).toBe('void');
  });

  it('labels and colours the payment states', () => {
    expect(paymentStatusLabel('partial')).toBe('Partial');
    expect(paymentStatusLabel('unknown')).toBe('Not billed');
    expect(paymentStatusColor('paid')).toBe('success');
    expect(paymentStatusColor('unpaid')).toBe('danger');
    expect(paymentStatusColor('partial')).toBe('warning');
    expect(paymentStatusColor('void')).toBe('secondary');
  });
});


describe('room availability', () => {
  const bookings = [
    { id: 'b1', roomId: 'r1', statusValue: 'confirmed', arrivalDate: '2026-05-02', departureDate: '2026-05-05' },
    { id: 'b2', roomId: 'r2', statusValue: 'departed', arrivalDate: '2026-05-01', departureDate: '2026-05-04' },
    { id: 'b3', roomId: 'r3', statusValue: 'cancelled', arrivalDate: '2026-05-01', departureDate: '2026-05-04' },
    { id: 'b4', roomId: 'r4', statusValue: 'arrived', arrivalDate: '2026-05-01', departureDate: '2026-05-03' },
  ];

  const rooms = [
    { id: 'r1', roomNumber: '101', roomType: 'double', status: 'available' },
    { id: 'r2', roomNumber: '102', roomType: 'double', status: 'available' },
    { id: 'r3', roomNumber: '103', roomType: 'single', status: 'available' },
    { id: 'r4', roomNumber: '201', roomType: 'king', status: 'available' },
    { id: 'r5', roomNumber: '202', roomType: 'double', status: 'maintenance' },
  ];

  it('detects overlapping date ranges', () => {
    expect(rangesOverlap('2026-05-01', '2026-05-03', '2026-05-02', '2026-05-04')).toBe(true);
    expect(rangesOverlap('2026-05-01', '2026-05-03', '2026-05-03', '2026-05-05')).toBe(false);
    expect(rangesOverlap('', '', '2026-05-03', '2026-05-05')).toBe(false);
  });

  it('blocks an assigned room while a booking holds it', () => {
    expect(
      isRoomAvailable(bookings, {
        roomId: 'r1',
        arrivalDate: '2026-05-04',
        departureDate: '2026-05-06',
      }),
    ).toBe(false);
    expect(
      isRoomAvailable(bookings, {
        roomId: 'r1',
        arrivalDate: '2026-05-05',
        departureDate: '2026-05-07',
      }),
    ).toBe(true);
  });

  it('ignores departed, cancelled and the booking being edited', () => {
    expect(
      isRoomAvailable(bookings, {
        roomId: 'r2',
        arrivalDate: '2026-05-02',
        departureDate: '2026-05-03',
      }),
    ).toBe(true);
    expect(
      isRoomAvailable(bookings, {
        roomId: 'r3',
        arrivalDate: '2026-05-02',
        departureDate: '2026-05-03',
      }),
    ).toBe(true);
    expect(
      isRoomAvailable(bookings, {
        roomId: 'r1',
        arrivalDate: '2026-05-02',
        departureDate: '2026-05-05',
        ignoreId: 'b1',
      }),
    ).toBe(true);
  });

  it('lists assignable rooms sorted by number', () => {
    const options = availableRoomsFor(rooms, bookings, {
      arrivalDate: '2026-05-02',
      departureDate: '2026-05-04',
    });

    expect(options.map(room => room.roomNumber)).toEqual(['102', '103']);
  });

  it('filters by room type', () => {
    const options = availableRoomsFor(rooms, bookings, {
      arrivalDate: '2026-06-01',
      departureDate: '2026-06-03',
      roomType: 'double',
    });

    expect(options.map(room => room.id)).toEqual(['r1', 'r2']);
  });
});

describe('front-desk workflow', () => {
  it('only allows check-in for confirmed bookings with a room', () => {
    expect(canCheckIn({ statusValue: 'confirmed', roomId: 'r1' })).toBe(true);
    expect(canCheckIn({ statusValue: 'pending', roomId: 'r1' })).toBe(true);
    expect(canCheckIn({ statusValue: 'confirmed' })).toBe(false);
    expect(canCheckIn({ statusValue: 'arrived', roomId: 'r1' })).toBe(false);
    expect(canCheckIn({ statusValue: 'departed', roomId: 'r1' })).toBe(false);
  });

  it('only allows check-out for arrived bookings', () => {
    expect(canCheckOut({ statusValue: 'arrived' })).toBe(true);
    expect(canCheckOut({ statusValue: 'confirmed' })).toBe(false);
  });

  it('does not cancel departed or cancelled bookings', () => {
    expect(canCancel({ statusValue: 'confirmed' })).toBe(true);
    expect(canCancel({ statusValue: 'arrived' })).toBe(true);
    expect(canCancel({ statusValue: 'departed' })).toBe(false);
    expect(canCancel({ statusValue: 'cancelled' })).toBe(false);
  });

  it('maps booking statuses to room statuses', () => {
    expect(roomStatusForBooking('arrived')).toBe('occupied');
    expect(roomStatusForBooking('departed')).toBe('available');
    expect(roomStatusForBooking('cancelled')).toBe('available');
    expect(roomStatusForBooking('confirmed')).toBeNull();
  });
});

describe('booking validation of money and rooms', () => {
  it('rejects negative rates and payments', () => {
    expect(validateBooking({ ...validForm(), rate: '-1' }).rate).toBeDefined();
    expect(validateBooking({ ...validForm(), paid: '-5' }).paid).toBeDefined();
    expect(validateBooking({ ...validForm(), rate: '500000', paid: '500000' })).toEqual({});
  });

  it('rejects a payment above the stay total', () => {
    const errors = validateBooking({
      ...validForm(),
      rate: '100000',
      paid: '500000',
    });

    expect(errors.paid).toMatch(/exceed/i);
  });

  it('requires a room to mark a booking as arrived', () => {
    expect(validateBooking({ ...validForm(), statusValue: 'arrived' }).roomId).toBeDefined();
    expect(
      validateBooking({ ...validForm(), statusValue: 'arrived', roomId: 'r1' }).roomId,
    ).toBeUndefined();
  });
});

