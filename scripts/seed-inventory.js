#!/usr/bin/env node
/**
 * Seeds sample inventory items into the Firestore `Inventory` collection.
 *
 * Usage:
 *   npm run seed:inventory
 *
 * Uses the Firestore REST API with firebase.config.json (no SDK or service
 * account) and is idempotent: an item is only created when no document with the
 * same `itemCode` exists yet. Quantities are mixed so the stock badges and the
 * "only low stock" filter have something to show.
 */
/* eslint-disable no-console */
const config = require('../firebase.config.json');

const { projectId, apiKey } = config;
if (!projectId || !apiKey) {
  console.error('firebase.config.json must contain "projectId" and "apiKey".');
  process.exit(1);
}

const BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const COLLECTION = 'Inventory';
const now = new Date().toISOString();

const str = value => ({ stringValue: value });
const int = value => ({ integerValue: String(value) });
const stamp = value => ({ timestampValue: value });

const items = [
  { itemCode: 'ITM-101', name: 'Bedsheet (double)', category: 'room', location: 'Shelf 4', quantity: 25 },
  { itemCode: 'ITM-102', name: 'Pillow', category: 'room', location: 'Shelf 4', quantity: 18 },
  { itemCode: 'ITM-103', name: 'Bath towel', category: 'bathroom', location: 'Shelf 2', quantity: 40 },
  { itemCode: 'ITM-104', name: 'Toilet paper', category: 'bathroom', location: 'Shelf 1', quantity: 3 },
  { itemCode: 'ITM-105', name: 'Shampoo bottle', category: 'bathroom', location: 'Cabinet A', quantity: 12 },
  { itemCode: 'ITM-106', name: 'Hand soap', category: 'bathroom', location: 'Cabinet A', quantity: 0 },
  { itemCode: 'KIT-201', name: 'Coffee sachet', category: 'kitchen', location: 'Pantry', quantity: 120 },
  { itemCode: 'KIT-202', name: 'Electric kettle', category: 'kitchen', location: 'Pantry', quantity: 4 },
  { itemCode: 'KIT-203', name: 'Dinner plate', category: 'kitchen', location: 'Cabinet B', quantity: 60 },
  { itemCode: 'KIT-204', name: 'Cutlery set', category: 'kitchen', location: 'Cabinet B', quantity: 15 },
  { itemCode: 'LAU-301', name: 'Laundry detergent', category: 'laundry', location: 'Shelf 3', quantity: 8 },
  { itemCode: 'MNT-401', name: 'Light bulb', category: 'maintenance', location: 'Store room', quantity: 2 },
  { itemCode: 'ELC-501', name: 'TV remote', category: 'electronics', location: 'Front desk', quantity: 6 },
  { itemCode: 'ELC-502', name: 'Hair dryer', category: 'electronics', location: 'Housekeeping', quantity: 0 },
];

const toFields = item => ({
  itemCode: str(item.itemCode),
  name: str(item.name),
  category: str(item.category),
  location: str(item.location),
  quantity: int(item.quantity),
  createdAt: stamp(now),
  updatedAt: stamp(now),
});

const itemExists = async itemCode => {
  const response = await fetch(`${BASE}:runQuery?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: COLLECTION }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'itemCode' },
            op: 'EQUAL',
            value: str(itemCode),
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

const createItem = async item => {
  const response = await fetch(`${BASE}/${COLLECTION}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFields(item) }),
  });

  if (!response.ok) {
    throw new Error(`create "${item.itemCode}" failed (${response.status}): ${await response.text()}`);
  }

  return response.json();
};

const stockLabel = quantity => {
  if (quantity <= 0) return 'out of stock';
  if (quantity <= 5) return 'low stock';
  return 'in stock';
};

(async () => {
  console.log(`Seeding ${items.length} sample inventory items into "${projectId}/${COLLECTION}"…\n`);

  const created = [];
  const skipped = [];

  for (const item of items) {
    if (await itemExists(item.itemCode)) {
      skipped.push(item.itemCode);
      console.log(`skip    ${item.itemCode} (already exists)`);
      continue;
    }

    await createItem(item);
    created.push(item.itemCode);
    console.log(
      `created ${item.itemCode.padEnd(8)} ${item.name.padEnd(22)} `
      + `qty ${String(item.quantity).padStart(3)}  ${stockLabel(item.quantity)}`,
    );
  }

  console.log(`\nDone. Created ${created.length}, skipped ${skipped.length} existing item(s).`);
  console.log('View the list at http://localhost:3000/view-inventory');
  console.log(`Firestore: https://console.firebase.google.com/project/${projectId}/firestore/data/~2F${COLLECTION}`);
})().catch(error => {
  console.error(`\nSeeding failed: ${error.message}`);
  process.exit(1);
});

