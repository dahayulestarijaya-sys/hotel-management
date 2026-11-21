import {
  deserializeProfile,
  deserializeProperty,
  emptyProfile,
  emptyProperty,
  initials,
  validateProfile,
  validateProperty,
} from '../settings';

describe('settings shapes', () => {
  it('creates empty forms', () => {
    expect(emptyProperty()).toEqual({ name: '', code: '' });
    expect(emptyProfile()).toEqual({
      name: '',
      role: '',
      email: '',
      phone: '',
      address: '',
    });
  });

  it('deserializes documents with safe defaults', () => {
    expect(deserializeProperty()).toEqual({ name: '', code: '' });
    expect(deserializeProfile({ name: 'Ada', email: 'ada@example.com' })).toEqual({
      name: 'Ada',
      role: '',
      email: 'ada@example.com',
      phone: '',
      address: '',
    });
  });
});

describe('validateProperty', () => {
  it('requires a name and a code', () => {
    const errors = validateProperty(emptyProperty());

    expect(errors.name).toBeDefined();
    expect(errors.code).toBeDefined();
    expect(validateProperty({ name: 'Emerald', code: 'HS-1' })).toEqual({});
  });
});

describe('validateProfile', () => {
  it('accepts a complete profile', () => {
    expect(
      validateProfile({
        name: 'Sarah Jenkins',
        role: 'General Manager',
        email: 'sarah@example.com',
        phone: '+62 812 3456 7890',
        address: 'Jakarta',
      }),
    ).toEqual({});
  });

  it('requires name, role and a valid email', () => {
    const errors = validateProfile(emptyProfile());

    expect(errors.name).toBeDefined();
    expect(errors.role).toBeDefined();
    expect(errors.email).toBeDefined();

    expect(validateProfile({ ...emptyProfile(), email: 'nope' }).email).toBeDefined();
    expect(
      validateProfile({ ...emptyProfile(), name: 'A', role: 'B', email: 'a@b.co', phone: '123' })
        .phone,
    ).toBeDefined();
  });
});

describe('initials', () => {
  it('uses the first letters of the first two words', () => {
    expect(initials('Sarah Jenkins')).toBe('SJ');
    expect(initials('  ada  ')).toBe('A');
    expect(initials('')).toBe('HQ');
    expect(initials(undefined)).toBe('HQ');
  });
});
