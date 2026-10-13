import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { StatusBadge } from '../components/Badge';
import {
  Package,
  Plus,
  Sliders,
  MapPin,
  Tag,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export function InventoryView() {
  const { isCoordinator } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('items'); // 'items', 'locations', 'assets'

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterKind, setFilterKind] = useState('');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Form states
  const [selectedItemForAction, setSelectedItemForAction] = useState(null);

  // New Item Form
  const [itemForm, setItemForm] = useState({
    code: '',
    name: '',
    category: '',
    description: '',
    kind: 'QUANTITY',
    initial_quantity: 10,
    max_issue_qty: 2,
    location_id: '',
  });

  // New Asset Form
  const [assetForm, setAssetForm] = useState({
    asset_tag: '',
    serial_no: '',
    condition: 'GOOD',
    location_id: '',
  });

  // Adjust Form
  const [adjustForm, setAdjustForm] = useState({
    action: 'ADD',
    bucket: 'AVAILABLE',
    to_bucket: 'AVAILABLE',
    quantity: 1,
    reason: '',
  });

  // Location Form
  const [locationForm, setLocationForm] = useState({
    name: '',
    kind: 'LABORATORY',
    description: '',
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [iRes, lRes, aRes] = await Promise.all([
        api.listItems({ limit: 200 }),
        api.listLocations(),
        api.listAssets({ limit: 300 }),
      ]);
      setItems(iRes || []);
      setLocations(lRes || []);
      setAssets(aRes || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  // Create Item
  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      await api.createItem({
        ...itemForm,
        initial_quantity: itemForm.kind === 'QUANTITY' ? parseInt(itemForm.initial_quantity, 10) || 0 : 0,
        max_issue_qty: itemForm.max_issue_qty ? parseInt(itemForm.max_issue_qty, 10) : null,
        location_id: itemForm.location_id ? parseInt(itemForm.location_id, 10) : null,
      });
      toast.success('Item created successfully!');
      setShowItemModal(false);
      setItemForm({ code: '', name: '', category: '', description: '', kind: 'QUANTITY', initial_quantity: 10, max_issue_qty: 2, location_id: '' });
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Failed to create item');
    }
  };

  // Create Asset
  const handleCreateAsset = async (e) => {
    e.preventDefault();
    if (!selectedItemForAction) return;
    try {
      await api.createAsset(selectedItemForAction.id, {
        asset_tag: assetForm.asset_tag.trim(),
        serial_no: assetForm.serial_no.trim() || null,
        condition: assetForm.condition,
        location_id: assetForm.location_id ? parseInt(assetForm.location_id, 10) : null,
      });
      toast.success('Asset tag registered successfully!');
      setShowAssetModal(false);
      setAssetForm({ asset_tag: '', serial_no: '', condition: 'GOOD', location_id: '' });
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Failed to register asset');
    }
  };

  // Adjust Stock
  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedItemForAction) return;
    try {
      await api.adjustItem(selectedItemForAction.id, {
        action: adjustForm.action,
        bucket: adjustForm.bucket,
        to_bucket: adjustForm.action === 'MOVE' ? adjustForm.to_bucket : null,
        quantity: parseInt(adjustForm.quantity, 10),
        reason: adjustForm.reason.trim(),
      });
      toast.success('Stock adjustment applied and audited!');
      setShowAdjustModal(false);
      setAdjustForm({ action: 'ADD', bucket: 'AVAILABLE', to_bucket: 'AVAILABLE', quantity: 1, reason: '' });
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Adjustment failed');
    }
  };

  // Create Location
  const handleCreateLocation = async (e) => {
    e.preventDefault();
    try {
      await api.createLocation(locationForm);
      toast.success('Location registered successfully!');
      setShowLocationModal(false);
      setLocationForm({ name: '', kind: 'LABORATORY', description: '' });
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Failed to add location');
    }
  };

  // Filtered items
  const filteredItems = items.filter((it) => {
    const matchSearch =
      !searchQuery ||
      it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = !filterCategory || it.category === filterCategory;
    const matchKind = !filterKind || it.kind === filterKind;
    return matchSearch && matchCat && matchKind;
  });

  const categories = Array.from(new Set(items.map((i) => i.category))).filter(Boolean);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Inventory & Asset Catalog</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Serialized hardware assets, bulk consumables, locations and stock adjustment controls
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '0.25rem' }}>
            <button
              className={`btn ${activeTab === 'items' ? 'btn-primary' : 'btn-icon'}`}
              onClick={() => setActiveTab('items')}
            >
              Items ({items.length})
            </button>
            <button
              className={`btn ${activeTab === 'assets' ? 'btn-primary' : 'btn-icon'}`}
              onClick={() => setActiveTab('assets')}
            >
              Assets ({assets.length})
            </button>
            <button
              className={`btn ${activeTab === 'locations' ? 'btn-primary' : 'btn-icon'}`}
              onClick={() => setActiveTab('locations')}
            >
              Locations ({locations.length})
            </button>
          </div>

          {isCoordinator && activeTab === 'items' && (
            <button className="btn btn-primary" onClick={() => setShowItemModal(true)}>
              <Plus size={16} /> New Item
            </button>
          )}

          {isCoordinator && activeTab === 'locations' && (
            <button className="btn btn-primary" onClick={() => setShowLocationModal(true)}>
              <Plus size={16} /> New Location
            </button>
          )}
        </div>
      </div>

      {/* ITEMS TAB */}
      {activeTab === 'items' && (
        <div>
          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="Search by item code or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: '180px' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: '160px' }}
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="QUANTITY">Quantity Only</option>
              <option value="ASSET">Asset Tracked</option>
            </select>
          </div>

          {/* Items Table */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Tracking Kind</th>
                  <th>Max Loan Qty</th>
                  <th>Status</th>
                  {isCoordinator && <th>Management</th>}
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      No items matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((it) => (
                    <tr key={it.id}>
                      <td className="mono" style={{ fontWeight: 600 }}>{it.code}</td>
                      <td>
                        <strong>{it.name}</strong>
                        {it.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{it.description}</div>
                        )}
                      </td>
                      <td>{it.category}</td>
                      <td>
                        <StatusBadge status={it.kind} />
                      </td>
                      <td>{it.max_issue_qty ? `${it.max_issue_qty} units` : 'No limit'}</td>
                      <td>
                        <StatusBadge status={it.is_active ? 'ACTIVE' : 'RETIRED'} />
                      </td>
                      {isCoordinator && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            {it.kind === 'ASSET' ? (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                onClick={() => {
                                  setSelectedItemForAction(it);
                                  setShowAssetModal(true);
                                }}
                              >
                                <Tag size={13} /> Add Tag
                              </button>
                            ) : (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                onClick={() => {
                                  setSelectedItemForAction(it);
                                  setShowAdjustModal(true);
                                }}
                              >
                                <Sliders size={13} /> Adjust Stock
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ASSETS TAB */}
      {activeTab === 'assets' && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Item ID</th>
                <th>Serial Number</th>
                <th>Condition</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    No serialized assets registered. Use the "Add Tag" button on ASSET items.
                  </td>
                </tr>
              ) : (
                assets.map((a) => (
                  <tr key={a.id}>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>{a.asset_tag}</td>
                    <td>Item #{a.item_id}</td>
                    <td className="mono">{a.serial_no || '—'}</td>
                    <td>
                      <StatusBadge status={a.condition} />
                    </td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* LOCATIONS TAB */}
      {activeTab === 'locations' && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Location Name</th>
                <th>Kind</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    No locations added yet. Click "New Location" to create one.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc.id}>
                    <td style={{ fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={16} color="var(--primary)" />
                        {loc.name}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-purple">{loc.kind}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{loc.description || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* NEW ITEM MODAL */}
      {showItemModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register New Department Item</h3>
            </div>
            <form onSubmit={handleCreateItem}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Code</label>
                    <input
                      type="text"
                      className="form-input mono"
                      placeholder="e.g. LAP-01"
                      value={itemForm.code}
                      onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Item Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dell Latitude Lab Laptop"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Computing / Adapters"
                      value={itemForm.category}
                      onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tracking Kind</label>
                    <select
                      className="form-select"
                      value={itemForm.kind}
                      onChange={(e) => setItemForm({ ...itemForm, kind: e.target.value })}
                    >
                      <option value="QUANTITY">QUANTITY (Cables, bulk count)</option>
                      <option value="ASSET">ASSET (Serialized equipment)</option>
                    </select>
                  </div>
                </div>

                {itemForm.kind === 'QUANTITY' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Initial Quantity</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        value={itemForm.initial_quantity}
                        onChange={(e) => setItemForm({ ...itemForm, initial_quantity: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Issue per Student</label>
                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        value={itemForm.max_issue_qty}
                        onChange={(e) => setItemForm({ ...itemForm, max_issue_qty: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Storage Location (Optional)</label>
                  <select
                    className="form-select"
                    value={itemForm.location_id}
                    onChange={(e) => setItemForm({ ...itemForm, location_id: e.target.value })}
                  >
                    <option value="">-- No specific location --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.kind})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Technical specifications or handling notes"
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER ASSET MODAL */}
      {showAssetModal && selectedItemForAction && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Register Asset Tag</h3>
              <span className="mono badge badge-blue">{selectedItemForAction.code}</span>
            </div>
            <form onSubmit={handleCreateAsset}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  Registering a physical unit for: <strong>{selectedItemForAction.name}</strong>
                </div>

                <div className="form-group">
                  <label className="form-label">Unique Asset Tag / Barcode</label>
                  <input
                    type="text"
                    className="form-input mono"
                    placeholder="e.g. TAG-001 or BOARD-2026-A"
                    value={assetForm.asset_tag}
                    onChange={(e) => setAssetForm({ ...assetForm, asset_tag: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Serial Number (Optional)</label>
                  <input
                    type="text"
                    className="form-input mono"
                    placeholder="Manufacturer serial number"
                    value={assetForm.serial_no}
                    onChange={(e) => setAssetForm({ ...assetForm, serial_no: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Physical Condition</label>
                  <select
                    className="form-select"
                    value={assetForm.condition}
                    onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value })}
                  >
                    <option value="GOOD">GOOD (Available for issue)</option>
                    <option value="FAIR">FAIR (Usable)</option>
                    <option value="DAMAGED">DAMAGED (Unavailable)</option>
                    <option value="NEEDS_MAINTENANCE">NEEDS MAINTENANCE (Unavailable)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssetModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {showAdjustModal && selectedItemForAction && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Audited Stock Adjustment</h3>
              <span className="mono badge badge-blue">{selectedItemForAction.code}</span>
            </div>
            <form onSubmit={handleAdjustStock}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Adjustment Action</label>
                  <select
                    className="form-select"
                    value={adjustForm.action}
                    onChange={(e) => setAdjustForm({ ...adjustForm, action: e.target.value })}
                  >
                    <option value="ADD">ADD (Add new incoming stock)</option>
                    <option value="MOVE">MOVE (Transfer between buckets)</option>
                    <option value="RETIRE">RETIRE (Remove damaged/obsolete units)</option>
                    <option value="CORRECT">CORRECT (Fix physical inventory count audit)</option>
                  </select>
                </div>

                {adjustForm.action === 'MOVE' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">From Bucket</label>
                      <select
                        className="form-select"
                        value={adjustForm.bucket}
                        onChange={(e) => setAdjustForm({ ...adjustForm, bucket: e.target.value })}
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="DAMAGED">DAMAGED</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">To Bucket</label>
                      <select
                        className="form-select"
                        value={adjustForm.to_bucket}
                        onChange={(e) => setAdjustForm({ ...adjustForm, to_bucket: e.target.value })}
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="DAMAGED">DAMAGED</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Target Bucket</label>
                    <select
                      className="form-select"
                      value={adjustForm.bucket}
                      onChange={(e) => setAdjustForm({ ...adjustForm, bucket: e.target.value })}
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="DAMAGED">DAMAGED</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mandatory Audit Reason</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Document justification for ledger integrity"
                    value={adjustForm.reason}
                    onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE LOCATION MODAL */}
      {showLocationModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Create Storage Location</h3>
            </div>
            <form onSubmit={handleCreateLocation}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Location Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Cyber Forensics Lab (Room 402)"
                    value={locationForm.name}
                    onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location Type</label>
                  <select
                    className="form-select"
                    value={locationForm.kind}
                    onChange={(e) => setLocationForm({ ...locationForm, kind: e.target.value })}
                  >
                    <option value="DEPARTMENT">DEPARTMENT</option>
                    <option value="LABORATORY">LABORATORY</option>
                    <option value="ROOM">ROOM</option>
                    <option value="CUPBOARD">CUPBOARD</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Details or building reference"
                    value={locationForm.description}
                    onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLocationModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
