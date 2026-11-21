import {
  acTypeLabel,
  amenityLabels,
  cancellationLabel,
  createEmptyRoomForm,
  deserializeRoom,
  filterRooms,
  filterRoomsByBeds,
  formatRent,
  roomStatusColor,
  roomStatusLabel,
  roomTypeLabel,
  serializeRoom,
  sortRooms,
  validateRoom,
} from '../rooms';

const validRoom = () => ({
  ...createEmptyRoomForm(),
  roomNumber: '  101  ',
  roomType: 'double',
  acType: 'ac',
  bedCapacity: '3',
  rentPerNight: '1500',
  phone: '+91 98765 43210',
  status: 'available',
  cancellation: 'free',
  details: '  Sea view  ',
  amenities: ['wifi', 'tv'],
});

describe('validateRoom', () => {
  it('accepts a complete room', () => {
    expect(validateRoom(validRoom())).toEqual({});
  });

  it('reports the required fields of an empty form', () => {
    const errors = validateRoom(createEmptyRoomForm());

    expect(errors.roomNumber).toBeDefined();
    expect(errors.roomType).toBeDefined();
    expect(errors.bedCapacity).toBeDefined();
    expect(errors.rentPerNight).toBeDefined();
    expect(errors.phone).toBeDefined();
  });

  it('rejects invalid bed capacities', () => {
    expect(validateRoom({ ...validRoom(), bedCapacity: '0' }).bedCapacity).toBeDefined();
    expect(validateRoom({ ...validRoom(), bedCapacity: '1.5' }).bedCapacity).toBeDefined();
    expect(validateRoom({ ...validRoom(), bedCapacity: '21' }).bedCapacity).toBeDefined();
    expect(validateRoom({ ...validRoom(), bedCapacity: '1' }).bedCapacity).toBeUndefined();
    expect(validateRoom({ ...validRoom(), bedCapacity: '20' }).bedCapacity).toBeUndefined();
  });

  it('rejects missing or negative rent', () => {
    expect(validateRoom({ ...validRoom(), rentPerNight: '' }).rentPerNight).toBeDefined();
    expect(validateRoom({ ...validRoom(), rentPerNight: '-5' }).rentPerNight).toBeDefined();
    expect(validateRoom({ ...validRoom(), rentPerNight: '0' }).rentPerNight).toBeUndefined();
  });

  it('rejects invalid phone numbers and room numbers', () => {
    expect(validateRoom({ ...validRoom(), phone: 'abc' }).phone).toBeDefined();
    expect(validateRoom({ ...validRoom(), roomNumber: '   ' }).roomNumber).toBeDefined();
    expect(
      validateRoom({ ...validRoom(), roomNumber: '12345678901' }).roomNumber,
    ).toBeDefined();
  });
});

describe('serializeRoom', () => {
  it('trims text and converts numbers', () => {
    expect(serializeRoom(validRoom())).toEqual({
      roomNumber: '101',
      roomType: 'double',
      acType: 'ac',
      bedCapacity: 3,
      rentPerNight: 1500,
      phone: '+91 98765 43210',
      status: 'available',
      cancellation: 'free',
      details: 'Sea view',
      amenities: ['wifi', 'tv'],
    });
  });

  it('stores null for an empty capacity/rent', () => {
    const payload = serializeRoom({ ...validRoom(), bedCapacity: '', rentPerNight: '' });

    expect(payload.bedCapacity).toBeNull();
    expect(payload.rentPerNight).toBeNull();
  });

  it('copies the amenities array', () => {
    const form = validRoom();
    const payload = serializeRoom(form);
    payload.amenities.push('locker');

    expect(form.amenities).toEqual(['wifi', 'tv']);
  });
});

describe('deserializeRoom', () => {
  it('maps a stored document back into form state', () => {
    const form = deserializeRoom({
      roomNumber: '101',
      roomType: 'double',
      acType: 'nonAc',
      bedCapacity: 2,
      rentPerNight: 1500,
      phone: '+91 98765 43210',
      status: 'occupied',
      cancellation: 'nil',
      details: 'Sea view',
      amenities: ['tv'],
    });

    expect(form).toMatchObject({
      roomNumber: '101',
      roomType: 'double',
      acType: 'nonAc',
      bedCapacity: '2',
      rentPerNight: '1500',
      status: 'occupied',
      cancellation: 'nil',
      details: 'Sea view',
      amenities: ['tv'],
    });
  });

  it('falls back to safe defaults', () => {
    const form = deserializeRoom();

    expect(form.roomNumber).toBe('');
    expect(form.acType).toBe('ac');
    expect(form.status).toBe('available');
    expect(form.cancellation).toBe('free');
    expect(form.bedCapacity).toBe('');
    expect(form.amenities).toEqual([]);
  });
});


describe('labels and colours', () => {
  it('maps option values to readable labels', () => {
    expect(roomTypeLabel('double')).toBe('Double');
    expect(roomTypeLabel('unknown')).toBe('—');
    expect(acTypeLabel('nonAc')).toBe('Non AC');
    expect(roomStatusLabel('maintenance')).toBe('Maintenance');
    expect(cancellationLabel('small')).toBe('5% before 24 hours');
    expect(amenityLabels(['wifi', 'tv', 'unknown'])).toEqual(['Wi-Fi', 'TV', '—']);
    expect(amenityLabels(undefined)).toEqual([]);
  });

  it('maps room statuses to badge colours', () => {
    expect(roomStatusColor('available')).toBe('success');
    expect(roomStatusColor('occupied')).toBe('info');
    expect(roomStatusColor('maintenance')).toBe('warning');
    expect(roomStatusColor('whatever')).toBe('info');
  });

  it('formats the rent in Rupiah', () => {
    expect(formatRent(350)).toBe('Rp 350');
    expect(formatRent('1500')).toBe('Rp 1.500');
    expect(formatRent(1750000)).toBe('Rp 1.750.000');
    expect(formatRent(null)).toBe('—');
    expect(formatRent('')).toBe('—');
    expect(formatRent('abc')).toBe('—');
  });
});

describe('filterRooms', () => {
  const rooms = [
    { id: '1', roomNumber: '101', roomType: 'single', acType: 'ac', status: 'available', phone: '412-206-6478', amenities: ['wifi'] },
    { id: '2', roomNumber: '102', roomType: 'double', acType: 'nonAc', status: 'occupied', phone: '979-488-2394', amenities: ['tv'] },
    { id: '3', roomNumber: '201', roomType: 'quad', acType: 'ac', status: 'maintenance', phone: '605-855-8626', amenities: [] },
  ];

  it('returns every room for an empty term', () => {
    expect(filterRooms(rooms, '   ')).toHaveLength(3);
  });

  it('matches room number, type, status, phone and amenities', () => {
    expect(filterRooms(rooms, '201').map(room => room.id)).toEqual(['3']);
    expect(filterRooms(rooms, 'double').map(room => room.id)).toEqual(['2']);
    expect(filterRooms(rooms, 'occupied').map(room => room.id)).toEqual(['2']);
    expect(filterRooms(rooms, '8626').map(room => room.id)).toEqual(['3']);
    expect(filterRooms(rooms, 'wi-fi').map(room => room.id)).toEqual(['1']);
    expect(filterRooms(rooms, 'nobody')).toHaveLength(0);
  });
});

describe('filterRoomsByBeds', () => {
  const rooms = [
    { id: '1', bedCapacity: 1 },
    { id: '2', bedCapacity: 3 },
    { id: '3', bedCapacity: 5 },
    { id: '4' },
  ];

  it('keeps rooms with at least the requested capacity', () => {
    expect(filterRoomsByBeds(rooms, 3).map(room => room.id)).toEqual(['2', '3']);
  });

  it('returns everything for 0/1 beds', () => {
    expect(filterRoomsByBeds(rooms, 0)).toHaveLength(4);
    expect(filterRoomsByBeds(rooms, 1)).toHaveLength(3);
  });
});

describe('sortRooms', () => {
  it('sorts room numbers naturally', () => {
    const sorted = sortRooms([
      { roomNumber: 'A-2' },
      { roomNumber: '201' },
      { roomNumber: '102' },
      { roomNumber: 'A-1' },
      { roomNumber: '101' },
    ]);

    expect(sorted.map(room => room.roomNumber)).toEqual(['101', '102', '201', 'A-1', 'A-2']);
  });

  it('does not mutate the input', () => {
    const rooms = [{ roomNumber: '102' }, { roomNumber: '101' }];
    sortRooms(rooms);

    expect(rooms.map(room => room.roomNumber)).toEqual(['102', '101']);
  });
});
