import React, { Fragment, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Link, useHistory, useParams } from 'react-router-dom';
import Card from 'components/Card/Loadable';
import InventoryForm from 'components/InventoryForm';
import { db, serverTimestamp } from 'utils/firebase';
import {
  INVENTORY_COLLECTION,
  deserializeItem,
  serializeItem,
} from 'utils/inventory';

export const EditItem = () => {
  const { id } = useParams();
  const history = useHistory();

  const [item, setItem] = useState(null);
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

    db.collection(INVENTORY_COLLECTION)
      .doc(id)
      .get()
      .then(doc => {
        if (!active) return;
        if (!doc.exists) {
          setItem(null);
          setMissing(true);
        } else {
          setItem({ ...deserializeItem(doc.data()), id: doc.id });
          setMissing(false);
        }
      })
      .catch(error => {
        if (!active) return;
        console.error('Could not load inventory item:', error);
        toast.error(`Could not load item: ${error.message}`);
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
    const payload = serializeItem(form);

    try {
      const duplicates = await db
        .collection(INVENTORY_COLLECTION)
        .where('itemCode', '==', payload.itemCode)
        .get();

      if (duplicates.docs.some(doc => doc.id !== id)) {
        toast.error(`Item ID "${payload.itemCode}" already exists`);
        return;
      }

      await db.collection(INVENTORY_COLLECTION).doc(id).update({
        ...payload,
        updatedAt: serverTimestamp(),
      });

      toast.success(`Item "${payload.name}" updated`);
      history.push('/view-inventory');
    } catch (error) {
      console.error('Could not update inventory item:', error);
      toast.error(`Could not update item: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (missing || !id) {
    return (
      <Card title="Edit Item">
        <p className="inventoryFormEmpty">
          No item selected. Open one from the{' '}
          <Link to="/view-inventory">inventory list</Link> to edit it.
        </p>
      </Card>
    );
  }

  if (loading || !item) {
    return (
      <Card title="Edit Item">
        <p className="inventoryFormEmpty">Loading item…</p>
      </Card>
    );
  }

  return (
    <Fragment>
      <Helmet>
        <title>Edit Item</title>
      </Helmet>
      <Card title={`Edit item ${item.itemCode}`} subtitle={item.name}>
        <InventoryForm
          initialItem={item}
          submitLabel="Save changes"
          submitting={saving}
          onSubmit={handleSave}
          onCancel={() => history.push('/view-inventory')}
        />
      </Card>
    </Fragment>
  );
};

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

const withConnect = connect(null, mapDispatchToProps);

export default compose(withConnect)(EditItem);
