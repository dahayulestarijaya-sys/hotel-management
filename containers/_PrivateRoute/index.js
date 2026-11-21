import React, { useState } from 'react';
import { Route } from 'react-router-dom';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import { CalendarDays, ChevronRight } from 'lucide-react';
import moment from 'moment';
import Header from 'components/Header/Loadable';
import SidebarNav from 'components/SidebarNav/Loadable';
import Footer from 'components/Footer/Loadable';

import './style.scss';

/**
 * Short description shown under the page title. Keeping it next to the route
 * table means every screen gets the same header rhythm without each page
 * having to render its own hero.
 */
const PAGE_META = {
  Dashboard: 'Live overview of arrivals, departures and booking momentum.',
  'Add Booking': 'Register a guest stay and assign a room in one pass.',
  'View Booking': 'Search the live booking list, check guests in and out.',
  'Edit Booking': 'Update guest details, dates, room and folio.',
  'Add Room': 'Add a sellable room with its rate and amenities.',
  'View Rooms': 'Monitor availability, capacity and nightly rates.',
  'Edit Room': 'Update the room details, status and pricing.',
  'Add Item': 'Add a stock item with its reorder threshold.',
  'View Inventory': 'Track stock levels and low-stock items.',
  'Edit Item': 'Adjust quantity, category and reorder threshold.',
  Reports: 'Occupancy, revenue and stock insights across the property.',
  Profile: 'Property identity and the staff profile used in the app.',
};

/**
 * Authenticated application shell: sidebar, top bar, page heading and content.
 */
export const PrivateRoute = ({ component: Component, title, ...props }) => {
  const fullScreenHandle = useFullScreenHandle();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(open => !open);

  const toggleFullScreen = () => {
    if (fullScreenHandle.active) {
      fullScreenHandle.exit();
    } else {
      fullScreenHandle.enter();
    }
  };

  return (
    <div className="appShell">
      <SidebarNav colupsMenuHandler={toggleMenu} open={menuOpen} />

      <div className="appContent">
        <Header
          colupsMenuHandler={toggleMenu}
          fullScreenHandler={toggleFullScreen}
        />

        <main className="appMain">
          <div className="appPageHead hqReveal">
            <div className="appPageHead__main">
              <div className="appBreadcrumb">
                <span>HotelsQuad</span>
                <ChevronRight size={13} />
                <span className="appBreadcrumb__current">{title}</span>
              </div>

              <h1 className="appTitle">{title}</h1>

              <p className="appSubtitle">
                {PAGE_META[title] ||
                  'Manage the property from one live, connected workspace.'}
              </p>
            </div>

            <div className="appPageHead__aside">
              <span className="appDateChip">
                <CalendarDays size={15} />
                {moment().format('ddd, D MMM YYYY')}
              </span>
              <span className="appLiveChip">
                <span className="appLiveChip__dot" />
                Live data
              </span>
            </div>
          </div>

          <FullScreen handle={fullScreenHandle}>
            <div className="appRoute hqReveal hqReveal--delay-1">
              <Route
                {...props}
                exact
                render={routeProps => <Component {...routeProps} />}
              />
            </div>
          </FullScreen>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default PrivateRoute;
