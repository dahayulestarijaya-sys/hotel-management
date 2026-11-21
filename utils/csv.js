/**
 * CSV export helpers.
 *
 * Each list page can export what the user is currently looking at. Values are
 * escaped per RFC 4180 (quotes doubled, fields with separators quoted) and the
 * file starts with a UTF-8 BOM so Excel opens the Rupiah amounts correctly.
 */
import {
  bookingBalance,
  bookingNights,
  bookingTotal,
  formatGuestName,
  paymentStatus,
  paymentStatusLabel,
  sortBookings,
  statusLabel,
} from './bookings';
import { roomStatusLabel } from './rooms';
import { categoryLabel, stockLabel, stockLevel } from './inventory';

export const CSV_SEPARATOR = ';';

export const escapeCsvValue = value => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/["\r\n]/.test(text) || text.includes(CSV_SEPARATOR)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

/** `headers` + `rows` (array of arrays) -> CSV text. */
export const toCsv = (headers = [], rows = []) =>
  [headers, ...rows]
    .map(row => row.map(escapeCsvValue).join(CSV_SEPARATOR))
    .join('\r\n');

export const bookingsToCsv = (bookings = []) =>
  toCsv(
    [
      'Booking ID',
      'Guest',
      'Email',
      'Phone',
      'Room',
      'Room type',
      'Guests',
      'Arrival',
      'Departure',
      'Nights',
      'Status',
      'Rate',
      'Total',
      'Paid',
      'Balance',
      'Payment',
    ],
    sortBookings(bookings).map(booking => [
      booking.bkId,
      formatGuestName(booking),
      booking.email,
      booking.phone,
      booking.roomNumber,
      booking.roomType || (booking.values && booking.values.room),
      booking.guestno,
      booking.arrivalDate,
      booking.departureDate,
      bookingNights(booking),
      statusLabel(booking.statusValue),
      booking.rate,
      bookingTotal(booking),
      Number(booking.paid) || 0,
      bookingBalance(booking),
      paymentStatusLabel(paymentStatus(booking)),
    ]),
  );

export const roomsToCsv = (rooms = []) =>
  toCsv(
    ['Room', 'Type', 'AC', 'Beds', 'Rent / night', 'Phone', 'Status', 'Amenities', 'Details'],
    rooms.map(room => [
      room.roomNumber,
      room.roomType,
      room.acType,
      room.bedCapacity,
      room.rentPerNight,
      room.phone,
      roomStatusLabel(room.status),
      Array.isArray(room.amenities) ? room.amenities.join(' | ') : '',
      room.details,
    ]),
  );

export const inventoryToCsv = (items = []) =>
  toCsv(
    ['Item code', 'Name', 'Category', 'Location', 'Quantity', 'Stock level'],
    items.map(item => [
      item.itemCode,
      item.name,
      categoryLabel(item.category),
      item.location,
      item.quantity,
      stockLabel(stockLevel(item.quantity)),
    ]),
  );

/** File name with the current day, e.g. `bookings-2026-11-19.csv`. */
export const csvFileName = (prefix, date = new Date()) =>
  `${prefix}-${date.toISOString().slice(0, 10)}.csv`;

/** Triggers a browser download for the given CSV text. */
export const downloadCsv = (filename, csv) => {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
};
