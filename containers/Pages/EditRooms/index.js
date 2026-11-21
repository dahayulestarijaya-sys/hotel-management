import React, { Fragment, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Link, useHistory, useParams } from 'react-router-dom';
import Card from 'components/Card/Loadable';
import RoomForm from 'components/RoomForm';
import { db, serverTimestamp } from 'utils/firebase';
import {
  ROOMS_COLLECTION,
  deserializeRoom,
  serializeRoom,
} from 'utils/rooms';

export const EditRooms = () => {
  const { id } = useParams();
  const history = useHistory();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [missing, setMissing] = useState(!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      setMissing(true);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);

    db.collection(ROOMS_COLLECTION)
      .doc(id)
      .get()
      .then(doc => {
        if (!active) return;
        if (!doc.exists) {
          setRoom(null);
          setMissing(true);
        } else {
          setRoom({ ...deserializeRoom(doc.data()), id: doc.id });
          setMissing(false);
        }
      })
      .catch(error => {
        if (!active) return;
        console.error('Could not load room:', error);
        toast.error(`Could not load room: ${error.message}`);
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
    const payload = serializeRoom(form);

    try {
      const duplicates = await db
        .collection(ROOMS_COLLECTION)
        .where('roomNumber', '==', payload.roomNumber)
        .get();

      if (duplicates.docs.some(doc => doc.id !== id)) {
        toast.error(`Room number "${payload.roomNumber}" already exists`);
        return;
      }

      await db.collection(ROOMS_COLLECTION).doc(id).update({
        ...payload,
        updatedAt: serverTimestamp(),
      });

      toast.success(`Room "${payload.roomNumber}" updated`);
      history.push('/view-rooms');
    } catch (error) {
      console.error('Could not update room:', error);
      toast.error(`Could not update room: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (missing || !id) {
    return (
      <Card title="Edit Room">
        <p className="roomFormEmpty">
          No room selected. Open one from the{' '}
          <Link to="/view-rooms">rooms list</Link> to edit it.
        </p>
      </Card>
    );
  }

  if (loading || !room) {
    return (
      <Card title="Edit Room">
        <p className="roomFormEmpty">Loading room…</p>
      </Card>
    );
  }

  return (
    <Fragment>
      <Helmet>
        <title>Edit Rooms</title>
      </Helmet>
      <Card title={`Edit room ${room.roomNumber}`} subtitle="Update the room details">
        <RoomForm
          initialRoom={room}
          submitLabel="Save changes"
          submitting={saving}
          onSubmit={handleSave}
          onCancel={() => history.push('/view-rooms')}
        />
      </Card>
    </Fragment>
  );
};

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

const withConnect = connect(null, mapDispatchToProps);

export default compose(withConnect)(EditRooms);
