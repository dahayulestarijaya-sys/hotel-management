import React, { useState } from 'react';
import {
  Button,
  Grid,
  MenuItem,
  TextField,
} from '@material-ui/core';
import {
  INVENTORY_CATEGORY_OPTIONS,
  validateItem,
} from 'utils/inventory';
import './style.scss';

/**
 * Shared inventory item form used by the "add" and "edit" screens.
 *
 * Props:
 *  - initialItem: form state (see createEmptyItemForm / deserializeItem)
 *  - submitLabel: text of the primary button
 *  - submitting:  disables the buttons while a Firestore write is running
 *  - onSubmit:    called with the validated form state
 *  - onCancel:    optional; renders a "Cancel" button instead of "Clear"
 */
const InventoryForm = ({ initialItem, submitLabel, submitting, onSubmit, onCancel }) => {
  const [form, setForm] = useState(initialItem);
  const [errors, setErrors] = useState({});

  const setField = (name, value) => {
    setForm(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: undefined }));
  };

  const handleTextChange = name => event => setField(name, event.target.value);

  const handleReset = () => {
    setForm(initialItem);
    setErrors({});
  };

  const handleSubmit = event => {
    event.preventDefault();
    const nextErrors = validateItem(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(form);
  };

  const errorProps = name =>
    (errors[name] ? { error: true, helperText: errors[name] } : {});

  return (
    <form className="inventoryForm" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={3}>
        <Grid item xl={4} md={4} sm={6} xs={12}>
          <TextField
            required
            label="Item ID"
            name="itemCode"
            className="inputField"
            fullWidth
            variant="filled"
            value={form.itemCode}
            onChange={handleTextChange('itemCode')}
            {...errorProps('itemCode')}
          />
        </Grid>
        <Grid item xl={8} md={8} sm={12} xs={12}>
          <TextField
            required
            label="Item Name"
            name="name"
            className="inputField"
            fullWidth
            variant="filled"
            value={form.name}
            onChange={handleTextChange('name')}
            {...errorProps('name')}
          />
        </Grid>

        <Grid item xl={4} md={4} sm={6} xs={12}>
          <TextField
            select
            required
            label="Category"
            name="category"
            className="inputField"
            fullWidth
            variant="filled"
            value={form.category}
            onChange={handleTextChange('category')}
            {...errorProps('category')}
          >
            {INVENTORY_CATEGORY_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xl={4} md={4} sm={6} xs={12}>
          <TextField
            required
            label="Location"
            name="location"
            placeholder="e.g. Shelf 4"
            className="inputField"
            fullWidth
            variant="filled"
            value={form.location}
            onChange={handleTextChange('location')}
            {...errorProps('location')}
          />
        </Grid>
        <Grid item xl={4} md={4} sm={6} xs={12}>
          <TextField
            required
            label="Quantity"
            name="quantity"
            type="number"
            inputProps={{ min: 0, step: 1 }}
            className="inputField"
            fullWidth
            variant="filled"
            value={form.quantity}
            onChange={handleTextChange('quantity')}
            {...errorProps('quantity')}
          />
        </Grid>

        <Grid item xs={12} className="inventoryForm__actions">
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

export default InventoryForm;
