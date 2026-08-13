import { API_BASE_URL, fetchDeduplicated } from '../config/api';
import { echo } from '../config/echo';
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, ReferenceLine } from 'recharts';
import '../styles/VisualizarMapa.css';
import EditableText from '../components/EditableText';
import ModalExportarCSV from '../components/ModalExportarCSV';
import { useLanguage } from '../context/LanguageContext';
import { usePageTitle } from '../hooks/usePageTitle';

// Icono de Calendario SVG
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// Mapeador de iconos SVG premium para las categorías públicas (reemplazando emojis)
const getCategorySVGIcon = (catName) => {
  const name = (catName || '').toLowerCase();

  // Icono de Educación/Universidad (Uleam, Laica, etc.)
  if (name.includes('universidad') || name.includes('uleam') || name.includes('laica')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="22" height="22">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Icono de IoT/Red/Nodos
  if (name.includes('red') || name.includes('iot') || name.includes('nodo')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="22" height="22">
        <circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="4" cy="4" r="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="4" r="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="20" r="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="4" cy="20" r="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="5.41" y1="5.41" x2="9.17" y2="9.17" strokeLinecap="round" />
        <line x1="18.59" y1="5.41" x2="14.83" y2="9.17" strokeLinecap="round" />
        <line x1="18.59" y1="18.59" x2="14.83" y2="14.83" strokeLinecap="round" />
        <line x1="5.41" y1="18.59" x2="9.17" y2="14.83" strokeLinecap="round" />
      </svg>
    );
  }

  // Icono fallback de Microprocesador/Hardware
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="22" height="22">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="9" width="6" height="6" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="9" y1="1" x2="9" y2="4" strokeLinecap="round" />
      <line x1="15" y1="1" x2="15" y2="4" strokeLinecap="round" />
      <line x1="9" y1="20" x2="9" y2="23" strokeLinecap="round" />
      <line x1="15" y1="20" x2="15" y2="23" strokeLinecap="round" />
      <line x1="20" y1="9" x2="23" y2="9" strokeLinecap="round" />
      <line x1="20" y1="15" x2="23" y2="15" strokeLinecap="round" />
      <line x1="1" y1="9" x2="4" y2="9" strokeLinecap="round" />
      <line x1="1" y1="15" x2="4" y2="15" strokeLinecap="round" />
    </svg>
  );
};

const DYNAMIC_ICONS_PUBLIC = {
  termometro: { class: 'theme-red', hex: '#FF0000', bg: '#fff0f0', icon: <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /> },
  humedad: { class: 'theme-blue', hex: '#2563eb', bg: '#eff6ff', icon: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /> },
  presion: { class: 'theme-green', hex: '#94C11F', bg: '#f7fbe9', icon: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="12" x2="15" y2="9" /></> },
  viento: { class: 'theme-cyan', hex: '#06b6d4', bg: '#ecfeff', icon: <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" /> },
  lluvia: { class: 'theme-purple', hex: '#8b5cf6', bg: '#f5f3ff', icon: <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25M8 16v4m4-2v4m4-4v4" /> },
  luz: { class: 'theme-orange', hex: '#f59e0b', bg: '#fffbeb', icon: <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></> },
  energia: { class: 'theme-blue', hex: '#6366f1', bg: '#eef2ff', icon: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /> },
  ph: { class: 'theme-green', hex: '#94C11F', bg: '#f7fbe9', icon: <path d="M10 2v7.31L4.75 18.25A2 2 0 0 0 6.46 21.2h11.08a2 2 0 0 0 1.71-2.95L14 9.31V2" /> },
  sonido: { class: 'theme-purple', hex: '#a855f7', bg: '#faf5ff', icon: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></> },
  general: { class: 'theme-green', hex: '#94C11F', bg: '#f7fbe9', icon: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></> }
};

const VAR_PALETTE = [
  { class: 'theme-red', hex: '#FF0000', bg: '#fff0f0', border: '#ffb3b3' },    // ULEAM Official Red
  { class: 'theme-green', hex: '#94C11F', bg: '#f7fbe9', border: '#cce580' },  // ULEAM Official Green
  { class: 'theme-gray', hex: '#4A4A49', bg: '#f4f4f4', border: '#d1d1d1' },   // ULEAM Official Gray
  { class: 'theme-blue', hex: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },   // Vibrant Blue
  { class: 'theme-amber', hex: '#d97706', bg: '#fffbeb', border: '#fcd34d' },  // Amber Orange
  { class: 'theme-purple', hex: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd' }, // Violet / Purple
  { class: 'theme-cyan', hex: '#06b6d4', bg: '#ecfeff', border: '#67e8f9' }    // Cyan
];

const getTheme = (clave, icono, idx = null) => {
  let baseTheme = null;
  if (icono && DYNAMIC_ICONS_PUBLIC[icono]) {
    baseTheme = DYNAMIC_ICONS_PUBLIC[icono];
  } else {
    const t = (clave || '').toLowerCase();
    if (t.includes('temp')) baseTheme = DYNAMIC_ICONS_PUBLIC.termometro;
    else if (t.includes('hum') || t.includes('soil')) baseTheme = DYNAMIC_ICONS_PUBLIC.humedad;
    else if (t.includes('press') || t.includes('presion')) baseTheme = DYNAMIC_ICONS_PUBLIC.presion;
    else if (t.includes('wind') || t.includes('viento')) baseTheme = DYNAMIC_ICONS_PUBLIC.viento;
    else if (t.includes('rain') || t.includes('lluvia')) baseTheme = DYNAMIC_ICONS_PUBLIC.lluvia;
    else if (t.includes('ph')) baseTheme = DYNAMIC_ICONS_PUBLIC.ph;
    else if (t.includes('oxigen') || t.includes('oxy')) baseTheme = DYNAMIC_ICONS_PUBLIC.oxigeno;
  }

  if (idx !== null && idx !== undefined) {
    const paletteItem = VAR_PALETTE[Math.abs(idx) % VAR_PALETTE.length];
    return {
      class: paletteItem.class,
      hex: paletteItem.hex,
      bg: paletteItem.bg,
      border: paletteItem.border,
      icon: baseTheme ? baseTheme.icon : DYNAMIC_ICONS_PUBLIC.general.icon
    };
  }

  return baseTheme || DYNAMIC_ICONS_PUBLIC.general;
};

// Componente Custom Select para la Selección de Nodo / Dispositivo en la Interfaz Pública
const PublicCustomSelectNode = ({ nodos, selectedNodeId, onSelect, placeholder = null }) => {
  const { t } = useLanguage();
  const defaultPlaceholder = placeholder || t("map.select_device_node", "-- Seleccionar Dispositivo / Nodo --");
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedNode = nodos.find(n => n.id.toString() === (selectedNodeId || '').toString());

  return (
    <div className="public-custom-select-wrapper" ref={ref}>
      <button
        type="button"
        className={`public-custom-select-trigger ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <span className="public-select-icon-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <rect x="2" y="2" width="20" height="8" rx="1.5" />
              <rect x="2" y="14" width="20" height="8" rx="1.5" />
              <circle cx="6" cy="6" r="1.5" fill="currentColor" />
              <circle cx="6" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: selectedNode ? '#0f2c59' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedNode ? selectedNode.nombre : defaultPlaceholder}
          </span>
        </div>
        <svg className={`public-select-chevron ${open ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="public-custom-select-dropdown">
          <div
            className={`public-select-option ${!selectedNodeId ? 'selected' : ''}`}
            onClick={() => {
              onSelect('');
              setOpen(false);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="public-option-bullet" />
              <span>{defaultPlaceholder}</span>
            </div>
            {!selectedNodeId && (
              <svg viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="3" width="14" height="14">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          {nodos.map(n => {
            const isSelected = selectedNodeId && selectedNodeId.toString() === n.id.toString();
            return (
              <div
                key={n.id}
                className={`public-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelect(n.id.toString());
                  setOpen(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`public-option-bullet ${isSelected ? 'active' : ''}`} />
                  <span style={{ fontWeight: isSelected ? 800 : 600 }}>{n.nombre}</span>
                </div>
                {isSelected && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="3" width="14" height="14">
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

// Botón Marcar Todas parcial con estado neutro inicial y hover verde
const MarcarTodasBtnPartial = ({ onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '10px',
        border: `1.5px solid ${hovered ? '#10b981' : '#cbd5e1'}`,
        backgroundColor: hovered ? '#ecfdf5' : '#ffffff',
        color: hovered ? '#047857' : '#334155',
        fontWeight: 700,
        fontSize: '0.81rem',
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}
      title="Marcar todas las variables"
    >
      <span style={{
        width: '15px',
        height: '15px',
        borderRadius: '4px',
        border: `1.5px solid ${hovered ? '#10b981' : '#94a3b8'}`,
        backgroundColor: hovered ? '#10b981' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: hovered ? '#ffffff' : 'transparent',
        fontSize: '10px',
        fontWeight: 900,
        transition: 'all 0.2s ease'
      }}>✓</span>
      <span>Marcar Todas</span>
    </button>
  );
};

// Botón Desmarcar Todas con hover de borde rojo y X resaltada
const DesmarcarTodasBtn = ({ onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '10px',
        border: `1.5px solid ${hovered ? '#ef4444' : '#cbd5e1'}`,
        backgroundColor: hovered ? '#fef2f2' : '#ffffff',
        color: hovered ? '#dc2626' : '#475569',
        fontWeight: 700,
        fontSize: '0.81rem',
        cursor: 'pointer',
        boxShadow: hovered ? '0 3px 10px rgba(239, 68, 68, 0.2)' : '0 2px 5px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}
      title="Desmarcar todas las variables y volver a vista individual"
    >
      <span style={{
        width: '15px',
        height: '15px',
        borderRadius: '4px',
        border: `1.5px solid ${hovered ? '#ef4444' : '#94a3b8'}`,
        backgroundColor: hovered ? '#ef4444' : '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: hovered ? '#ffffff' : '#64748b',
        fontSize: '10px',
        fontWeight: 900,
        transition: 'all 0.2s ease'
      }}>✕</span>
      <span>Desmarcar Todas</span>
    </button>
  );
};

const formatTimestampCard = (rawFecha) => {
  if (!rawFecha) {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  }

  let d;
  if (typeof rawFecha === 'number') {
    d = new Date(rawFecha > 1e11 ? rawFecha : rawFecha * 1000);
  } else if (typeof rawFecha === 'string') {
    let str = rawFecha.trim().replace(/\s*([ap]\.?m\.?|AM|PM)/gi, '').trim();

    // 1. Coincidencia YYYY-MM-DD HH:MM:SS o YYYY/MM/DD
    const matchYMD = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T\s,]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    // 2. Coincidencia DD/MM/YYYY HH:MM:SS o DD-MM-YYYY
    const matchDMY = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})[T\s,]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);

    if (matchYMD) {
      d = new Date(parseInt(matchYMD[1], 10), parseInt(matchYMD[2], 10) - 1, parseInt(matchYMD[3], 10), parseInt(matchYMD[4], 10), parseInt(matchYMD[5], 10), matchYMD[6] ? parseInt(matchYMD[6], 10) : 0);
    } else if (matchDMY) {
      d = new Date(parseInt(matchDMY[3], 10), parseInt(matchDMY[2], 10) - 1, parseInt(matchDMY[1], 10), parseInt(matchDMY[4], 10), parseInt(matchDMY[5], 10), matchDMY[6] ? parseInt(matchDMY[6], 10) : 0);
    } else {
      d = new Date(str);
    }
  } else if (rawFecha instanceof Date) {
    d = rawFecha;
  }

  if (!d || isNaN(d.getTime())) return String(rawFecha).replace(/\s*([ap]\.?m\.?|AM|PM)/gi, '');

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
};

// Tooltip personalizado para el gráfico público
const CustomPublicChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const itemData = payload[0]?.payload || {};
  let dateStr = '';
  let timeStr = label || itemData.time || itemData.shortTime || '';

  // Extraer fecha y hora de dateTime o created_at
  if (itemData.dateTime) {
    const parts = itemData.dateTime.split(/[\s,]+/);
    if (parts.length >= 2) {
      dateStr = parts[0];
      if (!timeStr) timeStr = parts[1];
    } else {
      dateStr = itemData.dateTime;
    }
  } else if (itemData.created_at) {
    try {
      const d = new Date(itemData.created_at);
      dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (!timeStr) {
        timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      }
    } catch (e) {}
  }

  // Fallback de fecha actual en formato DD/MM/YYYY
  if (!dateStr) {
    dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  return (
    <div style={{
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '12px',
      padding: '10px 14px',
      color: '#ffffff',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      fontSize: '0.82rem',
      minWidth: '180px'
    }}>
      <div style={{ marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>📅</span> <span>{dateStr}</span>
        </div>
        <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>🕒</span> <span>{timeStr}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {payload.map((item, idx) => {
          const color = item.color || item.fill || '#10b981';
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
                <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{item.name}:</span>
              </div>
              <span style={{ fontWeight: 800, color: color }}>{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const extractHHMMSS = (inputStr, rawTimestamp) => {
  if (inputStr && typeof inputStr === 'string') {
    const str = inputStr.trim().replace(/\s*([ap]\.?m\.?|AM|PM)/gi, '').trim();
    if (str.includes(' ')) {
      const parts = str.split(/\s+/);
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes(':')) return lastPart;
    }
    if (str.includes('T')) {
      const timePart = str.split('T')[1].split('.')[0];
      if (timePart.includes(':')) return timePart;
    }
    if (str.includes(',')) {
      const timePart = str.split(',')[1].trim();
      if (timePart.includes(':')) return timePart;
    }
    if (str.includes(':')) {
      return str;
    }
  }

  const d = rawTimestamp
    ? new Date(rawTimestamp > 1e11 ? rawTimestamp : rawTimestamp * 1000)
    : new Date();
  if (!isNaN(d.getTime())) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  const dNow = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(dNow.getHours())}:${pad(dNow.getMinutes())}:${pad(dNow.getSeconds())}`;
};

// Garante ticks con hora exacta en formato 24h (hh:mm:ss) para la XAxis
const CustomXAxisTick = ({ x, y, payload }) => {
  if (!payload || !payload.value) return null;
  const rawStr = String(payload.value).trim().replace(/\s*([ap]\.?m\.?|AM|PM)/gi, '');
  const parts = rawStr.split(' ');
  let timeText = parts.length >= 2 ? parts[parts.length - 1] : rawStr;
  let dateText = parts.length >= 2 ? parts[0] : '';

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill="#0f172a">
        <tspan x="0" dy="11" fill="#0f2c59" fontSize="10" fontWeight="800">{timeText}</tspan>
        {dateText && <tspan x="0" dy="13" fill="#64748b" fontSize="8.5" fontWeight="600">{dateText}</tspan>}
      </text>
    </g>
  );
};

// Helper para obtener la URL completa de la imagen del símbolo de la métrica desde la BD (backend/public/symbols/...)
const getMetricSymbolUrl = (l) => {
  const backendHost = API_BASE_URL.replace(/\/api\/?$/, '');
  const symbolImage = l?.symbol_image || l?.metric_symbol_image || l?.icono_imagen || l?.metric?.symbol_image || l?.subvariable?.symbol_image;

  if (symbolImage && typeof symbolImage === 'string' && symbolImage.trim() !== '') {
    if (symbolImage.startsWith('data:') || symbolImage.startsWith('http://') || symbolImage.startsWith('https://')) {
      return symbolImage;
    }
    const cleanPath = symbolImage.startsWith('/') ? symbolImage : `/${symbolImage}`;
    const relativePath = cleanPath.startsWith('/storage/') ? cleanPath.replace('/storage', '') : cleanPath;
    return `${backendHost}${relativePath}`;
  }

  return `${backendHost}/symbols/default.webp`;
};

// Etiqueta flotante en la derecha a la altura Y exacta del último valor recibido (con overflow visible sin entrecortarse)
const CustomRightLabel = (props) => {
  const { viewBox, valueText, color } = props;
  if (!viewBox || !valueText) return null;
  const { x, y, width } = viewBox;
  const rightX = x + width + 4;
  const badgeWidth = Math.max((valueText || '').length * 8 + 18, 56);

  return (
    <g transform={`translate(${rightX}, ${y})`} style={{ overflow: 'visible' }}>
      <circle cx="-4" cy="0" r="4.5" fill={color} stroke="#ffffff" strokeWidth="1.5" />
      <g transform="translate(2, -12)">
        <rect
          x="0"
          y="0"
          width={badgeWidth}
          height="24"
          rx="6"
          ry="6"
          fill={color}
          stroke="#ffffff"
          strokeWidth="1.5"
          style={{ filter: 'drop-shadow(0px 3px 6px rgba(0,0,0,0.25))' }}
        />
        <text
          x={badgeWidth / 2}
          y="15.5"
          fill="#ffffff"
          fontSize="11"
          fontWeight="900"
          textAnchor="middle"
          fontFamily="'Outfit', 'Inter', sans-serif"
        >
          {valueText}
        </text>
      </g>
    </g>
  );
};

// Componente para dibujar la gráfica Recharts interactiva en tiempo real (eje único a la izquierda)
const PublicRechartsChart = ({ history = [], nodoSeleccionado, activeVariables = {}, tipoGrafico, onDescargarClick, onAmpliarClick, isAmpliado = false, liveMode = false }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const lecturas = nodoSeleccionado?.lecturas || [];
  const activeLecturas = lecturas.filter(l => Boolean(activeVariables && activeVariables[l.data_type]));
  const [hoveredVar, setHoveredVar] = useState(null);

  const mainUnit = useMemo(() => {
    if (!activeLecturas || activeLecturas.length === 0) return '';
    return activeLecturas[0]?.unidad || '';
  }, [activeLecturas]);

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.slice(-10);
  }, [history]);

  return (
    <div className="dashboard-chart-svg-container" style={{ padding: isAmpliado ? '1rem' : '0.5rem 0', overflow: 'visible' }}>
      {/* Leyenda Dinámica de Variables Activas */}
      <div className="dashboard-chart-legend" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '0.85rem', alignItems: 'center' }}>
        {activeLecturas.map((l, idx) => {
          const theme = getTheme(l.data_type, l.icono, idx);
          const isHovered = hoveredVar === l.data_type;

          return (
            <div
              key={l.data_type}
              onMouseEnter={() => setHoveredVar(l.data_type)}
              onMouseLeave={() => setHoveredVar(null)}
              className="legend-item"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: '700',
                color: theme.hex,
                backgroundColor: isHovered ? `${theme.hex}22` : theme.bg,
                border: `1.5px solid ${isHovered ? theme.hex : theme.hex + '44'}`,
                padding: '4px 12px',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                boxShadow: isHovered ? `0 4px 12px ${theme.hex}44` : 'none'
              }}
            >
              <img
                src={getMetricSymbolUrl(l)}
                alt=""
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `${API_BASE_URL.replace(/\/api\/?$/, '')}/symbols/default.webp`;
                }}
                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
              />
              <span>{isEn ? (l.tipo_en || l.nombre_en || l.tipo) : (l.tipo_es || l.tipo)} ({l.unidad})</span>
            </div>
          );
        })}
        {activeLecturas.length === 0 && (
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
            Selecciona al menos una variable para visualizar la línea de tiempo.
          </span>
        )}
      </div>

      {/* Gráfico Recharts con Único Eje Izquierdo y Unidad */}
      <div style={{ width: '100%', height: isAmpliado ? '100%' : '310px', flex: isAmpliado ? 1 : 'initial', minHeight: isAmpliado ? '220px' : 'auto', display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
        {activeLecturas.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontSize: '0.9rem' }}>
            Sin variables activas marcadas
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontSize: '0.9rem' }}>
            {liveMode ? 'Cargando datos en tiempo real...' : 'No existen registros guardados'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
            {tipoGrafico === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 25, right: 90, left: 10, bottom: 45 }} style={{ overflow: 'visible' }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#cbd5e1" strokeOpacity={0.65} />
                <XAxis dataKey="time" height={56} tick={<CustomXAxisTick />} axisLine={{ stroke: '#334155', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.2 }} interval="preserveStartEnd" />
                <YAxis orientation="left" width={45} tick={{ fontSize: 11, fill: '#0f2c59', fontWeight: 800 }} axisLine={{ stroke: '#334155', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.2 }}>
                  {mainUnit && (
                    <Label
                      value={mainUnit}
                      position="top"
                      offset={10}
                      style={{
                        textAnchor: 'middle',
                        fill: '#0f2c59',
                        fontSize: '12px',
                        fontWeight: '900',
                        letterSpacing: '0.04em'
                      }}
                    />
                  )}
                </YAxis>

                <Tooltip content={<CustomPublicChartTooltip />} />

                {activeLecturas.map((l, idx) => {
                  const theme = getTheme(l.data_type, l.icono, idx);
                  const isHovered = hoveredVar === l.data_type;
                  const isOtherHovered = hoveredVar && !isHovered;

                  return (
                    <Bar
                      key={l.data_type}
                      dataKey={l.data_type}
                      name={`${l.tipo} (${l.unidad})`}
                      fill={theme.hex}
                      fillOpacity={isOtherHovered ? 0.2 : 1}
                      radius={[4, 4, 0, 0]}
                    />
                  );
                })}

                {/* Mostrar el último valor en tiempo real en la parte derecha a su altura Y exacta */}
                {activeLecturas.map((l, idx) => {
                  const theme = getTheme(l.data_type, l.icono, idx);
                  const lastPoint = chartData.length > 0 ? chartData[chartData.length - 1] : null;
                  const rawVal = lastPoint ? parseFloat(lastPoint[l.data_type]) : null;
                  const valueText = (rawVal !== null && rawVal !== undefined && !isNaN(rawVal))
                    ? `${rawVal} ${l.unidad}`
                    : null;

                  return (
                    <React.Fragment key={`ref-bar-line-${l.data_type}`}>
                      {lastPoint && rawVal !== null && !isNaN(rawVal) && valueText && (
                        <ReferenceLine
                          y={rawVal}
                          stroke={`${theme.hex}55`}
                          strokeDasharray="3 3"
                          strokeWidth={1.5}
                          isFront={true}
                          label={<CustomRightLabel valueText={valueText} color={theme.hex} />}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 25, right: 90, left: 10, bottom: 45 }} style={{ overflow: 'visible' }}>
                <defs>
                  {activeLecturas.map((l, idx) => {
                    const theme = getTheme(l.data_type, l.icono, idx);
                    return (
                      <linearGradient key={idx} id={`colorPub${l.data_type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.hex} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={theme.hex} stopOpacity={0} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#cbd5e1" strokeOpacity={0.65} />
                <XAxis dataKey="time" height={56} tick={<CustomXAxisTick />} axisLine={{ stroke: '#334155', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.2 }} interval="preserveStartEnd" />
                <YAxis orientation="left" width={45} tick={{ fontSize: 11, fill: '#0f2c59', fontWeight: 800 }} axisLine={{ stroke: '#334155', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.2 }}>
                  {mainUnit && (
                    <Label
                      value={mainUnit}
                      position="top"
                      offset={10}
                      style={{
                        textAnchor: 'middle',
                        fill: '#0f2c59',
                        fontSize: '12px',
                        fontWeight: '900',
                        letterSpacing: '0.04em'
                      }}
                    />
                  )}
                </YAxis>

                <Tooltip content={<CustomPublicChartTooltip />} />

                {activeLecturas.map((l, idx) => {
                  const theme = getTheme(l.data_type, l.icono, idx);
                  const isHovered = hoveredVar === l.data_type;
                  const isOtherHovered = hoveredVar && !isHovered;

                  return (
                    <Area
                      key={l.data_type}
                      type="monotone"
                      dataKey={l.data_type}
                      name={`${l.tipo} (${l.unidad})`}
                      stroke={theme.hex}
                      strokeWidth={isHovered ? 4.5 : 2.5}
                      strokeOpacity={isOtherHovered ? 0.2 : 1}
                      fillOpacity={isOtherHovered ? 0.05 : 1}
                      fill={`url(#colorPub${l.data_type})`}
                      dot={{ r: isHovered ? 5 : 3, strokeWidth: 1.5, fill: '#ffffff', stroke: theme.hex }}
                      activeDot={{ r: 7, strokeWidth: 0, fill: theme.hex }}
                    />
                  );
                })}

                {/* Mostrar el último valor en tiempo real en la parte derecha a su altura Y exacta */}
                {activeLecturas.map((l, idx) => {
                  const theme = getTheme(l.data_type, l.icono, idx);
                  const lastPoint = chartData.length > 0 ? chartData[chartData.length - 1] : null;
                  const rawVal = lastPoint ? parseFloat(lastPoint[l.data_type]) : null;
                  const valueText = (rawVal !== null && rawVal !== undefined && !isNaN(rawVal))
                    ? `${rawVal} ${l.unidad}`
                    : null;

                  return (
                    <React.Fragment key={`ref-area-line-${l.data_type}`}>
                      {lastPoint && rawVal !== null && !isNaN(rawVal) && valueText && (
                        <ReferenceLine
                          y={rawVal}
                          stroke={`${theme.hex}55`}
                          strokeDasharray="3 3"
                          strokeWidth={1.5}
                          isFront={true}
                          label={<CustomRightLabel valueText={valueText} color={theme.hex} />}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Botones de Acción de Pie de Gráfico */}
      {!isAmpliado && (
        <div className="dashboard-chart-footer-actions">
          <button onClick={onDescargarClick} className="chart-footer-btn download">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {isEn ? 'Download Data' : 'Descargar Datos'}
          </button>
          <button onClick={onAmpliarClick} className="chart-footer-btn zoom">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            {isEn ? 'Expanded Chart' : 'Gráfico Ampliado'}
          </button>
        </div>
      )}
    </div>
  );
};

export default function VisualizarMapa() {
  const { language, t } = useLanguage();
  const isEn = language === 'en';
  const [searchParams, setSearchParams] = useSearchParams();
  const [categorias, setCategorias] = useState([]);
  const [nodeCounts, setNodeCounts] = useState({});
  const [nodos, setNodos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [nodoSeleccionado, setNodoSeleccionado] = useState(null);
  const [lecturaSeleccionada, setLecturaSeleccionada] = useState(null);

  // Título dinámico de la pestaña del navegador
  const pageLabel = nodoSeleccionado
    ? nodoSeleccionado.nombre
    : categoriaSeleccionada
    ? categoriaSeleccionada
    : (language === 'en' ? 'Real-Time Map' : 'Mapa en Tiempo Real');
  usePageTitle(pageLabel);

  // Pestaña activa (realtime / mapa)
  const [tabActiva, setTabActiva] = useState('realtime');

  // Estado de carga inicial y de transiciones de datos
  const [pageLoading, setPageLoading] = useState(true);

  // Modo de mapa: 'categoria' (mapa general de la categoría) o 'nodo' (mapa de un nodo específico)
  const [modoMapa, setModoMapa] = useState('categoria');

  // Panel flotante de información en el mapa (abierto solo cuando se pulsa un marcador)
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Forma del gráfico ('line' o 'bar')
  const [tipoGrafico, setTipoGrafico] = useState('line');

  // Modal de gráfico ampliado
  const [showModalAmpliado, setShowModalAmpliado] = useState(false);

  // Valores de telemetría más recientes en BD
  const [valoresUltimos, setValoresUltimos] = useState({});

  // Puntos del gráfico histórico (BD)
  const [history, setHistory] = useState([]);

  // Modo de visualización del gráfico: true = En vivo (sin horas en eje X), false = Base de Datos (con horas en eje X). Por defecto APAGADO (false)
  const [liveMode, setLiveMode] = useState(false);
  // Estado que indica si se están recibiendo datos en tiempo real de forma activa
  const [isReceivingLive, setIsReceivingLive] = useState(false);
  // Buffer temporal en memoria para almacenar máximo 10 lecturas en tiempo real
  const [liveBuffer, setLiveBuffer] = useState([]);
  // Referencia al timestamp de la última recepción de paquete en tiempo real
  const lastLivePacketTime = React.useRef(0);

  // Cargar datos históricos iniciales cuando cambia el nodo seleccionado y reiniciar buffer live
  useEffect(() => {
    setLiveBuffer([]);
    setIsReceivingLive(false);
    lastLivePacketTime.current = 0;

    const serial = nodoSeleccionado?.serial_number;
    if (!serial) {
      setHistory([]);
      setPageLoading(false);
      return;
    }

    const fetchInitialHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lecturas/recientes?serial_number=${serial}&limit=15`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Ordenar cronológicamente ASC (el más antiguo primero a la izquierda, el más reciente al final a la derecha)
          const dataAsc = [...data].sort((a, b) => {
            const tA = a.timestamp ? Number(a.timestamp) : (a.created_at ? new Date(a.created_at).getTime() : 0);
            const tB = b.timestamp ? Number(b.timestamp) : (b.created_at ? new Date(b.created_at).getTime() : 0);
            return tA - tB;
          });

          const points = dataAsc.map(item => {
            let shortT = item.shortTime;
            let fullT = item.dateTime;

            if (!shortT && fullT) {
              shortT = fullT.includes(',') ? fullT.split(', ')[1] : fullT;
            } else if (shortT && !fullT) {
              fullT = `${new Date().toLocaleDateString('es-ES')}, ${shortT}`;
            }

            return {
              ...item,
              time: shortT,
              dateTime: fullT
            };
          });

          // Tomar exactamente máximo 10 lecturas guardadas de la BD
          const last10History = points.slice(-10);
          setHistory(last10History);
          setLiveBuffer([...last10History]);

          // La lectura verdaderamente más reciente es el último elemento del arreglo ASC
          const lastItem = last10History[last10History.length - 1];
          if (lastItem) {
            const map = {};
            Object.keys(lastItem).forEach(k => {
              if (k !== 'time' && k !== 'dateTime' && k !== 'shortTime' && k !== 'id' && k !== 'node_id' && k !== 'serial_number' && k !== 'created_at' && k !== 'updated_at' && k !== 'timestamp') {
                if (lastItem[k] !== null && lastItem[k] !== undefined) {
                  map[k] = {
                    valor: lastItem[k],
                    fecha: lastItem.dateTime
                  };
                }
              }
            });
            setValoresUltimos(map);
          }
        } else {
          setHistory([]);
          setLiveBuffer([]);
          setValoresUltimos({});
        }
      } catch (err) {
        console.error("Error al cargar historial inicial público:", err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchInitialHistory();
    const dbInterval = setInterval(fetchInitialHistory, 30000);
    return () => clearInterval(dbInterval);
  }, [nodoSeleccionado?.serial_number]);

  // Estados del Modal de Descarga CSV
  const [showModalDescarga, setShowModalDescarga] = useState(false);
  const [descargaMetrics, setDescargaMetrics] = useState({});
  const [descargaRango, setDescargaRango] = useState('24h');
  const [descargaIntervalo, setDescargaIntervalo] = useState('min');
  const [descargaFechaInicio, setDescargaFechaInicio] = useState('2025-07-04');
  const [descargaFechaFin, setDescargaFechaFin] = useState('2025-08-02');

  const getNodeSaveFrequencySeconds = () => {
    if (!nodoSeleccionado) return 5;
    const freq = parseInt(nodoSeleccionado.save_frequency, 10);
    return isNaN(freq) || freq <= 0 ? 5 : freq;
  };

  const getIntervalOptions = () => {
    const freqSec = getNodeSaveFrequencySeconds();
    const freqLabel = freqSec < 60 ? `${freqSec}s` : `${Math.round(freqSec / 60)}min`;

    return [
      { id: 'min', label: `Mínimo (${freqLabel})`, disabled: false },
      { id: '1', label: '1 min', disabled: freqSec > 60 },
      { id: '5', label: '5 min', disabled: freqSec > 300 },
      { id: '15', label: '15 min', disabled: freqSec > 900 },
      { id: '30', label: '30 min', disabled: freqSec > 1800 },
      { id: '60', label: '60 min', disabled: freqSec > 3600 }
    ];
  };

  // Trigger para simulación de telemetría dinámica en tiempo real
  const [liveTrigger, setLiveTrigger] = useState(0);

  // Monitorear periódicamente la señal en vivo (si no llega data en 15s, pasa a inactivo/BD)
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastLivePacketTime.current > 0) {
        const elapsed = Date.now() - lastLivePacketTime.current;
        if (elapsed >= 15000) {
          setIsReceivingLive(false);
        }
      } else {
        setIsReceivingLive(false);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);


  // Estado para el modo de selección: false (Individual por defecto), true (Multiselección mediante Marcar Todas)
  // Estado para el modo de selección: false (Navegación Individual por defecto), true (Multiselección por Unidad)
  const [isByUnitMode, setIsByUnitMode] = useState(false);
  const [activeVariables, setActiveVariables] = useState({});

  // Resetear al cambiar de nodo / dispositivo: por defecto 1 sola variable activa (la primera)
  useEffect(() => {
    setIsByUnitMode(false);
    if (nodoSeleccionado && nodoSeleccionado.lecturas && nodoSeleccionado.lecturas.length > 0) {
      const firstDataType = nodoSeleccionado.lecturas[0].data_type;
      setActiveVariables({ [firstDataType]: true });
      setLecturaSeleccionada(nodoSeleccionado.lecturas[0]);
    } else {
      setActiveVariables({});
      setLecturaSeleccionada(null);
    }
  }, [nodoSeleccionado?.id]);

  // Unidad activa derivada de la primera variable seleccionada
  const activeSelectedUnit = useMemo(() => {
    if (!nodoSeleccionado?.lecturas) return null;
    const checkedKey = Object.keys(activeVariables).find(k => activeVariables[k]);
    if (!checkedKey) return null;
    const found = nodoSeleccionado.lecturas.find(l => l.data_type === checkedKey);
    return found ? found.unidad : null;
  }, [nodoSeleccionado, activeVariables]);

  const toggleVariable = (dataType) => {
    if (!nodoSeleccionado?.lecturas) return;
    const targetLectura = nodoSeleccionado.lecturas.find(l => l.data_type === dataType);
    if (!targetLectura) return;

    if (!isByUnitMode) {
      // Modo Navegación Individual: solo la variable clickeada está activa (en rojo/destacada al centro)
      setActiveVariables({ [dataType]: true });
      setLecturaSeleccionada(targetLectura);
      setSearchParams(prev => {
        const p = new URLSearchParams(prev);
        p.set('lectura', dataType);
        return p;
      }, { replace: true });
    } else {
      // Modo Multiselección por Unidad
      setActiveVariables(prev => {
        const isCurrentlyChecked = Boolean(prev[dataType]);
        // Si intenta marcar una variable de unidad diferente a la activa, bloquear
        if (!isCurrentlyChecked && activeSelectedUnit && targetLectura.unidad !== activeSelectedUnit) {
          return prev;
        }

        const next = { ...prev, [dataType]: !isCurrentlyChecked };
        const hasAnyActive = nodoSeleccionado.lecturas.some(l => Boolean(next[l.data_type]));

        if (!hasAnyActive) {
          setIsByUnitMode(false);
          const firstDataType = nodoSeleccionado.lecturas[0].data_type;
          setLecturaSeleccionada(nodoSeleccionado.lecturas[0]);
          return { [firstDataType]: true };
        }

        return next;
      });
    }
  };

  const handleToggleByUnitMode = () => {
    setIsByUnitMode(prev => {
      const nextMode = !prev;
      if (!nextMode) {
        // Desactivar multiselección y volver a variable única (primera variable)
        if (nodoSeleccionado?.lecturas?.length > 0) {
          const firstDataType = nodoSeleccionado.lecturas[0].data_type;
          setActiveVariables({ [firstDataType]: true });
          setLecturaSeleccionada(nodoSeleccionado.lecturas[0]);
        }
      }
      return nextMode;
    });
  };

  const catParam = searchParams.get('categoria');
  const nodeParam = searchParams.get('nodo');
  const lecturaParam = searchParams.get('lectura');

  // Cargar categorías, conteo de nodos habilitados y nodos de forma directa y bajo demanda desde la BD
  useEffect(() => {
    setPageLoading(true);

    const fetches = [
      fetchDeduplicated(`${API_BASE_URL}/categorias?lang=${language}`).then(res => res.json()),
      fetchDeduplicated(`${API_BASE_URL}/categorias/nodos-count`).then(res => res.json()).catch(() => ({ counts: {} }))
    ];
    if (catParam) {
      fetches.push(fetchDeduplicated(`${API_BASE_URL}/nodos?categoria=${encodeURIComponent(catParam)}&lang=${language}`).then(res => res.json()));
    } else {
      fetches.push(Promise.resolve([]));
    }

    Promise.all(fetches)
      .then(([catData, countsData, nodosData]) => {
        setCategorias(Array.isArray(catData) ? catData : []);
        setNodeCounts(countsData?.counts || {});
        const nodeList = Array.isArray(nodosData) ? nodosData : [];
        setNodos(nodeList);

        if (catParam) {
          setCategoriaSeleccionada(catParam);
          const catList = Array.isArray(catData) ? catData : [];
          const targetParamNorm = catParam.toLowerCase().trim();
          const targetCat = catList.find(c =>
            (c.nombre && c.nombre.toLowerCase().trim() === targetParamNorm) ||
            (c.nombre_es && c.nombre_es.toLowerCase().trim() === targetParamNorm) ||
            (c.nombre_en && c.nombre_en.toLowerCase().trim() === targetParamNorm)
          );

          const filtered = nodeList.filter(n => {
            if (!n.categoria) return false;
            const nCatNorm = n.categoria.toLowerCase().trim();
            if (nCatNorm === targetParamNorm) return true;
            if (targetCat) {
              const catNombre = (targetCat.nombre || '').toLowerCase().trim();
              const catEs = (targetCat.nombre_es || '').toLowerCase().trim();
              const catEn = (targetCat.nombre_en || '').toLowerCase().trim();
              return nCatNorm === catNombre || (catEs && nCatNorm === catEs) || (catEn && nCatNorm === catEn);
            }
            return false;
          });

          if (filtered.length > 0) {
            let targetNode = null;
            if (nodeParam) {
              const found = filtered.find(n => n.id.toString() === nodeParam.toString() || n.serial_number === nodeParam.toString());
              if (found) targetNode = found;
            }

            if (targetNode) {
              setNodoSeleccionado(prev => (prev?.id === targetNode.id ? prev : targetNode));
              if (targetNode.lecturas && targetNode.lecturas.length > 0) {
                let activeLect = targetNode.lecturas[0];
                if (lecturaParam) {
                  const foundLect = targetNode.lecturas.find(l => l.data_type === lecturaParam);
                  if (foundLect) activeLect = foundLect;
                }
                setLecturaSeleccionada(activeLect);
              }
            } else {
              setNodoSeleccionado(null);
              setLecturaSeleccionada(null);
              setPageLoading(false);
            }
          } else {
            setNodoSeleccionado(null);
            setLecturaSeleccionada(null);
            setPageLoading(false);
          }
        } else {
          setCategoriaSeleccionada(null);
          setNodoSeleccionado(null);
          setLecturaSeleccionada(null);
          setPageLoading(false);
        }
      })
      .catch(err => {
        console.error("Error loading categories and telemetry data:", err);
        setPageLoading(false);
      });
  }, [catParam, nodeParam, language]);

  // Sincronizar parámetro de lectura activa en URL sin recargar categorías ni activar pageLoading
  useEffect(() => {
    if (nodoSeleccionado && nodoSeleccionado.lecturas && lecturaParam) {
      const foundLect = nodoSeleccionado.lecturas.find(l => l.data_type === lecturaParam);
      if (foundLect) {
        setLecturaSeleccionada(foundLect);
      }
    }
  }, [lecturaParam, nodoSeleccionado]);

  // Cargar lecturas reales registradas en la BD y escuchar eventos en tiempo real cada 5s via WebSockets
  // Cargar lecturas reales registradas en la BD y escuchar eventos en tiempo real via WebSockets
  useEffect(() => {
    const serial = nodoSeleccionado?.serial_number;
    if (!serial) return;

    const processTelemetryPacket = (newData, source = 'ws') => {
      if (!newData) return;

      lastLivePacketTime.current = Date.now();
      setIsReceivingLive(true);

      let shortT = newData.shortTime;
      let fullT = newData.dateTime;

      if (!shortT && fullT) {
        shortT = fullT.includes(',') ? fullT.split(', ')[1] : fullT;
      } else if (shortT && !fullT) {
        fullT = `${new Date().toLocaleDateString('es-ES')}, ${shortT}`;
      } else if (!shortT && !fullT) {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        shortT = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        fullT = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${shortT}`;
      }

      if (shortT) shortT = shortT.replace(/\s*([ap]\.?m\.?|AM|PM)/gi, '').trim();
      if (fullT) fullT = fullT.replace(/\s*([ap]\.?m\.?|AM|PM)/gi, '').trim();

      const parsedData = {
        ...newData,
        time: shortT,
        dateTime: fullT
      };

      // 1. SIEMPRE actualizar el buffer en vivo en memoria (modo Reloj encendido) con la frecuencia exacta del listener WebSocket
      setLiveBuffer(prev => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          // Evitar descartar datos si la hora coincide exactamente pero trae nuevos valores o timestamps de milisegundo
          if (last.dateTime === fullT && last.time === shortT && JSON.stringify(last) === JSON.stringify(parsedData)) {
            return prev;
          }
        }
        const nextBuffer = [...prev, parsedData];
        return nextBuffer.length > 15 ? nextBuffer.slice(-15) : nextBuffer;
      });

      // 2. SIEMPRE actualizar valores mas recientes para la tarjeta KPI en tiempo real
      setValoresUltimos(prev => {
        const updated = { ...prev };
        Object.keys(newData).forEach(k => {
          if (k !== 'time' && k !== 'dateTime' && k !== 'shortTime' && k !== 'id' && k !== 'node_id' && k !== 'serial_number' && k !== 'created_at' && k !== 'updated_at' && k !== 'timestamp') {
            if (newData[k] !== null && newData[k] !== undefined) {
              updated[k] = {
                valor: newData[k],
                fecha: fullT,
                _created_at: newData.created_at || null
              };
            }
          }
        });
        return updated;
      });

      // 3. Actualizar el historial de Base de Datos estático únicamente cuando sea un registro guardado en BD
      const isSavedInDB = Boolean(newData.id || newData.is_saved || source === 'db');
      if (isSavedInDB) {
        setHistory(prev => {
          if (prev.length > 0) {
            if (newData.id && prev.some(p => p.id === newData.id)) {
              return prev;
            }
            const last = prev[prev.length - 1];
            if (last.dateTime === fullT && last.time === shortT) {
              return prev;
            }
          }
          const updated = [...prev, parsedData];
          return updated.length > 10 ? updated.slice(-10) : updated;
        });
      }
    };

    // ── Escuchar canal WebSocket de Laravel Reverb en vivo
    let channel;
    try {
      const channelName = `telemetry.${serial}`;
      channel = echo.channel(channelName);
      const handlePayload = (e) => {
        const newData = e?.data || e?.lectura || e?.payload || e;
        if (newData) {
          processTelemetryPacket(newData, 'ws');
        }
      };
      channel.listen('.LecturaRecibida', handlePayload);
      channel.listen('LecturaRecibida', handlePayload);
    } catch (e) {
      console.warn("WebSocket channel error:", e);
    }

    return () => {
      if (channel && serial) {
        echo.leaveChannel(`telemetry.${serial}`);
      }
    };
  }, [nodoSeleccionado?.serial_number, liveMode]);

  // Polling continuo en tiempo real cuando el modo en vivo (reloj) está activo
  useEffect(() => {
    if (!liveMode || !nodoSeleccionado?.serial_number) return;

    const serial = nodoSeleccionado.serial_number;

    const fetchLiveRecent = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lecturas/recientes?serial_number=${serial}&live=1&limit=15`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const dataAsc = [...data].sort((a, b) => {
            const tA = a.timestamp ? Number(a.timestamp) : (a.created_at ? new Date(a.created_at).getTime() : 0);
            const tB = b.timestamp ? Number(b.timestamp) : (b.created_at ? new Date(b.created_at).getTime() : 0);
            return tA - tB;
          });

          const points = dataAsc.map(item => {
            const shortT = extractHHMMSS(item.shortTime || item.time || item.dateTime || item.created_at, item.timestamp);
            let fullT = item.dateTime || item.created_at;
            if (!fullT) {
              const d = new Date();
              const pad = (n) => String(n).padStart(2, '0');
              fullT = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${shortT}`;
            }
            return { ...item, time: shortT, dateTime: fullT };
          });

          setLiveBuffer(points.slice(-15));

          const lastItem = points[points.length - 1];
          if (lastItem) {
            const map = {};
            Object.keys(lastItem).forEach(k => {
              if (k !== 'time' && k !== 'dateTime' && k !== 'shortTime' && k !== 'id' && k !== 'node_id' && k !== 'serial_number' && k !== 'created_at' && k !== 'updated_at' && k !== 'timestamp') {
                if (lastItem[k] !== null && lastItem[k] !== undefined) {
                  map[k] = { valor: lastItem[k], fecha: lastItem.dateTime };
                }
              }
            });
            setValoresUltimos(prev => ({ ...prev, ...map }));
          }
        }
      } catch (err) {
        console.error("Error fetching live recent readings:", err);
      }
    };

    fetchLiveRecent();
    const liveInterval = setInterval(fetchLiveRecent, 2000);
    return () => clearInterval(liveInterval);
  }, [nodoSeleccionado?.serial_number, liveMode]);

  const handleCategoryClick = (catName) => {
    setPageLoading(true);
    setSearchParams({ categoria: catName });
    setCategoriaSeleccionada(catName);
    setNodoSeleccionado(null);
    setLecturaSeleccionada(null);
    setTabActiva('realtime');
    setModoMapa('categoria');
  };

  const handleNodeChange = (nodeId) => {
    if (!nodeId) {
      setSearchParams({ categoria: categoriaSeleccionada });
      setNodoSeleccionado(null);
      setLecturaSeleccionada(null);
      setModoMapa('categoria');
      setPageLoading(false);
      return;
    }

    const nodeObj = nodos.find(n => n.id.toString() === nodeId.toString());
    if (nodeObj) {
      setPageLoading(true);
      const firstLectura = nodeObj.lecturas && nodeObj.lecturas.length > 0 ? nodeObj.lecturas[0].data_type : '';
      setSearchParams({
        categoria: categoriaSeleccionada,
        nodo: nodeId,
        lectura: firstLectura
      });
      setNodoSeleccionado(nodeObj);
      setModoMapa('nodo');
    } else {
      setPageLoading(false);
    }
  };

  const handleLecturaChange = (lecturaKey) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('lectura', lecturaKey);
      return p;
    }, { replace: true });
    if (nodoSeleccionado && nodoSeleccionado.lecturas) {
      const found = nodoSeleccionado.lecturas.find(l => l.data_type === lecturaKey);
      if (found) {
        setLecturaSeleccionada(found);
        setActiveVariables({ [lecturaKey]: true });
      }
    }
  };

  const handleReset = () => {
    setSearchParams({});
    setCategoriaSeleccionada(null);
    setNodoSeleccionado(null);
    setLecturaSeleccionada(null);
    setTabActiva('realtime');
    setModoMapa('categoria');
  };

  const handleOpenMapFromHeader = () => {
    if (nodosFiltrados.length === 0) return;
    if (!nodoSeleccionado) {
      setModoMapa('categoria');
      if (nodosFiltrados.length > 0) {
        setNodoSeleccionado(nodosFiltrados[0]);
      }
    } else {
      setModoMapa('nodo');
    }
    setTabActiva('mapa');
  };

  const handleCategoryMapNodeSwitch = (nodeId) => {
    const nodeObj = nodos.find(n => n.id.toString() === nodeId.toString());
    if (nodeObj) {
      setNodoSeleccionado(nodeObj);
      if (nodeObj.lecturas && nodeObj.lecturas.length > 0) {
        setLecturaSeleccionada(nodeObj.lecturas[0]);
      }
    }
  };

  const handleOpenDescargaModal = () => {
    if (!nodoSeleccionado) return;
    setShowModalDescarga(true);
  };

  // Obtener valor live preferentemente de BD o historial en tiempo real (manteniendo precisión exacta recibida)
  // Retorna '--' si el nodo nunca ha enviado datos (sin valores en BD ni en tiempo real)
  const generarValorLive = (dataType) => {
    if (!dataType) return '--';

    // 0. Si el modo En Vivo está activo (reloj encendido), buscar PRIMERO en el paquete más reciente del buffer en vivo
    if (liveMode && liveBuffer && liveBuffer.length > 0) {
      const lastLive = liveBuffer[liveBuffer.length - 1];
      if (lastLive && lastLive[dataType] !== undefined && lastLive[dataType] !== null) {
        const v = lastLive[dataType];
        return typeof v === 'number' ? v.toString() : String(v);
      }
      const norm = String(dataType).toLowerCase().replace(/[^a-z0-9]/g, '');
      const liveKey = Object.keys(lastLive).find(k => {
        const kNorm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        return kNorm === norm || kNorm.includes(norm) || norm.includes(kNorm);
      });
      if (liveKey && lastLive[liveKey] !== undefined && lastLive[liveKey] !== null) {
        const v = lastLive[liveKey];
        return typeof v === 'number' ? v.toString() : String(v);
      }
    }

    // 1. Coincidencia directa en valoresUltimos (Base de Datos)
    if (valoresUltimos[dataType] !== undefined && valoresUltimos[dataType] !== null && valoresUltimos[dataType].valor !== undefined && valoresUltimos[dataType].valor !== null) {
      const v = valoresUltimos[dataType].valor;
      return typeof v === 'number' ? v.toString() : String(v);
    }

    // 2. Búsqueda insensible a mayúsculas/minúsculas/guiones en valoresUltimos
    const norm = String(dataType).toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = Object.keys(valoresUltimos).find(k => {
      const kNorm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return kNorm === norm || kNorm.includes(norm) || norm.includes(kNorm);
    });

    if (foundKey && valoresUltimos[foundKey] && valoresUltimos[foundKey].valor !== undefined && valoresUltimos[foundKey].valor !== null) {
      const v = valoresUltimos[foundKey].valor;
      return typeof v === 'number' ? v.toString() : String(v);
    }

    // 3. Coincidencia en historial reciente
    if (history && history.length > 0) {
      const lastPoint = history[history.length - 1];
      if (lastPoint) {
        if (lastPoint[dataType] !== undefined && lastPoint[dataType] !== null) {
          const v = lastPoint[dataType];
          return typeof v === 'number' ? v.toString() : String(v);
        }
        const histKey = Object.keys(lastPoint).find(k => {
          const kNorm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          return kNorm === norm || kNorm.includes(norm) || norm.includes(kNorm);
        });
        if (histKey && lastPoint[histKey] !== undefined && lastPoint[histKey] !== null) {
          const v = lastPoint[histKey];
          return typeof v === 'number' ? v.toString() : String(v);
        }
      }
    }

    // 4. Si el nodo tiene un valor registrado en sus lecturas configuradas, usarlo
    if (nodoSeleccionado && Array.isArray(nodoSeleccionado.lecturas)) {
      const lFound = nodoSeleccionado.lecturas.find(l => {
        const lNorm = (l.data_type || l.tipo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return lNorm === norm || lNorm.includes(norm) || norm.includes(lNorm);
      });
      if (lFound && lFound.valor !== undefined && lFound.valor !== null && lFound.valor !== '') {
        const v = lFound.valor;
        return typeof v === 'number' ? v.toString() : String(v);
      }
    }

    // Sin datos disponibles — nodo creado pero que nunca ha enviado lecturas
    return '--';
  };

  // Formatear estados y percentiles de barra para gauges del mapa público con escala estandarizada Bajo / Óptimo / Alto
  const getVariableIndexStatus = (variable, valueRaw) => {
    if (!variable) return null;

    const isEn = language === 'en';
    const varTitle = isEn
      ? (variable.tipo_en || variable.nombre_en || variable.tipo || variable.nombre || 'Variable')
      : (variable.tipo_es || variable.tipo || variable.nombre || 'Variable');

    // Sin datos — nodo nuevo sin lecturas registradas
    if (valueRaw === '--' || valueRaw === undefined || valueRaw === null || valueRaw === '') {
      return {
        title: varTitle,
        value: '--',
        label: isEn ? 'NO DATA' : 'SIN DATOS',
        color: '#94a3b8',
        percent: 0,
        type: 'custom_range',
        range: isEn ? ['Low', 'Optimal', 'High'] : ['Bajo', 'Óptimo', 'Alto'],
        isOutOfRange: false,
        outWarningMsg: null,
        noData: true
      };
    }

    const val = parseFloat(valueRaw);
    if (isNaN(val)) return null;

    // Extraer mínimo y máximo configurados en la métrica (si existen)
    let minExp = (variable.minExpected !== undefined && variable.minExpected !== null && variable.minExpected !== '')
      ? parseFloat(variable.minExpected)
      : (variable.min_expected !== undefined && variable.min_expected !== null && variable.min_expected !== '')
        ? parseFloat(variable.min_expected)
        : null;

    let maxExp = (variable.maxExpected !== undefined && variable.maxExpected !== null && variable.maxExpected !== '')
      ? parseFloat(variable.maxExpected)
      : (variable.max_expected !== undefined && variable.max_expected !== null && variable.max_expected !== '')
        ? parseFloat(variable.max_expected)
        : null;

    // Fallbacks si la métrica no tiene min/max definidos manualmente en la BD
    if (minExp === null || isNaN(minExp)) {
      const key = (variable.data_type || variable.claveMqtt || variable.tipo || '').toLowerCase();
      if (key.includes('temp')) minExp = 10;
      else if (key.includes('hum') || key.includes('soil')) minExp = 20;
      else if (key.includes('aqi')) minExp = 0;
      else if (key.includes('co2')) minExp = 400;
      else if (key.includes('pres')) minExp = 950;
      else minExp = 0;
    }

    if (maxExp === null || isNaN(maxExp)) {
      const key = (variable.data_type || variable.claveMqtt || variable.tipo || '').toLowerCase();
      if (key.includes('temp')) maxExp = 35;
      else if (key.includes('hum') || key.includes('soil')) maxExp = 80;
      else if (key.includes('aqi')) maxExp = 150;
      else if (key.includes('co2')) maxExp = 1000;
      else if (key.includes('pres')) maxExp = 1050;
      else maxExp = 100;
    }

    let label = isEn ? 'Optimal' : 'Óptimo';
    let color = '#10b981'; // Verde para dentro del rango
    let percent = 50;
    let isOutOfRange = false;
    let outWarningMsg = null;

    if (val < minExp) {
      label = isEn ? 'Low' : 'Bajo';
      color = '#3b82f6'; // Azul en el filo izquierdo (Bajo)
      percent = 2;
      isOutOfRange = true;
      outWarningMsg = isEn
        ? `Value (${val} ${variable.unidad || ''}) is below expected minimum (${minExp} ${variable.unidad || ''})`
        : `El valor registrado (${val} ${variable.unidad || ''}) está por debajo del mínimo esperado (${minExp} ${variable.unidad || ''})`;
    } else if (val > maxExp) {
      label = isEn ? 'High' : 'Alto';
      color = '#ef4444'; // Rojo en el filo derecho (Alto)
      percent = 98;
      isOutOfRange = true;
      outWarningMsg = isEn
        ? `Value (${val} ${variable.unidad || ''}) exceeds expected maximum (${maxExp} ${variable.unidad || ''})`
        : `El valor registrado (${val} ${variable.unidad || ''}) sobrepasa el máximo esperado (${maxExp} ${variable.unidad || ''})`;
    } else {
      label = isEn ? 'Optimal' : 'Óptimo';
      color = '#10b981';
      if (maxExp > minExp) {
        const ratio = (val - minExp) / (maxExp - minExp);
        percent = 15 + ratio * 70; // Movimiento proporcional entre 15% y 85% en la zona central
      } else {
        percent = 50;
      }
    }

    return {
      title: varTitle,
      value: `${val} ${variable.unidad || ''}`.trim(),
      label,
      color,
      percent: Math.min(Math.max(percent, 2), 98),
      type: 'custom_range',
      range: isEn ? ['Low', 'Optimal', 'High'] : ['Bajo', 'Óptimo', 'Alto'],
      isOutOfRange,
      outWarningMsg
    };
  };

  // Buscar la categoría activa en el listado de categorías (soporta coincidencia en español e inglés)
  const targetCategoryObj = useMemo(() => {
    if (!categoriaSeleccionada) return null;
    const targetNorm = categoriaSeleccionada.toLowerCase().trim();
    return categorias.find(c =>
      (c.nombre && c.nombre.toLowerCase().trim() === targetNorm) ||
      (c.nombre_es && c.nombre_es.toLowerCase().trim() === targetNorm) ||
      (c.nombre_en && c.nombre_en.toLowerCase().trim() === targetNorm)
    );
  }, [categorias, categoriaSeleccionada]);

  // Nombre de categoría a mostrar según el idioma seleccionado
  const displayCategoryName = useMemo(() => {
    if (!targetCategoryObj) return categoriaSeleccionada || '';
    if (isEn) {
      return targetCategoryObj.nombre_en || targetCategoryObj.nombre_es || targetCategoryObj.nombre || categoriaSeleccionada;
    }
    return targetCategoryObj.nombre_es || targetCategoryObj.nombre || targetCategoryObj.nombre_en || categoriaSeleccionada;
  }, [targetCategoryObj, isEn, categoriaSeleccionada]);

  // Sincronizar la categoría activa y la URL al cambiar de idioma
  useEffect(() => {
    if (categoriaSeleccionada && targetCategoryObj) {
      const canonicalName = isEn
        ? (targetCategoryObj.nombre_en || targetCategoryObj.nombre_es || targetCategoryObj.nombre)
        : (targetCategoryObj.nombre_es || targetCategoryObj.nombre || targetCategoryObj.nombre_en);

      if (canonicalName && canonicalName !== categoriaSeleccionada) {
        setCategoriaSeleccionada(canonicalName);
        setSearchParams(prev => {
          const p = new URLSearchParams(prev);
          p.set('categoria', canonicalName);
          return p;
        }, { replace: true });
      }
    }
  }, [language, isEn, targetCategoryObj, categoriaSeleccionada, setSearchParams]);

  // Filtrar los nodos pertenecientes a la categoría activa (coincidencia por nombre español, inglés o nombre localizado)
  const nodosFiltrados = useMemo(() => {
    if (!categoriaSeleccionada) return [];
    const targetNorm = categoriaSeleccionada.toLowerCase().trim();

    return nodos.filter(nodo => {
      if (!nodo.categoria) return false;
      const nodeCatNorm = nodo.categoria.toLowerCase().trim();

      if (nodeCatNorm === targetNorm) return true;

      if (targetCategoryObj) {
        const catNombre = (targetCategoryObj.nombre || '').toLowerCase().trim();
        const catEs = (targetCategoryObj.nombre_es || '').toLowerCase().trim();
        const catEn = (targetCategoryObj.nombre_en || '').toLowerCase().trim();

        return (
          nodeCatNorm === catNombre ||
          (catEs && nodeCatNorm === catEs) ||
          (catEn && nodeCatNorm === catEn)
        );
      }

      return false;
    });
  }, [nodos, categoriaSeleccionada, targetCategoryObj]);

  // Obtener todas las ubicaciones únicas de los nodos en esta categoría para la barra inferior del mapa
  const ubicacionesDeCategoria = [];
  const nombresVistos = new Set();
  nodosFiltrados.forEach(n => {
    const uNombre = n.ubicacion_nombre || 'Campus Uleam Manta';
    if (!nombresVistos.has(uNombre)) {
      nombresVistos.add(uNombre);
      ubicacionesDeCategoria.push({
        nombre: uNombre,
        latitud: n.latitud || '-0.951389',
        longitud: n.longitud || '-80.702476',
        node: n
      });
    }
  });

  // Determinar qué coordenadas de latitud/longitud cargar en el mapa según el nodo seleccionado
  const mapLatitud = nodoSeleccionado?.latitud || (ubicacionesDeCategoria[0]?.latitud ?? '-0.951389');
  const mapLongitud = nodoSeleccionado?.longitud || (ubicacionesDeCategoria[0]?.longitud ?? '-80.702476');
  const mapUbicacionNombre = nodoSeleccionado?.ubicacion_nombre || (ubicacionesDeCategoria[0]?.nombre ?? 'Universidad Laica Eloy Alfaro de Manabí');

  // Limpiar y resetear el scroll al inicio (0,0) al cambiar de categoría, nodo o pestaña
  useEffect(() => {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [categoriaSeleccionada, nodoSeleccionado?.id, tabActiva]);

  // Seleccionar automáticamente la primera lectura/métrica del nodo seleccionado para mostrar el gauge por defecto
  useEffect(() => {
    if (nodoSeleccionado && nodoSeleccionado.lecturas && nodoSeleccionado.lecturas.length > 0) {
      if (!lecturaSeleccionada || !nodoSeleccionado.lecturas.some(l => l.data_type === lecturaSeleccionada.data_type)) {
        setLecturaSeleccionada(nodoSeleccionado.lecturas[0]);
      }
    }
  }, [nodoSeleccionado]);

  // Bloquear scroll de la página principal cuando el mapa está en pantalla completa
  useEffect(() => {
    if (tabActiva === 'mapa' && categoriaSeleccionada) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [tabActiva, categoriaSeleccionada]);

  // Inicialización y sincronización de Leaflet para el Mapa Público
  useEffect(() => {
    if (tabActiva !== 'mapa') {
      if (window.leafletPublicMapInstance) {
        window.leafletPublicMapInstance.remove();
        window.leafletPublicMapInstance = null;
      }
      return;
    }

    const lat = parseFloat(mapLatitud);
    const lng = parseFloat(mapLongitud);

    // Cargar estilos de Leaflet si no están presentes
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      const container = document.getElementById('leaflet-public-map-preview');
      if (!container) return;

      if (window.leafletPublicMapInstance) {
        window.leafletPublicMapInstance.remove();
        window.leafletPublicMapInstance = null;
      }

      // Crear mapa satelital/híbrido idéntico a la vista previa de RegistrarNodo
      const map = window.L.map('leaflet-public-map-preview', { zoomControl: false }).setView([lat, lng], 17);
      window.leafletPublicMapInstance = map;

      // Google Maps Híbrido Satelital (mismo tile que RegistrarNodo)
      window.L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps',
        maxZoom: 20
      }).addTo(map);

      // Dibujar pines numerados por orden de creación para TODOS los nodos de la categoría
      nodosFiltrados.forEach((n, idx) => {
        const nLat = parseFloat(n.latitud || '-0.951389');
        const nLng = parseFloat(n.longitud || '-80.702476');
        const isSelected = nodoSeleccionado?.id === n.id;

        const pinColor = '#ef4444';
        const pinScale = isSelected ? 'scale(1.3)' : 'scale(1)';
        const strokeWidth = isSelected ? '2.5' : '1.5';

        const mapPinIcon = window.L.divIcon({
          html: `
            <div style="transform: ${pinScale}; transition: transform 0.2s ease;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.45));">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="${pinColor}" stroke="#ffffff" stroke-width="${strokeWidth}"/>
                <circle cx="12" cy="10" r="3.5" fill="#ffffff"/>
                <text x="12" y="11.2" font-size="3" font-weight="900" text-anchor="middle" fill="${pinColor}">${idx + 1}</text>
              </svg>
            </div>
          `,
          className: 'custom-map-pin-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40]
        });

        const marker = window.L.marker([nLat, nLng], { icon: mapPinIcon }).addTo(map);
        marker.bindTooltip(`<b>#${idx + 1} - ${n.nombre}</b><br/>${n.ubicacion_nombre || 'Ubicación'}`, { direction: 'top', offset: [0, -35] });

        marker.on('click', () => {
          handleCategoryMapNodeSwitch(n.id);
          map.setView([nLat, nLng], 18);
          setShowInfoPanel(true);
        });
      });

      // 1. Control de Zoom de Leaflet (+ y -)
      window.L.control.zoom({ position: 'topleft' }).addTo(map);

      // 2. Botón de centrado en el mapa (🏠 Home Icon)
      const CenterControl = window.L.Control.extend({
        onAdd: function () {
          const btn = window.L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-center-btn');
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2.5" width="16" height="16">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>`;
          btn.style.width = '30px';
          btn.style.height = '30px';
          btn.style.backgroundColor = '#ffffff';
          btn.style.border = '2px solid rgba(0, 0, 0, 0.2)';
          btn.style.borderRadius = '4px';
          btn.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
          btn.style.cursor = 'pointer';
          btn.style.display = 'flex';
          btn.style.alignItems = 'center';
          btn.style.justifyContent = 'center';
          btn.title = 'Centrar en el punto de ubicación';

          btn.onclick = function (e) {
            e.stopPropagation();
            map.setView([lat, lng], 17);
          };
          return btn;
        }
      });
      new CenterControl({ position: 'topleft' }).addTo(map);
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        initMap();
      };
      document.body.appendChild(script);
    }

    return () => {
      if (window.leafletPublicMapInstance) {
        window.leafletPublicMapInstance.remove();
        window.leafletPublicMapInstance = null;
      }
    };
  }, [tabActiva, mapLatitud, mapLongitud]);

  if (pageLoading) {
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes map-custom-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '4px solid #e2e8f0',
          borderTopColor: '#b91c1c',
          borderBottomColor: '#b91c1c',
          animation: 'map-custom-spin 0.8s linear infinite',
          marginBottom: '1.25rem'
        }}></div>
        <p style={{
          color: '#334155',
          fontWeight: 700,
          fontFamily: 'sans-serif',
          letterSpacing: '0.08em',
          fontSize: '1.1rem'
        }}>
          {language === 'en' ? 'LOADING...' : 'CARGANDO...'}
        </p>
      </div>
    );
  }

  return (
    <div className="map-public-container">

      {/* ── SECCIÓN: TÍTULO Y PRESENTACIÓN PÚBLICA (Premium sin emojis ni bordes duros) ── */}
      {!categoriaSeleccionada && (
        <div className="pub-news-header-row" style={{ marginBottom: '3rem' }}>
          <div className="pub-news-header" style={{ margin: 0, textAlign: 'left', display: 'inline-block', width: 'fit-content' }}>
            <h1 className="pub-news-main-title">
              <EditableText textKey="map_main_title" defaultText={t("map.main_title", "Monitoreo por Categorías")} />
            </h1>
            <div className="pub-news-title-underline" />
          </div>
          <p className="map-public-subtitle" style={{ marginTop: '0.85rem' }}>
            <span className="live-indicator"></span>
            <EditableText textKey="map_subtitle" defaultText={t("map.map_subtitle_categories", "Visualización en tiempo real y exploración analítica de variables de hardware en los campus ULEAM.")} isTextArea={true} />
          </p>
        </div>
      )}

      {/* ── BREADCRUMBS MÓVIL/DESKTOP (Ruta solicitada: Categorías / Categoria / Nodo) ── */}
      {categoriaSeleccionada && tabActiva !== 'mapa' && (
        <div className="breadcrumb-nav">
          <span onClick={handleReset} className="breadcrumb-link"><EditableText textKey="map_breadcrumb_categories" defaultText={t("map.breadcrumb_categories", "Categorías")} /></span>
          <span className="breadcrumb-separator">/</span>
          <span onClick={() => handleNodeChange(null)} className="breadcrumb-link">{displayCategoryName}</span>
          {nodoSeleccionado && (
            <>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{nodoSeleccionado.nombre}</span>
            </>
          )}
        </div>
      )}

      {/* ── VISTA 1: LISTADO DE CATEGORÍAS DISPONIBLES (Estilos Premium con SVG e Iconos dinámicos) ── */}
      {!categoriaSeleccionada && (
        <div className="categories-selection-view">
          <h3 className="section-heading">
            <EditableText textKey="map_choose_category" defaultText={t("map.choose_category", "Elige una categoría de investigación")} />
          </h3>
          <div className="categories-grid">
            {(() => {
              const categoriasHabilitadas = categorias.filter(cat => {
                const count = nodeCounts[cat.id] ?? nodeCounts[cat.nombre] ?? nodeCounts[cat.nombre_es] ?? nodeCounts[cat.nombre_en] ?? 0;
                return count > 0;
              });

              if (categoriasHabilitadas.length === 0) {
                return (
                  <div className="empty-state-card">
                    <span>{language === 'en' ? "No categories with active nodes currently available." : "No existen categorías con nodos habilitados disponibles."}</span>
                  </div>
                );
              }

              return categoriasHabilitadas.map(cat => {
                const count = nodeCounts[cat.id] ?? nodeCounts[cat.nombre] ?? nodeCounts[cat.nombre_es] ?? nodeCounts[cat.nombre_en] ?? 0;
                const nodeLabel = count === 1
                  ? (language === 'en' ? 'Active Node' : 'Nodo Habilitado')
                  : (language === 'en' ? 'Active Nodes' : 'Nodos Habilitados');

                return (
                  <div
                    key={cat.id}
                    className="category-card"
                    onClick={() => handleCategoryClick(cat.nombre)}
                  >
                    {/* Badge con Conteo de Nodos Habilitados (estado = true) */}
                    <div className="category-node-count-badge" title={`${count} ${nodeLabel}`}>
                      <span className={`node-count-dot ${count > 0 ? 'active' : 'inactive'}`} />
                      <span>{count} {nodeLabel}</span>
                    </div>

                    {/* Icono vectorial SVG en lugar de emojis */}
                    <div className="category-icon-wrapper">
                      {getCategorySVGIcon(cat.nombre)}
                    </div>
                    <h4 className="category-card-title">{cat.nombre}</h4>
                    <p className="category-card-desc">
                      {cat.descripcion || (language === 'en' ? 'Explore smart nodes and telemetry associated with this group.' : 'Explorar los nodos inteligentes y la telemetría asociada a este grupo.')}
                    </p>
                    <span className="category-action-link">
                      <EditableText textKey="map_view_network_nodes" defaultText={t("map.view_network_nodes", "Ver Nodos de Red")} />
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ marginLeft: '4px' }}>
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ── VISTA 2/3: INTERFAZ DE MONITOREO ── */}
      {categoriaSeleccionada && (
        <div className="dashboard-monitoreo-view">
          {/* Cabecera de Categoría con Pestañas Flotantes */}
          <div className="dashboard-location-header-row">
            <div className="dashboard-location-left">
              <button onClick={handleReset} className="dashboard-btn-back-chevron" title="Volver">
                ‹
              </button>
              <h2 className="dashboard-location-title-main">
                <EditableText textKey="map_category_label" defaultText={t("map.category_label", "Categoría")} />: {displayCategoryName}
              </h2>
            </div>

            <div className="dashboard-tabs-pills">
              <button
                type="button"
                onClick={handleOpenMapFromHeader}
                disabled={nodosFiltrados.length === 0}
                className={`dashboard-tab-pill ${tabActiva === 'mapa' ? 'active' : ''} ${nodosFiltrados.length === 0 ? 'disabled' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: nodosFiltrados.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: nodosFiltrados.length === 0 ? 0.55 : 1
                }}
                title={nodosFiltrados.length === 0 ? "Esta categoría no posee nodos registrados para mostrar en el mapa" : "Ver en el mapa"}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                <span><EditableText textKey="map_tab_map" defaultText={t("map.map_tab", "Mapa")} /></span>
              </button>
              <Link
                to={nodoSeleccionado ? `/${language}/${language === 'en' ? 'historical-analysis' : 'analisis-historico'}?nodo=${nodoSeleccionado.id}&categoria=${encodeURIComponent(categoriaSeleccionada)}` : `/${language}/${language === 'en' ? 'historical-analysis' : 'analisis-historico'}?categoria=${encodeURIComponent(categoriaSeleccionada)}`}
                className="dashboard-tab-pill-link"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
                  <path d="M3 3v18h18" />
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                </svg>
                <span><EditableText textKey="map_tab_history" defaultText={t("map.history_tab", "Histórico")} /></span>
              </Link>
            </div>
          </div>

          {/* TAB 1: DATOS TIEMPO REAL */}
          {tabActiva === 'realtime' && (
            <div className="dashboard-content-card">

              <div className="dashboard-panel-inner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <h4 className="dashboard-panel-inner-title" style={{ margin: 0 }}><EditableText textKey="map_realtime_data" defaultText={t("map.realtime_data", "Datos en Tiempo Real")} /></h4>

                {/* Selector de tipo de gráfico y modo En Vivo/BD en la cabecera */}
                {nodoSeleccionado && (
                  <div className="hist-chart-type-toggle" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {/* Botón Reloj (En vivo / BD) - Libre toggle sin bloqueo */}
                    <button
                      type="button"
                      onClick={() => setLiveMode(prev => !prev)}
                      className={`toggle-icon-btn ${liveMode ? 'active' : ''}`}
                      title={
                        liveMode
                          ? (language === 'en' ? 'Showing Live Data (Click for DB data)' : 'Mostrando Datos en Vivo (Clic para ver Base de Datos)')
                          : (language === 'en' ? 'Showing DB Data (Click for Live data)' : 'Mostrando Base de Datos (Clic para ver Datos en Vivo)')
                      }
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoGrafico('line')}
                      className={`toggle-icon-btn ${tipoGrafico === 'line' ? 'active' : ''}`}
                      title={language === 'en' ? 'Line chart' : 'Gráfico de línea'}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                        <path d="M3 3v18h18" />
                        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoGrafico('bar')}
                      className={`toggle-icon-btn ${tipoGrafico === 'bar' ? 'active' : ''}`}
                      title={language === 'en' ? 'Bar chart' : 'Gráfico de barras'}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                        <rect x="3" y="3" width="4" height="18" />
                        <rect x="10" y="8" width="4" height="13" />
                        <rect x="17" y="13" width="4" height="8" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Barra de Filtros: Dropdown Personalizado de Nodos y Botón Marcar Todas a la Derecha en la misma línea */}
              <div className="dashboard-filters-toolbar" style={{ borderBottom: nodoSeleccionado ? '1px solid #f1f5f9' : 'none', marginBottom: '1rem', paddingBottom: '0.75rem' }}>
                <div className="public-node-select-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '1rem', marginBottom: '0.85rem' }}>
                  <PublicCustomSelectNode
                    nodos={nodosFiltrados}
                    selectedNodeId={nodoSeleccionado?.id || ''}
                    onSelect={(nodeId) => handleNodeChange(nodeId)}
                  />

                  {nodoSeleccionado && nodoSeleccionado.lecturas && nodoSeleccionado.lecturas.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleToggleByUnitMode}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: isByUnitMode ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                          background: isByUnitMode ? '#2563eb' : '#ffffff',
                          color: isByUnitMode ? '#ffffff' : '#475569',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: isByUnitMode ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap'
                        }}
                        title={isByUnitMode ? "Desactivar multiselección por unidad" : "Marcar variables por misma unidad de medida"}
                      >
                        <span style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '3px',
                          border: isByUnitMode ? '1.5px solid #ffffff' : '1.5px solid #64748b',
                          background: isByUnitMode ? '#2563eb' : '#ffffff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 900
                        }}>
                          {isByUnitMode ? '✓' : ''}
                        </span>
                        {isByUnitMode ? t('map.check_unit_active', 'Marcar por unidad (Activo)') : t('map.check_unit', 'Marcar por unidad')}
                      </button>

                      {isByUnitMode && activeSelectedUnit && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                          {t('map.active_unit', 'Unidad activa')}: {activeSelectedUnit}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Lista de Botones Horizontales de Variables */}
                {nodoSeleccionado && (
                  <div className="dashboard-variables-scroll-container">
                    <div className="dashboard-variables-list">
                      {nodoSeleccionado.lecturas && nodoSeleccionado.lecturas.map((l, index) => {
                        const isChecked = Boolean(activeVariables && activeVariables[l.data_type]);
                        const isSameUnit = !activeSelectedUnit || l.unidad === activeSelectedUnit;
                        const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
                        const mainColor = palette[index % palette.length];

                        const isBlocked = isByUnitMode && !isChecked && !isSameUnit;
                        const isRedSingleActive = !isByUnitMode && isChecked;

                        const varNombre = language === 'en' ? (l.tipo_en || l.tipo) : (l.tipo_es || l.tipo);

                        const tooltipText = isBlocked
                          ? `${t('map.different_units', 'Unidades de medida diferentes')} (${l.unidad} vs ${activeSelectedUnit})`
                          : isByUnitMode
                            ? (isChecked ? t('map.click_uncheck', 'Click para desmarcar variable') : t('map.click_select', 'Click para seleccionar y comparar variable'))
                            : `${t('map.show', 'Mostrar')} ${varNombre} (${l.unidad})`;

                        return (
                          <button
                            key={l.data_type || index}
                            type="button"
                            disabled={isBlocked}
                            onClick={() => !isBlocked && toggleVariable(l.data_type)}
                            title={tooltipText}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              border: `1.5px solid ${isBlocked ? '#cbd5e1' : (isRedSingleActive ? '#b91c1c' : (isChecked ? mainColor : '#cbd5e1'))}`,
                              background: isBlocked ? '#f8fafc' : (isRedSingleActive ? '#b91c1c' : (isChecked ? `${mainColor}14` : '#ffffff')),
                              color: isBlocked ? '#94a3b8' : (isRedSingleActive ? '#ffffff' : (isChecked ? '#0f2c59' : '#475569')),
                              fontSize: '0.83rem',
                              fontWeight: isChecked ? 800 : 600,
                              cursor: isBlocked ? 'not-allowed' : 'pointer',
                              opacity: isBlocked ? 0.6 : 1,
                              boxShadow: isRedSingleActive ? '0 3px 10px rgba(185, 28, 28, 0.35)' : (isChecked ? `0 2px 6px ${mainColor}25` : 'none'),
                              transition: 'all 0.2s ease',
                              flexShrink: 0,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isByUnitMode && (
                              <span style={{
                                width: '15px',
                                height: '15px',
                                borderRadius: '4px',
                                border: `1.5px solid ${isBlocked ? '#cbd5e1' : (isChecked ? mainColor : '#94a3b8')}`,
                                background: isBlocked ? '#f1f5f9' : (isChecked ? mainColor : '#ffffff'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: '10px',
                                fontWeight: 900
                              }}>
                                {isChecked ? '✓' : (isBlocked ? '✕' : '')}
                              </span>
                            )}
                            <span>{varNombre} <small style={{ opacity: 0.85, fontWeight: 700 }}>({l.unidad})</small></span>
                          </button>
                        );
                      })}
                      {(!nodoSeleccionado.lecturas || nodoSeleccionado.lecturas.length === 0) && (
                        <span className="no-variables-label">Sin variables asignadas</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Si NO hay ningún nodo seleccionado, mostramos la pantalla vacía por defecto */}
              {!nodoSeleccionado ? (
                <div className="empty-dashboard-prompt">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                    <EditableText textKey="map_select_device_title" defaultText={t("map.select_device_title", "Selecciona un dispositivo para iniciar la visualización")} />
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.5' }}>
                    <EditableText textKey="map_select_device_desc" defaultText={t("map.select_device_desc", "Elige uno de los nodos de hardware de la categoría en el selector para cargar la telemetría y gráficos históricos.").replace('{{categoria}}', categoriaSeleccionada)} isTextArea={true} />
                  </p>
                </div>
              ) : (
                <>
                  {/* Grid de Tarjetas de Lecturas en Tiempo Real para Variables Activas */}
                  {nodoSeleccionado && nodoSeleccionado.lecturas && (() => {
                    const isVariableActive = (dataType) => {
                      return Boolean(activeVariables && activeVariables[dataType]);
                    };

                    const activeLecturasList = nodoSeleccionado.lecturas.filter(l => isVariableActive(l.data_type));
                    const isSingleCard = activeLecturasList.length === 1;

                    return (
                      <div className="public-readings-grid" style={{
                        display: isSingleCard ? 'flex' : 'grid',
                        justifyContent: isSingleCard ? 'center' : 'stretch',
                        gridTemplateColumns: isSingleCard ? 'none' : 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                      }}>
                        {activeLecturasList.map((l) => {
                          const theme = getTheme(l.data_type, l.icono);
                          const liveVal = generarValorLive(l.data_type);
                          const lastLivePacket = (liveMode && liveBuffer && liveBuffer.length > 0) ? liveBuffer[liveBuffer.length - 1] : null;
                          const rawFecha = lastLivePacket
                            ? (lastLivePacket.dateTime || lastLivePacket.created_at)
                            : (valoresUltimos[l.data_type]?.fecha || (history && history.length > 0 ? history[history.length - 1].dateTime : null));
                          const timestamp = formatTimestampCard(rawFecha);

                          const minExp = (l.minExpected !== undefined && l.minExpected !== null && l.minExpected !== '')
                            ? parseFloat(l.minExpected)
                            : (l.min_expected !== undefined && l.min_expected !== null && l.min_expected !== '')
                              ? parseFloat(l.min_expected)
                              : null;

                          const maxExp = (l.maxExpected !== undefined && l.maxExpected !== null && l.maxExpected !== '')
                            ? parseFloat(l.maxExpected)
                            : (l.max_expected !== undefined && l.max_expected !== null && l.max_expected !== '')
                              ? parseFloat(l.max_expected)
                              : null;

                          const numVal = parseFloat(liveVal);
                          let outWarning = null;

                          if (!isNaN(numVal)) {
                            if (minExp !== null && !isNaN(minExp) && numVal < minExp) {
                              outWarning = {
                                type: 'min',
                                msg: `El valor registrado (${numVal} ${l.unidad || ''}) está por debajo del mínimo esperado (${minExp} ${l.unidad || ''})`
                              };
                            } else if (maxExp !== null && !isNaN(maxExp) && numVal > maxExp) {
                              outWarning = {
                                type: 'max',
                                msg: `El valor registrado (${numVal} ${l.unidad || ''}) sobrepasa el máximo esperado (${maxExp} ${l.unidad || ''})`
                              };
                            }
                          }

                          return (
                            <div
                              key={l.data_type}
                              className="public-reading-card"
                              style={{
                                position: 'relative',
                                background: `linear-gradient(135deg, ${theme.bg || '#ffffff'}, #ffffff)`,
                                border: `1.5px solid ${theme.hex}33`,
                                borderRadius: '16px',
                                padding: '1.15rem 1.25rem',
                                overflow: 'hidden',
                                boxShadow: '0 4px 15px rgba(15, 44, 89, 0.04)',
                                transition: 'all 0.25s ease',
                                maxWidth: isSingleCard ? '420px' : 'none',
                                width: isSingleCard ? '100%' : 'auto',
                                textAlign: isSingleCard ? 'center' : 'left'
                              }}
                            >
                              {/* Ícono Grande de Fondo / Marca de Agua */}
                              <div
                                style={{
                                  position: 'absolute',
                                  right: '8px',
                                  bottom: '8px',
                                  opacity: 0.14,
                                  pointerEvents: 'none',
                                  width: '65px',
                                  height: '65px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <img
                                  src={getMetricSymbolUrl(l)}
                                  alt=""
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `${API_BASE_URL.replace(/\/api\/?$/, '')}/symbols/default.webp`;
                                  }}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain'
                                  }}
                                />
                              </div>

                              {/* Cabecera con ícono temático y nombre de variable */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSingleCard ? 'center' : 'space-between', marginBottom: '6px', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '8px',
                                      background: `${theme.hex}18`,
                                      padding: '4px'
                                    }}
                                  >
                                    <img
                                      src={getMetricSymbolUrl(l)}
                                      alt={l.tipo}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `${API_BASE_URL.replace(/\/api\/?$/, '')}/symbols/default.webp`;
                                      }}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain'
                                      }}
                                    />
                                  </span>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#475569' }}>
                                    {language === 'en' ? (l.tipo_en || l.nombre_en || l.tipo) : (l.tipo_es || l.tipo)}
                                  </span>
                                </div>

                                {outWarning && (
                                  <span
                                    title={outWarning.msg}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      color: outWarning.type === 'min' ? '#2563eb' : '#dc2626',
                                      backgroundColor: outWarning.type === 'min' ? '#eff6ff' : '#fef2f2',
                                      border: `1px solid ${outWarning.type === 'min' ? '#bfdbfe' : '#fca5a5'}`,
                                      borderRadius: '6px',
                                      padding: '2px 7px',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      cursor: 'help'
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                      <path d="M12 2L1 21h22L12 2zm0 3.99L20.53 19H3.47L12 5.99zM11 10h2v4h-2zm0 5h2v2h-2z" />
                                    </svg>
                                    {outWarning.type === 'min'
                                      ? (language === 'en' ? 'Below min.' : 'Bajo mín.')
                                      : (language === 'en' ? 'Exceeded max.' : 'Sobrepasó máx.')}
                                  </span>
                                )}
                              </div>

                              {/* Valor Grande en Real-Time */}
                              <div className="notranslate" translate="no" style={{ fontSize: '1.9rem', fontWeight: 900, color: liveVal === '--' ? '#94a3b8' : '#0f2c59', lineHeight: 1.15, margin: '4px 0 8px 0' }}>
                                <span className="notranslate" translate="no">{liveVal}</span>
                                {liveVal !== '--' && <span className="notranslate" translate="no" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f2c59' }}> {l.unidad}</span>}
                              </div>

                              {/* Timestamp / Estado vivo o sin datos */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSingleCard ? 'center' : 'flex-start', gap: '5px', fontSize: '0.74rem', color: '#1e293b', fontWeight: 700 }}>
                                {liveVal === '--' ? (
                                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                    {language === 'en' ? 'No data received yet' : 'Aún sin datos recibidos'}
                                  </span>
                                ) : (
                                  <>
                                    {/* Badge EN VIVO / ÚLT. LECTURA */}
                                    {(() => {
                                      return (
                                        <span style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px',
                                          fontSize: '0.68rem',
                                          fontWeight: 800,
                                          color: liveMode ? '#10b981' : '#64748b',
                                          backgroundColor: liveMode ? '#ecfdf5' : '#f1f5f9',
                                          border: `1px solid ${liveMode ? '#6ee7b7' : '#cbd5e1'}`,
                                          borderRadius: '20px',
                                          padding: '1px 6px',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.04em'
                                        }}>
                                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: liveMode ? '#10b981' : '#64748b', display: 'inline-block' }}></span>
                                          {liveMode ? (language === 'en' ? 'LIVE' : 'EN VIVO') : (language === 'en' ? 'Last reading' : 'Últ. lectura')}
                                        </span>
                                      );
                                    })()}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                                      <circle cx="12" cy="12" r="10" />
                                      <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    <span>{timestamp}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Lienzo del Gráfico Analítico Recharts en Tiempo Real */}
                  {nodoSeleccionado && nodoSeleccionado.lecturas && nodoSeleccionado.lecturas.length > 0 && (
                    <PublicRechartsChart
                      history={liveMode ? liveBuffer : history}
                      nodoSeleccionado={nodoSeleccionado}
                      activeVariables={activeVariables}
                      liveTrigger={liveTrigger}
                      tipoGrafico={tipoGrafico}
                      onDescargarClick={handleOpenDescargaModal}
                      onAmpliarClick={() => setShowModalAmpliado(true)}
                      liveMode={liveMode}
                    />
                  )}
                </>
              )}

            </div>
          )}

          {/* TAB 2: GEOLOCALIZACIÓN / MAPA DE LA CATEGORÍA EN PANTALLA COMPLETA */}
          {tabActiva === 'mapa' && (
            <div className={`node-fullscreen-overlay ${modoMapa === 'categoria' ? 'mode-categoria' : 'mode-nodo'}`}>
              {/* Lienzo del mapa Leaflet a pantalla completa */}
              <div id="leaflet-public-map-preview" className="node-fullscreen-map"></div>

              {/* BARRA SUPERIOR FLOTANTE: CATEGORÍA Y UBICACIÓN */}
              <div
                className="node-fullscreen-top-bar"
                style={{
                  position: 'absolute',
                  top: '24px',
                  left: '24px',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.92)',
                  backdropFilter: 'blur(12px)',
                  border: '1.5px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '30px',
                  padding: '8px 20px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
                  color: '#ffffff'
                }}
              >
                <button
                  onClick={() => {
                    if (modoMapa === 'categoria') {
                      setNodoSeleccionado(null);
                      setLecturaSeleccionada(null);
                      setSearchParams(prev => {
                        const p = new URLSearchParams(prev);
                        p.delete('nodo');
                        p.delete('lectura');
                        return p;
                      }, { replace: true });
                    }
                    setTabActiva('realtime');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '1.4rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    lineHeight: 1,
                    padding: 0
                  }}
                  title={language === 'en' ? 'Back to real-time view' : 'Volver a la vista en tiempo real'}
                >
                  ‹
                </button>
                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff' }}>
                  {language === 'en' ? 'Category' : 'Categoría'}: <span style={{ color: '#38bdf8' }}>{displayCategoryName}</span>
                </span>
                <span style={{ opacity: 0.4 }}>•</span>
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📍 {mapUbicacionNombre}
                </span>
              </div>

              {/* Tarjeta flotante de información si hay un nodo seleccionado y panel abierto */}
              {nodoSeleccionado && showInfoPanel && (
                <div className="node-fullscreen-card">
                  <div className="node-fullscreen-header">
                    <div className="node-fullscreen-header-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="node-fullscreen-info-label">{language === 'en' ? 'INFORMATION' : 'INFORMACIÓN'}</span>
                      <button
                        type="button"
                        className="node-fullscreen-close-btn"
                        onClick={() => setShowInfoPanel(false)}
                        title={language === 'en' ? 'Close panel' : 'Cerrar panel'}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>

                    <h3 className="node-fullscreen-node-name">
                      {nodoSeleccionado.nombre}
                    </h3>

                    <p className="node-fullscreen-address" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" width="16" height="16" style={{ flexShrink: 0 }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{mapUbicacionNombre}</span>
                    </p>
                  </div>

                  {/* Indicador Dinámico / Gauge */}
                  {(() => {
                    if (!lecturaSeleccionada) return null;
                    const valStr = generarValorLive(lecturaSeleccionada.data_type);
                    const status = getVariableIndexStatus(lecturaSeleccionada, valStr);
                    if (!status) return null;
                    return (
                      <div className="node-fullscreen-gauge-section">
                        <span className="node-fullscreen-section-label">
                          {status.title}
                        </span>

                        <div className="node-fullscreen-index-box">
                          <span className="node-fullscreen-index-value" style={{ color: status.color }}>
                            {status.value}
                          </span>
                          <span
                            className="node-fullscreen-index-badge"
                            style={{
                              backgroundColor: status.color,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: status.outWarningMsg ? 'help' : 'default'
                            }}
                            title={status.outWarningMsg || ''}
                          >
                            {status.label}
                            {status.isOutOfRange && (
                              <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                <path d="M12 2L1 21h22L12 2zm0 3.99L20.53 19H3.47L12 5.99zM11 10h2v4h-2zm0 5h2v2h-2z" />
                              </svg>
                            )}
                          </span>
                        </div>

                        <div className="node-fullscreen-gauge-bar-wrapper">
                          <div className="node-fullscreen-gauge-bar" style={{
                            background: status.type === 'air'
                              ? 'linear-gradient(to right, #10b981, #eab308, #f97316, #ef4444, #a855f7, #7f1d1d)'
                              : status.type === 'soil'
                                ? 'linear-gradient(to right, #f97316, #eab308, #10b981, #2563eb)'
                                : status.type === 'custom_range'
                                  ? 'linear-gradient(to right, #3b82f6, #10b981, #ef4444)'
                                  : 'linear-gradient(to right, #3b82f6, #60a5fa, #10b981, #f59e0b, #ef4444)'
                          }}></div>
                          <div className="node-fullscreen-gauge-indicator" style={{ left: `${status.percent}%` }}></div>
                        </div>

                        <div className="node-fullscreen-gauge-labels">
                          {status.range.map((r, idx) => (
                            <span key={idx} className={status.label === r ? 'active' : ''}>{r}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Sensor Readings List */}
                  <div className="node-fullscreen-readings-section">
                    <span className="node-fullscreen-section-label">
                      {language === 'en' ? 'DEVICE READINGS (CLICK TO VIEW INDEX)' : 'LECTURAS DEL DISPOSITIVO (HAZ CLIC PARA VER ÍNDICE)'}
                    </span>

                    <div className="node-fullscreen-readings-list">
                      {nodoSeleccionado.lecturas && nodoSeleccionado.lecturas.map((l, idx) => {
                        const valStr = generarValorLive(l.data_type);
                        const isTemp = l.data_type.toLowerCase().includes('temp');
                        const isHum = l.data_type.toLowerCase().includes('hum') || l.data_type.toLowerCase().includes('soil');
                        const isAqi = l.data_type.toLowerCase().includes('aqi') || l.data_type.toLowerCase().includes('co2') || l.data_type.toLowerCase().includes('pm');
                        const isSelected = lecturaSeleccionada?.data_type === l.data_type;

                        const minExp = (l.minExpected !== undefined && l.minExpected !== null && l.minExpected !== '')
                          ? parseFloat(l.minExpected)
                          : (l.min_expected !== undefined && l.min_expected !== null && l.min_expected !== '')
                            ? parseFloat(l.min_expected)
                            : null;

                        const maxExp = (l.maxExpected !== undefined && l.maxExpected !== null && l.maxExpected !== '')
                          ? parseFloat(l.maxExpected)
                          : (l.max_expected !== undefined && l.max_expected !== null && l.max_expected !== '')
                            ? parseFloat(l.max_expected)
                            : null;

                        const numVal = parseFloat(valStr);
                        let outWarningMsg = null;
                        let outWarningColor = null;
                        const isEn = language === 'en';

                        if (valStr !== '--' && !isNaN(numVal)) {
                          if (minExp !== null && !isNaN(minExp) && numVal < minExp) {
                            outWarningMsg = isEn
                              ? `Value (${numVal} ${l.unidad || ''}) is below expected minimum (${minExp} ${l.unidad || ''})`
                              : `El valor registrado (${numVal} ${l.unidad || ''}) está por debajo del mínimo esperado (${minExp} ${l.unidad || ''})`;
                            outWarningColor = '#3b82f6';
                          } else if (maxExp !== null && !isNaN(maxExp) && numVal > maxExp) {
                            outWarningMsg = isEn
                              ? `Value (${numVal} ${l.unidad || ''}) exceeds expected maximum (${maxExp} ${l.unidad || ''})`
                              : `El valor registrado (${numVal} ${l.unidad || ''}) sobrepasa el máximo esperado (${maxExp} ${l.unidad || ''})`;
                            outWarningColor = '#ef4444';
                          }
                        }

                        return (
                          <div
                            className={`node-fullscreen-reading-item ${isSelected ? 'active' : ''}`}
                            key={idx}
                            onClick={() => handleLecturaChange(l.data_type)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="node-fullscreen-reading-info">
                              <span className="node-fullscreen-reading-icon">
                                {isTemp ? (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                                  </svg>
                                ) : isHum ? (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                                  </svg>
                                ) : isAqi ? (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.59-4.59A2 2 0 1 1 19 12H2" />
                                  </svg>
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                                    <line x1="6" y1="6" x2="6.01" y2="6" />
                                    <line x1="6" y1="18" x2="6.01" y2="18" />
                                  </svg>
                                )}
                              </span>
                              <span className="node-fullscreen-reading-name">{language === 'en' ? (l.tipo_en || l.nombre_en || l.tipo) : (l.tipo_es || l.tipo)}</span>
                            </div>
                            <span className="node-fullscreen-reading-value font-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {valStr} {valStr !== '--' && <span className="node-fullscreen-reading-unit">{l.unidad}</span>}
                              {outWarningMsg && (
                                <span
                                  title={outWarningMsg}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: outWarningColor,
                                    cursor: 'help',
                                    marginLeft: '4px'
                                  }}
                                >
                                  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                                    <path d="M12 2L1 21h22L12 2zm0 3.99L20.53 19H3.47L12 5.99zM11 10h2v4h-2zm0 5h2v2h-2z" />
                                  </svg>
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* BARRA INFERIOR IZQUIERDA FLOTANTE DE NODOS DE LA CATEGORÍA (SOLO EN MODO CATEGORÍA) */}
              {modoMapa === 'categoria' && nodosFiltrados.length > 0 && (
                <div
                  className="public-map-bottom-selector"
                  style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '24px',
                    transform: 'none',
                    zIndex: 1000,
                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                    backdropFilter: 'blur(12px)',
                    border: '1.5px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '35px',
                    padding: '8px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5)',
                    color: '#ffffff',
                    maxWidth: 'calc(100vw - 440px)'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 800, color: '#38bdf8', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    📍 Dispositivos:
                  </span>

                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '520px', paddingBottom: '2px' }}>
                    {nodosFiltrados.map((n, idx) => {
                      const isSel = nodoSeleccionado?.id === n.id;
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            handleCategoryMapNodeSwitch(n.id);
                            if (window.leafletPublicMapInstance) {
                              const lat = parseFloat(n.latitud || '-0.951389');
                              const lng = parseFloat(n.longitud || '-80.702476');
                              window.leafletPublicMapInstance.setView([lat, lng], 18);
                            }
                          }}
                          style={{
                            background: isSel ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                            color: isSel ? '#0f172a' : '#ffffff',
                            border: `1.5px solid ${isSel ? '#38bdf8' : 'rgba(255, 255, 255, 0.25)'}`,
                            borderRadius: '20px',
                            padding: '6px 14px',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease',
                            boxShadow: isSel ? '0 4px 12px rgba(56, 189, 248, 0.4)' : 'none'
                          }}
                        >
                          #{idx + 1} - {n.nombre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL POPUP: DESCARGAR CSV ── */}
      <ModalExportarCSV
        show={showModalDescarga}
        onClose={() => setShowModalDescarga(false)}
        nodo={nodoSeleccionado}
      />

      {/* ── MODAL FULLSCREEN: GRÁFICO AMPLIADO ── */}
      {showModalAmpliado && nodoSeleccionado && lecturaSeleccionada && (
        <div
          className="ampliado-modal-overlay"
          onClick={() => setShowModalAmpliado(false)}
        >
          <div
            className="ampliado-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="ampliado-modal-header">
              <div className="ampliado-modal-info">
                <h3 className="ampliado-modal-title">
                  📊 Gráfico Ampliado — {nodoSeleccionado.nombre}
                </h3>
                <span className="ampliado-modal-sub">
                  Ubicación: {mapUbicacionNombre}
                </span>
              </div>

              <div className="ampliado-modal-actions">
                {/* Toggle línea / barras / Reloj */}
                <div className="hist-chart-type-toggle" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setLiveMode(prev => !prev)}
                    className={`toggle-icon-btn ${liveMode ? 'active' : ''}`}
                    title={
                      liveMode
                        ? (language === 'en' ? 'Showing Live Data (Click for DB data)' : 'Mostrando Datos en Vivo (Clic para ver Base de Datos)')
                        : (language === 'en' ? 'Showing DB Data (Click for Live data)' : 'Mostrando Base de Datos (Clic para ver Datos en Vivo)')
                    }
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoGrafico('line')}
                    className={`toggle-icon-btn ${tipoGrafico === 'line' ? 'active' : ''}`}
                  >
                    {language === 'en' ? 'Line' : 'Línea'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoGrafico('bar')}
                    className={`toggle-icon-btn ${tipoGrafico === 'bar' ? 'active' : ''}`}
                  >
                    {language === 'en' ? 'Bars' : 'Barras'}
                  </button>
                </div>

                {/* Botón cerrar */}
                <button
                  onClick={() => setShowModalAmpliado(false)}
                  className="ampliado-modal-close-btn"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Cerrar
                </button>
              </div>
            </div>

            {/* Chart canvas — fills remaining height */}
            <div className="ampliado-modal-body">
              <PublicRechartsChart
                history={liveMode ? liveBuffer : history}
                nodoSeleccionado={nodoSeleccionado}
                activeVariables={activeVariables}
                liveTrigger={liveTrigger}
                tipoGrafico={tipoGrafico}
                isAmpliado={true}
                liveMode={liveMode}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}