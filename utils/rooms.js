/**
 * Room domain helpers.
 *
 * Rooms live in the Firestore collection below. These helpers keep the form
 * state, the Firestore document shape and the table rendering in sync.
 *
 * Firestore document shape (collection `Rooms`):
 *   {
 *     roomNumber, roomType, acType, bedCapacity, rentPerNight, phone,
 *     status, cancellation, details, amenities: [],
 *     createdAt, updatedAt (server timestamps)
 *   }
 */
import { formatCurrency } from './currency';

export const ROOMS_COLLECTION = 'Rooms';

export const ROOM_TYPE_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'quad', label: 'Quad' },
  { value: 'king', label: 'King' },
  { value: 'queen', label: 'Queen' },
];

export const AC_OPTIONS = [
  { value: 'ac', label: 'AC' },
  { value: 'nonAc', label: 'Non AC' },
];

export const CANCELLATION_OPTIONS = [
  { value: 'free', label: 'Free Cancellation' },
  { value: 'small', label: '5% before 24 hours' },
  { value: 'nil', label: 'No Cancellation Allowed' },
];

export const ROOM_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
];

export const AMENITY_OPTIONS = [
  { value: 'bed', label: 'Bed' },
  { value: 'pillow', label: 'Pillow' },
  { value: 'chair', label: 'Chair' },
  { value: 'table', label: 'Table' },
  { value: 'tv', label: 'TV' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'locker', label: 'Locker' },
  { value: 'swimmingPool', label: 'Swimming Pool' },
];

export const createEmptyRoomForm = () => ({
  roomNumber: '',
  roomType: '',
  acType: 'ac',
  bedCapacity: '',
  rentPerNight: '',
  phone: '',
  status: 'available',
  cancellation: 'free',
  details: '',
  amenities: [],
});

const trim = value => (typeof value === 'string' ? value.trim() : value);

const toNumberOrNull = value =>
  value === '' || value === null || value === undefined ? null : Number(value);

export const serializeRoom = form => ({
  roomNumber: trim(form.roomNumber) || '',
  roomType: form.roomType,
  acType: form.acType,
  bedCapacity: toNumberOrNull(form.bedCapacity),
  rentPerNight: toNumberOrNull(form.rentPerNight),
  phone: trim(form.phone) || '',
  status: form.status,
  cancellation: form.cancellation,
  details: trim(form.details) || '',
  amenities: Array.isArray(form.amenities) ? [...form.amenities] : [],
});

export const deserializeRoom = (data = {}) => ({
  roomNumber: data.roomNumber || '',
  roomType: data.roomType || '',
  acType: data.acType || 'ac',
  bedCapacity: data.bedCapacity === null || data.bedCapacity === undefined
    ? ''
    : String(data.bedCapacity),
  rentPerNight: data.rentPerNight === null || data.rentPerNight === undefined
    ? ''
    : String(data.rentPerNight),
  phone: data.phone || '',
  status: data.status || 'available',
  cancellation: data.cancellation || 'free',
  details: data.details || '',
  amenities: Array.isArray(data.amenities) ? data.amenities : [],
});


const PHONE_PATTERN = /^[+\d][\d\s()-]{5,}$/;

/** Returns `{ field: message }`; an empty object means the form is valid. */
export const validateRoom = form => {
  const errors = {};

  const roomNumber = String(form.roomNumber || '').trim();
  if (!roomNumber) errors.roomNumber = 'Room number is required';
  else if (roomNumber.length > 10) errors.roomNumber = 'Room number is too long';

  if (!form.roomType) errors.roomType = 'Select a room type';
  if (!form.acType) errors.acType = 'Select AC or Non AC';
  if (!form.status) errors.status = 'Select a room status';
  if (!form.cancellation) errors.cancellation = 'Select the cancellation policy';

  const beds = Number(form.bedCapacity);
  if (form.bedCapacity === '' || form.bedCapacity === null || form.bedCapacity === undefined) {
    errors.bedCapacity = 'Bed capacity is required';
  } else if (!Number.isInteger(beds) || beds < 1 || beds > 20) {
    errors.bedCapacity = 'Bed capacity must be a whole number between 1 and 20';
  }

  const rent = Number(form.rentPerNight);
  if (form.rentPerNight === '' || form.rentPerNight === null || form.rentPerNight === undefined) {
    errors.rentPerNight = 'Rent per night is required';
  } else if (!Number.isFinite(rent) || rent < 0) {
    errors.rentPerNight = 'Rent must be a positive amount';
  }

  const phone = String(form.phone || '').trim();
  if (!phone) errors.phone = 'Phone number is required';
  else if (!PHONE_PATTERN.test(phone)) errors.phone = 'Enter a valid phone number';

  return errors;
};

const optionLabel = (options, value) => {
  const match = options.find(option => option.value === value);
  return match ? match.label : '—';
};

export const roomTypeLabel = value => optionLabel(ROOM_TYPE_OPTIONS, value);
export const acTypeLabel = value => optionLabel(AC_OPTIONS, value);
export const roomStatusLabel = value => optionLabel(ROOM_STATUS_OPTIONS, value);
export const cancellationLabel = value => optionLabel(CANCELLATION_OPTIONS, value);
export const amenityLabels = amenities =>
  (Array.isArray(amenities) ? amenities : []).map(value => optionLabel(AMENITY_OPTIONS, value));

export const roomStatusColor = status =>
  ({
    available: 'success',
    occupied: 'info',
    maintenance: 'warning',
  }[status] || 'info');

export const formatRent = value => formatCurrency(value);

/** Client-side search across the useful room fields. */
export const filterRooms = (rooms, search) => {
  const term = String(search || '').trim().toLowerCase();
  if (!term) return rooms;

  return rooms.filter(room =>
    [
      room.roomNumber,
      roomTypeLabel(room.roomType),
      acTypeLabel(room.acType),
      roomStatusLabel(room.status),
      room.phone,
      room.details,
      ...amenityLabels(room.amenities),
    ]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(term)),
  );
};

/** Rooms with at least `minBeds` beds (used by the bed capacity slider). */
export const filterRoomsByBeds = (rooms, minBeds) => {
  const minimum = Number(minBeds) || 0;
  if (minimum <= 0) return rooms;
  return rooms.filter(room => (Number(room.bedCapacity) || 0) >= minimum);
};

/** Natural order: 101, 102, 201, A-1 (numbers sorted numerically). */
export const sortRooms = rooms =>
  [...rooms].sort((a, b) =>
    String(a.roomNumber || '').localeCompare(String(b.roomNumber || ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  );
