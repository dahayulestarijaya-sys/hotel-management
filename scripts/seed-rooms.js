#!/usr/bin/env node
/**
 * Seeds sample rooms into the Firestore `Rooms` collection.
 *
 * Usage:
 *   npm run seed:rooms
 *
 * The script talks to the Firestore REST API using the same public web config
 * the app uses (firebase.config.json), so it needs no credentials or SDKs.
 * It is idempotent: a room is only created when no room with the same
 * `roomNumber` exists yet.
 */
/* eslint-disable no-console */
const config = require('../firebase.config.json');

const { projectId, apiKey } = config;
if (!projectId || !apiKey) {
  console.error('firebase.config.json must contain "projectId" and "apiKey".');
  process.exit(1);
}

const BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const COLLECTION = 'Rooms';
const now = new Date().toISOString();

const str = value => ({ stringValue: value });
const int = value => ({ integerValue: String(value) });
const list = values => ({ arrayValue: { values: values.map(str) } });
const stamp = value => ({ timestampValue: value });

const sampleRooms = [
  {
    roomNumber: '101',
    roomType: 'single',
    acType: 'ac',
    bedCapacity: 1,
    rentPerNight: 350000,
    phone: '555-0101',
    status: 'available',
    cancellation: 'free',
    details: 'Cozy single room with a city view',
    amenities: ['bed', 'pillow', 'chair', 'tv', 'wifi'],
  },
  {
    roomNumber: '102',
    roomType: 'double',
    acType: 'ac',
    bedCapacity: 2,
    rentPerNight: 550000,
    phone: '555-0102',
    status: 'available',
    cancellation: 'free',
    details: 'Spacious double room with a balcony',
    amenities: ['bed', 'pillow', 'chair', 'table', 'tv', 'wifi', 'locker'],
  },
  {
    roomNumber: '103',
    roomType: 'double',
    acType: 'nonAc',
    bedCapacity: 2,
    rentPerNight: 400000,
    phone: '555-0103',
    status: 'occupied',
    cancellation: 'small',
    details: 'Economy double room, garden side',
    amenities: ['bed', 'pillow', 'chair', 'wifi'],
  },
  {
    roomNumber: '104',
    roomType: 'queen',
    acType: 'ac',
    bedCapacity: 2,
    rentPerNight: 750000,
    phone: '555-0104',
    status: 'available',
    cancellation: 'free',
    details: 'Queen bed with garden view',
    amenities: ['bed', 'pillow', 'chair', 'table', 'tv', 'wifi', 'locker'],
  },
  {
    roomNumber: '105',
    roomType: 'quad',
    acType: 'ac',
    bedCapacity: 4,
    rentPerNight: 900000,
    phone: '555-0105',
    status: 'maintenance',
    cancellation: 'nil',
    details: 'Family quad room, under renovation',
    amenities: ['bed', 'pillow', 'table', 'tv', 'wifi'],
  },
  {
    roomNumber: '201',
    roomType: 'king',
    acType: 'ac',
    bedCapacity: 2,
    rentPerNight: 1100000,
    phone: '555-0201',
    status: 'available',
    cancellation: 'free',
    details: 'Executive king room with work desk',
    amenities: ['bed', 'pillow', 'chair', 'table', 'tv', 'wifi', 'locker'],
  },
  {
    roomNumber: '202',
    roomType: 'king',
    acType: 'ac',
    bedCapacity: 3,
    rentPerNight: 1250000,
    phone: '555-0202',
    status: 'occupied',
    cancellation: 'small',
    details: 'Deluxe king room with pool access',
    amenities: ['bed', 'pillow', 'chair', 'table', 'tv', 'wifi', 'locker', 'swimmingPool'],
  },
  {
    roomNumber: '203',
    roomType: 'double',
    acType: 'nonAc',
    bedCapacity: 2,
    rentPerNight: 450000,
    phone: '555-0203',
    status: 'available',
    cancellation: 'free',
    details: 'Budget double room',
    amenities: ['bed', 'pillow', 'wifi'],
  },
  {
    roomNumber: '301',
    roomType: 'queen',
    acType: 'ac',
    bedCapacity: 2,
    rentPerNight: 800000,
    phone: '555-0301',
    status: 'available',
    cancellation: 'small',
    details: 'Corner queen room with extra daylight',
    amenities: ['bed', 'pillow', 'chair', 'tv', 'wifi', 'locker'],
  },
  {
    roomNumber: '401',
    roomType: 'king',
    acType: 'ac',
    bedCapacity: 4,
    rentPerNight: 1750000,
    phone: '555-0401',
    status: 'available',
    cancellation: 'free',
    details: 'Presidential suite with living area',
    amenities: ['bed', 'pillow', 'chair', 'table', 'tv', 'wifi', 'locker', 'swimmingPool'],
  },
];

const toFields = room => ({
  roomNumber: str(room.roomNumber),
  roomType: str(room.roomType),
  acType: str(room.acType),
  bedCapacity: int(room.bedCapacity),
  rentPerNight: int(room.rentPerNight),
  phone: str(room.phone),
  status: str(room.status),
  cancellation: str(room.cancellation),
  details: str(room.details),
  amenities: list(room.amenities),
  createdAt: stamp(now),
  updatedAt: stamp(now),
});


const roomExists = async roomNumber => {
  const response = await fetch(`${BASE}:runQuery?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: COLLECTION }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'roomNumber' },
            op: 'EQUAL',
            value: str(roomNumber),
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

const createRoom = async room => {
  const response = await fetch(`${BASE}/${COLLECTION}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFields(room) }),
  });

  if (!response.ok) {
    throw new Error(`create "${room.roomNumber}" failed (${response.status}): ${await response.text()}`);
  }

  return response.json();
};

(async () => {
  console.log(`Seeding ${sampleRooms.length} sample rooms into "${projectId}/${COLLECTION}"…\n`);

  const created = [];
  const skipped = [];

  for (const room of sampleRooms) {
    if (await roomExists(room.roomNumber)) {
      skipped.push(room.roomNumber);
      console.log(`skip    ${room.roomNumber} (already exists)`);
      continue;
    }

    await createRoom(room);
    created.push(room.roomNumber);
    console.log(
      `created ${room.roomNumber}  ${room.roomType} / ${room.acType} / `
      + `${room.bedCapacity} bed(s) / Rp ${room.rentPerNight.toLocaleString('id-ID')}`,
    );
  }

  console.log(`\nDone. Created ${created.length}, skipped ${skipped.length} existing room(s).`);
  console.log('View them at http://localhost:3000/view-rooms');
  console.log(`Firestore: https://console.firebase.google.com/project/${projectId}/firestore/data/~2F${COLLECTION}`);
})().catch(error => {
  console.error(`\nSeeding failed: ${error.message}`);
  process.exit(1);
});
