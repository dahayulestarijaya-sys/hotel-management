import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BedDouble,
  Building2,
  CalendarCheck2,
  ChevronDown,
  LayoutDashboard,
  PackageSearch,
  PanelLeft,
  Settings,
  User,
} from 'lucide-react';
import { db } from 'utils/firebase';
import { PROPERTY_DOC, SETTINGS_COLLECTION } from 'utils/settings';
import './style.scss';

/**
 * Application sidebar.
 *
 * Groups expand/collapse; the group containing the current route opens
 * automatically. Icons come from lucide-react so the whole app shares one icon
 * set. The property block is read from Firestore (`Settings/property`).
 */
const NAVIGATION = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  {
    key: 'bookings',
    label: 'Bookings',
    icon: CalendarCheck2,
    items: [
      { label: 'Add Booking', to: '/add-booking' },
      { label: 'View Booking', to: '/view-booking' },
      { label: 'Edit Booking', to: '/edit-booking' },
    ],
  },
  {
    key: 'rooms',
    label: 'Rooms',
    icon: BedDouble,
    items: [
      { label: 'Add Room', to: '/add-rooms' },
      { label: 'View Rooms', to: '/view-rooms' },
      { label: 'Edit Room', to: '/edit-rooms' },
    ],
  },
  { key: 'reports', label: 'Reports', icon: BarChart3, to: '/reports' },
  {
    key: 'inventory',
    label: 'Inventory',
    icon: PackageSearch,
    items: [
      { label: 'Add Item', to: '/add-item' },
      { label: 'View Inventory', to: '/view-inventory' },
      { label: 'Edit Item', to: '/edit-item' },
    ],
  },
  { key: 'profile', label: 'Profile', icon: User, to: '/profile' },
];

const groupMatchesPath = (group, pathname) =>
  Boolean(group.items && group.items.some(item => pathname.startsWith(item.to)));

export const SidebarNav = ({ colupsMenuHandler, open, colupsMenu }) => {
  const location = useLocation();
  const [expanded, setExpanded] = useState({ bookings: true, rooms: false, inventory: false });
  const [property, setProperty] = useState({ name: '', code: '' });
  const isOpen = typeof open === 'boolean' ? open : Boolean(colupsMenu);

  useEffect(() => {
    const unsubscribe = db
      .collection(SETTINGS_COLLECTION)
      .doc(PROPERTY_DOC)
      .onSnapshot(
        doc => setProperty(doc.exists ? { name: doc.data().name || '', code: doc.data().code || '' } : { name: '', code: '' }),
        error => console.error('Could not load the property settings:', error),
      );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const activeGroup = NAVIGATION.find(group => groupMatchesPath(group, location.pathname));
    if (activeGroup) {
      setExpanded(previous => ({ ...previous, [activeGroup.key]: true }));
    }
  }, [location.pathname]);

  // Mobile drawer: lock the page behind it and allow Escape to close it.
  useEffect(() => {
    if (!isOpen || typeof colupsMenuHandler !== 'function') return undefined;

    const handleKeyDown = event => {
      if (event.key === 'Escape') colupsMenuHandler();
    };
    const previousOverflow = document.body.style.overflow;

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, colupsMenuHandler]);

  const toggleGroup = key =>
    setExpanded(previous => ({ ...previous, [key]: !previous[key] }));

  const handleNavigate = () => {
    window.scrollTo(0, 0);
    // On mobile the menu is an off-canvas drawer: close it after navigating.
    if (isOpen) colupsMenuHandler();
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="sidebarScrim"
          onClick={colupsMenuHandler}
          aria-label="Close navigation"
        />
      )}

      <div className={`sidebarMainWrapper${isOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="sidebarToggle"
          onClick={colupsMenuHandler}
          aria-label="Toggle navigation"
        >
          <PanelLeft size={18} />
        </button>

        <div className="sidebar">
          <NavLink to="/dashboard" className="sidebar__brand" onClick={handleNavigate}>
            <span className="sidebar__logo">
              <Building2 size={20} />
            </span>
            <span className="sidebar__brandText">
              <strong>HotelsQuad</strong>
              <small>PMS CLOUD</small>
            </span>
          </NavLink>

          <nav className="sidebar__nav">
            <span className="sidebar__sectionLabel">Workspace</span>
            {NAVIGATION.map(group => {
              if (!group.items) {
                const Icon = group.icon;

                return (
                  <NavLink
                    key={group.key}
                    to={group.to}
                    className="navItem navItem--single"
                    activeClassName="is-active"
                    onClick={handleNavigate}
                  >
                    <span className="navItem__icon"><Icon size={18} /></span>
                    <span className="navItem__label">{group.label}</span>
                  </NavLink>
                );
              }

              const Icon = group.icon;
              const isExpanded = Boolean(expanded[group.key]);
              const isActive = groupMatchesPath(group, location.pathname);

              return (
                <div
                  key={group.key}
                  className={`navGroup${isExpanded ? ' is-expanded' : ''}${isActive ? ' is-active' : ''}`}
                >
                  <button
                    type="button"
                    className="navGroup__header"
                    onClick={() => toggleGroup(group.key)}
                    aria-expanded={isExpanded}
                  >
                    <span className="navItem__icon"><Icon size={18} /></span>
                    <span className="navItem__label">{group.label}</span>
                    <ChevronDown size={16} className="navGroup__chevron" />
                  </button>

                  {isExpanded && (
                    <div className="navGroup__items">
                      {group.items.map(item => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className="navSubItem"
                          activeClassName="is-active"
                          onClick={handleNavigate}
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="sidebar__footer">
            <span className="sidebar__propertyIcon">
              <Building2 size={15} />
            </span>
            <div className="sidebar__propertyText">
              <span className="sidebar__footerLabel">
                {property.name || 'Property'}
              </span>
              <strong>{property.code || 'Not configured'}</strong>
            </div>
            <NavLink
              to="/profile"
              className="sidebar__settings"
              aria-label="Property settings"
              onClick={handleNavigate}
            >
              <Settings size={16} />
            </NavLink>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarNav;
