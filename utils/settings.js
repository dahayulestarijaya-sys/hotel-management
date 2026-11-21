/**
 * Firestore-backed application settings.
 *
 * Collection `Settings`:
 *   - property: { name, code }            → sidebar property card, reports
 *   - profile:  { name, role, email, phone, address } → header + profile page
 *
 * Nothing here is hard-coded: the documents are read live and edited from the
 * Profile page, so the app ships without demo values.
 */
export const SETTINGS_COLLECTION = 'Settings';
export const PROPERTY_DOC = 'property';
export const PROFILE_DOC = 'profile';

export const emptyProperty = () => ({ name: '', code: '' });

export const emptyProfile = () => ({
  name: '',
  role: '',
  email: '',
  phone: '',
  address: '',
});

export const deserializeProperty = (data = {}) => ({
  name: data.name || '',
  code: data.code || '',
});

export const deserializeProfile = (data = {}) => ({
  name: data.name || '',
  role: data.role || '',
  email: data.email || '',
  phone: data.phone || '',
  address: data.address || '',
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+\d][\d\s()-]{5,}$/;

export const validateProperty = property => {
  const errors = {};

  if (!String(property.name || '').trim()) errors.name = 'Property name is required';
  if (!String(property.code || '').trim()) errors.code = 'Property code is required';

  return errors;
};

export const validateProfile = profile => {
  const errors = {};

  if (!String(profile.name || '').trim()) errors.name = 'Full name is required';
  if (!String(profile.role || '').trim()) errors.role = 'Role is required';

  const email = String(profile.email || '').trim();
  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address';

  const phone = String(profile.phone || '').trim();
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = 'Enter a valid phone number';

  return errors;
};

/** Initials shown in the header avatar: "Sarah Jenkins" → "SJ". */
export const initials = name => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'HQ';
  return parts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
};
