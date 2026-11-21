import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Badge, CardBody, Table } from 'reactstrap';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import {
  CircularProgress,
  Grid,
  InputAdornment,
  Slider,
  TextField,
} from '@material-ui/core';
import { Download, Pencil, Plus, Search as SearchIcon, Trash2 } from 'lucide-react';
import Card from 'components/Card/Loadable';
import { db } from 'utils/firebase';
import { csvFileName, downloadCsv, roomsToCsv } from 'utils/csv';
import {
  ROOMS_COLLECTION,
  acTypeLabel,
  filterRooms,
  filterRoomsByBeds,
  formatRent,
  roomStatusColor,
  roomStatusLabel,
  roomTypeLabel,
  sortRooms,
} from 'utils/rooms';

export const ViewRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [minBeds, setMinBeds] = useState(1);
  const [deletingId, setDeletingId] = useState('');

  useEffect(() => {
    // `onSnapshot` returns an unsubscribe function: returning it from the effect
    // detaches the live listener when the page unmounts.
    const unsubscribe = db.collection(ROOMS_COLLECTION).onSnapshot(
      snapshot => {
        setRooms(sortRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        setLoadError('');
        setLoading(false);
      },
      error => {
        // Usually a Firestore rules problem or a database that was never created.
        console.error('Could not load rooms:', error);
        setLoadError(error.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const visibleRooms = useMemo(
    () => filterRoomsByBeds(filterRooms(rooms, search), minBeds),
    [rooms, search, minBeds],
  );

  const handleExport = () => {
    if (visibleRooms.length === 0) return;
    const filename = csvFileName('rooms');
    downloadCsv(filename, roomsToCsv(visibleRooms));
    toast.success(`Exported ${visibleRooms.length} room(s) to ${filename}`);
  };

  const handleDelete = async room => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Delete room "${room.roomNumber}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(room.id);
    try {
      await db.collection(ROOMS_COLLECTION).doc(room.id).delete();
      toast.success(`Room "${room.roomNumber}" deleted`);
    } catch (error) {
      console.error('Could not delete room:', error);
      toast.error(`Could not delete room: ${error.message}`);
    } finally {
      setDeletingId('');
    }
  };

  return (
    <Fragment>
      <Helmet>
        <title>View Rooms</title>
      </Helmet>

      {loadError && (
        <Grid className="pageError">
          Could not load rooms: {loadError}
        </Grid>
      )}

      <Card>
        <CardBody>
          <Grid container spacing={2} alignItems="center" className="pageToolbar">
            <Grid item xs={12} md={4} className="pageToolbar__left">
              <Link to="/add-rooms" className="uiButton uiButton--primary">
                <Plus size={16} />
                New room
              </Link>
              <button
                type="button"
                className="uiButton"
                onClick={handleExport}
                disabled={visibleRooms.length === 0}
              >
                <Download size={16} />
                Export CSV
              </button>
              <span className="uiPill">
                {visibleRooms.length} of {rooms.length} room
                {rooms.length === 1 ? '' : 's'}
              </span>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="search"
                placeholder="Room number, type, status, phone…"
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
            <Grid item xs={12} md={4}>
              <div className="roomBedFilter">
                <span>
                  Minimum bed capacity: <b>{minBeds}</b>
                </span>
                <Slider
                  value={minBeds}
                  min={1}
                  max={10}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                  aria-label="Minimum bed capacity"
                  onChange={(event, value) => setMinBeds(Array.isArray(value) ? value[0] : value)}
                />
              </div>
            </Grid>
          </Grid>

          <Table responsive className="roomTable">
            <thead>
              <tr>
                <th>Room Number</th>
                <th>Room Type</th>
                <th>Phone</th>
                <th>Rent / Night</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="pageState">
                    <CircularProgress size={18} /> Loading rooms…
                  </td>
                </tr>
              )}

              {!loading && visibleRooms.length === 0 && (
                <tr>
                  <td colSpan={6} className="pageState">
                    {rooms.length === 0
                      ? 'No rooms yet. Create the first one with “Add Room”.'
                      : 'No rooms match your filters.'}
                  </td>
                </tr>
              )}

              {visibleRooms.map(room => (
                <tr key={room.id}>
                  <td>
                    <span className="pageMainValue">{room.roomNumber || '—'}</span>
                    {room.details && <span className="pageSubValue">{room.details}</span>}
                  </td>
                  <td>
                    <span className="pageMainValue">{roomTypeLabel(room.roomType)}</span>
                    <span className="pageSubValue">
                      {acTypeLabel(room.acType)} · {room.bedCapacity || 0} bed
                      {Number(room.bedCapacity) === 1 ? '' : 's'}
                    </span>
                  </td>
                  <td>{room.phone || '—'}</td>
                  <td>{formatRent(room.rentPerNight)}</td>
                  <td>
                    <Badge color={roomStatusColor(room.status)}>
                      {roomStatusLabel(room.status)}
                    </Badge>
                  </td>
                  <td>
                    <div className="pageActions">
                      <Link
                        to={`/edit-rooms/${room.id}`}
                        className="uiIconButton"
                        aria-label="Edit room"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        type="button"
                        className="uiIconButton uiIconButton--danger"
                        aria-label="delete room"
                        disabled={deletingId === room.id}
                        onClick={() => handleDelete(room)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

export default compose(withConnect)(ViewRooms);

