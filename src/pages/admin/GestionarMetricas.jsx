import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useLanguage } from '../../context/LanguageContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import '../../styles/components/admin/GestionarMetricas.css';
import iotLogoDefault from '../../assets/IOT-LOGO.png';

const CustomItemsPerPageSelect = ({ value, onChange, options = [6, 12, 24, 48], language = 'es' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suffix = language === 'en' ? 'page' : 'pág';

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '10px',
          border: '1.5px solid #cbd5e1',
          background: '#ffffff',
          color: '#0f2c59',
          fontWeight: '700',
          fontSize: '0.82rem',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
      >
        <span>{value} / {suffix}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          width="12"
          height="12"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
            padding: '6px',
            minWidth: '115px',
            zIndex: 1100,
            maxWidth: '90vw',
            boxSizing: 'border-box'
          }}
        >
          {options.map((opt) => {
            const isSelected = Number(opt) === Number(value);
            return (
              <div
                key={opt}
                onClick={() => {
                  onChange(Number(opt));
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                  color: isSelected ? '#1e40af' : '#334155',
                  fontWeight: isSelected ? '800' : '600',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{opt} / {suffix}</span>
                {isSelected && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="3" width="12" height="12">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const formatImageUrl = (urlStr) => {
  if (!urlStr) return iotLogoDefault;
  if (urlStr.startsWith('data:') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
    return urlStr;
  }
  const backendHost = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${backendHost}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
};

const convertImageToWebP = (file, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" });
          resolve({ webpFile, dataUrl: canvas.toDataURL('image/webp', quality) });
        } else {
          reject(new Error("Canvas toBlob failed"));
        }
      }, 'image/webp', quality);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
  });
};

export default function GestionarMetricas() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  usePageTitle({ es: 'Gestionar Métricas', en: 'Manage Metrics' }, 'Admin · IoT ULEAM');

  const [metricas, setMetricas]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [showForm, setShowForm]               = useState(false);
  const [editandoId, setEditandoId]           = useState(null);
  
  const symbolFileInputRef                    = useRef(null);

  // Metric Form Fields
  const [nombre, setNombre]                   = useState('');
  const [unidad, setUnidad]                   = useState('');
  const [minExpected, setMinExpected]         = useState('');
  const [maxExpected, setMaxExpected]         = useState('');
  const [symbolImage, setSymbolImage]         = useState('');
  const [symbolFile, setSymbolFile]           = useState(null);
  const [jsonKeys, setJsonKeys]               = useState([]);
  const [newKeyInput, setNewKeyInput]         = useState('');

  const [saving, setSaving]                   = useState(false);
  const [busqueda, setBusqueda]               = useState('');
  const [orden, setOrden]                     = useState(null);
  const [showOrdenPanel, setShowOrdenPanel]   = useState(false);

  // Pagination
  const [itemsPerPage, setItemsPerPage]       = useState(6);
  const [currentPage, setCurrentPage]         = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, orden]);

  const metricasFiltradas = metricas
    .filter(m => {
      const query = busqueda.toLowerCase().trim();
      if (!query) return true;
      const nameStr = (m.name || m.name_es || m.nombre || '').toLowerCase();
      const unitStr = (m.unit || m.unidad || '').toLowerCase();
      const matchName = nameStr.includes(query) || unitStr.includes(query);
      const keysList = m.json_keys || m.jsonKeys || m.subvariables || [];
      const matchKeys = keysList.some(k => {
        const kName = typeof k === 'string' ? k : (k.key_name || k.claveMqtt || k.nombre || '');
        return kName.toLowerCase().includes(query);
      });
      return matchName || matchKeys;
    })
    .sort((a, b) => {
      const nameA = a.name || a.name_es || a.nombre || '';
      const nameB = b.name || b.name_es || b.nombre || '';
      if (orden === 'name_asc') return nameA.localeCompare(nameB);
      if (orden === 'name_desc') return nameB.localeCompare(nameA);
      if (orden === 'desc') return b.id - a.id;
      return a.id - b.id;
    });

  const totalPages = Math.ceil(metricasFiltradas.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMetricas = metricasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  const cargarMetricas = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/metricas?lang=${language}`)
      .then(r => r.json())
      .then(data => { setMetricas(Array.isArray(data) ? data : []); })
      .catch((err) => {
        console.error('Error loading metrics:', err);
        setMetricas([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarMetricas(); }, [language]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.met-filter-group-orden')) {
        setShowOrdenPanel(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const obtenerTextoOrden = () => {
    if (orden === 'desc') return isEn ? 'Newest first' : 'Más recientes primero';
    if (orden === 'name_asc') return isEn ? 'Name (A-Z)' : 'Nombre (A-Z)';
    if (orden === 'name_desc') return isEn ? 'Name (Z-A)' : 'Nombre (Z-A)';
    if (orden === 'asc') return isEn ? 'Oldest first' : 'Más antiguos primero';
    return isEn ? 'Sort' : 'Ordenar';
  };

  const limpiar = () => {
    setEditandoId(null);
    setNombre('');
    setUnidad('');
    setMinExpected('');
    setMaxExpected('');
    setSymbolImage('');
    setSymbolFile(null);
    setJsonKeys([]);
    setNewKeyInput('');
    setSaving(false);
  };

  const abrirCreacion = () => {
    limpiar();
    setJsonKeys([{ key_name: '', is_standard: true, isNew: true }]);
    setShowForm(true);
  };

  const cancelar = () => { limpiar(); setShowForm(false); };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: isEn ? 'File too large' : 'Archivo demasiado grande',
        text: isEn ? 'Image must be smaller than 5MB.' : 'La imagen debe ser menor a 5MB.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    try {
      const { webpFile, dataUrl } = await convertImageToWebP(file);
      setSymbolFile(webpFile);
      setSymbolImage(dataUrl);
    } catch (err) {
      console.error('Error converting image to WebP:', err);
      setSymbolFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setSymbolImage(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSymbolImage('/symbols/default.webp');
    setSymbolFile(null);
  };

  // Standard Key Toggle handler
  const handleToggleStandardKey = (targetIndex) => {
    setJsonKeys(prev => prev.map((k, idx) => ({
      ...k,
      is_standard: idx === targetIndex
    })));

    // If editing existing metric and key has an ID, notify API
    const targetKey = jsonKeys[targetIndex];
    if (editandoId && targetKey && targetKey.id) {
      fetchWithAuth(`${API_BASE_URL}/metric-json-keys/${targetKey.id}/set-standard`, {
        method: 'PUT'
      }).catch(err => console.error("Error setting standard key:", err));
    }
  };

  const handleAddJsonKey = () => {
    const clean = newKeyInput.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');
    if (!clean) return;

    if (jsonKeys.some(k => k.key_name.toLowerCase() === clean)) {
      Swal.fire({
        icon: 'warning',
        title: isEn ? 'Key exists' : 'Clave ya existe',
        text: isEn ? 'This JSON key is already added.' : 'Esta clave JSON ya está agregada.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const isFirst = jsonKeys.length === 0;

    if (editandoId) {
      // Add via backend immediately
      fetchWithAuth(`${API_BASE_URL}/metric-json-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric_id: editandoId,
          key_name: clean,
          is_standard: isFirst
        })
      })
        .then(res => res.json())
        .then(created => {
          setJsonKeys(prev => [...prev, created]);
          setNewKeyInput('');
        })
        .catch(err => console.error("Error adding json key:", err));
    } else {
      setJsonKeys(prev => [...prev, { key_name: clean, is_standard: isFirst, isNew: true }]);
      setNewKeyInput('');
    }
  };

  const handleRemoveJsonKey = (index) => {
    const targetKey = jsonKeys[index];
    if (editandoId && targetKey && targetKey.id) {
      fetchWithAuth(`${API_BASE_URL}/metric-json-keys/${targetKey.id}`, {
        method: 'DELETE'
      })
        .then(() => {
          setJsonKeys(prev => {
            const next = prev.filter((_, idx) => idx !== index);
            if (targetKey.is_standard && next.length > 0) {
              next[0].is_standard = true;
              if (next[0].id) {
                fetchWithAuth(`${API_BASE_URL}/metric-json-keys/${next[0].id}/set-standard`, { method: 'PUT' });
              }
            }
            return next;
          });
        })
        .catch(err => console.error("Error deleting json key:", err));
    } else {
      setJsonKeys(prev => {
        const next = prev.filter((_, idx) => idx !== index);
        if (targetKey?.is_standard && next.length > 0) {
          next[0].is_standard = true;
        }
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre.trim() || !unidad.trim()) {
      Swal.fire({
        icon: 'warning',
        title: isEn ? 'Incomplete fields' : 'Campos incompletos',
        text: isEn ? 'Please enter metric name and unit.' : 'Por favor ingresa el nombre de la métrica y su unidad.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const validKeys = jsonKeys.filter(k => k.key_name && k.key_name.trim());
    if (validKeys.length === 0 && !editandoId) {
      Swal.fire({
        icon: 'warning',
        title: isEn ? 'Missing JSON Keys' : 'Faltan Claves JSON',
        text: isEn ? 'Please add at least one JSON key for this metric.' : 'Por favor añade al menos una clave JSON para esta métrica.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setSaving(true);

    try {
      let metricId = editandoId;
      const stdKeyObj = validKeys.find(k => k.is_standard) || validKeys[0];

      let cleanSymbolImage = symbolImage;
      if (cleanSymbolImage && cleanSymbolImage.startsWith('data:')) {
        cleanSymbolImage = undefined;
      }

      if (editandoId) {
        // Update metric
        const putPayload = {
          name: nombre.trim(),
          unit: unidad.trim(),
          min_expected: minExpected !== '' ? parseFloat(minExpected) : null,
          max_expected: maxExpected !== '' ? parseFloat(maxExpected) : null
        };
        if (cleanSymbolImage !== undefined) {
          putPayload.symbol_image = cleanSymbolImage;
        }

        const res = await fetchWithAuth(`${API_BASE_URL}/metricas/${editandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(putPayload)
        });
        if (!res.ok) throw new Error();
      } else {
        // Create metric
        const res = await fetchWithAuth(`${API_BASE_URL}/metricas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nombre.trim(),
            unit: unidad.trim(),
            min_expected: minExpected !== '' ? parseFloat(minExpected) : null,
            max_expected: maxExpected !== '' ? parseFloat(maxExpected) : null,
            standard_json_key: stdKeyObj ? stdKeyObj.key_name : ''
          })
        });
        if (!res.ok) throw new Error();
        const createdMetric = await res.json();
        metricId = createdMetric.id;

        // Add additional non-standard keys if any
        for (const k of validKeys) {
          if (k.key_name !== (stdKeyObj ? stdKeyObj.key_name : '')) {
            await fetchWithAuth(`${API_BASE_URL}/metric-json-keys`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                metric_id: metricId,
                key_name: k.key_name,
                is_standard: false
              })
            });
          }
        }
      }

      // If user uploaded a new symbol image file, upload it
      if (symbolFile && metricId) {
        const formData = new FormData();
        formData.append('image', symbolFile);

        await fetchWithAuth(`${API_BASE_URL}/metricas/${metricId}/upload-symbol`, {
          method: 'POST',
          body: formData
        });
      }

      Swal.fire({
        icon: 'success',
        title: editandoId ? (isEn ? 'Updated!' : '¡Actualizado!') : (isEn ? 'Registered!' : '¡Registrado!'),
        text: editandoId ? (isEn ? 'Metric updated successfully.' : 'La métrica se actualizó correctamente.') : (isEn ? 'Metric created successfully.' : 'La métrica se creó correctamente.'),
        confirmButtonColor: '#2563eb'
      });

      cancelar();
      cargarMetricas();
    } catch (err) {
      console.error("Error saving metric:", err);
      Swal.fire({
        icon: 'error',
        title: isEn ? 'Something went wrong' : 'Algo salió mal',
        text: isEn ? 'Could not save metric. Try again.' : 'No se pudo guardar la métrica. Inténtalo de nuevo.',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setSaving(false);
    }
  };

  const cargarEdicion = (m) => {
    setEditandoId(m.id);
    setNombre(m.name || m.name_es || m.nombre || '');
    setUnidad(m.unit || m.unidad || '');
    setMinExpected(m.min_expected !== null && m.min_expected !== undefined ? String(m.min_expected) : '');
    setMaxExpected(m.max_expected !== null && m.max_expected !== undefined ? String(m.max_expected) : '');
    setSymbolImage(m.symbol_image || m.imagen || '/symbols/default.webp');
    setSymbolFile(null);

    const keys = m.json_keys || m.jsonKeys || [];
    setJsonKeys(keys.map(k => ({
      id: k.id,
      key_name: k.key_name || k.claveMqtt || '',
      is_standard: Boolean(k.is_standard)
    })));

    setShowForm(true);
  };

  const eliminar = (id) => {
    const met = metricas.find(m => m.id === id);
    const mName = met?.name || met?.name_es || met?.nombre || '';

    Swal.fire({
      title: isEn ? 'Delete metric?' : '¿Eliminar métrica?',
      text: isEn ? `"${mName}" and all its JSON keys will be deleted.` : `"${mName}" y todas sus claves JSON serán eliminadas.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
      confirmButtonText: isEn ? 'Yes, delete' : 'Sí, eliminar',
      cancelButtonText: isEn ? 'Cancel' : 'Cancelar'
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await fetchWithAuth(`${API_BASE_URL}/metricas/${id}`, { method: 'DELETE' });
        if (editandoId === id) cancelar();
        cargarMetricas();
      } catch {
        Swal.fire({
          icon: 'error',
          title: isEn ? 'Something went wrong' : 'Algo salió mal',
          text: isEn ? 'Could not delete metric. Try again.' : 'No se pudo eliminar la métrica. Inténtalo de nuevo.',
          confirmButtonColor: '#2563eb'
        });
      }
    });
  };

  return (
    <div className="met-page">

      {/* ══════════════════════════════════════════
          MODO FORMULARIO — Full-screen layout
      ══════════════════════════════════════════ */}
      {showForm ? (
        <div className="met-form-fullscreen">

          {/* ── Cabecera del formulario ── */}
          <div className="met-form-topbar">
            <h2 className="met-form-heading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#0f2c59' }}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              {editandoId ? (isEn ? 'Modify Metric' : 'Modificar Métrica') : (isEn ? 'Register New Metric' : 'Registrar Nueva Métrica')}
            </h2>

            <button
              type="button"
              onClick={cancelar}
              className="met-btn-volver"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              {isEn ? 'Back to List' : 'Volver al Listado'}
            </button>
          </div>

          {/* ── Cuerpo en dos columnas ── */}
          <form onSubmit={handleSubmit} className="met-form-body">

            {/* ── COL IZQUIERDA: Nombre, Unidad + Imagen de Símbolo ── */}
            <div className="met-form-left">
              <div className="met-field-group">
                <label className="met-label">{isEn ? 'Metric Name' : 'Nombre de la Métrica'}</label>
                <input
                  autoFocus
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder={isEn ? 'e.g. Temperature, Air Quality Index' : 'ej. Temperatura, Índice de Calidad de Aire'}
                  className="met-input met-input--full"
                />
              </div>

              <div className="met-field-group">
                <label className="met-label">{isEn ? 'Unit of Measurement' : 'Unidad de Medida'}</label>
                <input
                  type="text"
                  value={unidad}
                  onChange={e => setUnidad(e.target.value)}
                  placeholder={isEn ? 'e.g. °C, %, ppm, µg/m³' : 'ej. °C, %, ppm, µg/m³'}
                  className="met-input met-input--full"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '420px' }}>
                <div className="met-field-group" style={{ flex: 1 }}>
                  <label className="met-label">{isEn ? 'Default Min Expected' : 'Mín. Esperado Defecto'}</label>
                  <input
                    type="number"
                    step="any"
                    value={minExpected}
                    onChange={e => setMinExpected(e.target.value)}
                    placeholder={isEn ? 'e.g. 0' : 'ej. 0'}
                    className="met-input met-input--full"
                  />
                </div>
                <div className="met-field-group" style={{ flex: 1 }}>
                  <label className="met-label">{isEn ? 'Default Max Expected' : 'Máx. Esperado Defecto'}</label>
                  <input
                    type="number"
                    step="any"
                    value={maxExpected}
                    onChange={e => setMaxExpected(e.target.value)}
                    placeholder={isEn ? 'e.g. 100' : 'ej. 100'}
                    className="met-input met-input--full"
                  />
                </div>
              </div>

              {/* Imagen de Símbolo (.webp en /symbols/) */}
              <div className="met-field-group" style={{ flex: 1 }}>
                <label className="met-label">{isEn ? 'Symbol Image (.webp in /symbols/)' : 'Imagen de Símbolo (.webp en /symbols/)'}</label>
                <input
                  type="file"
                  ref={symbolFileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />

                <div className="met-symbol-upload-box" style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '14px',
                  padding: '16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}>
                  {symbolImage ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
                      <div style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '12px',
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }}>
                        <img
                          src={formatImageUrl(symbolImage)}
                          alt="Vista previa símbolo"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = iotLogoDefault;
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => symbolFileInputRef.current?.click()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: '#2563eb',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(37,99,235,0.2)',
                            transition: 'transform 0.15s ease'
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          {isEn ? 'Change Image' : 'Cambiar Imagen'}
                        </button>

                        <button
                          type="button"
                          onClick={removeImage}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: '#ffffff',
                            color: '#ef4444',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            border: '1.5px solid #fca5a5',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                          {isEn ? 'Reset' : 'Restablecer'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => symbolFileInputRef.current?.click()}
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px',
                        width: '100%'
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" width="44" height="44">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span style={{ fontWeight: 700, color: '#0f2c59', fontSize: '0.88rem' }}>
                        {isEn ? 'Click to upload symbol image' : 'Haz clic para subir imagen de símbolo'}
                      </span>
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        {isEn ? 'PNG, JPG, WEBP, SVG · Converts to .webp in /symbols/' : 'PNG, JPG, WEBP, SVG · Se guarda como .webp en /symbols/'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── COL DERECHA: Claves JSON (claves_json) ── */}
            <div className="met-form-right">
              <div className="met-subs-section met-subs-section--full">
                <div className="met-subs-header">
                  <span className="met-section-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }}>
                      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                    {isEn ? 'JSON Reading Keys (claves_json)' : 'Claves de Lectura JSON (claves_json)'}
                  </span>
                </div>

                {/* Inline Add Key Input */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    value={newKeyInput}
                    onChange={e => setNewKeyInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddJsonKey(); } }}
                    placeholder={isEn ? 'Enter key name (e.g. temp, temperature)...' : 'Escribir clave (ej. temp, temperatura)...'}
                    className="met-sub-input"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddJsonKey}
                    className="met-btn-add-sub"
                    style={{ padding: '0 16px', borderRadius: '10px', height: 'auto' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    {isEn ? 'Add Key' : 'Añadir Clave'}
                  </button>
                </div>

                {/* List of JSON Keys with Standard Selector */}
                <div className="met-subs-list">
                  {jsonKeys.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                      {isEn ? 'No JSON keys added yet. Add at least one key above.' : 'Sin claves JSON aún. Añade al menos una clave arriba.'}
                    </div>
                  ) : (
                    jsonKeys.map((k, idx) => (
                      <div key={idx} className="met-sub-row" style={{ alignItems: 'center', gap: '12px', padding: '10px 14px', border: k.is_standard ? '2px solid #2563eb' : '1px solid #e2e8f0', background: k.is_standard ? '#f0f6ff' : '#ffffff', borderRadius: '12px' }}>

                        {/* Standard Switcher (Checkbox/Radio) on Left */}
                        <label title={isEn ? "Mark as standard key" : "Marcar como clave estándar"} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(k.is_standard)}
                            onChange={() => handleToggleStandardKey(idx)}
                            style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: k.is_standard ? '#2563eb' : '#64748b' }}>
                            {k.is_standard ? (isEn ? '★ Standard' : '★ Estándar') : (isEn ? 'Standard' : 'Estándar')}
                          </span>
                        </label>

                        {/* Key Name Input */}
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={k.key_name}
                            readOnly={Boolean(k.id)} // Existing keys read-only name, can delete or change standard
                            onChange={e => {
                              const val = e.target.value.toLowerCase().replace(/\s+/g, '_');
                              setJsonKeys(prev => prev.map((item, i) => i === idx ? { ...item, key_name: val } : item));
                            }}
                            className="met-sub-input met-sub-input--mono"
                            style={{ fontWeight: 700, color: '#0f172a' }}
                          />
                        </div>

                        {/* Remove Key Button */}
                        <button
                          type="button"
                          className="met-btn-remove-sub"
                          onClick={() => handleRemoveJsonKey(idx)}
                          title={isEn ? "Delete key" : "Eliminar clave"}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="met-form-actions">
                <button type="button" onClick={cancelar} className="met-btn-cancel">{isEn ? 'Cancel' : 'Cancelar'}</button>
                <button type="submit" className="met-btn-save" disabled={saving}>
                  {saving ? (
                    isEn ? 'Saving...' : 'Guardando...'
                  ) : editandoId ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                      {isEn ? 'Apply Changes' : 'Aplicar Cambios'}
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                      {isEn ? 'Save Metric' : 'Guardar Métrica'}
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </div>

      ) : (
        /* ══════════════════════════════════════════
            MODO LISTADO
        ══════════════════════════════════════════ */
        <>
          {/* ── Toolbar única ── */}
          <div className="met-toolbar" style={{ position: 'relative', zIndex: 30 }}>
            {/* Búsqueda */}
            <div className="met-search-wrapper" style={{ flex: '1 1 200px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14" className="met-search-icon">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder={isEn ? 'Search metric or JSON key...' : 'Buscar métrica o clave JSON...'}
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="met-filter-input met-search-input"
              />
            </div>

            {/* Ordenar */}
            <div className="pub-news-filter-group met-filter-group-orden" style={{ position: 'relative' }}>
              <button 
                type="button"
                className={`pub-news-unified-filter-btn ${showOrdenPanel ? 'open' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOrdenPanel(!showOrdenPanel);
                }}
                style={{ height: '42px', borderRadius: '12px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
                <span>{obtenerTextoOrden()}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" className="select-arrow-icon">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showOrdenPanel && (
                <div className="pub-news-unified-filter-panel met-order-dropdown-panel">
                  <div className="filter-panel-section" style={{ width: '100%' }}>
                    <span className="filter-panel-section-title">{isEn ? 'Sort by' : 'Ordenar por'}</span>
                    <div className="filter-panel-options-list">
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'asc' ? 'active' : ''}`}
                        onClick={() => {
                          setOrden(orden === 'asc' ? null : 'asc');
                          setShowOrdenPanel(false);
                        }}
                      >
                        {isEn ? 'Oldest first' : 'Más antiguos primero'}
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'desc' ? 'active' : ''}`}
                        onClick={() => {
                          setOrden(orden === 'desc' ? null : 'desc');
                          setShowOrdenPanel(false);
                        }}
                      >
                        {isEn ? 'Newest first' : 'Más recientes primero'}
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'name_asc' ? 'active' : ''}`}
                        onClick={() => {
                          setOrden(orden === 'name_asc' ? null : 'name_asc');
                          setShowOrdenPanel(false);
                        }}
                      >
                        {isEn ? 'Name (A-Z)' : 'Nombre (A-Z)'}
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'name_desc' ? 'active' : ''}`}
                        onClick={() => {
                          setOrden(orden === 'name_desc' ? null : 'name_desc');
                          setShowOrdenPanel(false);
                        }}
                      >
                        {isEn ? 'Name (Z-A)' : 'Nombre (Z-A)'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón agregar */}
            <button className="met-btn-add" onClick={abrirCreacion} style={{ flexShrink: 0, height: '42px', borderRadius: '12px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="15" height="15">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {isEn ? 'Add Metric' : 'Agregar Métrica'}
            </button>
          </div>

          {/* ── Cards ── */}
          <div className="met-grid">
            {loading && <div className="met-loading-text">{isEn ? 'Loading metrics...' : 'Cargando métricas...'}</div>}
            {!loading && metricasFiltradas.length === 0 && (
              <div className="met-empty-state">{isEn ? 'No registered metrics found.' : 'No se encontraron métricas registradas.'}</div>
            )}

            {!loading && paginatedMetricas.map((m, idx) => {
              const mName = m.name || m.name_es || m.nombre || 'Métrica';
              const mUnit = m.unit || m.unidad || '';
              const keysList = m.json_keys || m.jsonKeys || m.subvariables || [];

              return (
                <div key={m.id} className="met-card">
                  <div className="met-card-img-wrapper">
                    <img
                      src={formatImageUrl(m.symbol_image || m.imagen)}
                      alt={mName}
                      className={(m.symbol_image || m.imagen) ? 'met-card-img' : 'met-card-img met-card-img--default'}
                    />
                    <div className="met-card-idx">#{startIndex + idx + 1}</div>
                  </div>

                  <div className="met-card-content">
                    <h3 className="met-card-name">
                      {mName}
                      {mUnit && <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700, marginLeft: '8px' }}>({mUnit})</span>}
                    </h3>

                    <div className="met-card-section-title">🔑 {isEn ? 'JSON Keys (claves_json)' : 'Claves JSON (claves_json)'}</div>

                    <div className="met-card-subs">
                      {keysList.length === 0 ? (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>{isEn ? 'No keys registered' : 'Sin claves registradas'}</span>
                      ) : (
                        keysList.map((k, i) => {
                          const kName = typeof k === 'string' ? k : (k.key_name || k.claveMqtt || k.nombre || '');
                          const isStd = typeof k === 'object' && Boolean(k.is_standard);

                          return (
                            <div key={i} className={`met-sub-badge ${isStd ? 'met-sub-badge--standard' : ''}`} style={{ border: isStd ? '1.5px solid #2563eb' : '1px solid #cbd5e1', background: isStd ? '#eff6ff' : '#f8fafc' }}>
                              <span className="met-sub-badge-key" style={{ fontWeight: 800, color: isStd ? '#1e40af' : '#334155' }}>
                                {isStd ? `★ ${kName}` : kName}
                              </span>
                              {isStd && (
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#2563eb', color: '#ffffff', padding: '1px 6px', borderRadius: '6px', marginLeft: '4px' }}>
                                  {isEn ? 'Standard' : 'Estándar'}
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="met-card-actions">
                    <button className="met-btn-edit" onClick={() => cargarEdicion(m)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      {isEn ? 'Edit' : 'Editar'}
                    </button>
                    <button className="met-btn-delete" onClick={() => eliminar(m.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
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

          {/* CONTROLES DE PAGINACIÓN */}
          {!loading && metricasFiltradas.length > 0 && (
            <div className="metrics-pagination-bar">
              <div className="pagination-info-text">
                {isEn 
                  ? `Showing ${Math.min(startIndex + 1, metricasFiltradas.length)} to ${Math.min(startIndex + itemsPerPage, metricasFiltradas.length)} of ${metricasFiltradas.length} metrics`
                  : `Mostrando ${Math.min(startIndex + 1, metricasFiltradas.length)} a ${Math.min(startIndex + itemsPerPage, metricasFiltradas.length)} de ${metricasFiltradas.length} métricas`}
              </div>

              <div className="pagination-controls-group">
                <CustomItemsPerPageSelect
                  value={itemsPerPage}
                  onChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                  options={[6, 12, 24, 48]}
                  language={language}
                />

                <div className="pagination-buttons-wrapper">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`pagination-nav-btn prev-btn ${currentPage === 1 ? 'disabled' : ''}`}
                    title={isEn ? 'Previous page' : 'Página anterior'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <span className="pagination-btn-label">{isEn ? 'Prev' : 'Anterior'}</span>
                  </button>

                  <div className="pagination-number-list">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`pagination-num-btn ${p === currentPage ? 'active' : ''}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`pagination-nav-btn next-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                    title={isEn ? 'Next page' : 'Página siguiente'}
                  >
                    <span className="pagination-btn-label">{isEn ? 'Next' : 'Siguiente'}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

