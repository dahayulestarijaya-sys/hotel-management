/**
 * Booking domain helpers.
 *
 * The booking feature stores one document per booking in the Firestore
 * collection below. These helpers keep the form state (TextFields + date/time
 * pickers), the Firestore document shape and the table rendering in sync.
 *
 * Firestore document shape (collection `AddBooking`):
 *   {
 *     bkId, fname, lname, email, phone,
 *     guestno, selectedValue (gender), roomType, statusValue,
 *     arrivalDate ('YYYY-MM-DD'), arrivalTime ('HH:mm'),
 *     departureDate ('YYYY-MM-DD'), departureTime ('HH:mm'),
 *     createdAt, updatedAt (server timestamps)
 *   }
 */
import moment from 'moment';

export const BOOKINGS_COLLECTION = 'AddBooking';

export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'HH:mm';

export const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'others', label: 'Others' },
];

export const ROOM_TYPE_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'quad', label: 'Quad' },
  { value: 'king', label: 'King' },
  { value: 'queen', label: 'Queen' },
];

export const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'departed', label: 'Departed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Empty form state used by the "add booking" screen. Dates/times are moment
 * objects because that is what @material-ui/pickers expects.
 *
 * `roomId` links the booking to a physical room (`Rooms` doc); `rate` is the
 * agreed nightly rate and `paid` the amount received so far.
 */
export const createEmptyBookingForm = () => ({
  bkId: '',
  fname: '',
  lname: '',
  email: '',
  phone: '',
  guestno: '',
  gender: '',
  roomType: '',
  statusValue: 'confirmed',
  roomId: '',
  roomNumber: '',
  rate: '',
  paid: '',
  arrivalDate: moment(),
  arrivalTime: moment(),
  departureDate: moment().add(1, 'day'),
  departureTime: moment(),
});

const trim = value => (typeof value === 'string' ? value.trim() : value);

const asMoment = (value, format) => {
  if (!value) return null;
  const parsed = format ? moment(value, format) : moment(value);
  return parsed.isValid() ? parsed : null;
};

/** Form state -> Firestore payload. */
export const serializeBooking = form => ({
  bkId: trim(form.bkId),
  fname: trim(form.fname),
  lname: trim(form.lname),
  email: trim(form.email).toLowerCase(),
  phone: trim(form.phone),
  guestno: form.guestno === '' || form.guestno === null || form.guestno === undefined
    ? null
    : Number(form.guestno),
  selectedValue: form.gender,
  roomType: form.roomType,
  statusValue: form.statusValue,
  roomId: form.roomId || '',
  roomNumber: trim(form.roomNumber) || '',
  rate: form.rate === '' || form.rate === null || form.rate === undefined
    ? null
    : Number(form.rate),
  paid: form.paid === '' || form.paid === null || form.paid === undefined
    ? 0
    : Number(form.paid),
  arrivalDate: form.arrivalDate ? moment(form.arrivalDate).format(DATE_FORMAT) : '',
  arrivalTime: form.arrivalTime ? moment(form.arrivalTime).format(TIME_FORMAT) : '',
  departureDate: form.departureDate ? moment(form.departureDate).format(DATE_FORMAT) : '',
  departureTime: form.departureTime ? moment(form.departureTime).format(TIME_FORMAT) : '',
});

/**
 * Firestore document -> form state.
 * Also understands the legacy documents that only stored `values.room` and had
 * no arrival/departure fields, so old bookings keep working.
 */
export const deserializeBooking = (data = {}) => ({
  bkId: data.bkId || '',
  fname: data.fname || '',
  lname: data.lname || '',
  email: data.email || '',
  phone: data.phone || '',
  guestno: data.guestno === null || data.guestno === undefined ? '' : String(data.guestno),
  gender: data.selectedValue || '',
  roomType: data.roomType || (data.values && data.values.room) || '',
  statusValue: data.statusValue || 'confirmed',
  roomId: data.roomId || '',
  roomNumber: data.roomNumber || '',
  rate: data.rate === null || data.rate === undefined ? '' : String(data.rate),
  paid: data.paid === null || data.paid === undefined ? '' : String(data.paid),
  arrivalDate: asMoment(data.arrivalDate, DATE_FORMAT) || moment(),
  arrivalTime: asMoment(data.arrivalTime, TIME_FORMAT) || moment(),
  departureDate: asMoment(data.departureDate, DATE_FORMAT) || moment().add(1, 'day'),
  departureTime: asMoment(data.departureTime, TIME_FORMAT) || moment(),
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+\d][\d\s()-]{5,}$/;

/** Returns `{ field: message }`; an empty object means the form is valid. */
export const validateBooking = form => {
  const errors = {};

  if (!String(form.bkId || '').trim()) errors.bkId = 'Booking ID is required';

  if (!String(form.fname || '').trim()) errors.fname = 'First name is required';
  if (!String(form.lname || '').trim()) errors.lname = 'Last name is required';

  const email = String(form.email || '').trim();
  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address';

  const phone = String(form.phone || '').trim();
  if (!phone) errors.phone = 'Phone number is required';
  else if (!PHONE_PATTERN.test(phone)) errors.phone = 'Enter a valid phone number';

  const guests = Number(form.guestno);
  if (form.guestno === '' || form.guestno === null || form.guestno === undefined) {
    errors.guestno = 'Number of guests is required';
  } else if (!Number.isInteger(guests) || guests < 1) {
    errors.guestno = 'Guests must be a whole number of at least 1';
  }

  if (!form.gender) errors.gender = 'Select a gender';
  if (!form.roomType) errors.roomType = 'Select a room type';
  if (!form.statusValue) errors.statusValue = 'Select a status';

  const rate = Number(form.rate);
  if (form.rate !== '' && form.rate !== null && form.rate !== undefined) {
    if (!Number.isFinite(rate) || rate < 0) errors.rate = 'Rate must be a positive amount';
  }

  const paid = Number(form.paid);
  if (form.paid !== '' && form.paid !== null && form.paid !== undefined) {
    if (!Number.isFinite(paid) || paid < 0) {
      errors.paid = 'Paid amount must be zero or more';
    } else if (rate > 0 && form.arrivalDate && form.departureDate) {
      const total = rate * stayNights(form.arrivalDate, form.departureDate);
      if (paid > total) errors.paid = 'Paid amount cannot exceed the stay total';
    }
  }

  if (form.statusValue === 'arrived' && !form.roomId) {
    errors.roomId = 'Assign a room before marking the booking as arrived';
  }

  if (!form.arrivalDate) errors.arrivalDate = 'Arrival date is required';
  if (!form.departureDate) errors.departureDate = 'Departure date is required';

  if (form.arrivalDate && form.departureDate) {
    const arrival = moment(form.arrivalDate).startOf('day');
    const departure = moment(form.departureDate).startOf('day');
    if (departure.isBefore(arrival)) {
      errors.departureDate = 'Departure must be on or after the arrival date';
    }
  }

  return errors;
};

export const formatBookingDate = value =>
  value ? moment(value, DATE_FORMAT).format('DD MMM YYYY') : '—';

export const formatBookingTime = value =>
  value ? moment(value, TIME_FORMAT).format('hh:mm A') : '—';

export const formatGuestName = booking =>
  [booking.fname, booking.lname].filter(Boolean).join(' ') || '—';

/**
 * Room type of a booking. Older documents stored it as `values.room` instead of
 * the `roomType` field, so support both.
 */
export const bookingRoomType = booking =>
  booking.roomType || (booking.values && booking.values.room) || '';

export const statusColor = status =>
  ({
    arrived: 'success',
    confirmed: 'info',
    pending: 'warning',
    departed: 'secondary',
    cancelled: 'danger',
  }[status] || 'info');

export const statusLabel = status =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

/** Client-side search across the useful booking fields. */
export const filterBookings = (bookings, search) => {
  const term = String(search || '').trim().toLowerCase();
  if (!term) return bookings;

  return bookings.filter(booking =>
    [
      booking.bkId,
      booking.fname,
      booking.lname,
      booking.email,
      booking.phone,
      booking.roomType,
      booking.roomNumber,
      booking.statusValue,
    ]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(term)),
  );
};

const timestampToMillis = value => {
  if (!value) return 0;
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

/** Newest first, falling back to arrival date/time for legacy documents. */
export const sortBookings = bookings =>
  [...bookings].sort((a, b) => {
    const createdDiff = timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt);
    if (createdDiff !== 0) return createdDiff;

    const arrivalDateDiff = String(b.arrivalDate || '').localeCompare(String(a.arrivalDate || ''));
    if (arrivalDateDiff !== 0) return arrivalDateDiff;

    return String(b.arrivalTime || '').localeCompare(String(a.arrivalTime || ''));
  });

/* -------------------------------------------------------------------------
 * Stay, billing and room availability
 * ---------------------------------------------------------------------- */

const toDay = value => {
  const parsed = moment.isMoment(value) ? value.clone() : moment(value, DATE_FORMAT);
  return parsed.isValid() ? parsed.startOf('day') : null;
};

/**
 * Nights between two dates. A same-day stay still occupies the room for one
 * night, so a valid range never returns 0.
 */
export const stayNights = (arrivalDate, departureDate) => {
  const arrival = toDay(arrivalDate);
  const departure = toDay(departureDate);

  if (!arrival || !departure || departure.isBefore(arrival)) return 0;
  return Math.max(departure.diff(arrival, 'days'), 1);
};

/** Nightly rate x nights. Accepts form values (strings/moments) or documents. */
export const stayTotal = (rate, arrivalDate, departureDate) => {
  const amount = Number(rate) || 0;
  return amount > 0 ? amount * stayNights(arrivalDate, departureDate) : 0;
};

export const bookingNights = booking =>
  stayNights(booking.arrivalDate, booking.departureDate);

export const bookingTotal = booking =>
  stayTotal(booking.rate, booking.arrivalDate, booking.departureDate);

export const bookingPaid = booking => Number(booking.paid) || 0;

export const bookingBalance = booking =>
  Math.max(bookingTotal(booking) - bookingPaid(booking), 0);

/** `unbilled` | `unpaid` | `partial` | `paid` | `void` — folio badge state. */
export const paymentStatus = booking => {
  const total = bookingTotal(booking);
  const paid = bookingPaid(booking);

  if (booking.statusValue === 'cancelled') return 'void';
  if (total <= 0) return 'unbilled';
  if (paid <= 0) return 'unpaid';
  if (paid < total) return 'partial';
  return 'paid';
};

export const paymentStatusLabel = status =>
  ({
    unbilled: 'Not billed',
    unpaid: 'Unpaid',
    partial: 'Partial',
    paid: 'Paid',
    void: 'Void',
  }[status] || 'Not billed');

export const paymentStatusColor = status =>
  ({
    unbilled: 'light',
    unpaid: 'danger',
    partial: 'warning',
    paid: 'success',
    void: 'secondary',
  }[status] || 'light');

/** True when two half-open date ranges share at least one night. */
export const rangesOverlap = (startA, endA, startB, endB) => {
  const aStart = toDay(startA);
  const aEnd = toDay(endA);
  const bStart = toDay(startB);
  const bEnd = toDay(endB);

  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart.isBefore(bEnd) && bStart.isBefore(aEnd);
};

/** Statuses that still hold a room. */
export const BLOCKING_STATUSES = ['confirmed', 'arrived', 'pending'];

/**
 * Is `roomId` free for the given date range?
 *
 * Departed/cancelled bookings and `ignoreId` (the booking being edited) are
 * ignored, and the departure day can be reused by the next guest.
 */
export const isRoomAvailable = (
  bookings = [],
  { roomId, arrivalDate, departureDate, ignoreId } = {},
) => {
  if (!roomId) return true;
  if (!toDay(arrivalDate) || !toDay(departureDate)) return true;

  return !bookings.some(
    booking =>
      booking.id !== ignoreId &&
      booking.roomId === roomId &&
      BLOCKING_STATUSES.includes(booking.statusValue) &&
      rangesOverlap(arrivalDate, departureDate, booking.arrivalDate, booking.departureDate),
  );
};

/**
 * Rooms that can host the stay: not in maintenance, optionally matching the
 * room type, and free for the date range. Sorted by room number.
 */
export const availableRoomsFor = (
  rooms = [],
  bookings = [],
  { arrivalDate, departureDate, roomType, ignoreId } = {},
) =>
  rooms
    .filter(room => room.status !== 'maintenance')
    .filter(room => !roomType || room.roomType === roomType)
    .filter(room =>
      isRoomAvailable(bookings, {
        roomId: room.id,
        arrivalDate,
        departureDate,
        ignoreId,
      }),
    )
    .sort((a, b) =>
      String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, {
        numeric: true,
      }),
    );

/* -------------------------------------------------------------------------
 * Front-desk workflow
 * ---------------------------------------------------------------------- */

export const canCheckIn = booking =>
  Boolean(booking.roomId) && ['confirmed', 'pending'].includes(booking.statusValue);

export const canCheckOut = booking => booking.statusValue === 'arrived';

export const canCancel = booking =>
  !['departed', 'cancelled'].includes(booking.statusValue);

/** Room status that follows a booking status change (`null` = leave as is). */
export const roomStatusForBooking = status => {
  if (status === 'arrived') return 'occupied';
  if (status === 'departed' || status === 'cancelled') return 'available';
  return null;
};


