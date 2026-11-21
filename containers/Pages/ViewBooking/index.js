import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Badge, CardBody, Table } from 'reactstrap';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import { Link, useLocation } from 'react-router-dom';
import {
  CircularProgress,
  Grid,
  InputAdornment,
  TextField,
} from '@material-ui/core';
import {
  Download,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Search as SearchIcon,
  Trash2,
} from 'lucide-react';
import Card from 'components/Card/Loadable';
import { db, serverTimestamp } from 'utils/firebase';
import {
  BOOKINGS_COLLECTION,
  bookingBalance,
  bookingRoomType,
  bookingTotal,
  canCheckOut,
  filterBookings,
  formatBookingDate,
  formatBookingTime,
  formatGuestName,
  paymentStatus,
  paymentStatusColor,
  paymentStatusLabel,
  roomStatusForBooking,
  sortBookings,
  statusColor,
  statusLabel,
} from 'utils/bookings';
import { ROOMS_COLLECTION } from 'utils/rooms';
import { formatCurrency } from 'utils/currency';
import { bookingsToCsv, csvFileName, downloadCsv } from 'utils/csv';

/**
 * Booking list: live Firestore data, search, folio (billing) summary and the
 * front-desk actions — check-in / check-out keep the room status in sync.
 */
export const ViewBooking = () => {
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState(
    new URLSearchParams(location.search).get('q') || '',
  );
  const [deletingId, setDeletingId] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    setSearch(new URLSearchParams(location.search).get('q') || '');
  }, [location.search]);

  useEffect(() => {
    // `onSnapshot` returns an unsubscribe function: returning it from the effect
    // detaches the live listener when the page unmounts.
    const unsubscribe = db.collection(BOOKINGS_COLLECTION).onSnapshot(
      snapshot => {
        setBookings(
          sortBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        );
        setLoadError('');
        setLoading(false);
      },
      error => {
        // Usually a Firestore rules problem or a database that was never created.
        console.error('Could not load bookings:', error);
        setLoadError(error.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const visibleBookings = useMemo(() => filterBookings(bookings, search), [
    bookings,
    search,
  ]);

  const handleDelete = async booking => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Delete booking "${booking.bkId}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(booking.id);
    try {
      await db.collection(BOOKINGS_COLLECTION).doc(booking.id).delete();
      toast.success(`Booking "${booking.bkId}" deleted`);
    } catch (error) {
      console.error('Could not delete booking:', error);
      toast.error(`Could not delete booking: ${error.message}`);
    } finally {
      setDeletingId('');
    }
  };

  /**
   * Moves the booking to `status` and applies the matching room status in the
   * same Firestore batch, so occupancy never drifts from the booking state.
   */
  const runStatusChange = async (booking, status, message) => {
    setBusyId(booking.id);

    try {
      const batch = db.batch();
      const bookingUpdate = {
        statusValue: status,
        updatedAt: serverTimestamp(),
      };

      if (status === 'arrived') bookingUpdate.checkedInAt = serverTimestamp();
      if (status === 'departed') bookingUpdate.checkedOutAt = serverTimestamp();

      batch.update(
        db.collection(BOOKINGS_COLLECTION).doc(booking.id),
        bookingUpdate,
      );

      const nextRoomStatus = roomStatusForBooking(status);
      if (booking.roomId && nextRoomStatus) {
        batch.set(
          db.collection(ROOMS_COLLECTION).doc(booking.roomId),
          { status: nextRoomStatus, updatedAt: serverTimestamp() },
          { merge: true },
        );
      }

      await batch.commit();
      toast.success(message);
    } catch (error) {
      console.error('Could not update the booking:', error);
      toast.error(`Could not update the booking: ${error.message}`);
    } finally {
      setBusyId('');
    }
  };

  const handleCheckIn = booking => {
    if (!booking.roomId) {
      toast.error('Assign a room to this booking first (Edit booking).');
      return;
    }

    runStatusChange(
      booking,
      'arrived',
      `${formatGuestName(booking)} checked in · room ${booking.roomNumber} occupied`,
    );
  };

  const handleCheckOut = booking =>
    runStatusChange(
      booking,
      'departed',
      `${formatGuestName(booking)} checked out · room ${booking.roomNumber} available`,
    );

  const handleExport = () => {
    if (visibleBookings.length === 0) return;
    const filename = csvFileName('bookings');
    downloadCsv(filename, bookingsToCsv(visibleBookings));
    toast.success(`Exported ${visibleBookings.length} booking(s) to ${filename}`);
  };


  return (
    <Fragment>
      <Helmet>
        <title>View Booking</title>
      </Helmet>

      {loadError && (
        <Grid className="pageError">
          Could not load bookings: {loadError}
        </Grid>
      )}

      <Card>
        <CardBody>
          <Grid container spacing={2} alignItems="center" className="pageToolbar">
            <Grid item xs={12} md={7} className="pageToolbar__left">
              <Link to="/add-booking" className="uiButton uiButton--primary">
                <Plus size={16} />
                New booking
              </Link>
              <button
                type="button"
                className="uiButton"
                onClick={handleExport}
                disabled={visibleBookings.length === 0}
              >
                <Download size={16} />
                Export CSV
              </button>
              <span className="uiPill">
                {visibleBookings.length} of {bookings.length} booking
                {bookings.length === 1 ? '' : 's'}
              </span>
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                name="search"
                placeholder="Booking ID, guest, email, room…"
                type="search"
                className="inputField"
                fullWidth
                variant="outlined"
                value={search}
                onChange={event => setSearch(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Table responsive className="bookingTable">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Arrival</th>
                <th>Folio</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="pageState">
                    <CircularProgress size={18} /> Loading bookings…
                  </td>
                </tr>
              )}

              {!loading && visibleBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="pageState">
                    {bookings.length === 0
                      ? 'No bookings yet. Create the first one with “New booking”.'
                      : 'No bookings match your search.'}
                  </td>
                </tr>
              )}


              {visibleBookings.map(booking => {
                const total = bookingTotal(booking);
                const balance = bookingBalance(booking);
                const payment = paymentStatus(booking);
                const awaitingRoom = ['confirmed', 'pending'].includes(
                  booking.statusValue,
                );
                const isBusy = busyId === booking.id;

                return (
                  <tr key={booking.id}>
                    <td>{booking.bkId || '—'}</td>
                    <td>
                      <span className="pageMainValue">
                        {formatGuestName(booking)}
                      </span>
                      <span className="pageSubValue">
                        {booking.guestno ? `${booking.guestno} guest${booking.guestno === 1 ? '' : 's'} · ` : ''}
                        {booking.email || statusLabel(booking.selectedValue || 'unknown')}
                      </span>
                    </td>
                    <td>
                      <span className="pageMainValue">
                        {booking.roomNumber || 'Unassigned'}
                      </span>
                      <span className="pageSubValue">
                        {statusLabel(bookingRoomType(booking) || 'room type n/a')}
                      </span>
                    </td>
                    <td>
                      <span className="pageMainValue">
                        {formatBookingDate(booking.arrivalDate)}
                      </span>
                      <span className="pageSubValue">
                        {formatBookingTime(booking.arrivalTime)} ·{' '}
                        {formatBookingDate(booking.departureDate)}
                      </span>
                    </td>
                    <td>
                      <span className="pageMainValue">{formatCurrency(total)}</span>
                      <span className="pageSubValue">
                        <Badge color={paymentStatusColor(payment)}>
                          {paymentStatusLabel(payment)}
                        </Badge>{' '}
                        {total <= 0
                          ? '—'
                          : balance > 0
                            ? `Due ${formatCurrency(balance)}`
                            : 'Settled'}
                      </span>
                    </td>
                    <td>
                      <Badge color={statusColor(booking.statusValue)}>
                        {statusLabel(booking.statusValue)}
                      </Badge>
                    </td>
                    <td>
                      <div className="pageActions">
                        {awaitingRoom && (
                          <button
                            type="button"
                            className="uiIconButton"
                            aria-label="check in booking"
                            title={
                              booking.roomId
                                ? `Check in to room ${booking.roomNumber}`
                                : 'Assign a room first (Edit booking)'
                            }
                            disabled={!booking.roomId || isBusy}
                            onClick={() => handleCheckIn(booking)}
                          >
                            <LogIn size={15} />
                          </button>
                        )}
                        {canCheckOut(booking) && (
                          <button
                            type="button"
                            className="uiIconButton"
                            aria-label="check out booking"
                            title={`Check out · free room ${booking.roomNumber}`}
                            disabled={isBusy}
                            onClick={() => handleCheckOut(booking)}
                          >
                            <LogOut size={15} />
                          </button>
                        )}
                        <Link
                          to={`/edit-booking/${booking.id}`}
                          className="uiIconButton"
                          aria-label="Edit booking"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          type="button"
                          className="uiIconButton uiIconButton--danger"
                          aria-label="delete booking"
                          disabled={deletingId === booking.id}
                          onClick={() => handleDelete(booking)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </Fragment>
  );
};

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

const withConnect = connect(null, mapDispatchToProps);

export default compose(withConnect)(ViewBooking);

