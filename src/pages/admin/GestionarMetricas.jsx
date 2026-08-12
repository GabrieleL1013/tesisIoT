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

  usePageTitle({ es: 'Métricas / Unidades', en: 'Metrics / Units' }, 'Admin · IoT ULEAM');

  const [metricas, setMetricas]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [showForm, setShowForm]               = useState(false);
  const [editandoId, setEditandoId]           = useState(null);

  const symbolFileInputRef                    = useRef(null);

  // Metric General Form Fields
  const [nombre, setNombre]                   = useState('');
  const [symbolImage, setSymbolImage]         = useState('');
  const [symbolFile, setSymbolFile]           = useState(null);

  // Subvariables / Unidades (Array of rows)
  const [subvariables, setSubvariables]       = useState([]);

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
      const matchName = nameStr.includes(query);

      const unitsList = m.units || [];
      const matchUnits = unitsList.some(u => {
        const uName = (u.name || u.name_es || '').toLowerCase();
        const uSymbol = (u.unit || '').toLowerCase();
        const uKeys = u.json_keys || [];
        return uName.includes(query) || uSymbol.includes(query) || uKeys.some(k => (k.key_name || '').toLowerCase().includes(query));
      });

      const keysList = m.json_keys || [];
      const matchKeys = keysList.some(k => (k.key_name || '').toLowerCase().includes(query));

      return matchName || matchUnits || matchKeys;
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
    setSymbolImage('');
    setSymbolFile(null);
    setSubvariables([]);
    setSaving(false);
  };

  const abrirCreacion = () => {
    limpiar();
    setSubvariables([
      {
        id: null,
        name: '',
        unit: '',
        min_expected: '',
        max_expected: '',
        json_keys: [{ key_name: '', is_standard: true }],
        standard_json_key: '',
        new_key_input: ''
      }
    ]);
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

  // Subvariables Handler Functions
  const handleAddSubvariable = () => {
    setSubvariables(prev => [
      ...prev,
      {
        id: null,
        name: '',
        unit: '',
        min_expected: '',
        max_expected: '',
        json_keys: [{ key_name: '', is_standard: true }],
        standard_json_key: '',
        new_key_input: '',
        expanded_keys: false
      }
    ]);
  };

  const handleRemoveSubvariable = (subIdx) => {
    setSubvariables(prev => prev.filter((_, idx) => idx !== subIdx));
  };

  const handleUpdateSubvariable = (subIdx, field, val) => {
    setSubvariables(prev => prev.map((item, idx) => {
      if (idx === subIdx) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const handleToggleExpandKeys = (subIdx) => {
    setSubvariables(prev => prev.map((item, idx) => {
      if (idx === subIdx) {
        return { ...item, expanded_keys: !item.expanded_keys };
      }
      return item;
    }));
  };

  const handleRemoveKeyFromSubvariable = (subIdx, keyNameToRemove) => {
    setSubvariables(prev => prev.map((item, idx) => {
      if (idx === subIdx) {
        const nextKeys = item.json_keys.filter(k => {
          const kName = typeof k === 'string' ? k : k.key_name;
          return kName.toLowerCase() !== keyNameToRemove.toLowerCase();
        });

        const currentStd = item.standard_json_key || '';
        const wasStd = currentStd.toLowerCase() === keyNameToRemove.toLowerCase();
        const firstKey = nextKeys[0] ? (typeof nextKeys[0] === 'string' ? nextKeys[0] : nextKeys[0].key_name) : '';
        const newStd = wasStd ? firstKey : currentStd;

        const updatedKeys = nextKeys.map(k => {
          const kName = typeof k === 'string' ? k : k.key_name;
          return {
            key_name: kName,
            is_standard: kName.toLowerCase() === newStd.toLowerCase()
          };
        });

        return {
          ...item,
          standard_json_key: newStd,
          json_keys: updatedKeys
        };
      }
      return item;
    }));
  };

  // Add JSON key to specific subvariable row
  const handleAddKeyToSubvariable = (subIdx) => {
    const sub = subvariables[subIdx];
    if (!sub) return;
    const clean = (sub.new_key_input || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');
    if (!clean) return;

    if (sub.json_keys.some(k => (typeof k === 'string' ? k : k.key_name).toLowerCase() === clean)) {
      Swal.fire({
        icon: 'warning',
        title: isEn ? 'Key exists' : 'Clave ya existe',
        text: isEn ? 'This JSON key is already added to this unit.' : 'Esta clave JSON ya está agregada a esta unidad.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const isFirst = sub.json_keys.length === 0;

    setSubvariables(prev => prev.map((item, idx) => {
      if (idx === subIdx) {
        const nextKeys = [...item.json_keys, { key_name: clean, is_standard: isFirst }];
        return {
          ...item,
          json_keys: nextKeys,
          standard_json_key: isFirst ? clean : item.standard_json_key,
          new_key_input: ''
        };
      }
      return item;
    }));
  };

  // Select standard key for subvariable row
  const handleSelectStandardKey = (subIdx, selectedKeyName) => {
    setSubvariables(prev => prev.map((item, idx) => {
      if (idx === subIdx) {
        const nextKeys = item.json_keys.map(k => {
          const kName = typeof k === 'string' ? k : k.key_name;
          return {
            key_name: kName,
            is_standard: kName === selectedKeyName
          };
        });
        return {
          ...item,
          standard_json_key: selectedKeyName,
          json_keys: nextKeys
        };
      }
      return item;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: isEn ? 'Incomplete fields' : 'Campos incompletos',
        text: isEn ? 'Please enter metric name.' : 'Por favor ingresa el nombre de la métrica.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const validSubs = subvariables.filter(s => (s.name && s.name.trim()) || (s.unit && s.unit.trim()));
    if (validSubs.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: isEn ? 'Missing subvariables' : 'Faltan subvariables',
        text: isEn ? 'Please add at least one unit/subvariable row.' : 'Por favor añade al menos una fila de subvariable / unidad.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setSaving(true);

    try {
      let metricId = editandoId;

      let cleanSymbolImage = symbolImage;
      if (cleanSymbolImage && cleanSymbolImage.startsWith('data:')) {
        cleanSymbolImage = undefined;
      }

      const formattedUnits = validSubs.map(s => {
        const validKeys = s.json_keys
          .map(k => typeof k === 'string' ? { key_name: k, is_standard: false } : k)
          .filter(k => k.key_name && k.key_name.trim());

        const stdKey = s.standard_json_key || (validKeys[0] ? validKeys[0].key_name : '');

        return {
          id: s.id || null,
          name: s.name.trim() || nombre.trim(),
          unit: s.unit.trim(),
          min_expected: s.min_expected !== '' ? parseFloat(s.min_expected) : null,
          max_expected: s.max_expected !== '' ? parseFloat(s.max_expected) : null,
          standard_json_key: stdKey,
          json_keys: validKeys
        };
      });

      const payload = {
        name: nombre.trim(),
        units: formattedUnits
      };
      if (cleanSymbolImage !== undefined) {
        payload.symbol_image = cleanSymbolImage;
      }

      if (editandoId) {
        const res = await fetchWithAuth(`${API_BASE_URL}/metricas/${editandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetchWithAuth(`${API_BASE_URL}/metricas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error();
        const createdMetric = await res.json();
        metricId = createdMetric.id;
      }

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
    setSymbolImage(m.symbol_image || m.imagen || '/symbols/default.webp');
    setSymbolFile(null);

    const unitsList = m.units || [];
    if (unitsList.length > 0) {
      setSubvariables(unitsList.map(u => {
        const keys = (u.json_keys || []).map(k => ({
          id: k.id,
          key_name: k.key_name || '',
          is_standard: Boolean(k.is_standard)
        }));
        const stdKeyObj = keys.find(k => k.is_standard) || keys[0];
        return {
          id: u.id,
          name: u.name || u.name_es || '',
          unit: u.unit || '',
          min_expected: u.min_expected !== null && u.min_expected !== undefined ? String(u.min_expected) : '',
          max_expected: u.max_expected !== null && u.max_expected !== undefined ? String(u.max_expected) : '',
          json_keys: keys,
          standard_json_key: stdKeyObj ? stdKeyObj.key_name : '',
          new_key_input: ''
        };
      }));
    } else {
      // Fallback single unit if metric didn't have units
      const keys = (m.json_keys || []).map(k => ({
        id: k.id,
        key_name: k.key_name || '',
        is_standard: Boolean(k.is_standard)
      }));
      const stdKeyObj = keys.find(k => k.is_standard) || keys[0];
      setSubvariables([
        {
          id: null,
          name: m.name || m.name_es || '',
          unit: m.unit || '',
          min_expected: m.min_expected !== null && m.min_expected !== undefined ? String(m.min_expected) : '',
          max_expected: m.max_expected !== null && m.max_expected !== undefined ? String(m.max_expected) : '',
          json_keys: keys,
          standard_json_key: stdKeyObj ? stdKeyObj.key_name : '',
          new_key_input: ''
        }
      ]);
    }

    setShowForm(true);
  };

  const eliminar = (id) => {
    const met = metricas.find(m => m.id === id);
    const mName = met?.name || met?.name_es || met?.nombre || '';

    Swal.fire({
      title: isEn ? 'Delete metric?' : '¿Eliminar métrica?',
      text: isEn ? `"${mName}" and all its subvariables will be deleted.` : `"${mName}" y todas sus subvariables serán eliminadas.`,
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
          MODO FORMULARIO — Visual Design from Image 3
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

          {/* ── Cuerpo en dos columnas (Imagen 3) ── */}
          <form onSubmit={handleSubmit} className="met-form-body">

            {/* ── COL IZQUIERDA: Nombre de la Métrica + Imagen de Símbolo ── */}
            <div className="met-form-left">
              <div className="met-field-group">
                <label className="met-label">{isEn ? 'Metric Name' : 'NOMBRE DE LA MÉTRICA'}</label>
                <input
                  autoFocus
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder={isEn ? 'e.g. Temperature, Distance / Length' : 'ej. Temperatura, Distancia / Longitud'}
                  className="met-input met-input--full"
                  style={{ width: '100%', maxWidth: '100%' }}
                />
              </div>

              {/* Imagen de Símbolo */}
              <div className="met-field-group" style={{ flex: 1 }}>
                <label className="met-label">{isEn ? 'Symbol Image (.webp in /symbols/)' : 'IMAGEN DE SÍMBOLO (.WEBP EN /SYMBOLS/)'}</label>
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
                  padding: '24px',
                  textAlign: 'center',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '220px',
                  gap: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}>
                  {symbolImage ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
                      <div style={{
                        width: '110px',
                        height: '110px',
                        borderRadius: '14px',
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.06)'
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
                            padding: '7px 16px',
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
                            padding: '7px 12px',
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
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── COL DERECHA: Subvariables de Métricas (Imagen 3) ── */}
            <div className="met-form-right">
              <div className="met-subs-section met-subs-section--full" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>

                {/* Subvariables Header Banner */}
                <div style={{
                  background: '#3b82f6',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                }}>
                  <span>{isEn ? 'ADD METRIC SUBVARIABLES' : 'AGREGAR SUBVARIABLES DE MÉTRICAS'}</span>
                  <button
                    type="button"
                    onClick={handleAddSubvariable}
                    style={{
                      background: 'rgba(255, 255, 255, 0.22)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '8px',
                      padding: '4px 12px',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    {isEn ? 'Add Row' : 'Añadir Fila'}
                  </button>
                </div>

                {/* Subvariables Header Columns */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 0.8fr 1.8fr 0.8fr 0.8fr 40px',
                  gap: '10px',
                  marginBottom: '10px',
                  padding: '0 6px'
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isEn ? 'NAME' : 'NOMBRE'}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isEn ? 'UNIT' : 'UNIDAD'}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isEn ? 'STANDARD JSON KEY' : 'CLAVE JSON ESTÁNDAR'}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isEn ? 'MIN' : 'MIN'}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isEn ? 'MAX' : 'MAX'}</span>
                  <span></span>
                </div>

                {/* Subvariables Rows List */}
                <div className="met-subs-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {subvariables.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', background: '#f8fafc', borderRadius: '12px' }}>
                      {isEn ? 'No subvariables added. Click "Add Row" above.' : 'Sin subvariables. Haz clic en "Añadir Fila" arriba.'}
                    </div>
                  ) : (
                    subvariables.map((sub, sIdx) => {
                      const keysList = sub.json_keys || [];

                      return (
                        <div key={sIdx} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          background: '#f8fafc',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '12px',
                          transition: 'all 0.2s ease'
                        }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1.4fr 0.8fr 1.8fr 0.8fr 0.8fr 40px',
                            gap: '10px',
                            alignItems: 'center'
                          }}>
                            {/* NOMBRE (ej. Grados Celsius) */}
                            <input
                              type="text"
                              value={sub.name}
                              onChange={e => handleUpdateSubvariable(sIdx, 'name', e.target.value)}
                              placeholder={isEn ? 'e.g. Degrees Celsius' : 'ej. Grados Celsius'}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1.5px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#0f2c59',
                                fontWeight: 700,
                                fontSize: '0.85rem'
                              }}
                            />

                            {/* UNIDAD (ej. ºC) */}
                            <input
                              type="text"
                              value={sub.unit}
                              onChange={e => handleUpdateSubvariable(sIdx, 'unit', e.target.value)}
                              placeholder={isEn ? 'e.g. °C' : 'ej. °C'}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1.5px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#0f2c59',
                                fontWeight: 700,
                                fontSize: '0.85rem'
                              }}
                            />

                            {/* CLAVE JSON ESTÁNDAR + Botón Desplegable de Claves */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <select
                                value={sub.standard_json_key || (keysList[0] ? (typeof keysList[0] === 'string' ? keysList[0] : keysList[0].key_name) : '')}
                                onChange={e => handleSelectStandardKey(sIdx, e.target.value)}
                                style={{
                                  flex: 1,
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: '1.5px solid #2563eb',
                                  background: '#ffffff',
                                  color: '#1e40af',
                                  fontWeight: 800,
                                  fontSize: '0.82rem',
                                  outline: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                {keysList.length === 0 ? (
                                  <option value="">{isEn ? '-- Select key --' : '-- Seleccionar clave --'}</option>
                                ) : (
                                  keysList.map((k, kIdx) => {
                                    const kName = typeof k === 'string' ? k : k.key_name;
                                    return (
                                      <option key={kIdx} value={kName}>
                                        {kName} {k.is_standard ? '★ (Estándar)' : ''}
                                      </option>
                                    );
                                  })
                                )}
                              </select>

                              {/* Botón con flecha hacia abajo para desplegar claves */}
                              <button
                                type="button"
                                onClick={() => handleToggleExpandKeys(sIdx)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  background: sub.expanded_keys ? '#2563eb' : '#ffffff',
                                  color: sub.expanded_keys ? '#ffffff' : '#2563eb',
                                  border: '1.5px solid #2563eb',
                                  fontWeight: 800,
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  flexShrink: 0
                                }}
                                title={isEn ? "Toggle JSON keys list" : "Desplegar / ocultar claves JSON asociadas"}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  width="12"
                                  height="12"
                                  style={{
                                    transform: sub.expanded_keys ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease'
                                  }}
                                >
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </button>
                            </div>

                            {/* MIN */}
                            <input
                              type="number"
                              step="any"
                              value={sub.min_expected}
                              onChange={e => handleUpdateSubvariable(sIdx, 'min_expected', e.target.value)}
                              placeholder="0"
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: '1.5px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#0f2c59',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                textAlign: 'center'
                              }}
                            />

                            {/* MAX */}
                            <input
                              type="number"
                              step="any"
                              value={sub.max_expected}
                              onChange={e => handleUpdateSubvariable(sIdx, 'max_expected', e.target.value)}
                              placeholder="100"
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: '1.5px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#0f2c59',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                textAlign: 'center'
                              }}
                            />

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveSubvariable(sIdx)}
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: '#ffffff',
                                border: '1.5px solid #fca5a5',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title={isEn ? 'Remove row' : 'Eliminar fila'}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
                          </div>

                          {/* Sub-row Desplegable: Claves asociadas a la unidad con botón X para borrar */}
                          {sub.expanded_keys && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              marginTop: '6px',
                              paddingTop: '8px',
                              borderTop: '1px dashed #cbd5e1',
                              animation: 'metFormIn 0.15s ease'
                            }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                                {isEn ? 'Keys linked to this unit:' : 'Claves asociadas a esta unidad:'}
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', flex: 1 }}>
                                {keysList.length === 0 ? (
                                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                    {isEn ? 'No keys linked yet' : 'Sin claves asociadas aún'}
                                  </span>
                                ) : (
                                  keysList.map((k, kIdx) => {
                                    const kName = typeof k === 'string' ? k : k.key_name;
                                    const isStd = (typeof k === 'object' && k.is_standard) || (sub.standard_json_key === kName);
                                    return (
                                      <span key={kIdx} style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        background: isStd ? '#dbeafe' : '#ffffff',
                                        color: isStd ? '#1e40af' : '#475569',
                                        border: isStd ? '1.5px solid #93c5fd' : '1.5px solid #cbd5e1',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                      }}>
                                        <span>{isStd ? `★ ${kName}` : kName}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveKeyFromSubvariable(sIdx, kName)}
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#ef4444',
                                            fontWeight: 900,
                                            fontSize: '0.85rem',
                                            lineHeight: 1,
                                            cursor: 'pointer',
                                            padding: '0 2px',
                                            marginLeft: '2px',
                                            borderRadius: '4px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                          title={isEn ? "Delete key" : "Borrar clave"}
                                        >
                                          ×
                                        </button>
                                      </span>
                                    );
                                  })
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <input
                                  type="text"
                                  value={sub.new_key_input || ''}
                                  onChange={e => handleUpdateSubvariable(sIdx, 'new_key_input', e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyToSubvariable(sIdx); } }}
                                  placeholder={isEn ? 'New key (e.g. temp)...' : 'Nueva clave (ej. temp)...'}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '0.78rem',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#0f2c59',
                                    fontWeight: 600,
                                    width: '150px'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddKeyToSubvariable(sIdx)}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '0.78rem',
                                    fontWeight: 800,
                                    borderRadius: '6px',
                                    background: '#2563eb',
                                    color: '#ffffff',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {isEn ? '+ Key' : '+ Clave'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Row Button at Bottom */}
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start' }}>
                  <button
                    type="button"
                    onClick={handleAddSubvariable}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1.5px solid #93c5fd',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    {isEn ? 'Add Subvariable / Unit' : '+ Añadir Subvariable / Unidad'}
                  </button>
                </div>

              </div>

              {/* Actions */}
              <div className="met-form-actions" style={{ marginTop: '20px' }}>
                <button type="button" onClick={cancelar} className="met-btn-cancel">{isEn ? 'Cancel' : 'Cancelar'}</button>
                <button type="submit" className="met-btn-save" disabled={saving}>
                  {saving ? (
                    isEn ? 'Saving...' : 'Guardando...'
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                      {editandoId ? (isEn ? 'Apply Changes' : 'Aplicar Cambios') : (isEn ? 'Save Metric' : 'Guardar Métrica')}
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
                placeholder={isEn ? 'Search metric or subvariable...' : 'Buscar métrica o subvariable...'}
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

          {/* ── Cards de Métricas Generales ── */}
          <div className="met-grid">
            {loading && <div className="met-loading-text">{isEn ? 'Loading metrics...' : 'Cargando métricas...'}</div>}
            {!loading && metricasFiltradas.length === 0 && (
              <div className="met-empty-state">{isEn ? 'No registered metrics found.' : 'No se encontraron métricas registradas.'}</div>
            )}

            {!loading && paginatedMetricas.map((m, idx) => {
              const mName = m.name || m.name_es || m.nombre || 'Métrica';
              const unitsList = m.units || [];

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
                    </h3>

                    <div className="met-card-section-title">📐 {isEn ? 'Subvariables / Units' : 'Subvariables de Métrica'}</div>

                    <div className="met-card-subs">
                      {unitsList.length === 0 ? (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>{isEn ? 'No units registered' : 'Sin unidades registradas'}</span>
                      ) : (
                        unitsList.map((u, i) => {
                          const uName = u.name || u.name_es || 'Unidad';
                          const uSymbol = u.unit ? `(${u.unit})` : '';
                          const keys = u.json_keys || [];
                          const stdKeyObj = keys.find(k => k.is_standard) || keys[0];
                          const stdKeyName = stdKeyObj ? (typeof stdKeyObj === 'string' ? stdKeyObj : stdKeyObj.key_name) : '';

                          return (
                            <div key={i} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                              padding: '6px 10px',
                              background: '#f8fafc',
                              border: '1.5px solid #e2e8f0',
                              borderRadius: '8px',
                              width: '100%'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f2c59' }}>{uName}</span>
                                {uSymbol && <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2563eb' }}>{uSymbol}</span>}
                              </div>
                              {stdKeyName && (
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '1px 7px', borderRadius: '6px' }}>
                                  ★ {stdKeyName}
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
