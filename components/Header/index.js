import React, { useEffect, useMemo, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Maximize,
  Menu,
  Search,
  User,
  Zap,
} from 'lucide-react';
import { db } from 'utils/firebase';
import { BOOKINGS_COLLECTION, formatGuestName, sortBookings, statusLabel } from 'utils/bookings';
import { INVENTORY_COLLECTION, stockLevel } from 'utils/inventory';
import { PROFILE_DOC, SETTINGS_COLLECTION, initials } from 'utils/settings';
import './style.scss';

/**
 * Top application bar: global search, quick check-in, live data status,
 * currency, notifications (built from Firestore) and the staff profile
 * (stored in `Settings/profile`).
 */
export const Header = ({ colupsMenuHandler, fullScreenHandler }) => {
  const history = useHistory();
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState('');
  const [profile, setProfile] = useState({ name: '', role: '' });
  const [bookings, setBookings] = useState([]);
  const [items, setItems] = useState([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const unsubscribes = [
      db
        .collection(SETTINGS_COLLECTION)
        .doc(PROFILE_DOC)
        .onSnapshot(
          doc => setProfile(doc.exists ? doc.data() : { name: '', role: '' }),
          error => console.error('Could not load the profile settings:', error),
        ),
      db.collection(BOOKINGS_COLLECTION).onSnapshot(
        snapshot => {
          setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLive(true);
        },
        error => console.error('Could not load bookings for the header:', error),
      ),
      db.collection(INVENTORY_COLLECTION).onSnapshot(
        snapshot => setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        error => console.error('Could not load inventory for the header:', error),
      ),
    ];

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, []);

  const notifications = useMemo(() => {
    const latestBookings = sortBookings(bookings)
      .slice(0, 3)
      .map(booking => ({
        key: `booking-${booking.id}`,
        title: `Booking ${booking.bkId || ''}`.trim(),
        meta: `${formatGuestName(booking)} · ${statusLabel(booking.statusValue)}`,
        to: '/view-booking',
      }));

    const lowStock = items
      .filter(item => stockLevel(item.quantity) !== 'in')
      .slice(0, 2)
      .map(item => ({
        key: `item-${item.id}`,
        title: `Low stock: ${item.name || item.itemCode}`,
        meta: `${item.quantity ?? 0} left · ${item.location || 'no location'}`,
        to: '/view-inventory',
      }));

    return [...lowStock, ...latestBookings];
  }, [bookings, items]);

  const profileName = profile.name || 'Staff profile';
  const profileRole = profile.role || 'Set up in Profile';

  const handleSearch = event => {
    event.preventDefault();
    const term = query.trim();
    history.push(term ? `/view-booking?q=${encodeURIComponent(term)}` : '/view-booking');
  };

  const togglePanel = name => setPanel(current => (current === name ? '' : name));

  return (
    <header className="appHeader">
      <button
        type="button"
        className="appHeader__menu"
        onClick={colupsMenuHandler}
        aria-label="Toggle navigation"
      >
        <Menu size={20} />
      </button>

      <form className="appHeader__search" onSubmit={handleSearch} role="search">
        <Search size={16} />
        <input
          type="search"
          name="globalSearch"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search booking, guest name…"
          aria-label="Search bookings"
        />
      </form>

      <div className="appHeader__actions">
        <Link to="/view-booking?q=confirmed" className="appHeader__quick">
          <Zap size={15} />
          <span>Quick Check-In</span>
        </Link>

        <span className={`appHeader__status${live ? ' is-live' : ''}`}>
          <span className="appHeader__dot" />
          {live ? 'Live' : 'Connecting…'}
        </span>

        <span className="appHeader__currency">
          IDR (Rp)
          <ChevronDown size={13} />
        </span>

        {fullScreenHandler && (
          <button
            type="button"
            className="appHeader__icon appHeader__icon--full"
            onClick={fullScreenHandler}
            aria-label="Toggle full screen"
          >
            <Maximize size={18} />
          </button>
        )}

        <div className="appHeader__dropdown">
          <button
            type="button"
            className="appHeader__icon"
            onClick={() => togglePanel('notifications')}
            aria-label="Notifications"
            aria-expanded={panel === 'notifications'}
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="appHeader__badge">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {panel === 'notifications' && (
            <div className="appHeader__panel">
              <h5>Notifications</h5>
              {notifications.length === 0 ? (
                <p className="appHeader__empty">Nothing to report right now.</p>
              ) : (
                <ul>
                  {notifications.map(item => (
                    <li key={item.key}>
                      <Link to={item.to} onClick={() => setPanel('')}>
                        <strong>{item.title}</strong>
                        <span>{item.meta}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="appHeader__dropdown">
          <button
            type="button"
            className="appHeader__profile"
            onClick={() => togglePanel('profile')}
            aria-expanded={panel === 'profile'}
          >
            <span className="appHeader__avatar">{initials(profile.name)}</span>
            <span className="appHeader__profileText">
              <strong>{profileName}</strong>
              <small>{profileRole}</small>
            </span>
            <ChevronDown size={14} />
          </button>

          {panel === 'profile' && (
            <div className="appHeader__panel appHeader__panel--menu">
              <Link to="/profile" onClick={() => setPanel('')}>
                <User size={15} /> My profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
