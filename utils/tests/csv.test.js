import { csvFileName, escapeCsvValue, inventoryToCsv, roomsToCsv, toCsv } from '../csv';
import { bookingsToCsv } from '../csv';

describe('escapeCsvValue', () => {
  it('quotes separators, quotes and new lines', () => {
    expect(escapeCsvValue('101')).toBe('101');
    expect(escapeCsvValue(null)).toBe('');
    expect(escapeCsvValue(undefined)).toBe('');
    expect(escapeCsvValue('Rp 350.000')).toBe('Rp 350.000');
    expect(escapeCsvValue('a;b')).toBe('"a;b"');
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvValue('line1\nline2')).toBe('"line1\nline2"');
  });
});

describe('toCsv', () => {
  it('joins headers and rows with the configured separator', () => {
    expect(toCsv(['A', 'B'], [[1, 2], [3, 4]])).toBe('A;B\r\n1;2\r\n3;4');
    expect(toCsv([], [])).toBe('');
  });
});

describe('entity exports', () => {
  it('writes booking folio columns', () => {
    const csv = bookingsToCsv([
      {
        id: '1',
        bkId: 'BK-1',
        fname: 'Ada',
        lname: 'Lovelace',
        email: 'ada@example.com',
        phone: '+44 20 7946 0958',
        roomNumber: '101',
        roomType: 'double',
        guestno: 2,
        arrivalDate: '2026-05-01',
        departureDate: '2026-05-03',
        statusValue: 'confirmed',
        rate: 500000,
        paid: 200000,
      },
    ]);
    const lines = csv.split('\r\n');

    expect(lines[0]).toContain('Booking ID;Guest;Email');
    expect(lines[0]).toContain('Total;Paid;Balance;Payment');
    expect(lines[1]).toContain('Ada Lovelace');
    expect(lines[1]).toContain('1000000;200000;800000');
    expect(lines[1]).toContain('Partial');
  });

  it('writes rooms and inventory rows', () => {
    const rooms = roomsToCsv([
      {
        roomNumber: '101',
        roomType: 'double',
        acType: 'ac',
        bedCapacity: 2,
        rentPerNight: 500000,
        phone: '021',
        status: 'available',
        amenities: ['wifi', 'tv'],
        details: 'Corner room',
      },
    ]);

    expect(rooms.split('\r\n')[1]).toBe(
      '101;double;ac;2;500000;021;Available;wifi | tv;Corner room',
    );

    const items = inventoryToCsv([
      { itemCode: 'ELC-502', name: 'Hair dryer', category: 'electronics', location: 'Housekeeping', quantity: 0 },
    ]);

    expect(items.split('\r\n')[1]).toBe('ELC-502;Hair dryer;Electronics;Housekeeping;0;Out of stock');
  });
});

describe('csvFileName', () => {
  it('prefixes the file with the current day', () => {
    expect(csvFileName('bookings', new Date('2026-11-19T10:00:00Z'))).toBe(
      'bookings-2026-11-19.csv',
    );
  });
});
