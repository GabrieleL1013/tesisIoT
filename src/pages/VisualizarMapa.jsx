import { API_BASE_URL } from '../config/api';
import { echo } from '../config/echo';
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/VisualizarMapa.css';
import EditableText from '../components/EditableText';
import ModalExportarCSV from '../components/ModalExportarCSV';

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
  termometro: { class: 'theme-orange', hex: '#ea580c', bg: '#fff7ed', icon: <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /> },
  humedad: { class: 'theme-blue', hex: '#2563eb', bg: '#eff6ff', icon: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /> },
  presion: { class: 'theme-green', hex: '#10b981', bg: '#ecfdf5', icon: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="12" x2="15" y2="9" /></> },
  viento: { class: 'theme-cyan', hex: '#06b6d4', bg: '#ecfeff', icon: <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" /> },
  lluvia: { class: 'theme-purple', hex: '#8b5cf6', bg: '#f5f3ff', icon: <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25M8 16v4m4-2v4m4-4v4" /> },
  luz: { class: 'theme-orange', hex: '#f59e0b', bg: '#fffbeb', icon: <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></> },
  energia: { class: 'theme-blue', hex: '#6366f1', bg: '#eef2ff', icon: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /> },
  ph: { class: 'theme-green', hex: '#14b8a6', bg: '#f0fdfa', icon: <path d="M10 2v7.31L4.75 18.25A2 2 0 0 0 6.46 21.2h11.08a2 2 0 0 0 1.71-2.95L14 9.31V2" /> },
  sonido: { class: 'theme-purple', hex: '#a855f7', bg: '#faf5ff', icon: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></> },
  general: { class: 'theme-green', hex: '#10b981', bg: '#ecfdf5', icon: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></> }
};

const VAR_PALETTE = [
  { class: 'theme-red', hex: '#b91c1c', bg: '#fef2f2', border: '#fca5a5' },    // Solid Dark Red
  { class: 'theme-blue', hex: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },   // Vibrant Blue
  { class: 'theme-green', hex: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },  // Emerald Green
  { class: 'theme-amber', hex: '#d97706', bg: '#fffbeb', border: '#fcd34d' },  // Amber Orange
  { class: 'theme-purple', hex: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd' }, // Violet / Purple
  { class: 'theme-pink', hex: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8' },   // Magenta / Pink
  { class: 'theme-cyan', hex: '#06b6d4', bg: '#ecfeff', border: '#67e8f9' }    // Cyan
];

const getTheme = (clave, icono, idx = null) => {
  let baseTheme = null;
  const t = (clave || '').toLowerCase();
  if (t.includes('temp')) baseTheme = DYNAMIC_ICONS_PUBLIC.termometro;
  else if (t.includes('hum') || t.includes('soil')) baseTheme = DYNAMIC_ICONS_PUBLIC.humedad;
  else if (t.includes('press') || t.includes('presion')) baseTheme = DYNAMIC_ICONS_PUBLIC.presion;
  else if (t.includes('wind') || t.includes('viento')) baseTheme = DYNAMIC_ICONS_PUBLIC.viento;
  else if (t.includes('rain') || t.includes('lluvia')) baseTheme = DYNAMIC_ICONS_PUBLIC.lluvia;
  else if (t.includes('ph')) baseTheme = DYNAMIC_ICONS_PUBLIC.ph;
  else if (t.includes('oxigen') || t.includes('oxy')) baseTheme = DYNAMIC_ICONS_PUBLIC.oxigeno;

  if (!baseTheme && icono && DYNAMIC_ICONS_PUBLIC[icono]) {
    baseTheme = DYNAMIC_ICONS_PUBLIC[icono];
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
const PublicCustomSelectNode = ({ nodos, selectedNodeId, onSelect, placeholder = "-- Seleccionar Dispositivo / Nodo --" }) => {
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
            {selectedNode ? selectedNode.nombre : placeholder}
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
              <span>{placeholder}</span>
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

// Tooltip interactivo personalizado para diferenciar ejes y colores por variable
const CustomPublicChartTooltip = ({ active, payload, label, showAxisBadges = false, axisMapping = {}, activeLecturas = [] }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div style={{
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '12px',
      padding: '10px 14px',
      color: '#ffffff',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      fontSize: '0.82rem',
      minWidth: '180px'
    }}>
      <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
        🕒 {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {payload.map((item, idx) => {
          const color = item.color || item.fill || '#10b981';
          const matchLectura = activeLecturas.find(l => (item.dataKey && item.dataKey === l.data_type) || (item.name && item.name.includes(l.tipo)));
          const dataKey = matchLectura ? matchLectura.data_type : item.dataKey;
          const axisSide = (axisMapping && dataKey && axisMapping[dataKey]) || (axisMapping && item.dataKey && axisMapping[item.dataKey]) || item.yAxisId || item.axisId;
          const isLeft = axisSide ? axisSide === 'left' : idx % 2 === 0;
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
                <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{item.name}:</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800, color: color }}>{item.value}</span>
                {showAxisBadges && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: color, backgroundColor: `${color}22`, padding: '1px 5px', borderRadius: '4px' }}>
                    {isLeft ? '◄ Izq.' : 'Der. ►'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Garante ticks de 2 líneas (Hora arriba, Fecha con año abajo) para la XAxis
const CustomXAxisTick = ({ x, y, payload }) => {
  if (!payload || !payload.value) return null;
  const rawStr = String(payload.value).trim();
  const parts = rawStr.split(' ');
  let dateText = '';
  let timeText = '';

  if (parts.length >= 2) {
    dateText = parts[0];
    timeText = parts.slice(1).join(' ');
  } else if (rawStr.includes('/')) {
    dateText = rawStr;
  } else {
    timeText = rawStr;
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill="#0f172a">
        {timeText && <tspan x="0" dy="11" fill="#0f2c59" fontSize="10" fontWeight="800">{timeText}</tspan>}
        {dateText && <tspan x="0" dy={timeText ? "13" : "11"} fill="#64748b" fontSize="8.5" fontWeight="600">{dateText}</tspan>}
      </text>
    </g>
  );
};

// Componente para dibujar la gráfica Recharts interactiva en tiempo real
const PublicRechartsChart = ({ history = [], nodoSeleccionado, activeVariables = {}, tipoGrafico, onDescargarClick, onAmpliarClick, isAmpliado = false }) => {
  const lecturas = nodoSeleccionado?.lecturas || [];
  const activeLecturas = lecturas.filter(l => Boolean(activeVariables && activeVariables[l.data_type]));
  const [hoveredVar, setHoveredVar] = useState(null);

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.slice(-10);
  }, [history]);

  // Mapeo inteligente de ejes por orden de magnitud (valores grandes ej. 6000 van a 'left', pequeños ej. 8 y 9 van a 'right')
  const axisMapping = useMemo(() => {
    if (!activeLecturas || activeLecturas.length <= 1) {
      return { [activeLecturas[0]?.data_type]: 'left' };
    }

    const maxes = activeLecturas.map(l => {
      let max = 0;
      chartData.forEach(d => {
        const val = Math.abs(parseFloat(d[l.data_type]) || 0);
        if (val > max) max = val;
      });
      return { data_type: l.data_type, max };
    });

    const sorted = [...maxes].sort((a, b) => b.max - a.max);
    const topMax = sorted[0].max;

    const mapping = {};
    maxes.forEach(item => {
      if (topMax > 50 && item.max >= topMax * 0.15) {
        mapping[item.data_type] = 'left';
      } else {
        mapping[item.data_type] = 'right';
      }
    });

    const leftCount = Object.values(mapping).filter(v => v === 'left').length;
    if (leftCount === 0 || leftCount === activeLecturas.length) {
      const result = {};
      activeLecturas.forEach((l, i) => {
        result[l.data_type] = i === 0 ? 'left' : 'right';
      });
      return result;
    }

    return mapping;
  }, [activeLecturas, chartData]);

  const showAxisBadges = activeLecturas.length > 1;

  const leftVariable = activeLecturas.find(l => axisMapping[l.data_type] === 'left');
  const rightVariable = activeLecturas.find(l => axisMapping[l.data_type] === 'right');

  const leftTheme = leftVariable ? getTheme(leftVariable.data_type, leftVariable.icono, activeLecturas.indexOf(leftVariable)) : null;
  const rightTheme = (rightVariable && showAxisBadges) ? getTheme(rightVariable.data_type, rightVariable.icono, activeLecturas.indexOf(rightVariable)) : null;

  const hoveredAxis = hoveredVar ? axisMapping[hoveredVar] : null;

  return (
    <div className="dashboard-chart-svg-container" style={{ padding: isAmpliado ? '1rem' : '0.5rem 0' }}>
      {/* Leyenda Dinámica de Variables Activas con Indicador de Eje y Efecto Hover */}
      <div className="dashboard-chart-legend" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '0.85rem', alignItems: 'center' }}>
        {activeLecturas.map((l, idx) => {
          const theme = getTheme(l.data_type, l.icono, showAxisBadges ? idx : null);
          const axisSide = axisMapping[l.data_type] || 'left';
          const isLeft = axisSide === 'left';
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                {theme.icon}
              </svg>
              <span>{l.tipo} ({l.unidad})</span>
              {showAxisBadges && (
                <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', backgroundColor: `${theme.hex}22`, color: theme.hex }}>
                  {isLeft ? '◄ Eje Izq.' : 'Eje Der. ►'}
                </span>
              )}
            </div>
          );
        })}
        {activeLecturas.length === 0 && (
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
            Selecciona al menos una variable en los checkboxes superiores para visualizar la línea de tiempo.
          </span>
        )}
      </div>

      {/* Gráfico Recharts */}
      <div style={{ width: '100%', height: isAmpliado ? 'calc(100vh - 220px)' : '260px', minHeight: isAmpliado ? '400px' : 'auto' }}>
        {activeLecturas.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontSize: '0.9rem' }}>
            Sin variables activas marcadas
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontSize: '0.9rem' }}>
            Cargando datos en tiempo real...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {tipoGrafico === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: showAxisBadges ? 25 : 40, left: 10, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" height={52} tick={<CustomXAxisTick />} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />

                {leftTheme && (
                  <YAxis
                    yAxisId="left"
                    width={55}
                    tick={{
                      fontSize: hoveredAxis === 'left' ? 12 : 10,
                      fill: leftTheme.hex,
                      fontWeight: hoveredAxis === 'left' ? 900 : 700,
                      opacity: hoveredAxis === 'right' ? 0.35 : 1
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                )}
                {rightTheme && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    width={50}
                    tick={{
                      fontSize: hoveredAxis === 'right' ? 12 : 10,
                      fill: rightTheme.hex,
                      fontWeight: hoveredAxis === 'right' ? 900 : 700,
                      opacity: hoveredAxis === 'left' ? 0.35 : 1
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                )}

                <Tooltip content={<CustomPublicChartTooltip showAxisBadges={showAxisBadges} axisMapping={axisMapping} activeLecturas={activeLecturas} />} />

                {activeLecturas.map((l, idx) => {
                  const theme = getTheme(l.data_type, l.icono, showAxisBadges ? idx : null);
                  const yAxisId = axisMapping[l.data_type] || 'left';
                  const isHovered = hoveredVar === l.data_type;
                  const isOtherHovered = hoveredVar && !isHovered;

                  return (
                    <Bar
                      key={l.data_type}
                      yAxisId={yAxisId}
                      dataKey={l.data_type}
                      name={`${l.tipo} (${l.unidad})`}
                      fill={theme.hex}
                      fillOpacity={isOtherHovered ? 0.2 : 1}
                      radius={[4, 4, 0, 0]}
                    />
                  );
                })}
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: showAxisBadges ? 25 : 40, left: 10, bottom: 28 }}>
                <defs>
                  {activeLecturas.map((l, idx) => {
                    const theme = getTheme(l.data_type, l.icono, showAxisBadges ? idx : null);
                    return (
                      <linearGradient key={idx} id={`colorPub${l.data_type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.hex} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={theme.hex} stopOpacity={0} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" height={52} tick={<CustomXAxisTick />} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                {leftTheme && (
                  <YAxis
                    yAxisId="left"
                    width={55}
                    tick={{
                      fontSize: hoveredAxis === 'left' ? 12 : 10,
                      fill: leftTheme.hex,
                      fontWeight: hoveredAxis === 'left' ? 900 : 700,
                      opacity: hoveredAxis === 'right' ? 0.35 : 1
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                )}
                {rightTheme && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    width={50}
                    tick={{
                      fontSize: hoveredAxis === 'right' ? 12 : 10,
                      fill: rightTheme.hex,
                      fontWeight: hoveredAxis === 'right' ? 900 : 700,
                      opacity: hoveredAxis === 'left' ? 0.35 : 1
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                )}

                <Tooltip content={<CustomPublicChartTooltip showAxisBadges={showAxisBadges} axisMapping={axisMapping} activeLecturas={activeLecturas} />} />

                {activeLecturas.map((l, idx) => {
                  const theme = getTheme(l.data_type, l.icono, showAxisBadges ? idx : null);
                  const yAxisId = axisMapping[l.data_type] || 'left';
                  const isHovered = hoveredVar === l.data_type;
                  const isOtherHovered = hoveredVar && !isHovered;

                  return (
                    <Area
                      key={l.data_type}
                      yAxisId={yAxisId}
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
            Descargar Datos
          </button>
          <button onClick={onAmpliarClick} className="chart-footer-btn zoom">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            Gráfico Ampliado
          </button>
        </div>
      )}
    </div>
  );
};

export default function VisualizarMapa() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categorias, setCategorias] = useState([]);
  const [nodos, setNodos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [nodoSeleccionado, setNodoSeleccionado] = useState(null);
  const [lecturaSeleccionada, setLecturaSeleccionada] = useState(null);

  // Pestaña activa (realtime / mapa)
  const [tabActiva, setTabActiva] = useState('realtime');

  // Modo de mapa: 'categoria' (mapa general de la categoría) o 'nodo' (mapa de un nodo específico)
  const [modoMapa, setModoMapa] = useState('categoria');

  // Forma del gráfico ('line' o 'bar')
  const [tipoGrafico, setTipoGrafico] = useState('line');

  // Modal de gráfico ampliado
  const [showModalAmpliado, setShowModalAmpliado] = useState(false);

  // Valores de telemetría más recientes en BD
  const [valoresUltimos, setValoresUltimos] = useState({});

  // Puntos del gráfico histórico y tiempo real
  const [history, setHistory] = useState([]);

  // Cargar datos históricos iniciales cuando cambia el nodo seleccionado (50 lecturas recientes)
  useEffect(() => {
    const serial = nodoSeleccionado?.serial_number;
    if (!serial) {
      setHistory([]);
      return;
    }

    const fetchInitialHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lecturas/recientes?serial_number=${serial}&limit=50`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const points = data.map(item => {
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

          setHistory(points);

          const lastItem = points[points.length - 1];
          if (lastItem && nodoSeleccionado?.lecturas) {
            const map = {};
            nodoSeleccionado.lecturas.forEach(l => {
              if (lastItem[l.data_type] !== undefined && lastItem[l.data_type] !== null) {
                map[l.data_type] = {
                  valor: parseFloat(lastItem[l.data_type]),
                  fecha: lastItem.dateTime
                };
              }
            });
            setValoresUltimos(map);
          }
        }
      } catch (err) {
        console.error("Error al cargar historial inicial público:", err);
      }
    };

    fetchInitialHistory();
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

  // Estado para el modo de selección: false (Individual por defecto), true (Multiselección mediante Marcar Todas)
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [activeVariables, setActiveVariables] = useState({});

  // Resetear modo de selección al cambiar de nodo / dispositivo
  useEffect(() => {
    setIsMultiSelectMode(false);
    if (nodoSeleccionado && nodoSeleccionado.lecturas && nodoSeleccionado.lecturas.length > 0) {
      const firstDataType = nodoSeleccionado.lecturas[0].data_type;
      setActiveVariables({ [firstDataType]: true });
    } else {
      setActiveVariables({});
    }
  }, [nodoSeleccionado?.id]);

  // Actualizar variables activas cuando el usuario altera isMultiSelectMode manualmente
  useEffect(() => {
    if (!nodoSeleccionado || !nodoSeleccionado.lecturas || nodoSeleccionado.lecturas.length === 0) return;
    if (isMultiSelectMode) {
      const initialMap = {};
      nodoSeleccionado.lecturas.forEach(l => {
        initialMap[l.data_type] = true;
      });
      setActiveVariables(initialMap);
    }
  }, [isMultiSelectMode]);

  const toggleVariable = (dataType) => {
    if (!isMultiSelectMode) {
      // Modo Individual: solo la variable clickeada está activa (en ROJO)
      setActiveVariables({ [dataType]: true });
      if (nodoSeleccionado && nodoSeleccionado.lecturas) {
        const found = nodoSeleccionado.lecturas.find(l => l.data_type === dataType);
        if (found) setLecturaSeleccionada(found);
      }
    } else {
      // Modo Multiselección: alternar casilla de verificación
      setActiveVariables(prev => {
        const nextState = {
          ...prev,
          [dataType]: !prev[dataType]
        };

        // Si el usuario desmarcó todas las variables manualmente (0 activas), volver automáticamente a modo individual (primera variable en rojo)
        const hasAnyActive = nodoSeleccionado?.lecturas?.some(l => Boolean(nextState[l.data_type]));
        if (!hasAnyActive) {
          setIsMultiSelectMode(false);
          const firstDataType = nodoSeleccionado.lecturas[0].data_type;
          return { [firstDataType]: true };
        }

        return nextState;
      });
    }
  };

  const handleToggleAllVariables = () => {
    if (!nodoSeleccionado?.lecturas) return;
    if (!isMultiSelectMode) {
      // Activar modo multiselección y marcar todas las variables
      setIsMultiSelectMode(true);
      const newMap = {};
      nodoSeleccionado.lecturas.forEach(l => {
        newMap[l.data_type] = true;
      });
      setActiveVariables(newMap);
    } else {
      // Desactivar modo multiselección y volver a navegación individual (solo la primera variable)
      setIsMultiSelectMode(false);
      const firstDataType = nodoSeleccionado.lecturas[0].data_type;
      setActiveVariables({ [firstDataType]: true });
    }
  };

  const catParam = searchParams.get('categoria');
  const nodeParam = searchParams.get('nodo');
  const lecturaParam = searchParams.get('lectura');

  // Cargar categorías y nodos
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/categorias`).then(res => res.json()),
      fetch(`${API_BASE_URL}/nodos`).then(res => res.json())
    ])
      .then(([catData, nodosData]) => {
        setCategorias(Array.isArray(catData) ? catData : []);
        const nodeList = Array.isArray(nodosData) ? nodosData : [];
        setNodos(nodeList);

        if (catParam) {
          setCategoriaSeleccionada(catParam);
          const filtered = nodeList.filter(
            n => n.categoria && n.categoria.toLowerCase() === catParam.toLowerCase()
          );

          if (filtered.length > 0) {
            if (nodeParam) {
              const found = filtered.find(n => n.id.toString() === nodeParam.toString());
              if (found) {
                setNodoSeleccionado(prev => (prev?.id === found.id ? prev : found));
                if (found.lecturas && found.lecturas.length > 0) {
                  let activeLect = found.lecturas[0];
                  if (lecturaParam) {
                    const foundLect = found.lecturas.find(l => l.data_type === lecturaParam);
                    if (foundLect) activeLect = foundLect;
                  }
                  setLecturaSeleccionada(activeLect);
                }
                return;
              }
            }
          }
          setNodoSeleccionado(null);
          setLecturaSeleccionada(null);
        } else {
          setCategoriaSeleccionada(null);
          setNodoSeleccionado(null);
          setLecturaSeleccionada(null);
        }
      })
      .catch(err => {
        console.error("Error loading categories and telemetry data:", err);
      });
  }, [catParam, nodeParam, lecturaParam]);

  // Cargar lecturas reales registradas en la BD y escuchar eventos en tiempo real cada 5s via WebSockets
  useEffect(() => {
    const serial = nodoSeleccionado?.serial_number;
    if (!serial) return;

    const processTelemetryPacket = (newData) => {
      if (!newData) return;

      let shortT = newData.shortTime;
      let fullT = newData.dateTime;

      if (!shortT && fullT) {
        shortT = fullT.includes(',') ? fullT.split(', ')[1] : fullT;
      } else if (shortT && !fullT) {
        fullT = `${new Date().toLocaleDateString('es-ES')}, ${shortT}`;
      } else if (!shortT && !fullT) {
        shortT = new Date().toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
        fullT = `${new Date().toLocaleDateString('es-ES')}, ${shortT}`;
      }

      const parsedData = {
        ...newData,
        time: shortT,
        dateTime: fullT
      };

      if (nodoSeleccionado?.lecturas) {
        setValoresUltimos(prev => {
          const updated = { ...prev };
          nodoSeleccionado.lecturas.forEach(l => {
            if (newData[l.data_type] !== undefined && newData[l.data_type] !== null) {
              updated[l.data_type] = {
                valor: parseFloat(newData[l.data_type]),
                fecha: fullT
              };
            }
          });
          return updated;
        });
      }

      setHistory(prev => {
        const updated = [...prev, parsedData];
        if (updated.length > 200) updated.shift();
        return updated;
      });
    };

    // Escuchar canal WebSocket de Laravel Reverb en vivo (emitido cada 5s por el listener MQTT)
    let channel;
    try {
      const channelName = `telemetry.${serial}`;
      channel = echo.channel(channelName);
      channel.listen('.LecturaRecibida', (e) => {
        const newData = e.data || e;
        if (newData) {
          processTelemetryPacket(newData);
        }
      });
    } catch (e) {
      console.warn("WebSocket channel error:", e);
    }

    return () => {
      if (channel && serial) {
        echo.leaveChannel(`telemetry.${serial}`);
      }
    };
  }, [nodoSeleccionado?.serial_number]);

  const handleCategoryClick = (catName) => {
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
      return;
    }

    const nodeObj = nodos.find(n => n.id.toString() === nodeId.toString());
    if (nodeObj) {
      const firstLectura = nodeObj.lecturas && nodeObj.lecturas.length > 0 ? nodeObj.lecturas[0].data_type : '';
      setSearchParams({
        categoria: categoriaSeleccionada,
        nodo: nodeId,
        lectura: firstLectura
      });
      setNodoSeleccionado(prev => (prev?.id === nodeObj.id ? prev : nodeObj));
      setModoMapa('nodo');
    }
  };

  const handleLecturaChange = (lecturaKey) => {
    setSearchParams({
      categoria: categoriaSeleccionada,
      nodo: nodoSeleccionado?.id,
      lectura: lecturaKey
    });
    if (nodoSeleccionado && nodoSeleccionado.lecturas) {
      const found = nodoSeleccionado.lecturas.find(l => l.data_type === lecturaKey);
      if (found) setLecturaSeleccionada(found);
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
      setModoMapa('categoria');
    }
  };

  const handleOpenDescargaModal = () => {
    if (!nodoSeleccionado) return;
    setShowModalDescarga(true);
  };

  // Obtener valor live preferentemente de BD o fallback simulador
  const generarValorLive = (dataType) => {
    if (!dataType) return '0.0';

    if (valoresUltimos[dataType]) {
      return parseFloat(valoresUltimos[dataType].valor).toFixed(1);
    }

    // Fallback de simulación
    const baseHash = (dataType.charCodeAt(0) || 10) + liveTrigger;
    if (dataType.includes('temp')) {
      return (24 + (baseHash % 5) + (Math.sin(liveTrigger) * 0.3)).toFixed(1);
    }
    if (dataType.includes('hum') || dataType.includes('water')) {
      return (56.3 + Math.sin(liveTrigger * 0.4) * 0.6 + ((baseHash) % 2) * 0.1).toFixed(1);
    }
    if (dataType.includes('pm') || dataType.includes('co2')) {
      return (14 + (baseHash % 20)).toFixed(1);
    }
    if (dataType.includes('vel') || dataType.includes('wind')) {
      return (2.1 + Math.sin(liveTrigger * 0.5) * 0.3 + ((baseHash) % 3) * 0.1).toFixed(1);
    }
    return (5 + (baseHash % 8)).toFixed(0);
  };

  // Formatear estados y percentiles de barra para gauges de la vista RegistrarNodo
  const getVariableIndexStatus = (variable, valueRaw) => {
    if (!variable) return null;
    const val = parseFloat(valueRaw);
    if (isNaN(val)) return null;

    // Extraer mínimo y máximo configurados en la métrica (si existen)
    const minExp = (variable.minExpected !== undefined && variable.minExpected !== null && variable.minExpected !== '')
      ? parseFloat(variable.minExpected)
      : (variable.min_expected !== undefined && variable.min_expected !== null && variable.min_expected !== '')
        ? parseFloat(variable.min_expected)
        : null;

    const maxExp = (variable.maxExpected !== undefined && variable.maxExpected !== null && variable.maxExpected !== '')
      ? parseFloat(variable.maxExpected)
      : (variable.max_expected !== undefined && variable.max_expected !== null && variable.max_expected !== '')
        ? parseFloat(variable.max_expected)
        : null;

    // Si la métrica tiene configurados Mínimo o Máximo esperados válidos
    if (minExp !== null || maxExp !== null) {
      let label = 'Medio';
      let color = '#10b981'; // Verde para dentro del rango (Medio / Óptimo)
      let percent = 50;
      let isOutOfRange = false;
      let outWarningMsg = null;

      if (minExp !== null && val < minExp) {
        label = 'Bajo';
        color = '#3b82f6'; // Azul para nivel bajo por debajo del mínimo
        percent = 2; // Filo izquierdo de la barra indicadora
        isOutOfRange = true;
        outWarningMsg = `El valor registrado (${val} ${variable.unidad || ''}) está por debajo del mínimo esperado (${minExp} ${variable.unidad || ''})`;
      } else if (maxExp !== null && val > maxExp) {
        label = 'Alto';
        color = '#ef4444'; // Rojo para nivel alto por encima del máximo
        percent = 98; // Filo derecho de la barra indicadora
        isOutOfRange = true;
        outWarningMsg = `El valor registrado (${val} ${variable.unidad || ''}) sobrepasa el máximo esperado (${maxExp} ${variable.unidad || ''})`;
      } else {
        label = 'Medio';
        color = '#10b981'; // Verde para el rango medio / normal
        if (minExp !== null && maxExp !== null && maxExp > minExp) {
          const ratio = (val - minExp) / (maxExp - minExp);
          percent = 15 + ratio * 70; // Centrado dentro del rango óptimo
        } else {
          percent = 50;
        }
      }

      return {
        title: variable.tipo || variable.nombre || 'Variable',
        value: `${val} ${variable.unidad || ''}`.trim(),
        label,
        color,
        percent: Math.min(Math.max(percent, 2), 98),
        type: 'custom_range',
        range: ['Bajo', 'Medio', 'Alto'],
        isOutOfRange,
        outWarningMsg
      };
    }

    const key = (variable.data_type || variable.claveMqtt || '').toLowerCase();
    const nombre = (variable.tipo || variable.nombre || '').toLowerCase();

    // 1. AQI
    if (key.includes('aqi')) {
      let label = 'Buena';
      let color = '#10b981';
      let percent = Math.min((val / 500) * 100, 100);
      if (val > 300) {
        label = 'Peligroso';
        color = '#7f1d1d';
      } else if (val > 200) {
        label = 'Muy Dañina';
        color = '#a855f7';
      } else if (val > 150) {
        label = 'Dañina';
        color = '#ef4444';
      } else if (val > 100) {
        label = 'Mala';
        color = '#f97316';
      } else if (val > 50) {
        label = 'Moderada';
        color = '#eab308';
      }
      return {
        title: 'Índice de Calidad del Aire (AQI)',
        value: val.toString(),
        label,
        color,
        percent,
        type: 'air',
        range: ['Buena', 'Moderada', 'Mala', 'Dañina', 'Muy Dañina', 'Peligroso']
      };
    }

    // 2. CO2
    if (key.includes('co2')) {
      let label = 'Excelente';
      let color = '#10b981';
      let percent = Math.min((val / 2000) * 100, 100);
      if (val > 2000) {
        label = 'Malo';
        color = '#ef4444';
      } else if (val > 1000) {
        label = 'Regular';
        color = '#f59e0b';
      } else if (val > 400) {
        label = 'Bueno';
        color = '#10b981';
      }
      return {
        title: 'Concentración de CO2',
        value: `${val} ppm`,
        label,
        color,
        percent,
        type: 'co2',
        range: ['Excelente', 'Bueno', 'Regular', 'Malo']
      };
    }

    // 3. HUMEDAD
    if (key.includes('hum') || key.includes('soil') || key.includes('water')) {
      let label = 'Óptimo';
      let color = '#10b981';
      let percent = val;
      if (val > 80) {
        label = 'Saturado';
        color = '#2563eb';
      } else if (val > 50) {
        label = 'Óptimo';
        color = '#10b981';
      } else if (val > 30) {
        label = 'Moderado';
        color = '#eab308';
      } else {
        label = 'Seco';
        color = '#f97316';
      }
      return {
        title: nombre.includes('suelo') ? 'Humedad del Suelo' : 'Humedad Relativa',
        value: `${val}%`,
        label,
        color,
        percent,
        type: 'soil',
        range: ['Seco', 'Moderado', 'Óptimo', 'Saturado']
      };
    }

    // 4. TEMPERATURA
    if (key.includes('temp')) {
      let label = 'Confortable';
      let color = '#10b981';
      let percent = Math.min(Math.max(((val - 10) / 30) * 100, 0), 100);
      if (val > 30) {
        label = 'Caliente';
        color = '#ef4444';
      } else if (val > 25) {
        label = 'Cálido';
        color = '#f59e0b';
      } else if (val > 18) {
        label = 'Confortable';
        color = '#10b981';
      } else if (val > 12) {
        label = 'Fresco';
        color = '#60a5fa';
      } else {
        label = 'Frío';
        color = '#3b82f6';
      }
      return {
        title: 'Sensación Térmica',
        value: `${val} °C`,
        label,
        color,
        percent,
        type: 'thermal',
        range: ['Frío', 'Fresco', 'Confortable', 'Cálido', 'Caliente']
      };
    }

    // 5. PRESIÓN
    if (key.includes('press') || key.includes('pres')) {
      let label = 'Normal';
      let color = '#10b981';
      let percent = Math.min(Math.max(((val - 990) / 40) * 100, 0), 100);
      if (val > 1015) {
        label = 'Alta';
        color = '#2563eb';
      } else if (val < 1009) {
        label = 'Baja';
        color = '#f59e0b';
      }
      return {
        title: 'Presión Barométrica',
        value: `${val} hPa`,
        label,
        color,
        percent,
        type: 'pressure',
        range: ['Baja', 'Normal', 'Alta']
      };
    }

    return {
      title: variable.tipo || variable.nombre || 'Variable',
      value: `${val} ${variable.unidad || ''}`.trim(),
      label: 'Medio',
      color: '#10b981',
      percent: 50,
      type: 'default',
      range: ['Bajo', 'Medio', 'Alto']
    };
  };

  // Filtrar los nodos pertenecientes a la categoría activa
  const nodosFiltrados = nodos.filter(
    nodo => nodo.categoria && nodo.categoria.toLowerCase() === (categoriaSeleccionada || '').toLowerCase()
  );

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

  // Auto-seleccionar primer nodo (#1) SOLO cuando se abre el mapa y no hay nodo seleccionado previamente
  useEffect(() => {
    if (tabActiva === 'mapa' && modoMapa === 'categoria' && nodosFiltrados.length > 0) {
      if (!nodoSeleccionado || !nodosFiltrados.some(n => n.id === nodoSeleccionado.id)) {
        setNodoSeleccionado(nodosFiltrados[0]);
      }
    }
  }, [tabActiva, modoMapa, categoriaSeleccionada, nodosFiltrados]);

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
      const map = window.L.map('leaflet-public-map-preview').setView([lat, lng], 17);
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
        });
      });

      // Botón de centrado en el mapa (🏠 Home Icon idéntico a RegistrarNodo)
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

  return (
    <div className="map-public-container">

      {/* ── SECCIÓN: TÍTULO Y PRESENTACIÓN PÚBLICA (Premium sin emojis ni bordes duros) ── */}
      {!categoriaSeleccionada && (
        <div className="pub-news-header-row" style={{ marginBottom: '3rem' }}>
          <div className="pub-news-header" style={{ margin: 0, textAlign: 'left', display: 'inline-block', width: 'fit-content' }}>
            <h1 className="pub-news-main-title">
              <EditableText textKey="map_main_title" defaultText="Monitoreo por Categorías" />
            </h1>
            <div className="pub-news-title-underline" />
          </div>
          <p className="map-public-subtitle" style={{ marginTop: '0.85rem' }}>
            <span className="live-indicator"></span>
            <EditableText textKey="map_subtitle" defaultText="Visualización en tiempo real y exploración analítica de variables de hardware en los campus ULEAM." isTextArea={true} />
          </p>
        </div>
      )}

      {/* ── BREADCRUMBS MÓVIL/DESKTOP (Ruta solicitada: Categorías / Categoria / Nodo) ── */}
      {categoriaSeleccionada && tabActiva !== 'mapa' && (
        <div className="breadcrumb-nav">
          <span onClick={handleReset} className="breadcrumb-link">Categorías</span>
          <span className="breadcrumb-separator">/</span>
          <span onClick={() => handleNodeChange(null)} className="breadcrumb-link">{categoriaSeleccionada}</span>
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
          <h3 className="section-heading">Elige una categoría de investigación</h3>
          <div className="categories-grid">
            {categorias.length === 0 ? (
              <div className="empty-state-card">
                <span>No hay categorías registradas en el sistema.</span>
              </div>
            ) : (
              categorias.map(cat => (
                <div
                  key={cat.id}
                  className="category-card"
                  onClick={() => handleCategoryClick(cat.nombre)}
                >
                  {/* Icono vectorial SVG en lugar de emojis */}
                  <div className="category-icon-wrapper">
                    {getCategorySVGIcon(cat.nombre)}
                  </div>
                  <h4 className="category-card-title">{cat.nombre}</h4>
                  <p className="category-card-desc">
                    {cat.descripcion || 'Explorar los nodos inteligentes y la telemetría asociada a este grupo.'}
                  </p>
                  <span className="category-action-link">
                    Ver Nodos de Red
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ marginLeft: '4px' }}>
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              ))
            )}
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
                Categoría: {categoriaSeleccionada}
              </h2>
            </div>

            <div className="dashboard-tabs-pills">
              <button
                type="button"
                onClick={handleOpenMapFromHeader}
                className={`dashboard-tab-pill ${tabActiva === 'mapa' ? 'active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                <span>Mapa</span>
              </button>
              <Link
                to={nodoSeleccionado ? `/analisis-historico?nodo=${nodoSeleccionado.id}&categoria=${encodeURIComponent(categoriaSeleccionada)}` : `/analisis-historico?categoria=${encodeURIComponent(categoriaSeleccionada)}`}
                className="dashboard-tab-pill-link"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
                  <path d="M3 3v18h18" />
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                </svg>
                <span>Histórico</span>
              </Link>
            </div>
          </div>

          {/* TAB 1: DATOS TIEMPO REAL */}
          {tabActiva === 'realtime' && (
            <div className="dashboard-content-card">

              <div className="dashboard-panel-inner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <h4 className="dashboard-panel-inner-title" style={{ margin: 0 }}>Datos en Tiempo Real</h4>

                {/* Selector de tipo de gráfico en la cabecera (Línea / Barras) */}
                {nodoSeleccionado && (
                  <div className="hist-chart-type-toggle" style={{ margin: 0 }}>
                    <button
                      type="button"
                      onClick={() => setTipoGrafico('line')}
                      className={`toggle-icon-btn ${tipoGrafico === 'line' ? 'active' : ''}`}
                      title="Gráfico de línea"
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
                      title="Gráfico de barras"
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

                  {nodoSeleccionado && nodoSeleccionado.lecturas && nodoSeleccionado.lecturas.length > 0 && (() => {
                    const lecturas = nodoSeleccionado.lecturas;
                    const totalCount = lecturas.length;
                    const checkedCount = lecturas.filter(l => Boolean(activeVariables && activeVariables[l.data_type])).length;
                    const isSomeChecked = isMultiSelectMode && checkedCount > 0 && checkedCount < totalCount;

                    if (!isMultiSelectMode) {
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMultiSelectMode(true);
                            const newMap = {};
                            lecturas.forEach(l => { newMap[l.data_type] = true; });
                            setActiveVariables(newMap);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '7px 16px',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#475569',
                            fontWeight: 700,
                            fontSize: '0.83rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s ease',
                            userSelect: 'none',
                            whiteSpace: 'nowrap'
                          }}
                          title="Marcar todas las variables para comparación"
                        >
                          <span style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            border: '1.5px solid #94a3b8',
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 900
                          }}></span>
                          <span>Marcar Todas</span>
                        </button>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isSomeChecked && (
                          <MarcarTodasBtnPartial
                            onClick={() => {
                              const newMap = {};
                              lecturas.forEach(l => { newMap[l.data_type] = true; });
                              setActiveVariables(newMap);
                            }}
                          />
                        )}

                        <DesmarcarTodasBtn
                          onClick={() => {
                            setIsMultiSelectMode(false);
                            const firstDataType = lecturas[0].data_type;
                            setActiveVariables({ [firstDataType]: true });
                            setLecturaSeleccionada(lecturas[0]);
                          }}
                        />
                      </div>
                    );
                  })()}
                </div>

                {/* Lista de Botones Horizontales de Variables */}
                {nodoSeleccionado && (
                  <div className="dashboard-variables-scroll-container">
                    <div className="dashboard-variables-list">
                      {nodoSeleccionado.lecturas && nodoSeleccionado.lecturas.map((l, index) => {
                        const isChecked = Boolean(activeVariables && activeVariables[l.data_type]);
                        const theme = getTheme(l.data_type, l.icono, isMultiSelectMode ? index : null);
                        const isRedSingleActive = !isMultiSelectMode && isChecked;

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => toggleVariable(l.data_type)}
                            className={`dashboard-variable-btn public-var-checkbox-chip ${isChecked ? 'active' : 'inactive'}`}
                            style={{
                              borderColor: isRedSingleActive ? '#b91c1c' : (isChecked ? theme.hex : '#cbd5e1'),
                              backgroundColor: isRedSingleActive ? '#b91c1c' : (isChecked ? theme.bg : '#ffffff'),
                              color: isRedSingleActive ? '#ffffff' : (isChecked ? '#0f2c59' : '#0f172a'),
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 16px',
                              borderRadius: '8px',
                              border: `1.5px solid ${isRedSingleActive ? '#b91c1c' : (isChecked ? theme.hex : '#cbd5e1')}`,
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: isRedSingleActive ? '0 3px 10px rgba(185, 28, 28, 0.35)' : 'none'
                            }}
                          >
                            {isMultiSelectMode && (
                              <span
                                className="checkbox-custom-box"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '15px',
                                  height: '15px',
                                  borderRadius: '4px',
                                  background: isChecked ? theme.hex : '#ffffff',
                                  border: `1.5px solid ${isChecked ? theme.hex : '#cbd5e1'}`,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {isChecked && (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" width="10" height="10">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </span>
                            )}
                            <span style={{ display: 'inline-flex', alignItems: 'center', color: isRedSingleActive ? '#ffffff' : theme.hex }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                {theme.icon}
                              </svg>
                            </span>
                            <span>{l.tipo} ({l.unidad})</span>
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
                    Selecciona un dispositivo para iniciar la visualización
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.5' }}>
                    Elige uno de los nodos de hardware de la categoría "{categoriaSeleccionada}" en el selector para cargar la telemetría y gráficos históricos.
                  </p>
                </div>
              ) : (
                <>
                  {/* Grid de Tarjetas de Lecturas en Tiempo Real para Variables Activas */}
                  {nodoSeleccionado && nodoSeleccionado.lecturas && (() => {
                    const activeLecturasList = nodoSeleccionado.lecturas.filter(l => Boolean(activeVariables && activeVariables[l.data_type]));
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
                          const rawFecha = valoresUltimos[l.data_type]?.fecha;
                          const timestamp = (() => {
                            if (!rawFecha) return `${new Date().toLocaleDateString('es-ES')}, ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`;
                            if (typeof rawFecha === 'string' && (rawFecha.includes('/') || rawFecha.includes('a. m.') || rawFecha.includes('p. m.') || rawFecha.includes('AM') || rawFecha.includes('PM'))) {
                              return rawFecha;
                            }
                            try {
                              const parsed = new Date(rawFecha);
                              if (!isNaN(parsed.getTime())) {
                                return parsed.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium', hour12: true });
                              }
                            } catch (e) { }
                            return rawFecha;
                          })();

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
                                  right: '-8px',
                                  bottom: '-10px',
                                  opacity: 0.12,
                                  color: theme.hex,
                                  pointerEvents: 'none',
                                  transform: 'scale(2.6)',
                                  transformOrigin: 'bottom right'
                                }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="40" height="40">
                                  {theme.icon}
                                </svg>
                              </div>

                              {/* Cabecera con ícono temático y nombre de variable */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSingleCard ? 'center' : 'space-between', marginBottom: '6px', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '8px',
                                      background: `${theme.hex}18`,
                                      color: theme.hex
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                      {theme.icon}
                                    </svg>
                                  </span>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#475569' }}>
                                    {l.tipo}
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
                                    {outWarning.type === 'min' ? 'Bajo mín.' : 'Sobrepasó máx.'}
                                  </span>
                                )}
                              </div>

                              {/* Valor Grande en Real-Time */}
                              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f2c59', lineHeight: 1.15, margin: '4px 0 8px 0' }}>
                                {liveVal} <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f2c59' }}>{l.unidad}</span>
                              </div>

                              {/* Timestamp Exacto con Hora, Minuto y Segundo */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSingleCard ? 'center' : 'flex-start', gap: '5px', fontSize: '0.74rem', color: '#1e293b', fontWeight: 700 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>{timestamp}</span>
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
                      history={history}
                      nodoSeleccionado={nodoSeleccionado}
                      activeVariables={activeVariables}
                      liveTrigger={liveTrigger}
                      tipoGrafico={tipoGrafico}
                      onDescargarClick={handleOpenDescargaModal}
                      onAmpliarClick={() => setShowModalAmpliado(true)}
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

              {/* BARRA SUPERIOR FLOTANTE: CATEGORÍA Y UBICACIÓN (SOLO EN MODO CATEGORÍA) */}
              {modoMapa === 'categoria' && (
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
                      setTabActiva('realtime');
                      setNodoSeleccionado(null);
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
                    title="Volver a la vista de categoría"
                  >
                    ‹
                  </button>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff' }}>
                    Categoría: <span style={{ color: '#38bdf8' }}>{categoriaSeleccionada}</span>
                  </span>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    📍 {mapUbicacionNombre}
                  </span>
                </div>
              )}

              {/* Tarjeta flotante de información si hay un nodo seleccionado */}
              {nodoSeleccionado && (
                <div className="node-fullscreen-card">
                  <div className="node-fullscreen-header">
                    <div className="node-fullscreen-header-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="node-fullscreen-info-label">INFORMACIÓN</span>
                      {modoMapa === 'nodo' && (
                        <button
                          type="button"
                          className="node-fullscreen-close-btn"
                          onClick={() => setTabActiva('realtime')}
                          title="Cerrar vista de mapa"
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
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 800
                          }}
                        >
                          ✕
                        </button>
                      )}
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
                      Lecturas del Dispositivo (Haz clic para ver índice)
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

                        if (!isNaN(numVal)) {
                          if (minExp !== null && !isNaN(minExp) && numVal < minExp) {
                            outWarningMsg = `El valor registrado (${numVal} ${l.unidad || ''}) está por debajo del mínimo esperado (${minExp} ${l.unidad || ''})`;
                            outWarningColor = '#3b82f6';
                          } else if (maxExp !== null && !isNaN(maxExp) && numVal > maxExp) {
                            outWarningMsg = `El valor registrado (${numVal} ${l.unidad || ''}) sobrepasa el máximo esperado (${maxExp} ${l.unidad || ''})`;
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
                              <span className="node-fullscreen-reading-name">{l.tipo}</span>
                            </div>
                            <span className="node-fullscreen-reading-value font-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {valStr} <span className="node-fullscreen-reading-unit">{l.unidad}</span>
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
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={() => setShowModalAmpliado(false)}
        >
          <div
            style={{
              position: 'relative',
              margin: '16px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  📊 Gráfico Ampliado — {nodoSeleccionado.nombre}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  Ubicación: {mapUbicacionNombre}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Toggle línea / barras */}
                <div className="hist-chart-type-toggle" style={{ margin: 0 }}>
                  <button
                    type="button"
                    onClick={() => setTipoGrafico('line')}
                    className={`toggle-icon-btn ${tipoGrafico === 'line' ? 'active' : ''}`}
                  >
                    Línea
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoGrafico('bar')}
                    className={`toggle-icon-btn ${tipoGrafico === 'bar' ? 'active' : ''}`}
                  >
                    Barras
                  </button>
                </div>

                {/* Botón cerrar */}
                <button
                  onClick={() => setShowModalAmpliado(false)}
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    padding: '0.35rem 0.8rem',
                    cursor: 'pointer',
                    color: '#b91c1c',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Cerrar
                </button>
              </div>
            </div>

            {/* Chart canvas — fills remaining height */}
            <div style={{ flex: 1, overflow: 'hidden', padding: '0.5rem 0' }}>
              <PublicRechartsChart
                history={history}
                nodoSeleccionado={nodoSeleccionado}
                activeVariables={activeVariables}
                liveTrigger={liveTrigger}
                tipoGrafico={tipoGrafico}
                isAmpliado={true}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}