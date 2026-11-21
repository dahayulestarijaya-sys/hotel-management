#!/usr/bin/env node
/**
 * Seeds sample bookings into the Firestore `AddBooking` collection.
 *
 * Usage:
 *   npm run seed:bookings
 *
 * Dates are generated relative to today, so the dashboard shows real
 * "CheckIn Today" / "CheckOut Today" numbers and the monthly charts have data.
 * The script uses the Firestore REST API with firebase.config.json (no SDK or
 * service account) and is idempotent: a booking is only created when no
 * document with the same `bkId` exists yet.
 */
/* eslint-disable no-console */
const config = require('../firebase.config.json');

const { projectId, apiKey } = config;
if (!projectId || !apiKey) {
  console.error('firebase.config.json must contain "projectId" and "apiKey".');
  process.exit(1);
}

const BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const COLLECTION = 'AddBooking';
const now = new Date().toISOString();

const pad = value => String(value).padStart(2, '0');
const day = offset => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const str = value => ({ stringValue: value });
const int = value => ({ integerValue: String(value) });
const stamp = value => ({ timestampValue: value });

const bookings = [
  {
    bkId: 'BK-1001',
    fname: 'Ada',
    lname: 'Lovelace',
    email: 'ada@example.com',
    phone: '+44 20 7946 0958',
    guestno: 2,
    selectedValue: 'female',
    roomType: 'double',
    statusValue: 'arrived',
    arrivalDate: day(0),
    arrivalTime: '14:00',
    departureDate: day(2),
    departureTime: '11:00',
  },
  {
    bkId: 'BK-1002',
    fname: 'Alan',
    lname: 'Turing',
    email: 'alan@example.com',
    phone: '+44 20 7946 0102',
    guestno: 1,
    selectedValue: 'male',
    roomType: 'single',
    statusValue: 'confirmed',
    arrivalDate: day(0),
    arrivalTime: '15:30',
    departureDate: day(1),
    departureTime: '10:00',
  },
  {
    bkId: 'BK-1003',
    fname: 'Grace',
    lname: 'Hopper',
    email: 'grace@example.com',
    phone: '+1 202 555 0103',
    guestno: 2,
    selectedValue: 'female',
    roomType: 'king',
    statusValue: 'pending',
    arrivalDate: day(0),
    arrivalTime: '18:00',
    departureDate: day(3),
    departureTime: '11:00',
  },
  {
    bkId: 'BK-1004',
    fname: 'Linus',
    lname: 'Torvalds',
    email: 'linus@example.com',
    phone: '+358 40 555 0104',
    guestno: 4,
    selectedValue: 'male',
    roomType: 'quad',
    statusValue: 'departed',
    arrivalDate: day(-3),
    arrivalTime: '12:00',
    departureDate: day(0),
    departureTime: '09:00',
  },
  {
    bkId: 'BK-1005',
    fname: 'Margaret',
    lname: 'Hamilton',
    email: 'margaret@example.com',
    phone: '+1 617 555 0105',
    guestno: 2,
    selectedValue: 'female',
    roomType: 'queen',
    statusValue: 'departed',
    arrivalDate: day(-2),
    arrivalTime: '16:00',
    departureDate: day(0),
    departureTime: '11:00',
  },
  {
    bkId: 'BK-1006',
    fname: 'Katherine',
    lname: 'Johnson',
    email: 'katherine@example.com',
    phone: '+1 757 555 0106',
    guestno: 2,
    selectedValue: 'female',
    roomType: 'double',
    statusValue: 'confirmed',
    arrivalDate: day(1),
    arrivalTime: '13:00',
    departureDate: day(4),
    departureTime: '10:00',
  },
  {
    bkId: 'BK-1007',
    fname: 'Tim',
    lname: 'Berners-Lee',
    email: 'tim@example.com',
    phone: '+44 20 7946 0107',
    guestno: 1,
    selectedValue: 'male',
    roomType: 'single',
    statusValue: 'arrived',
    arrivalDate: day(-1),
    arrivalTime: '19:00',
    departureDate: day(2),
    departureTime: '10:00',
  },
  {
    bkId: 'BK-1008',
    fname: 'Barbara',
    lname: 'Liskov',
    email: 'barbara@example.com',
    phone: '+1 617 555 0108',
    guestno: 3,
    selectedValue: 'female',
    roomType: 'king',
    statusValue: 'confirmed',
    arrivalDate: day(5),
    arrivalTime: '14:00',
    departureDate: day(8),
    departureTime: '11:00',
  },
  {
    bkId: 'BK-1009',
    fname: 'Dennis',
    lname: 'Ritchie',
    email: 'dennis@example.com',
    phone: '+1 908 555 0109',
    guestno: 2,
    selectedValue: 'male',
    roomType: 'double',
    statusValue: 'departed',
    arrivalDate: day(-20),
    arrivalTime: '15:00',
    departureDate: day(-17),
    departureTime: '10:00',
  },
  {
    bkId: 'BK-1010',
    fname: 'Radia',
    lname: 'Perlman',
    email: 'radia@example.com',
    phone: '+1 206 555 0110',
    guestno: 2,
    selectedValue: 'female',
    roomType: 'queen',
    statusValue: 'arrived',
    arrivalDate: day(-8),
    arrivalTime: '17:00',
    departureDate: day(2),
    departureTime: '11:00',
  },
  {
    bkId: 'BK-1011',
    fname: 'Ken',
    lname: 'Thompson',
    email: 'ken@example.com',
    phone: '+1 908 555 0111',
    guestno: 4,
    selectedValue: 'male',
    roomType: 'quad',
    statusValue: 'pending',
    arrivalDate: day(10),
    arrivalTime: '16:00',
    departureDate: day(12),
    departureTime: '10:00',
  },
  {
    bkId: 'BK-1012',
    fname: 'Shafi',
    lname: 'Goldwasser',
    email: 'shafi@example.com',
    phone: '+972 3 555 0112',
    guestno: 1,
    selectedValue: 'female',
    roomType: 'single',
    statusValue: 'departed',
    arrivalDate: day(-70),
    arrivalTime: '13:00',
    departureDate: day(-67),
    departureTime: '09:00',
  },
  {
    bkId: 'BK-1013',
    fname: 'Edsger',
    lname: 'Dijkstra',
    email: 'edsger@example.com',
    phone: '+31 40 555 0113',
    guestno: 2,
    selectedValue: 'male',
    roomType: 'double',
    statusValue: 'confirmed',
    arrivalDate: day(-45),
    arrivalTime: '14:30',
    departureDate: day(-42),
    departureTime: '11:00',
  },
  {
    bkId: 'BK-1014',
    fname: 'Frances',
    lname: 'Allen',
    email: 'frances@example.com',
    phone: '+1 914 555 0114',
    guestno: 2,
    selectedValue: 'female',
    roomType: 'queen',
    statusValue: 'departed',
    arrivalDate: day(-100),
    arrivalTime: '12:30',
    departureDate: day(-97),
    departureTime: '10:00',
  },
  {
    bkId: 'BK-1015',
    fname: 'Donald',
    lname: 'Knuth',
    email: 'donald@example.com',
    phone: '+1 650 555 0115',
    guestno: 3,
    selectedValue: 'male',
    roomType: 'king',
    statusValue: 'departed',
    arrivalDate: day(-140),
    arrivalTime: '18:30',
    departureDate: day(-137),
    departureTime: '11:00',
  },
];

const toFields = booking => ({
  bkId: str(booking.bkId),
  fname: str(booking.fname),
  lname: str(booking.lname),
  email: str(booking.email),
  phone: str(booking.phone),
  guestno: int(booking.guestno),
  selectedValue: str(booking.selectedValue),
  roomType: str(booking.roomType),
  statusValue: str(booking.statusValue),
  arrivalDate: str(booking.arrivalDate),
  arrivalTime: str(booking.arrivalTime),
  departureDate: str(booking.departureDate),
  departureTime: str(booking.departureTime),
  createdAt: stamp(now),
  updatedAt: stamp(now),
});

const bookingExists = async bkId => {
  const response = await fetch(`${BASE}:runQuery?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: COLLECTION }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'bkId' },
            op: 'EQUAL',
            value: str(bkId),
          },
        },
        limit: 1,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`query failed (${response.status}): ${await response.text()}`);
  }

  const results = await response.json();
  return results.some(result => result.document);
};

const createBooking = async booking => {
  const response = await fetch(`${BASE}/${COLLECTION}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFields(booking) }),
  });

  if (!response.ok) {
    throw new Error(`create "${booking.bkId}" failed (${response.status}): ${await response.text()}`);
  }

  return response.json();
};

(async () => {
  console.log(`Seeding ${bookings.length} sample bookings into "${projectId}/${COLLECTION}"…\n`);

  const created = [];
  const skipped = [];

  for (const booking of bookings) {
    if (await bookingExists(booking.bkId)) {
      skipped.push(booking.bkId);
      console.log(`skip    ${booking.bkId} (already exists)`);
      continue;
    }

    await createBooking(booking);
    created.push(booking.bkId);
    console.log(
      `created ${booking.bkId}  ${booking.fname} ${booking.lname}  `
      + `${booking.arrivalDate} → ${booking.departureDate}  ${booking.statusValue}`,
    );
  }

  console.log(`\nDone. Created ${created.length}, skipped ${skipped.length} existing booking(s).`);
  console.log('View the list at http://localhost:3000/view-booking');
  console.log('See the KPIs at http://localhost:3000/dashboard');
  console.log(`Firestore: https://console.firebase.google.com/project/${projectId}/firestore/data/~2F${COLLECTION}`);
})().catch(error => {
  console.error(`\nSeeding failed: ${error.message}`);
  process.exit(1);
});

