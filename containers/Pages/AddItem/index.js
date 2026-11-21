import React, { Fragment, useState } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import { connect } from 'react-redux';
import { compose } from 'redux';
import Card from 'components/Card/Loadable';
import InventoryForm from 'components/InventoryForm';
import { db, serverTimestamp } from 'utils/firebase';
import {
  INVENTORY_COLLECTION,
  createEmptyItemForm,
  serializeItem,
} from 'utils/inventory';

export const AddItem = () => {
  const [saving, setSaving] = useState(false);
  // Changing the key remounts the form so it is reset to the empty state.
  const [formKey, setFormKey] = useState(0);

  const handleCreate = async form => {
    setSaving(true);
    const payload = serializeItem(form);

    try {
      // Item IDs are the human facing reference, so keep them unique.
      const duplicates = await db
        .collection(INVENTORY_COLLECTION)
        .where('itemCode', '==', payload.itemCode)
        .limit(1)
        .get();

      if (!duplicates.empty) {
        toast.error(`Item ID "${payload.itemCode}" already exists`);
        return;
      }

      await db.collection(INVENTORY_COLLECTION).add({
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success(`Item "${payload.name}" added`);
      setFormKey(key => key + 1);
    } catch (error) {
      // Usually a Firestore rules/permissions problem.
      console.error('Could not save inventory item:', error);
      toast.error(`Could not save item: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Fragment>
      <Helmet>
        <title>Add Item</title>
      </Helmet>
      <Card title="New Inventory Item" subtitle="Add stock to the inventory">
        <InventoryForm
          key={formKey}
          initialItem={createEmptyItemForm()}
          submitLabel="Add item"
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

export default compose(withConnect)(AddItem);
