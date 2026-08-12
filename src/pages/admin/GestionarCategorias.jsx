import SEO from "../../components/SEO";
import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useLanguage } from '../../context/LanguageContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import '../../styles/components/admin/GestionarCategorias.css';
import '../../styles/components/admin/GestionarUsuarios.css';

const hexToHsv = (hex) => {
  let c = (hex || '#3b82f6').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return { h: 217, s: 76, v: 96 };
  const r = parseInt(c.substr(0, 2), 16) / 255;
  const g = parseInt(c.substr(2, 2), 16) / 255;
  const b = parseInt(c.substr(4, 2), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
};

const hsvToHex = (h, s, v) => {
  const sat = s / 100, val = v / 100;
  let r, g, b;
  const i = Math.floor((h / 60) % 6);
  const f = h / 60 - i;
  const p = val * (1 - sat);
  const q = val * (1 - f * sat);
  const t = val * (1 - (1 - f) * sat);
  switch (i) {
    case 0: r = val; g = t; b = p; break;
    case 1: r = q; g = val; b = p; break;
    case 2: r = p; g = val; b = t; break;
    case 3: r = p; g = q; b = val; break;
    case 4: r = t; g = p; b = val; break;
    case 5: r = val; g = p; b = q; break;
  }
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hsvToRgb = (h, s, v) => {
  const hex = hsvToHex(h, s, v).replace('#', '');
  return {
    r: parseInt(hex.substr(0, 2), 16) || 0,
    g: parseInt(hex.substr(2, 2), 16) || 0,
    b: parseInt(hex.substr(4, 2), 16) || 0
  };
};

const CustomColorPickerPopover = ({ value, onChange, onClose }) => {
  const containerRef = useRef(null);
  const satAreaRef = useRef(null);
  const hueSliderRef = useRef(null);

  const [hsv, setHsv] = useState(() => hexToHsv(value));

  useEffect(() => {
    setHsv(hexToHsv(value));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSatMouseDown = (e) => {
    const updateSatVal = (evt) => {
      if (!satAreaRef.current) return;
      const rect = satAreaRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, evt.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, evt.clientY - rect.top));
      const newS = Math.round((x / rect.width) * 100);
      const newV = Math.round((1 - y / rect.height) * 100);
      
      const newHsv = { ...hsv, s: newS, v: newV };
      setHsv(newHsv);
      onChange(hsvToHex(newHsv.h, newS, newV));
    };

    updateSatVal(e);

    const onMouseMove = (evt) => updateSatVal(evt);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleHueMouseDown = (e) => {
    const updateHue = (evt) => {
      if (!hueSliderRef.current) return;
      const rect = hueSliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, evt.clientX - rect.left));
      const newH = Math.round((x / rect.width) * 360);
      
      const newHsv = { ...hsv, h: newH };
      setHsv(newHsv);
      onChange(hsvToHex(newH, newHsv.s, newHsv.v));
    };

    updateHue(e);

    const onMouseMove = (evt) => updateHue(evt);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          onChange(result.sRGBHex);
        }
      } catch (err) {
        console.log('Eyedropper cancelado');
      }
    }
  };

  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const pureHueHex = hsvToHex(hsv.h, 100, 100);

  return (
    <div className="pretty-color-popover-panel" ref={containerRef}>
      {/* Canvas 2D Saturación / Brillo */}
      <div 
        ref={satAreaRef}
        className="pretty-sat-val-area"
        style={{ backgroundColor: pureHueHex }}
        onMouseDown={handleSatMouseDown}
      >
        <div className="pretty-sat-val-white" />
        <div className="pretty-sat-val-black" />
        <div 
          className="pretty-sat-val-pointer"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            backgroundColor: value || '#3b82f6'
          }}
        />
      </div>

      {/* Controles: Pipeta, Círculo de Color Seleccionado, Hue Slider */}
      <div className="pretty-popover-controls-row">
        {'EyeDropper' in window && (
          <button 
            type="button" 
            className="pretty-pipeta-btn" 
            onClick={handleEyeDropper}
            title="Capturar color de la pantalla"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
              <path d="M14 2l4 4L7 17H3v-4L14 2z" />
              <path d="M11 5l4 4" />
            </svg>
          </button>
        )}

        <div 
          className="pretty-popover-color-circle" 
          style={{ backgroundColor: value || '#3b82f6' }} 
        />

        <div 
          ref={hueSliderRef}
          className="pretty-hue-slider-track"
          onMouseDown={handleHueMouseDown}
        >
          <div 
            className="pretty-hue-slider-pointer"
            style={{ left: `${(hsv.h / 360) * 100}%` }}
          />
        </div>
      </div>

      {/* Entradas R G B */}
      <div className="pretty-rgb-inputs-row">
        <div className="pretty-rgb-field">
          <input 
            type="text" 
            value={rgb.r} 
            onChange={(e) => {
              const newR = Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0));
              const hex = `#${newR.toString(16).padStart(2,'0')}${rgb.g.toString(16).padStart(2,'0')}${rgb.b.toString(16).padStart(2,'0')}`;
              onChange(hex);
            }} 
          />
          <span>R</span>
        </div>
        <div className="pretty-rgb-field">
          <input 
            type="text" 
            value={rgb.g} 
            onChange={(e) => {
              const newG = Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0));
              const hex = `#${rgb.r.toString(16).padStart(2,'0')}${newG.toString(16).padStart(2,'0')}${rgb.b.toString(16).padStart(2,'0')}`;
              onChange(hex);
            }} 
          />
          <span>G</span>
        </div>
        <div className="pretty-rgb-field">
          <input 
            type="text" 
            value={rgb.b} 
            onChange={(e) => {
              const newB = Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0));
              const hex = `#${rgb.r.toString(16).padStart(2,'0')}${rgb.g.toString(16).padStart(2,'0')}${newB.toString(16).padStart(2,'0')}`;
              onChange(hex);
            }} 
          />
          <span>B</span>
        </div>
      </div>
    </div>
  );
};

const PrettyColorPicker = ({ value, onChange }) => {
  const [showPopover, setShowPopover] = useState(false);
  const currentColor = value || '#3b82f6';

  return (
    <div className="pretty-color-picker-container" style={{ position: 'relative' }}>
      <div className="pretty-color-input-row">
        <div 
          className="pretty-color-badge-preview"
          style={{ backgroundColor: currentColor }}
          onClick={() => setShowPopover(!showPopover)}
          title="Haz clic para abrir el selector de color avanzado"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" width="14" height="14" className="pretty-color-edit-icon">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
          </svg>
        </div>

        <div className="pretty-hex-input-wrapper">
          <span className="pretty-hex-prefix">#</span>
          <input 
            type="text"
            value={currentColor.replace('#', '')}
            onChange={(e) => {
              const val = e.target.value.trim();
              onChange(val ? `#${val}` : '#');
            }}
            placeholder="3b82f6"
            className="pretty-hex-input"
            maxLength={7}
          />
        </div>

        <button
          type="button"
          className="pretty-custom-picker-btn"
          onClick={() => setShowPopover(!showPopover)}
          title="Selector de color con animación"
        >
          <span 
            style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: currentColor,
              display: 'inline-block',
              boxShadow: '0 0 0 1.5px #ffffff, 0 0 0 2.5px rgba(0,0,0,0.15)',
              transition: 'background-color 0.15s ease'
            }} 
          />
          Gama
        </button>
      </div>

      {showPopover && (
        <CustomColorPickerPopover 
          value={currentColor} 
          onChange={onChange} 
          onClose={() => setShowPopover(false)} 
        />
      )}
    </div>
  );
};

const CustomItemsPerPageSelect = ({ value, onChange, options = [5, 10, 20, 50], language = 'es' }) => {
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

export default function GestionarCategorias() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  usePageTitle({ es: 'Gestionar Categorías', en: 'Manage Categories' }, 'Admin · IoT ULEAM');
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Inline new row state
  const [addingRow, setAddingRow] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newColorHex, setNewColorHex] = useState('#3b82f6');

  // Inline edit state
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editColorHex, setEditColorHex] = useState('#3b82f6');

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, itemsPerPage]);

  const categoriasFiltradas = categorias.filter(c => {
    if (!busqueda.trim()) return true;
    return c.nombre.toLowerCase().includes(busqueda.toLowerCase().trim());
  });

  const totalPages = Math.ceil(categoriasFiltradas.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const categoriasPaginadas = categoriasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/categorias?lang=${language}`);
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error al cargar categorías:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategorias(); }, [language]);

  /* ---------- helpers ---------- */
  const cancelAdd = () => { setAddingRow(false); setNewNombre(''); setNewColorHex('#3b82f6'); };
  const cancelEdit = () => { setEditId(null); };

  /* ---------- create ---------- */
  const handleCreate = async () => {
    if (!newNombre.trim()) {
      Swal.fire({ icon: 'warning', title: isEn ? 'Empty field' : 'Campo vacío', text: isEn ? 'Enter category name.' : 'Ingresa el nombre de la categoría.', confirmButtonColor: '#2563eb' });
      return;
    }
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/categorias?lang=${language}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newNombre.trim(), color: newColorHex, colorHex: newColorHex })
      });
      if (res.ok) {
        cancelAdd();
        fetchCategorias();
      } else {
        const err = await res.json();
        Swal.fire({ icon: 'error', title: 'Error', text: err.message || (isEn ? 'Could not create category.' : 'No se pudo crear la categoría.'), confirmButtonColor: '#2563eb' });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: isEn ? 'Network error' : 'Error de red', text: isEn ? 'Could not connect to server.' : 'No se pudo conectar con el servidor.', confirmButtonColor: '#2563eb' });
    }
  };

  /* ---------- update ---------- */
  const startEdit = (cat) => {
    setEditId(cat.id);
    setEditNombre(cat.nombre);
    setEditColorHex(cat.colorHex || '#3b82f6');
    setAddingRow(false);
  };

  const handleUpdate = async () => {
    if (!editNombre.trim()) {
      Swal.fire({ icon: 'warning', title: isEn ? 'Empty field' : 'Campo vacío', text: isEn ? 'Name cannot be blank.' : 'El nombre no puede estar en blanco.', confirmButtonColor: '#2563eb' });
      return;
    }
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/categorias/${editId}?lang=${language}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editNombre.trim(), color: editColorHex, colorHex: editColorHex })
      });
      if (res.ok) {
        cancelEdit();
        fetchCategorias();
      } else {
        const err = await res.json();
        Swal.fire({ icon: 'error', title: 'Error', text: err.message || (isEn ? 'Could not update.' : 'No se pudo actualizar.'), confirmButtonColor: '#2563eb' });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: isEn ? 'Network error' : 'Error de red', text: isEn ? 'Could not connect to server.' : 'No se pudo conectar con el servidor.', confirmButtonColor: '#2563eb' });
    }
  };

  /* ---------- delete ---------- */
  const handleDelete = (id) => {
    const cat = categorias.find(c => c.id === id);
    Swal.fire({
      title: isEn ? 'Delete category?' : '¿Eliminar categoría?',
      text: isEn ? `"${cat?.nombre}" will be permanently deleted.` : `"${cat?.nombre}" será eliminada permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
      confirmButtonText: isEn ? 'Yes, delete' : 'Sí, eliminar',
      cancelButtonText: isEn ? 'Cancel' : 'Cancelar'
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/categorias/${id}`, { method: 'DELETE' });
        if (res.ok) {
          if (editId === id) cancelEdit();
          fetchCategorias();
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: isEn ? 'Could not delete category.' : 'No se pudo eliminar la categoría.', confirmButtonColor: '#2563eb' });
        }
      } catch (e) {
        Swal.fire({ icon: 'error', title: isEn ? 'Network error' : 'Error de red', text: isEn ? 'Could not connect to server.' : 'No se pudo conectar con el servidor.', confirmButtonColor: '#2563eb' });
      }
    });
  };

  /* ---------- render ---------- */
  return (
    <div className="cat-page">
      <SEO 
        title={isEn ? "Categories - IoT ULEAM" : "Categorías - IoT ULEAM"}
        description={isEn ? "Manage and view IoT node categories." : "Gestiona y visualiza las categorías de los nodos IoT."}
      />

      {/* ── Header ── */}
      <div className="cat-header">
        <div>
          <h1 className="cat-heading">{isEn ? 'Research Lines' : 'Líneas de Investigación'}</h1>
          <p className="cat-subheading">{isEn ? 'Classify your sensor nodes by academic area.' : 'Clasifica tus nodos sensores por área académica.'}</p>
        </div>
        {!addingRow && (
          <button className="cat-btn-add" onClick={() => { setAddingRow(true); setEditId(null); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="15" height="15">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {isEn ? 'Add Category' : 'Agregar Categoría'}
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="cat-table-wrapper">
        <table className="cat-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{isEn ? 'Line Name' : 'Nombre de Línea'}</th>
              <th>{isEn ? 'Color' : 'Color'}</th>
              <th style={{ textAlign: 'right' }}>{isEn ? 'Actions' : 'Acciones'}</th>
            </tr>
          </thead>
          <tbody>

            {/* Loading */}
            {loading && (
              <tr><td colSpan="4" className="cat-empty-cell">{isEn ? 'Loading data...' : 'Cargando datos...'}</td></tr>
            )}

            {/* Existing rows */}
            {!loading && categoriasPaginadas.map((cat, idx) =>
              editId === cat.id ? (
                /* ── Inline Edit Row ── */
                <tr key={cat.id} className="cat-row-editing">
                  <td className="cat-idx">{startIndex + idx + 1}</td>
                  <td>
                    <input
                      autoFocus
                      className="cat-inline-input"
                      value={editNombre}
                      onChange={e => setEditNombre(e.target.value)}
                      placeholder={isEn ? 'Category name' : 'Nombre de categoría'}
                      onKeyDown={e => e.key === 'Enter' && handleUpdate()}
                    />
                  </td>
                  <td>
                    <PrettyColorPicker value={editColorHex} onChange={setEditColorHex} />
                  </td>
                  <td>
                    <div className="cat-inline-actions">
                      {/* ✔ Save */}
                      <button className="cat-btn-confirm" title={isEn ? "Save changes" : "Guardar cambios"} onClick={handleUpdate}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                      {/* ✕ Cancel */}
                      <button className="cat-btn-cancel-inline" title={isEn ? "Cancel" : "Cancelar"} onClick={cancelEdit}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                /* ── Normal Row ── */
                <tr key={cat.id} className="cat-row">
                  <td className="cat-idx">{startIndex + idx + 1}</td>
                  <td className="cat-name">{cat.nombre}</td>
                  <td>
                    <div className="cat-badge" style={{ borderColor: cat.colorHex + '55' }}>
                      <span className="cat-badge-dot" style={{ backgroundColor: cat.colorHex }} />
                      <span className="cat-badge-hex">{cat.colorHex}</span>
                    </div>
                  </td>
                  <td>
                    <div className="cat-row-actions">
                      <button className="cat-btn-edit" onClick={() => startEdit(cat)} title={isEn ? "Edit" : "Editar"}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        {isEn ? 'Edit' : 'Editar'}
                      </button>
                      <button className="cat-btn-delete" onClick={() => handleDelete(cat.id)} title={isEn ? "Delete" : "Eliminar"}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        {isEn ? 'Delete' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}

            {/* Empty state */}
            {!loading && categorias.length === 0 && !addingRow && (
              <tr><td colSpan="4" className="cat-empty-cell">{isEn ? 'No categories registered yet.' : 'No hay categorías registradas aún.'}</td></tr>
            )}

            {/* ── Inline New Row ── */}
            {addingRow && (
              <tr className="cat-row-adding">
                <td className="cat-idx">—</td>
                <td>
                  <input
                    autoFocus
                    className="cat-inline-input"
                    value={newNombre}
                    onChange={e => setNewNombre(e.target.value)}
                    placeholder={isEn ? 'Category name' : 'Nombre de la categoría'}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  />
                </td>
                <td>
                  <PrettyColorPicker value={newColorHex} onChange={setNewColorHex} />
                </td>
                <td>
                  <div className="cat-inline-actions">
                    {/* ✔ Save */}
                    <button className="cat-btn-confirm" title={isEn ? "Save category" : "Guardar categoría"} onClick={handleCreate}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    {/* ✕ Cancel */}
                    <button className="cat-btn-cancel-inline" title={isEn ? "Cancel" : "Cancelar"} onClick={cancelAdd}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      {!loading && categoriasFiltradas.length > 0 && (
        <div className="cat-pagination-bar">
          <div className="pagination-info-text">
            {isEn 
              ? `Showing ${Math.min(startIndex + 1, categoriasFiltradas.length)} to ${Math.min(startIndex + itemsPerPage, categoriasFiltradas.length)} of ${categoriasFiltradas.length} categories`
              : `Mostrando ${Math.min(startIndex + 1, categoriasFiltradas.length)} a ${Math.min(startIndex + itemsPerPage, categoriasFiltradas.length)} de ${categoriasFiltradas.length} categorías`}
          </div>

          <div className="pagination-controls-group">
            <CustomItemsPerPageSelect
              value={itemsPerPage}
              onChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
              options={[5, 10, 20, 50]}
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

    </div>
  );
}
