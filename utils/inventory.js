/**
 * Inventory domain helpers.
 *
 * Inventory items live in the Firestore collection below. These helpers keep
 * the form state, the Firestore document shape and the table rendering in sync.
 *
 * Firestore document shape (collection `Inventory`):
 *   {
 *     itemCode, name, category, location, quantity,
 *     createdAt, updatedAt (server timestamps)
 *   }
 */
export const INVENTORY_COLLECTION = 'Inventory';

export const INVENTORY_CATEGORY_OPTIONS = [
  { value: 'room', label: 'Room' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'other', label: 'Other' },
];

/** Quantities at or below this value are flagged as low stock. */
export const STOCK_LOW_THRESHOLD = 5;

export const createEmptyItemForm = () => ({
  itemCode: '',
  name: '',
  category: 'room',
  location: '',
  quantity: '',
});

const trim = value => (typeof value === 'string' ? value.trim() : value);

export const serializeItem = form => ({
  itemCode: trim(form.itemCode) || '',
  name: trim(form.name) || '',
  category: form.category,
  location: trim(form.location) || '',
  quantity: form.quantity === '' || form.quantity === null || form.quantity === undefined
    ? null
    : Number(form.quantity),
});

export const deserializeItem = (data = {}) => ({
  itemCode: data.itemCode || '',
  name: data.name || '',
  category: data.category || 'room',
  location: data.location || '',
  quantity: data.quantity === null || data.quantity === undefined
    ? ''
    : String(data.quantity),
});

/** Returns `{ field: message }`; an empty object means the form is valid. */
export const validateItem = form => {
  const errors = {};

  const itemCode = String(form.itemCode || '').trim();
  if (!itemCode) errors.itemCode = 'Item ID is required';
  else if (itemCode.length > 20) errors.itemCode = 'Item ID is too long';

  if (!String(form.name || '').trim()) errors.name = 'Item name is required';
  if (!form.category) errors.category = 'Select a category';
  if (!String(form.location || '').trim()) errors.location = 'Location is required';

  const quantity = Number(form.quantity);
  if (form.quantity === '' || form.quantity === null || form.quantity === undefined) {
    errors.quantity = 'Quantity is required';
  } else if (!Number.isInteger(quantity) || quantity < 0) {
    errors.quantity = 'Quantity must be a whole number (0 or more)';
  }

  return errors;
};

const optionLabel = (options, value) => {
  const match = options.find(option => option.value === value);
  return match ? match.label : '—';
};

export const categoryLabel = value => optionLabel(INVENTORY_CATEGORY_OPTIONS, value);

/** 'out' | 'low' | 'in' — derived from the quantity. */
export const stockLevel = quantity => {
  const amount = Number(quantity);
  if (!Number.isFinite(amount) || amount <= 0) return 'out';
  if (amount <= STOCK_LOW_THRESHOLD) return 'low';
  return 'in';
};

export const stockLabel = level =>
  ({ out: 'Out of stock', low: 'Low stock', in: 'In stock' }[level] || 'Unknown');

export const stockColor = level =>
  ({ out: 'danger', low: 'warning', in: 'success' }[level] || 'info');

/** Items that need restocking (out of stock or at/below the threshold). */
export const isLowStock = item => stockLevel(item.quantity) !== 'in';

/** Client-side search across the useful item fields. */
export const filterItems = (items, search) => {
  const term = String(search || '').trim().toLowerCase();
  if (!term) return items;

  return items.filter(item =>
    [item.itemCode, item.name, categoryLabel(item.category), item.location]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(term)),
  );
};

/** Natural order on the item code: 101, 102, ITM-9, ITM-10. */
export const sortItems = items =>
  [...items].sort((a, b) =>
    String(a.itemCode || '').localeCompare(String(b.itemCode || ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  );
