import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useLanguage } from '../../context/LanguageContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import '../../styles/components/admin/GestionarSensores.css';
import iotLogoDefault from '../../assets/IOT-LOGO.png';

const formatImageUrl = (urlStr) => {
  if (!urlStr) return iotLogoDefault;
  if (urlStr.startsWith('data:') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
    return urlStr;
  }
  const backendHost = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${backendHost}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
};

export default function GestionarSensores() {
  const { language, triggerContentLoading } = useLanguage();
  const isEn = language === 'en';

  usePageTitle({ es: 'Gestionar Sensores', en: 'Manage Sensors' }, 'Admin · IoT ULEAM');

  const [searchParams, setSearchParams] = useSearchParams();
  const [sensors, setSensors] = useState([]);
  const [metricsList, setMetricsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMetricIds, setSelectedMetricIds] = useState([]);
  const [saving, setSaving] = useState(false);

  // Controls State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Load Data from API
  const loadData = () => {
    setLoading(true);
    const pSensors = fetchWithAuth(`${API_BASE_URL}/sensors?lang=${language}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? data : []);

    const pMetrics = fetch(`${API_BASE_URL}/metricas?lang=${language}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? data : []);

    Promise.all([pSensors, pMetrics])
      .then(([sData, mData]) => {
        setSensors(sData);
        setMetricsList(mData);
      })
      .catch(err => {
        console.error('Error loading sensors data:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [language]);

  // Sync state with URL search params
  useEffect(() => {
    if (loading) return;
    const editarParam = searchParams.get('editar');
    const accionParam = searchParams.get('accion');

    if (editarParam) {
      const found = sensors.find(s => String(s.id) === String(editarParam));
      if (found) {
        openEditForm(found, false);
      }
    } else if (accionParam === 'crear') {
      openCreateForm(false);
    } else {
      if (showForm) {
        resetForm();
        setShowForm(false);
      }
    }
  }, [searchParams, loading, sensors]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setBrand('');
    setDescription('');
    setSelectedMetricIds([]);
  };

  const openCreateForm = (updateUrl = true) => {
    resetForm();
    setShowForm(true);
    if (updateUrl) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('editar');
      newParams.set('accion', 'crear');
      setSearchParams(newParams);
    }
  };

  const openEditForm = (sensor, updateUrl = true) => {
    setEditingId(sensor.id);
    setName(sensor.name || '');
    setBrand(sensor.brand || '');
    setDescription(sensor.description || '');
    const metricIds = (sensor.metrics || []).map(m => m.id);
    setSelectedMetricIds(metricIds);
    setShowForm(true);

    if (updateUrl) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('accion');
      newParams.set('editar', String(sensor.id));
      setSearchParams(newParams);
    }
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('accion');
    newParams.delete('editar');
    setSearchParams(newParams);
  };

  const toggleMetricSelection = (mId) => {
    setSelectedMetricIds(prev =>
      prev.includes(mId) ? prev.filter(id => id !== mId) : [...prev, mId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: isEn ? 'Missing Name' : 'Nombre Requerido',
        text: isEn ? 'Please enter a sensor name.' : 'Por favor ingresa un nombre para el sensor.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      description: description.trim(),
      metric_ids: selectedMetricIds
    };

    const url = editingId ? `${API_BASE_URL}/sensors/${editingId}?lang=${language}` : `${API_BASE_URL}/sensors?lang=${language}`;
    const method = editingId ? 'PUT' : 'POST';

    fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error('Error saving sensor');
        return res.json();
      })
      .then(() => {
        triggerContentLoading();
        Swal.fire({
          icon: 'success',
          title: editingId ? (isEn ? 'Sensor Updated!' : '¡Sensor Actualizado!') : (isEn ? 'Sensor Created!' : '¡Sensor Creado!'),
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2500
        });
        closeForm();
        loadData();
      })
      .catch(err => {
        console.error('Error saving sensor:', err);
        Swal.fire({
          icon: 'error',
          title: isEn ? 'Error' : 'Error',
          text: isEn ? 'Could not save sensor.' : 'No se pudo guardar el sensor.',
          confirmButtonColor: '#2563eb'
        });
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleDelete = (sensor) => {
    Swal.fire({
      title: isEn ? 'Delete Sensor?' : '¿Eliminar Sensor?',
      text: isEn ? `Are you sure you want to delete "${sensor.name}"?` : `¿Estás seguro de eliminar el sensor "${sensor.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: isEn ? 'Yes, delete' : 'Sí, eliminar',
      cancelButtonText: isEn ? 'Cancel' : 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        fetchWithAuth(`${API_BASE_URL}/sensors/${sensor.id}`, { method: 'DELETE' })
          .then(r => {
            if (!r.ok) throw new Error('Error deleting');
            return r.json();
          })
          .then(() => {
            Swal.fire({
              icon: 'success',
              title: isEn ? 'Sensor Deleted' : 'Sensor Eliminado',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 2000
            });
            loadData();
          })
          .catch(() => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: isEn ? 'Could not delete sensor.' : 'No se pudo eliminar el sensor.',
              confirmButtonColor: '#2563eb'
            });
          });
      }
    });
  };

  // Filter & Sort
  const filteredSensors = useMemo(() => {
    let result = [...sensors];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.brand && s.brand.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'name_asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'name_desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortBy === 'metrics_desc') {
      result.sort((a, b) => (b.metrics || []).length - (a.metrics || []).length);
    }
    return result;
  }, [sensors, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredSensors.length / itemsPerPage) || 1;
  const paginatedSensors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSensors.slice(start, start + itemsPerPage);
  }, [filteredSensors, currentPage, itemsPerPage]);

  return (
    <div className="sen-container">
      {/* Banner Header */}
      <div className="sen-header-banner">
        <div className="sen-header-title">
          <div className="sen-header-icon-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="26" height="26">
              <rect x="2" y="6" width="20" height="12" rx="3"/>
              <path d="M6 12h4m4 0h4"/>
              <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <div className="sen-header-text">
            <h2>{isEn ? 'Manage Sensors' : 'Gestión de Sensores'}</h2>
            <p>{isEn ? 'Configure physical or virtual sensors and their associated metric context.' : 'Administra los sensores físicos o virtuales y sus métricas asociadas.'}</p>
          </div>
        </div>

        {!showForm && (
          <button type="button" onClick={() => openCreateForm()} className="sen-btn-add">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {isEn ? 'Add Sensor' : 'Agregar Sensor'}
          </button>
        )}
      </div>

      {/* ── MODE 1: FORM OVERLAY ── */}
      {showForm ? (
        <div className="sen-form-wrapper">
          <div className="sen-form-header">
            <h3>{editingId ? (isEn ? 'Modify Sensor' : 'Modificar Sensor') : (isEn ? 'Register New Sensor' : 'Registrar Nuevo Sensor')}</h3>
            <button type="button" onClick={closeForm} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 800, color: '#475569', cursor: 'pointer' }}>
              {isEn ? 'Back to List' : 'Volver al Listado'}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="sen-form-grid">
              <div className="sen-field">
                <label className="sen-label">{isEn ? 'Sensor Name *' : 'Nombre del Sensor *'}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={isEn ? 'e.g. DHT22 / BME280 / MQ-135' : 'ej. DHT22 / BME280 / MQ-135'}
                  className="sen-input"
                  required
                />
              </div>

              <div className="sen-field">
                <label className="sen-label">{isEn ? 'Brand / Manufacturer' : 'Marca / Fabricante'}</label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder={isEn ? 'e.g. Aosong / Bosch / DFRobot' : 'ej. Aosong / Bosch / DFRobot'}
                  className="sen-input"
                />
              </div>

              <div className="sen-field sen-field--full">
                <label className="sen-label">{isEn ? 'Description' : 'Descripción'}</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={isEn ? 'Brief description of the sensor capabilities...' : 'Breve descripción de la capacidad del sensor...'}
                  className="sen-textarea"
                />
              </div>

              {/* Metric Associations Picker */}
              <div className="sen-field sen-field--full">
                <label className="sen-label">{isEn ? 'Associated Metrics Context' : 'Métricas Asociadas al Sensor'}</label>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 10px 0' }}>
                  {isEn ? 'Select which general metrics this sensor can measure:' : 'Selecciona qué métricas generales puede medir este sensor:'}
                </p>

                <div className="sen-metrics-picker">
                  {metricsList.map(m => {
                    const isSelected = selectedMetricIds.includes(m.id);
                    const unitsText = (m.units || []).map(u => u.unit).join(', ');
                    const mName = isEn ? (m.name_en || m.name) : m.name;

                    return (
                      <div
                        key={m.id}
                        className={`sen-metric-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleMetricSelection(m.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="sen-checkbox"
                        />
                        <img
                          src={formatImageUrl(m.symbol_image)}
                          alt={mName}
                          style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                          onError={e => { e.target.onerror = null; e.target.src = iotLogoDefault; }}
                        />
                        <div className="sen-metric-item-info">
                          <span className="sen-metric-item-name">{mName}</span>
                          <span className="sen-metric-item-units">{unitsText ? `(${unitsText})` : ''}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1.5px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={closeForm}
                style={{ padding: '10px 20px', borderRadius: '10px', background: '#ffffff', border: '1.5px solid #cbd5e1', color: '#475569', fontWeight: 800, cursor: 'pointer' }}
              >
                {isEn ? 'Cancel' : 'Cancelar'}
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ padding: '10px 24px', borderRadius: '10px', background: '#2563eb', border: 'none', color: '#ffffff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
              >
                {saving ? (isEn ? 'Saving...' : 'Guardando...') : (editingId ? (isEn ? 'Apply Changes' : 'Aplicar Cambios') : (isEn ? 'Save Sensor' : 'Guardar Sensor'))}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ── MODE 2: SENSORS LIST GRID ── */
        <>
          <div className="sen-controls-bar">
            <div className="sen-search-box">
              <svg className="sen-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search sensor by name, brand, or description...' : 'Buscar sensor por nombre, marca o descripción...'}
                className="sen-search-input"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{isEn ? 'Sort:' : 'Ordenar:'}</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#0f2c59', fontWeight: 700, fontSize: '0.82rem', outline: 'none' }}
              >
                <option value="name_asc">{isEn ? 'Name (A-Z)' : 'Nombre (A-Z)'}</option>
                <option value="name_desc">{isEn ? 'Name (Z-A)' : 'Nombre (Z-A)'}</option>
                <option value="metrics_desc">{isEn ? 'Metrics (Most to least)' : 'Métricas (Más a menos)'}</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
              {isEn ? 'Loading sensors...' : 'Cargando sensores...'}
            </div>
          ) : paginatedSensors.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', background: '#ffffff', border: '1.5px dashed #cbd5e1', borderRadius: '20px', color: '#64748b' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                {isEn ? 'No sensors found matching the filter.' : 'No se encontraron sensores que coincidan con el filtro.'}
              </p>
            </div>
          ) : (
            <div className="sen-grid">
              {paginatedSensors.map(sensor => {
                const sName = isEn ? (sensor.name_en || sensor.name) : sensor.name;
                const mList = sensor.metrics || [];

                return (
                  <div key={sensor.id} className="sen-card">
                    <div>
                      <div className="sen-card-header">
                        <div className="sen-card-title-group">
                          <div className="sen-card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                              <rect x="2" y="6" width="20" height="12" rx="3"/>
                              <path d="M6 12h4m4 0h4"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="sen-card-name">{sName}</h3>
                            {sensor.brand && (
                              <span className="sen-card-brand">{sensor.brand}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="sen-card-desc">
                        {sensor.description || (isEn ? 'No description registered for this sensor.' : 'Sin descripción registrada para este sensor.')}
                      </p>

                      <div className="sen-metrics-section">
                        <div className="sen-metrics-label">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                            <path d="M12 2v20M2 12h20"/>
                          </svg>
                          {isEn ? `Associated Metrics (${mList.length})` : `Métricas Asociadas (${mList.length})`}
                        </div>

                        <div className="sen-metrics-list">
                          {mList.length === 0 ? (
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              {isEn ? 'No metrics assigned' : 'Sin métricas asignadas'}
                            </span>
                          ) : (
                            mList.map(m => {
                              const mName = isEn ? (m.name_en || m.name) : m.name;
                              return (
                                <div key={m.id} className="sen-metric-badge">
                                  <img
                                    src={formatImageUrl(m.symbol_image)}
                                    alt={mName}
                                    className="sen-metric-thumb"
                                    onError={e => { e.target.onerror = null; e.target.src = iotLogoDefault; }}
                                  />
                                  <span>{mName}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sen-card-actions">
                      <button type="button" onClick={() => openEditForm(sensor)} className="sen-btn-edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        {isEn ? 'Edit' : 'Editar'}
                      </button>

                      <button type="button" onClick={() => handleDelete(sensor)} className="sen-btn-delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        {isEn ? 'Delete' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '28px' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#ffffff', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                &larr;
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2c59' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#ffffff', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
