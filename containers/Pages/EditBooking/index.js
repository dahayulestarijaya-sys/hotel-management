import React, { Fragment, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Link, useHistory, useParams } from 'react-router-dom';
import Card from 'components/Card/Loadable';
import BookingForm from 'components/BookingForm';
import { db, serverTimestamp } from 'utils/firebase';
import {
  BOOKINGS_COLLECTION,
  deserializeBooking,
  isRoomAvailable,
  roomStatusForBooking,
  serializeBooking,
} from 'utils/bookings';
import { ROOMS_COLLECTION } from 'utils/rooms';

export const EditBooking = () => {
  const { id } = useParams();
  const history = useHistory();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [missing, setMissing] = useState(!id);
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Room picker + availability check (the booking being edited is ignored).
  useEffect(() => {
    const unsubscribes = [
      db.collection(ROOMS_COLLECTION).onSnapshot(
        snapshot => setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        error => console.error('Could not load rooms:', error),
      ),
      db.collection(BOOKINGS_COLLECTION).onSnapshot(
        snapshot => setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        error => console.error('Could not load bookings:', error),
      ),
    ];

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, []);

  useEffect(() => {
    if (!id) {
      setMissing(true);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);

    db.collection(BOOKINGS_COLLECTION)
      .doc(id)
      .get()
      .then(doc => {
        if (!active) return;
        if (!doc.exists) {
          setBooking(null);
          setMissing(true);
        } else {
          setBooking({ ...deserializeBooking(doc.data()), id: doc.id });
          setMissing(false);
        }
      })
      .catch(error => {
        if (!active) return;
        console.error('Could not load booking:', error);
        toast.error(`Could not load booking: ${error.message}`);
        setMissing(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleSave = async form => {
    setSaving(true);
    const payload = serializeBooking(form);

    try {
      const duplicates = await db
        .collection(BOOKINGS_COLLECTION)
        .where('bkId', '==', payload.bkId)
        .get();

      if (duplicates.docs.some(doc => doc.id !== id)) {
        toast.error(`Booking ID "${payload.bkId}" is already in use`);
        return;
      }

      if (
        payload.roomId &&
        !isRoomAvailable(bookings, {
          roomId: payload.roomId,
          arrivalDate: payload.arrivalDate,
          departureDate: payload.departureDate,
          ignoreId: id,
        })
      ) {
        toast.error(`Room ${payload.roomNumber} is already booked for those dates`);
        return;
      }

      await db.collection(BOOKINGS_COLLECTION).doc(id).update({
        ...payload,
        updatedAt: serverTimestamp(),
      });

      // Room handover: free the previous room and occupy the new one.
      const nextRoomStatus = roomStatusForBooking(payload.statusValue);
      const previousRoomId = booking.roomId;

      if (nextRoomStatus && previousRoomId && previousRoomId !== payload.roomId) {
        await db
          .collection(ROOMS_COLLECTION)
          .doc(previousRoomId)
          .set({ status: 'available', updatedAt: serverTimestamp() }, { merge: true });
      }

      if (nextRoomStatus && payload.roomId) {
        await db
          .collection(ROOMS_COLLECTION)
          .doc(payload.roomId)
          .set({ status: nextRoomStatus, updatedAt: serverTimestamp() }, { merge: true });
      }

      toast.success(`Booking "${payload.bkId}" updated`);
      history.push('/view-booking');
    } catch (error) {
      console.error('Could not update booking:', error);
      toast.error(`Could not update booking: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (missing || !id) {
    return (
      <Card title="Edit Booking">
        <p className="bookingFormEmpty">
          No booking selected. Open one from the{' '}
          <Link to="/view-booking">bookings list</Link> to edit it.
        </p>
      </Card>
    );
  }

  if (loading || !booking) {
    return (
      <Card title="Edit Booking">
        <p className="bookingFormEmpty">Loading booking…</p>
      </Card>
    );
  }

  return (
    <Fragment>
      <Helmet>
        <title>Edit Booking</title>
      </Helmet>
      <Card
        title={`Edit booking ${booking.bkId}`}
        subtitle={`${booking.fname} ${booking.lname}`.trim()}
      >
        <BookingForm
          initialBooking={booking}
          rooms={rooms}
          bookings={bookings}
          ignoreBookingId={id}
          submitLabel="Save changes"
          submitting={saving}
          onSubmit={handleSave}
          onCancel={() => history.push('/view-booking')}
        />
      </Card>
    </Fragment>
  );
};

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

const withConnect = connect(null, mapDispatchToProps);

export default compose(withConnect)(EditBooking);
