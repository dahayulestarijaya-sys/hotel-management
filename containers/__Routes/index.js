import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import PrivateRoute from 'containers/_PrivateRoute';

import DashboardAnalytic from 'containers/Dashboard/Analytic/Loadable';

import AddBooking from 'containers/Pages/AddBooking/Loadable';
import ViewBooking from 'containers/Pages/ViewBooking/Loadable';
import EditBooking from 'containers/Pages/EditBooking/Loadable';

import AddRooms from 'containers/Pages/AddRooms/Loadable';
import ViewRooms from 'containers/Pages/ViewRooms/Loadable';
import EditRooms from 'containers/Pages/EditRooms/Loadable';

import AddItem from 'containers/Pages/AddItem/Loadable';
import ViewInventory from 'containers/Pages/ViewInventory/Loadable';
import EditItem from 'containers/Pages/EditItem/Loadable';

import Reports from 'containers/Pages/Reports/Loadable';
import ProfilePage from 'containers/Pages/ProfilePage/Loadable';

import NotfoundPage from 'components/NotfoundPage/Loadable';

/**
 * Application routes. Only Firestore-backed features are exposed — the
 * template demo pages (inbox, chat, calendar, chart gallery, …) are no longer
 * routed, so nothing in the app shows static demo data.
 */
export const Routes = () => (
  <Switch>
    <Redirect exact from="/" to="/dashboard" />

    <PrivateRoute exact path="/dashboard" title="Dashboard" component={DashboardAnalytic} />

    <PrivateRoute exact path="/add-booking" title="Add Booking" component={AddBooking} />
    <PrivateRoute exact path="/view-booking" title="View Booking" component={ViewBooking} />
    <PrivateRoute exact path="/edit-booking/:id?" title="Edit Booking" component={EditBooking} />

    <PrivateRoute exact path="/add-rooms" title="Add Room" component={AddRooms} />
    <PrivateRoute exact path="/view-rooms" title="View Rooms" component={ViewRooms} />
    <PrivateRoute exact path="/edit-rooms/:id?" title="Edit Room" component={EditRooms} />

    <PrivateRoute exact path="/add-item" title="Add Item" component={AddItem} />
    <PrivateRoute exact path="/view-inventory" title="View Inventory" component={ViewInventory} />
    <PrivateRoute exact path="/edit-item/:id?" title="Edit Item" component={EditItem} />

    <PrivateRoute exact path="/reports" title="Reports" component={Reports} />
    <PrivateRoute exact path="/profile" title="Profile" component={ProfilePage} />

    <Route component={NotfoundPage} />
  </Switch>
);

export default Routes;
