#!/usr/bin/env node
/**
 * Backfills the nightly rate on bookings that predate the folio feature.
 *
 * Usage:
 *   npm run seed:rates
 *
 * Bookings created before billing existed have no `rate`, so the folio shows
 * "Not billed" and the revenue report stays at zero. This script prices those
 * bookings with the median `rentPerNight` of the rooms that share their room
 * type (falling back to the median across all rooms). It never touches `paid`:
 * payments must be recorded by the front desk, so the outstanding balance stays
 * truthful.
 *
 * Uses the Firestore REST API with firebase.config.json (no SDK or service
 * account) and is idempotent — bookings that already have a rate are skipped.
 */
/* eslint-disable no-console */
const config = require('../firebase.config.json');

const { projectId, apiKey } = config;
if (!projectId || !apiKey) {
  console.error('firebase.config.json must contain "projectId" and "apiKey".');
  process.exit(1);
}

const BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const now = new Date().toISOString();

const toNumber = value => {
  if (!value) return null;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return Number(value.doubleValue);
  if (value.stringValue !== undefined) return Number(value.stringValue) || null;
  return null;
};

const listCollection = async collection => {
  const res = await fetch(`${BASE}/${collection}?key=${apiKey}&pageSize=300`);
  if (!res.ok) throw new Error(`${collection}: HTTP ${res.status}`);
  const json = await res.json();
  return (json.documents || []).map(doc => ({
    id: doc.name.split('/').pop(),
    fields: doc.fields || {},
  }));
};

const median = values => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle];
};

const patchRate = async (id, rate) => {
  const res = await fetch(
    `${BASE}/AddBooking/${id}?key=${apiKey}&updateMask.fieldPaths=rate&updateMask.fieldPaths=updatedAt`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          rate: { integerValue: String(rate) },
          updatedAt: { timestampValue: now },
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PATCH ${id} failed: ${res.status} ${body.slice(0, 120)}`);
  }
};

(async () => {
  const [bookings, rooms] = await Promise.all([
    listCollection('AddBooking'),
    listCollection('Rooms'),
  ]);

  const rentsByType = rooms.reduce((acc, room) => {
    const rent = toNumber(room.fields.rentPerNight);
    const type = room.fields.roomType ? room.fields.roomType.stringValue : '';
    if (!rent || !type) return acc;
    return { ...acc, [type]: [...(acc[type] || []), rent] };
  }, {});

  const overallRent = median(
    rooms.map(room => toNumber(room.fields.rentPerNight)).filter(Boolean),
  );

  const rateFor = booking => {
    const type = booking.fields.roomType
      ? booking.fields.roomType.stringValue
      : booking.fields.values && booking.fields.values.mapValue
        ? ''
        : '';
    const rents = rentsByType[type] || [];
    return rents.length > 0 ? median(rents) : overallRent;
  };

  let updated = 0;
  let skipped = 0;

  for (const booking of bookings) {
    const currentRate = toNumber(booking.fields.rate);
    const bkId = booking.fields.bkId ? booking.fields.bkId.stringValue : booking.id;

    if (currentRate && currentRate > 0) {
      skipped += 1;
      continue; // already priced
    }

    const rate = rateFor(booking);
    if (!rate) {
      console.warn(`- ${bkId}: no room rate available, skipped`);
      skipped += 1;
      continue;
    }

    await patchRate(booking.id, rate);
    updated += 1;
    console.log(`- ${bkId}: rate set to Rp ${rate.toLocaleString('id-ID')}`);
  }

  console.log(
    `\nDone. Updated ${updated}, skipped ${skipped} existing booking(s) (${bookings.length} total).`,
  );
})().catch(error => {
  console.error('Backfill failed:', error.message);
  process.exit(1);
});
