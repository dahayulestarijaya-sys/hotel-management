import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Badge, CardBody, Table } from 'reactstrap';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import {
  CircularProgress,
  FormControlLabel,
  Grid,
  InputAdornment,
  Switch,
  TextField,
} from '@material-ui/core';
import { Download, Pencil, Plus, Search as SearchIcon, Trash2 } from 'lucide-react';
import Card from 'components/Card/Loadable';
import { db } from 'utils/firebase';
import { csvFileName, downloadCsv, inventoryToCsv } from 'utils/csv';
import {
  INVENTORY_COLLECTION,
  categoryLabel,
  filterItems,
  isLowStock,
  sortItems,
  stockColor,
  stockLabel,
  stockLevel,
} from 'utils/inventory';

export const ViewInventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  useEffect(() => {
    // `onSnapshot` returns an unsubscribe function: returning it from the effect
    // detaches the live listener when the page unmounts.
    const unsubscribe = db.collection(INVENTORY_COLLECTION).onSnapshot(
      snapshot => {
        setItems(sortItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        setLoadError('');
        setLoading(false);
      },
      error => {
        // Usually a Firestore rules problem or a database that was never created.
        console.error('Could not load inventory:', error);
        setLoadError(error.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const visibleItems = useMemo(() => {
    const searched = filterItems(items, search);
    return lowStockOnly ? searched.filter(isLowStock) : searched;
  }, [items, search, lowStockOnly]);

  const handleExport = () => {
    if (visibleItems.length === 0) return;
    const filename = csvFileName('inventory');
    downloadCsv(filename, inventoryToCsv(visibleItems));
    toast.success(`Exported ${visibleItems.length} item(s) to ${filename}`);
  };

  const handleDelete = async item => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Delete inventory item "${item.name}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      await db.collection(INVENTORY_COLLECTION).doc(item.id).delete();
      toast.success(`Item "${item.name}" deleted`);
    } catch (error) {
      console.error('Could not delete inventory item:', error);
      toast.error(`Could not delete item: ${error.message}`);
    } finally {
      setDeletingId('');
    }
  };

  return (
    <Fragment>
      <Helmet>
        <title>View Inventory</title>
      </Helmet>

      {loadError && (
        <Grid className="pageError">
          Could not load inventory: {loadError}
        </Grid>
      )}

      <Card>
        <CardBody>
          <Grid container spacing={2} alignItems="center" className="pageToolbar">
            <Grid item xs={12} md={4} className="pageToolbar__left">
              <Link to="/add-item" className="uiButton uiButton--primary">
                <Plus size={16} />
                New item
              </Link>
              <button
                type="button"
                className="uiButton"
                onClick={handleExport}
                disabled={visibleItems.length === 0}
              >
                <Download size={16} />
                Export CSV
              </button>
              <span className="uiPill">
                {visibleItems.length} of {items.length} item
                {items.length === 1 ? '' : 's'}
              </span>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="search"
                placeholder="Item ID, name, category, location…"
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
              <FormControlLabel
                className="inventoryFilter"
                control={
                  <Switch
                    color="primary"
                    checked={lowStockOnly}
                    onChange={event => setLowStockOnly(event.target.checked)}
                    name="lowStockOnly"
                  />
                }
                label="Only low stock"
              />
            </Grid>
          </Grid>

          <Table responsive className="inventoryTable">
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Location</th>
                <th>Quantity</th>
                <th>Stock</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="pageState">
                    <CircularProgress size={18} /> Loading inventory…
                  </td>
                </tr>
              )}

              {!loading && visibleItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="pageState">
                    {items.length === 0
                      ? 'No inventory items yet. Add the first one with “New item”.'
                      : 'No items match your filters.'}
                  </td>
                </tr>
              )}

              {visibleItems.map(item => {
                const level = stockLevel(item.quantity);

                return (
                  <tr key={item.id}>
                    <td>
                      <span className="pageMainValue">{item.itemCode || '—'}</span>
                    </td>
                    <td>{item.name || '—'}</td>
                    <td>{categoryLabel(item.category)}</td>
                    <td>{item.location || '—'}</td>
                    <td>{item.quantity === null || item.quantity === undefined
                      ? '—'
                      : item.quantity}
                    </td>
                    <td>
                      <Badge color={stockColor(level)}>{stockLabel(level)}</Badge>
                    </td>
                    <td>
                      <div className="pageActions">
                        <Link
                          to={`/edit-item/${item.id}`}
                          className="uiIconButton"
                          aria-label="Edit item"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          type="button"
                          className="uiIconButton uiIconButton--danger"
                          aria-label="delete item"
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item)}
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

export default compose(withConnect)(ViewInventory);

