import React, { Fragment, useState } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import { connect } from 'react-redux';
import { compose } from 'redux';
import Card from 'components/Card/Loadable';
import RoomForm from 'components/RoomForm';
import { db, serverTimestamp } from 'utils/firebase';
import {
  ROOMS_COLLECTION,
  createEmptyRoomForm,
  serializeRoom,
} from 'utils/rooms';

export const AddRooms = () => {
  const [saving, setSaving] = useState(false);
  // Changing the key remounts the form so it is reset to the empty state.
  const [formKey, setFormKey] = useState(0);

  const handleCreate = async form => {
    setSaving(true);
    const payload = serializeRoom(form);

    try {
      // Room numbers are the human facing reference, so keep them unique.
      const duplicates = await db
        .collection(ROOMS_COLLECTION)
        .where('roomNumber', '==', payload.roomNumber)
        .limit(1)
        .get();

      if (!duplicates.empty) {
        toast.error(`Room number "${payload.roomNumber}" already exists`);
        return;
      }

      await db.collection(ROOMS_COLLECTION).add({
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success(`Room "${payload.roomNumber}" created`);
      setFormKey(key => key + 1);
    } catch (error) {
      // Usually a Firestore rules/permissions problem.
      console.error('Could not save room:', error);
      toast.error(`Could not save room: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Fragment>
      <Helmet>
        <title>Add Rooms</title>
      </Helmet>
      <Card title="New Room" subtitle="Add a room to the property">
        <RoomForm
          key={formKey}
          initialRoom={createEmptyRoomForm()}
          submitLabel="Create room"
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

export default compose(withConnect)(AddRooms);
