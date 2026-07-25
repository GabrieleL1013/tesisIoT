import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
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

export default function GestionarCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inline new row state
  const [addingRow, setAddingRow] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newColorHex, setNewColorHex] = useState('#3b82f6');

  // Inline edit state
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editColorHex, setEditColorHex] = useState('#3b82f6');

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/categorias');
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error al cargar categorías:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategorias(); }, []);

  /* ---------- helpers ---------- */
  const cancelAdd = () => { setAddingRow(false); setNewNombre(''); setNewColorHex('#3b82f6'); };
  const cancelEdit = () => { setEditId(null); };

  /* ---------- create ---------- */
  const handleCreate = async () => {
    if (!newNombre.trim()) {
      Swal.fire({ icon: 'warning', title: 'Campo vacío', text: 'Ingresa el nombre de la categoría.', confirmButtonColor: '#2563eb' });
      return;
    }
    try {
      const res = await fetch('http://127.0.0.1:8000/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newNombre.trim(), color: newColorHex, colorHex: newColorHex })
      });
      if (res.ok) {
        cancelAdd();
        fetchCategorias();
      } else {
        const err = await res.json();
        Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'No se pudo crear la categoría.', confirmButtonColor: '#2563eb' });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error de red', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#2563eb' });
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
      Swal.fire({ icon: 'warning', title: 'Campo vacío', text: 'El nombre no puede estar en blanco.', confirmButtonColor: '#2563eb' });
      return;
    }
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/categorias/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editNombre.trim(), color: editColorHex, colorHex: editColorHex })
      });
      if (res.ok) {
        cancelEdit();
        fetchCategorias();
      } else {
        const err = await res.json();
        Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'No se pudo actualizar.', confirmButtonColor: '#2563eb' });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error de red', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#2563eb' });
    }
  };

  /* ---------- delete ---------- */
  const handleDelete = (id) => {
    const cat = categorias.find(c => c.id === id);
    Swal.fire({
      title: '¿Eliminar categoría?',
      text: `"${cat?.nombre}" será eliminada permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/categorias/${id}`, { method: 'DELETE' });
        if (res.ok) {
          if (editId === id) cancelEdit();
          fetchCategorias();
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar la categoría.', confirmButtonColor: '#2563eb' });
        }
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error de red', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#2563eb' });
      }
    });
  };

  /* ---------- render ---------- */
  return (
    <div className="cat-page">

      {/* ── Header ── */}
      <div className="cat-header">
        <div>
          <h1 className="cat-heading">Líneas de Investigación</h1>
          <p className="cat-subheading">Clasifica tus nodos sensores por área académica.</p>
        </div>
        {!addingRow && (
          <button className="cat-btn-add" onClick={() => { setAddingRow(true); setEditId(null); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="15" height="15">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Agregar Categoría
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="cat-table-wrapper">
        <table className="cat-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre de Línea</th>
              <th>Color</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>

            {/* Loading */}
            {loading && (
              <tr><td colSpan="4" className="cat-empty-cell">Cargando datos...</td></tr>
            )}

            {/* Existing rows */}
            {!loading && categorias.map((cat, idx) =>
              editId === cat.id ? (
                /* ── Inline Edit Row ── */
                <tr key={cat.id} className="cat-row-editing">
                  <td className="cat-idx">{idx + 1}</td>
                  <td>
                    <input
                      autoFocus
                      className="cat-inline-input"
                      value={editNombre}
                      onChange={e => setEditNombre(e.target.value)}
                      placeholder="Nombre de categoría"
                      onKeyDown={e => e.key === 'Enter' && handleUpdate()}
                    />
                  </td>
                  <td>
                    <PrettyColorPicker value={editColorHex} onChange={setEditColorHex} />
                  </td>
                  <td>
                    <div className="cat-inline-actions">
                      {/* ✔ Save */}
                      <button className="cat-btn-confirm" title="Guardar cambios" onClick={handleUpdate}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                      {/* ✕ Cancel */}
                      <button className="cat-btn-cancel-inline" title="Cancelar" onClick={cancelEdit}>
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
                  <td className="cat-idx">{idx + 1}</td>
                  <td className="cat-name">{cat.nombre}</td>
                  <td>
                    <div className="cat-badge" style={{ borderColor: cat.colorHex + '55' }}>
                      <span className="cat-badge-dot" style={{ backgroundColor: cat.colorHex }} />
                      <span className="cat-badge-hex">{cat.colorHex}</span>
                    </div>
                  </td>
                  <td>
                    <div className="cat-row-actions">
                      <button className="cat-btn-edit" onClick={() => startEdit(cat)} title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Editar
                      </button>
                      <button className="cat-btn-delete" onClick={() => handleDelete(cat.id)} title="Eliminar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}

            {/* Empty state */}
            {!loading && categorias.length === 0 && !addingRow && (
              <tr><td colSpan="4" className="cat-empty-cell">No hay categorías registradas aún.</td></tr>
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
                    placeholder="Nombre de la categoría"
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  />
                </td>
                <td>
                  <PrettyColorPicker value={newColorHex} onChange={setNewColorHex} />
                </td>
                <td>
                  <div className="cat-inline-actions">
                    {/* ✔ Save */}
                    <button className="cat-btn-confirm" title="Guardar categoría" onClick={handleCreate}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    {/* ✕ Cancel */}
                    <button className="cat-btn-cancel-inline" title="Cancelar" onClick={cancelAdd}>
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

    </div>
  );
}
