import React, { useState } from 'react';
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid,
  MenuItem,
  TextField,
} from '@material-ui/core';
import {
  AC_OPTIONS,
  AMENITY_OPTIONS,
  CANCELLATION_OPTIONS,
  ROOM_STATUS_OPTIONS,
  ROOM_TYPE_OPTIONS,
  validateRoom,
} from 'utils/rooms';
import './style.scss';

/**
 * Shared room form used by the "add" and "edit" screens.
 *
 * Props:
 *  - initialRoom: form state (see createEmptyRoomForm / deserializeRoom)
 *  - submitLabel: text of the primary button
 *  - submitting:  disables the buttons while a Firestore write is running
 *  - onSubmit:    called with the validated form state
 *  - onCancel:    optional; renders a "Cancel" button instead of "Clear"
 */
const RoomForm = ({ initialRoom, submitLabel, submitting, onSubmit, onCancel }) => {
  const [form, setForm] = useState(initialRoom);
  const [errors, setErrors] = useState({});

  const setField = (name, value) => {
    setForm(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: undefined }));
  };

  const handleTextChange = name => event => setField(name, event.target.value);

  const toggleAmenity = value =>
    setForm(previous => ({
      ...previous,
      amenities: previous.amenities.includes(value)
        ? previous.amenities.filter(item => item !== value)
        : [...previous.amenities, value],
    }));

  const handleReset = () => {
    setForm(initialRoom);
    setErrors({});
  };

  const handleSubmit = event => {
    event.preventDefault();
    const nextErrors = validateRoom(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(form);
  };

  const errorProps = name =>
    (errors[name] ? { error: true, helperText: errors[name] } : {});

  return (
    <form className="roomForm" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={3}>
        <Grid item xl={4} md={4} sm={6} xs={12}>
          <TextField
            required
            label="Room Number"
            name="roomNumber"
            className="inputField"
            fullWidth
            variant="filled"
            value={form.roomNumber}
            onChange={handleTextChange('roomNumber')}
            {...errorProps('roomNumber')}
          />
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
            select
            required
            label="AC / Non AC"
            name="acType"
            className="inputField"
            fullWidth
            variant="filled"
            value={form.acType}
            onChange={handleTextChange('acType')}
            {...errorProps('acType')}
          >
            {AC_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xl={3} md={3} sm={6} xs={12}>
          <TextField
            required
            label="Bed Capacity"
            name="bedCapacity"
            type="number"
            inputProps={{ min: 1, max: 20, step: 1 }}
            className="inputField"
            fullWidth
            variant="filled"
            value={form.bedCapacity}
            onChange={handleTextChange('bedCapacity')}
            {...errorProps('bedCapacity')}
          />
        </Grid>
        <Grid item xl={3} md={3} sm={6} xs={12}>
          <TextField
            required
            label="Rent Per Night"
            name="rentPerNight"
            type="number"
            inputProps={{ min: 0, step: 1 }}
            helperText={errors.rentPerNight || 'In Indonesian Rupiah (Rp)'}
            error={Boolean(errors.rentPerNight)}
            className="inputField"
            fullWidth
            variant="filled"
            value={form.rentPerNight}
            onChange={handleTextChange('rentPerNight')}
          />
        </Grid>
        <Grid item xl={3} md={3} sm={6} xs={12}>
          <TextField
            select
            required
            label="Status"
            name="status"
            className="inputField"
            fullWidth
            variant="filled"
            value={form.status}
            onChange={handleTextChange('status')}
            {...errorProps('status')}
          >
            {ROOM_STATUS_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xl={3} md={3} sm={6} xs={12}>
          <TextField
            select
            required
            label="Cancellation Charges"
            name="cancellation"
            className="inputField"
            fullWidth
            variant="filled"
            value={form.cancellation}
            onChange={handleTextChange('cancellation')}
            {...errorProps('cancellation')}
          >
            {CANCELLATION_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xl={6} md={6} sm={12} xs={12}>
          <TextField
            required
            label="Phone Number"
            name="phone"
            type="tel"
            className="inputField"
            fullWidth
            variant="filled"
            value={form.phone}
            onChange={handleTextChange('phone')}
            {...errorProps('phone')}
          />
        </Grid>
        <Grid item xl={6} md={6} sm={12} xs={12}>
          <TextField
            label="Room Details"
            name="details"
            multiline
            rows={4}
            className="inputField"
            fullWidth
            variant="filled"
            value={form.details}
            onChange={handleTextChange('details')}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Amenities Included</FormLabel>
            <FormGroup row>
              {AMENITY_OPTIONS.map(option => (
                <FormControlLabel
                  key={option.value}
                  label={option.label}
                  control={
                    <Checkbox
                      name="amenities"
                      value={option.value}
                      color="primary"
                      checked={form.amenities.includes(option.value)}
                      onChange={() => toggleAmenity(option.value)}
                    />
                  }
                />
              ))}
            </FormGroup>
            <FormHelperText>{form.amenities.length} selected</FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} className="roomForm__actions">
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
  );
};

export default RoomForm;

