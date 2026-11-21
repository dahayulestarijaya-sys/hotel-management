import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button, Grid, Tab, Tabs, TextField } from '@material-ui/core';
import { toast } from 'react-toastify';
import { Building2, Mail, MapPin, Phone, User } from 'lucide-react';
import Card from 'components/Card/Loadable';
import { db, serverTimestamp } from 'utils/firebase';
import {
  PROFILE_DOC,
  PROPERTY_DOC,
  SETTINGS_COLLECTION,
  deserializeProfile,
  deserializeProperty,
  emptyProfile,
  emptyProperty,
  initials,
  validateProfile,
  validateProperty,
} from 'utils/settings';
import './style.scss';

/**
 * Staff + property settings, stored in Firestore (`Settings/profile`,
 * `Settings/property`) and edited right here. There is no hard-coded persona:
 * an empty profile shows a "set up" prompt instead of demo values.
 */
export const ProfilePage = () => {
  const [tab, setTab] = useState('view');
  const [profile, setProfile] = useState(emptyProfile());
  const [property, setProperty] = useState(emptyProperty());
  const [profileForm, setProfileForm] = useState(emptyProfile());
  const [propertyForm, setPropertyForm] = useState(emptyProperty());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  // Keeps a live snapshot from overwriting inputs while they are being edited.
  const dirtyRef = useRef(false);

  useEffect(() => {
    const unsubscribes = [
      db
        .collection(SETTINGS_COLLECTION)
        .doc(PROFILE_DOC)
        .onSnapshot(
          doc => {
            const data = deserializeProfile(doc.exists ? doc.data() : {});
            setProfile(data);
            setProfileForm(previous => (dirtyRef.current ? previous : data));
          },
          error => console.error('Could not load the profile:', error),
        ),
      db
        .collection(SETTINGS_COLLECTION)
        .doc(PROPERTY_DOC)
        .onSnapshot(
          doc => {
            const data = deserializeProperty(doc.exists ? doc.data() : {});
            setProperty(data);
            setPropertyForm(previous => (dirtyRef.current ? previous : data));
          },
          error => console.error('Could not load the property settings:', error),
        ),
    ];

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, []);

  const setProfileField = name => event => {
    dirtyRef.current = true;
    setProfileForm(previous => ({ ...previous, [name]: event.target.value }));
  };

  const setPropertyField = name => event => {
    dirtyRef.current = true;
    setPropertyForm(previous => ({ ...previous, [name]: event.target.value }));
  };

  const saveProfile = async event => {
    event.preventDefault();
    const nextErrors = validateProfile(profileForm);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await db
        .collection(SETTINGS_COLLECTION)
        .doc(PROFILE_DOC)
        .set({ ...profileForm, updatedAt: serverTimestamp() }, { merge: true });
      dirtyRef.current = false;
      toast.success('Profile saved');
      setTab('view');
    } catch (error) {
      console.error('Could not save the profile:', error);
      toast.error(`Could not save the profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveProperty = async event => {
    event.preventDefault();
    const nextErrors = validateProperty(propertyForm);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await db
        .collection(SETTINGS_COLLECTION)
        .doc(PROPERTY_DOC)
        .set({ ...propertyForm, updatedAt: serverTimestamp() }, { merge: true });
      dirtyRef.current = false;
      toast.success('Property saved');
      setTab('view');
    } catch (error) {
      console.error('Could not save the property:', error);
      toast.error(`Could not save the property: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const details = [
    { key: 'name', label: 'Full name', value: profile.name, icon: User },
    { key: 'role', label: 'Role', value: profile.role, icon: Building2 },
    { key: 'email', label: 'Email', value: profile.email, icon: Mail },
    { key: 'phone', label: 'Phone', value: profile.phone, icon: Phone },
    { key: 'address', label: 'Address', value: profile.address, icon: MapPin },
  ];

  return (
    <Fragment>
      <Helmet>
        <title>Profile</title>
      </Helmet>

      <Grid container spacing={3}>
        <Grid item lg={4} md={5} xs={12}>
          <Card className="profileCard">
            <div className="profileCard__identity">
              <span className="profileCard__avatar">{initials(profile.name)}</span>
              <div>
                <h3>{profile.name || 'Profile not set up'}</h3>
                <p>{profile.role || 'Add your name and role to personalise the header.'}</p>
              </div>
            </div>
            <p className="profileCard__hint">
              Stored in Firestore · <code>Settings/{PROFILE_DOC}</code>
            </p>

            <Tabs
              value={tab}
              onChange={(event, value) => {
                setErrors({});
                setTab(value);
              }}
              orientation="vertical"
              className="profileCard__tabs"
            >
              <Tab value="view" label="My Profile" />
              <Tab value="edit" label="Edit Profile" />
              <Tab value="property" label="Property" />
            </Tabs>
          </Card>
        </Grid>

        <Grid item lg={8} md={7} xs={12}>
          {tab === 'view' && (
            <Card title="My Profile" subtitle="Staff details used across the application">
              <ul className="profileDetails">
                {details.map(item => {
                  const Icon = item.icon;

                  return (
                    <li key={item.key}>
                      <span className="profileDetails__icon"><Icon size={16} /></span>
                      <span className="profileDetails__label">{item.label}</span>
                      <strong>{item.value || '—'}</strong>
                    </li>
                  );
                })}
              </ul>
              <div className="profileDetails__property">
                <span className="uiPill">
                  {property.code
                    ? `${property.name} · ${property.code}`
                    : 'Property not configured'}
                </span>
              </div>
            </Card>
          )}


          {tab === 'edit' && (
            <Card title="Edit Profile" subtitle="Saved to Settings/profile in Firestore">
              <form className="profileForm" onSubmit={saveProfile} noValidate>
                <Grid container spacing={2}>
                  <Grid item md={6} xs={12}>
                    <TextField
                      variant="filled"
                      label="Full name"
                      name="name"
                      value={profileForm.name}
                      onChange={setProfileField('name')}
                      error={Boolean(errors.name)}
                      helperText={errors.name}
                      fullWidth
                    />
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <TextField
                      variant="filled"
                      label="Role"
                      name="role"
                      value={profileForm.role}
                      onChange={setProfileField('role')}
                      error={Boolean(errors.role)}
                      helperText={errors.role}
                      fullWidth
                    />
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <TextField
                      variant="filled"
                      label="Email"
                      name="email"
                      type="email"
                      value={profileForm.email}
                      onChange={setProfileField('email')}
                      error={Boolean(errors.email)}
                      helperText={errors.email}
                      fullWidth
                    />
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <TextField
                      variant="filled"
                      label="Phone"
                      name="phone"
                      value={profileForm.phone}
                      onChange={setProfileField('phone')}
                      error={Boolean(errors.phone)}
                      helperText={errors.phone}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      variant="filled"
                      label="Address"
                      name="address"
                      value={profileForm.address}
                      onChange={setProfileField('address')}
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <div className="profileForm__actions">
                  <Button type="submit" variant="contained" color="primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save profile'}
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={saving}
                    onClick={() => {
                      dirtyRef.current = false;
                      setProfileForm(profile);
                      setErrors({});
                      setTab('view');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {tab === 'property' && (
            <Card title="Property" subtitle="Saved to Settings/property in Firestore">
              <form className="profileForm" onSubmit={saveProperty} noValidate>
                <Grid container spacing={2}>
                  <Grid item md={6} xs={12}>
                    <TextField
                      variant="filled"
                      label="Property name"
                      name="propertyName"
                      value={propertyForm.name}
                      onChange={setPropertyField('name')}
                      error={Boolean(errors.name)}
                      helperText={errors.name}
                      fullWidth
                    />
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <TextField
                      variant="filled"
                      label="Property code"
                      name="propertyCode"
                      value={propertyForm.code}
                      onChange={setPropertyField('code')}
                      error={Boolean(errors.code)}
                      helperText={errors.code}
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <div className="profileForm__actions">
                  <Button type="submit" variant="contained" color="primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save property'}
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={saving}
                    onClick={() => {
                      dirtyRef.current = false;
                      setPropertyForm(property);
                      setErrors({});
                      setTab('view');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </Grid>
      </Grid>
    </Fragment>
  );
};

export default ProfilePage;

