import React, { useMemo, useState } from 'react';
import {
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
} from '@material-ui/core';
import {
  KeyboardDatePicker,
  KeyboardTimePicker,
  MuiPickersUtilsProvider,
} from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import {
  GENDER_OPTIONS,
  ROOM_TYPE_OPTIONS,
  STATUS_OPTIONS,
  availableRoomsFor,
  stayNights,
  stayTotal,
  validateBooking,
} from 'utils/bookings';
import { roomStatusLabel } from 'utils/rooms';
import { formatCurrency } from 'utils/currency';
import './style.scss';

/**
 * Shared booking form used by the "add" and "edit" screens.
 *
 * Props:
 *  - initialBooking: form state (see createEmptyBookingForm / deserializeBooking)
 *  - rooms:          Rooms documents; used to assign a physical room
 *  - bookings:       existing bookings; used to reject double bookings
 *  - ignoreBookingId: id of the booking being edited (excluded from availability)
 *  - submitLabel:    text of the primary button
 *  - submitting:     disables the buttons while a Firestore write is running
 *  - onSubmit:       called with the validated form state
 *  - onCancel:       optional; renders a "Cancel" button instead of "Clear"
 */
const BookingForm = ({
  initialBooking,
  rooms = [],
  bookings = [],
  ignoreBookingId,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState(initialBooking);
  const [errors, setErrors] = useState({});

  const setField = (name, value) => {
    setForm(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: undefined }));
  };

  const handleTextChange = name => event => setField(name, event.target.value);

  const handlePickerChange = name => value => setField(name, value);

  const handleRoomChange = event => {
    const roomId = event.target.value;
    const room = rooms.find(item => item.id === roomId);

    setForm(previous => ({
      ...previous,
      roomId,
      roomNumber: room ? room.roomNumber : '',
      roomType: room ? room.roomType : previous.roomType,
      rate: room && room.rentPerNight !== null && room.rentPerNight !== undefined
        ? String(room.rentPerNight)
        : previous.rate,
    }));
    setErrors(previous => ({ ...previous, roomId: undefined }));
  };

  const handleReset = () => {
    setForm(initialBooking);
    setErrors({});
  };

  const handleSubmit = event => {
    event.preventDefault();
    const nextErrors = validateBooking(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(form);
  };

  const errorProps = name =>
    (errors[name] ? { error: true, helperText: errors[name] } : {});

  const selectedRoom = rooms.find(room => room.id === form.roomId);

  const roomOptions = useMemo(() => {
    const options = availableRoomsFor(rooms, bookings, {
      arrivalDate: form.arrivalDate,
      departureDate: form.departureDate,
      roomType: form.roomType,
      ignoreId: ignoreBookingId,
    });

    // Keep the current room selectable even when it is temporarily unavailable
    // (e.g. marked for maintenance) so editing never silently drops it.
    if (selectedRoom && !options.some(room => room.id === selectedRoom.id)) {
      return [selectedRoom, ...options];
    }
    return options;
  }, [
    rooms,
    bookings,
    form.arrivalDate,
    form.departureDate,
    form.roomType,
    ignoreBookingId,
    selectedRoom,
  ]);

  const nights = stayNights(form.arrivalDate, form.departureDate);
  const total = stayTotal(form.rate, form.arrivalDate, form.departureDate);
  const paid = Number(form.paid) || 0;
  const balance = Math.max(total - paid, 0);

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <form className="bookingForm" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xl={4} md={4} sm={6} xs={12}>
            <TextField
              required
              label="Booking ID"
              name="bkId"
              className="inputField"
              fullWidth
              variant="filled"
              value={form.bkId}
              onChange={handleTextChange('bkId')}
              {...errorProps('bkId')}
            />
          </Grid>
          <Grid item xl={4} md={4} sm={6} xs={12}>
            <TextField
              required
              label="First Name"
              name="fname"
              className="inputField"
              fullWidth
              variant="filled"
              value={form.fname}
              onChange={handleTextChange('fname')}
              {...errorProps('fname')}
            />
          </Grid>
          <Grid item xl={4} md={4} sm={6} xs={12}>
            <TextField
              required
              label="Last Name"
              name="lname"
              className="inputField"
              fullWidth
              variant="filled"
              value={form.lname}
              onChange={handleTextChange('lname')}
              {...errorProps('lname')}
            />
          </Grid>

          <Grid item xl={6} md={6} sm={12} xs={12}>
            <TextField
              required
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              className="inputField"
              fullWidth
              variant="filled"
              value={form.email}
              onChange={handleTextChange('email')}
              {...errorProps('email')}
            />
          </Grid>
          <Grid item xl={6} md={6} sm={12} xs={12}>
            <TextField
              required
              label="Phone Number"
              name="phone"
              type="tel"
              autoComplete="tel"
              className="inputField"
              fullWidth
              variant="filled"
              value={form.phone}
              onChange={handleTextChange('phone')}
              {...errorProps('phone')}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl component="fieldset" error={Boolean(errors.gender)}>
              <FormLabel component="legend">Gender</FormLabel>
              <RadioGroup
                row
                name="gender"
                value={form.gender}
                onChange={handleTextChange('gender')}
              >
                {GENDER_OPTIONS.map(option => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    control={<Radio color="primary" />}
                  />
                ))}
              </RadioGroup>
              {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xl={4} md={4} sm={6} xs={12}>
            <TextField
              select
              required
              label="Room Type"
              name="roomType"
              className="inputField"
              fullWidth
              variant="filled"
              value={form.roomType}
              onChange={handleTextChange('roomType')}
              {...errorProps('roomType')}
            >
              {ROOM_TYPE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xl={4} md={4} sm={6} xs={12}>
            <TextField
              required
              label="Number Of Guests"
              name="guestno"
              type="number"
              inputProps={{ min: 1, step: 1 }}
              className="inputField"
              fullWidth
              variant="filled"
              value={form.guestno}
              onChange={handleTextChange('guestno')}
              {...errorProps('guestno')}
            />
          </Grid>
          <Grid item xl={4} md={4} sm={6} xs={12}>
            <TextField
              select
              required
              label="Status"
              name="statusValue"
              className="inputField"
              fullWidth
              variant="filled"
              value={form.statusValue}
              onChange={handleTextChange('statusValue')}
              {...errorProps('statusValue')}
            >
              {STATUS_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xl={4} md={4} sm={6} xs={12}>
            <TextField
              select
              label="Assigned Room"
              name="roomId"
              className="inputField"
              fullWidth
              variant="filled"
              value={form.roomId}
              onChange={handleRoomChange}
              SelectProps={{ displayEmpty: true }}
              error={Boolean(errors.roomId)}
              helperText={
                errors.roomId ||
                (rooms.length > 0 && roomOptions.length === 0
                  ? 'No room is free for these dates'
                  : 'Assign a room to check the guest in')
              }
            >
              <MenuItem value="">Unassigned</MenuItem>
              {roomOptions.map(room => (
                <MenuItem key={room.id} value={room.id}>
                  {`${room.roomNumber} · ${roomStatusLabel(room.status)}${
                    room.rentPerNight ? ` · ${formatCurrency(room.rentPerNight)}` : ''
                  }`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xl={4} md={4} sm={6} xs={12}>
            <TextField
              label="Rate / Night"
              name="rate"
              type="number"
              inputProps={{ min: 0, step: 10000 }}
              className="inputField"
              fullWidth
              variant="filled"
              value={form.rate}
              onChange={handleTextChange('rate')}
              error={Boolean(errors.rate)}
              helperText={errors.rate || 'In Indonesian Rupiah (Rp)'}
            />
          </Grid>
          <Grid item xl={4} md={4} sm={6} xs={12}>
            <TextField
              label="Paid / Deposit"
              name="paid"
              type="number"
              inputProps={{ min: 0, step: 10000 }}
              className="inputField"
              fullWidth
              variant="filled"
              value={form.paid}
              onChange={handleTextChange('paid')}
              error={Boolean(errors.paid)}
              helperText={errors.paid || 'Amount received so far'}
            />
          </Grid>

          <Grid item xs={12}>
            <div className="bookingForm__folio">
              <span>
                {nights} night{nights === 1 ? '' : 's'} × {formatCurrency(Number(form.rate) || 0)}
              </span>
              <strong>Total {formatCurrency(total)}</strong>
              <span>Paid {formatCurrency(paid)}</span>
              <span className={balance > 0 ? 'is-due' : 'is-clear'}>
                Balance {formatCurrency(balance)}
              </span>
            </div>
          </Grid>

          <Grid item xl={6} md={6} sm={6} xs={12}>
            <KeyboardDatePicker
              required
              label="Arrival Date"
              className="datePicker"
              fullWidth
              inputVariant="filled"
              format="DD/MM/YYYY"
              value={form.arrivalDate}
              onChange={handlePickerChange('arrivalDate')}
              InputAdornmentProps={{ position: 'end' }}
              {...errorProps('arrivalDate')}
            />
          </Grid>
          <Grid item xl={6} md={6} sm={6} xs={12}>
            <KeyboardTimePicker
              required
              label="Arrival Time"
              className="timepicker"
              fullWidth
              inputVariant="filled"
              format="hh:mm A"
              mask="__:__ _M"
              value={form.arrivalTime}
              onChange={handlePickerChange('arrivalTime')}
              InputAdornmentProps={{ position: 'end' }}
              {...errorProps('arrivalTime')}
            />
          </Grid>
          <Grid item xl={6} md={6} sm={6} xs={12}>
            <KeyboardDatePicker
              required
              label="Departure Date"
              className="datePicker"
              fullWidth
              inputVariant="filled"
              format="DD/MM/YYYY"
              minDate={form.arrivalDate || undefined}
              value={form.departureDate}
              onChange={handlePickerChange('departureDate')}
              InputAdornmentProps={{ position: 'end' }}
              {...errorProps('departureDate')}
            />
          </Grid>
          <Grid item xl={6} md={6} sm={6} xs={12}>
            <KeyboardTimePicker
              required
              label="Departure Time"
              className="timepicker"
              fullWidth
              inputVariant="filled"
              format="hh:mm A"
              mask="__:__ _M"
              value={form.departureTime}
              onChange={handlePickerChange('departureTime')}
              InputAdornmentProps={{ position: 'end' }}
              {...errorProps('departureTime')}
            />
          </Grid>

          <Grid item xs={12} className="bookingForm__actions">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : submitLabel}
            </Button>
            {onCancel ? (
              <Button variant="outlined" onClick={onCancel} disabled={submitting}>
                Cancel
              </Button>
            ) : (
              <Button variant="outlined" onClick={handleReset} disabled={submitting}>
                Clear
              </Button>
            )}
          </Grid>
        </Grid>
      </form>
    </MuiPickersUtilsProvider>
  );
};

export default BookingForm;
