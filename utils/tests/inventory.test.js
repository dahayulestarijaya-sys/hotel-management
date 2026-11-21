import {
  categoryLabel,
  createEmptyItemForm,
  deserializeItem,
  filterItems,
  isLowStock,
  serializeItem,
  sortItems,
  stockColor,
  stockLabel,
  stockLevel,
  validateItem,
} from '../inventory';

const validItem = () => ({
  ...createEmptyItemForm(),
  itemCode: '  ITM-101  ',
  name: '  Bedsheet  ',
  category: 'laundry',
  location: '  Shelf 4  ',
  quantity: '25',
});

describe('validateItem', () => {
  it('accepts a complete item', () => {
    expect(validateItem(validItem())).toEqual({});
  });

  it('reports the required fields of an empty form', () => {
    const errors = validateItem(createEmptyItemForm());

    expect(errors.itemCode).toBeDefined();
    expect(errors.name).toBeDefined();
    expect(errors.location).toBeDefined();
    expect(errors.quantity).toBeDefined();
  });

  it('rejects invalid quantities', () => {
    expect(validateItem({ ...validItem(), quantity: '' }).quantity).toBeDefined();
    expect(validateItem({ ...validItem(), quantity: '-2' }).quantity).toBeDefined();
    expect(validateItem({ ...validItem(), quantity: '2.5' }).quantity).toBeDefined();
    expect(validateItem({ ...validItem(), quantity: '0' }).quantity).toBeUndefined();
    expect(validateItem({ ...validItem(), quantity: '12' }).quantity).toBeUndefined();
  });

  it('rejects a too long item id', () => {
    expect(
      validateItem({ ...validItem(), itemCode: '123456789012345678901' }).itemCode,
    ).toBeDefined();
  });
});

describe('serializeItem', () => {
  it('trims text and converts the quantity', () => {
    expect(serializeItem(validItem())).toEqual({
      itemCode: 'ITM-101',
      name: 'Bedsheet',
      category: 'laundry',
      location: 'Shelf 4',
      quantity: 25,
    });
  });

  it('stores null for an empty quantity', () => {
    expect(serializeItem({ ...validItem(), quantity: '' }).quantity).toBeNull();
  });
});

describe('deserializeItem', () => {
  it('maps a stored document back into form state', () => {
    const form = deserializeItem({
      itemCode: 'ITM-101',
      name: 'Bedsheet',
      category: 'laundry',
      location: 'Shelf 4',
      quantity: 25,
    });

    expect(form).toEqual({
      itemCode: 'ITM-101',
      name: 'Bedsheet',
      category: 'laundry',
      location: 'Shelf 4',
      quantity: '25',
    });
  });

  it('falls back to safe defaults', () => {
    const form = deserializeItem();

    expect(form.itemCode).toBe('');
    expect(form.category).toBe('room');
    expect(form.quantity).toBe('');
  });
});

describe('labels and stock levels', () => {
  it('maps categories to labels', () => {
    expect(categoryLabel('kitchen')).toBe('Kitchen');
    expect(categoryLabel('nope')).toBe('—');
  });

  it('derives the stock level from the quantity', () => {
    expect(stockLevel(0)).toBe('out');
    expect(stockLevel('')).toBe('out');
    expect(stockLevel('abc')).toBe('out');
    expect(stockLevel(1)).toBe('low');
    expect(stockLevel(5)).toBe('low');
    expect(stockLevel(6)).toBe('in');
  });

  it('maps levels to labels, colours and the low stock filter', () => {
    expect(stockLabel('out')).toBe('Out of stock');
    expect(stockLabel('low')).toBe('Low stock');
    expect(stockLabel('in')).toBe('In stock');
    expect(stockColor('out')).toBe('danger');
    expect(stockColor('low')).toBe('warning');
    expect(stockColor('in')).toBe('success');
    expect(isLowStock({ quantity: 0 })).toBe(true);
    expect(isLowStock({ quantity: 3 })).toBe(true);
    expect(isLowStock({ quantity: 30 })).toBe(false);
  });
});

describe('filterItems', () => {
  const items = [
    { id: '1', itemCode: 'ITM-101', name: 'Bedsheet', category: 'laundry', location: 'Shelf 4' },
    { id: '2', itemCode: 'ITM-102', name: 'Table', category: 'room', location: 'Shelf 4' },
    { id: '3', itemCode: 'KIT-1', name: 'Kettle', category: 'kitchen', location: 'Pantry' },
  ];

  it('returns every item for an empty term', () => {
    expect(filterItems(items, '  ')).toHaveLength(3);
  });

  it('matches code, name, category label and location', () => {
    expect(filterItems(items, 'kettle').map(item => item.id)).toEqual(['3']);
    expect(filterItems(items, 'laundry').map(item => item.id)).toEqual(['1']);
    expect(filterItems(items, 'pantry').map(item => item.id)).toEqual(['3']);
    expect(filterItems(items, 'shelf').map(item => item.id)).toEqual(['1', '2']);
    expect(filterItems(items, 'nobody')).toHaveLength(0);
  });
});

describe('sortItems', () => {
  it('sorts item codes naturally', () => {
    const sorted = sortItems([
      { itemCode: 'ITM-10' },
      { itemCode: '101' },
      { itemCode: 'ITM-9' },
      { itemCode: '102' },
    ]);

    expect(sorted.map(item => item.itemCode)).toEqual(['101', '102', 'ITM-9', 'ITM-10']);
  });

  it('does not mutate the input', () => {
    const items = [{ itemCode: 'ITM-2' }, { itemCode: 'ITM-1' }];
    sortItems(items);

    expect(items.map(item => item.itemCode)).toEqual(['ITM-2', 'ITM-1']);
  });
});
