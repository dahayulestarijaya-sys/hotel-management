import React, { Fragment, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import { connect } from 'react-redux';
import { compose } from 'redux';
import Card from 'components/Card/Loadable';
import BookingForm from 'components/BookingForm';
import { db, serverTimestamp } from 'utils/firebase';
import {
  BOOKINGS_COLLECTION,
  createEmptyBookingForm,
  isRoomAvailable,
  roomStatusForBooking,
  serializeBooking,
} from 'utils/bookings';
import { ROOMS_COLLECTION } from 'utils/rooms';

export const AddBooking = () => {
  const [saving, setSaving] = useState(false);
  // Changing the key remounts the form so it is reset to the empty state.
  const [formKey, setFormKey] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Rooms + existing bookings drive the room picker and the double-booking check.
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

  const handleCreate = async form => {
    setSaving(true);
    const payload = serializeBooking(form);

    try {
      // Booking IDs are the human facing reference, so keep them unique.
      const duplicates = await db
        .collection(BOOKINGS_COLLECTION)
        .where('bkId', '==', payload.bkId)
        .limit(1)
        .get();

      if (!duplicates.empty) {
        toast.error(`Booking ID "${payload.bkId}" is already in use`);
        return;
      }

      if (
        payload.roomId &&
        !isRoomAvailable(bookings, {
          roomId: payload.roomId,
          arrivalDate: payload.arrivalDate,
          departureDate: payload.departureDate,
        })
      ) {
        toast.error(`Room ${payload.roomNumber} is already booked for those dates`);
        return;
      }

      await db.collection(BOOKINGS_COLLECTION).add({
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Keep the room inventory in sync when the booking starts as arrived.
      const nextRoomStatus = roomStatusForBooking(payload.statusValue);
      if (payload.roomId && nextRoomStatus) {
        await db
          .collection(ROOMS_COLLECTION)
          .doc(payload.roomId)
          .set({ status: nextRoomStatus, updatedAt: serverTimestamp() }, { merge: true });
      }

      toast.success(
        payload.roomNumber
          ? `Booking "${payload.bkId}" created · room ${payload.roomNumber}`
          : `Booking "${payload.bkId}" created`,
      );
      setFormKey(key => key + 1);
    } catch (error) {
      // Usually a Firestore rules/permissions problem.
      console.error('Could not save booking:', error);
      toast.error(`Could not save booking: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Fragment>
      <Helmet>
        <title>Add Booking</title>
      </Helmet>
      <Card title="New Booking" subtitle="Register a guest stay">
        <BookingForm
          key={formKey}
          initialBooking={createEmptyBookingForm()}
          rooms={rooms}
          bookings={bookings}
          submitLabel="Create booking"
          submitting={saving}
          onSubmit={handleCreate}
        />
      </Card>
    </Fragment>
  );
};

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

const withConnect = connect(null, mapDispatchToProps);

export default compose(withConnect)(AddBooking);
