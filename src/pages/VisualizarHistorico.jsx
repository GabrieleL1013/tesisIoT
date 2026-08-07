import { API_BASE_URL, fetchDeduplicated } from '../config/api';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/VisualizarHistorico.css';
import EditableText from '../components/EditableText';
import ModalExportarCSV from '../components/ModalExportarCSV';
import { useLanguage } from '../context/LanguageContext';
import { usePageTitle } from '../hooks/usePageTitle';

// Mapeador de Íconos y Temas
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

// Botón Marcar Todas parcial con estado neutro inicial y hover verde
const MarcarTodasBtnPartial = ({ onClick }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
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
      title={isEn ? "Select all variables" : "Marcar todas las variables"}
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
      <span>{isEn ? 'Check All' : 'Marcar Todas'}</span>
    </button>
  );
};

// Botón Desmarcar Todas con hover de borde rojo y X resaltada
const DesmarcarTodasBtn = ({ onClick }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
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
      title={isEn ? "Deselect all variables and return to single view" : "Desmarcar todas las variables y volver a vista individual"}
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
      <span>{isEn ? 'Deselect All' : 'Desmarcar Todas'}</span>
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

// Tick personalizado inclinado en diagonal (-35deg) para fechas limpias en el eje X
const CustomXAxisTick = ({ x, y, payload }) => {
  if (!payload || !payload.value) return null;
  const rawStr = String(payload.value).trim();
  const parts = rawStr.split(' ');
  let dateText = parts[0] || rawStr;
  let timeText = parts.length > 1 ? parts.slice(1).join(' ') : '';

  return (
    <g transform={`translate(${x},${y}) rotate(-35)`}>
      <text textAnchor="end" fill="#0f172a" fontSize="9.5" fontWeight="800">
        <tspan fill="#0f2c59">{dateText}</tspan>
        {timeText && <tspan fill="#64748b" fontSize="8" dx="4">{timeText}</tspan>}
      </text>
    </g>
  );
};

// Opciones de agrupación de tiempo
const agrupacionOptions = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '120', label: '2 horas' },
  { value: '180', label: '3 horas' },
  { value: '240', label: '4 horas' },
  { value: '360', label: '6 horas' },
  { value: '480', label: '8 horas' },
  { value: '720', label: '12 horas' },
  { value: '1440', label: '1 día' }
];

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

// Componente Custom Select genérico para Opciones en Vista Pública (Período, Agrupación)
const PublicCustomSelectOption = ({ options, value, onChange, label, style = {} }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value) || options[0];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', ...style }} ref={ref}>
      {label && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{label}</span>}
      <button
        type="button"
        className={`public-custom-select-trigger ${open ? 'active' : ''}`}
        style={{ height: '38px', padding: '0 12px', minWidth: '130px', fontSize: '0.85rem' }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedOpt?.label}</span>
        <svg className={`public-select-chevron ${open ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="public-custom-select-dropdown" style={{ minWidth: '150px' }}>
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                className={`public-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span>{opt.label}</span>
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

export default function VisualizarHistorico() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const mapSlug = isEn ? 'categories' : 'categorias';
  const [searchParams] = useSearchParams();
  const [nodos, setNodos] = useState([]);

  // Filtros de Consulta
  const [nodoSeleccionadoId, setNodoSeleccionadoId] = useState('');
  const [periodo, setPeriodo] = useState('30d'); // '24h', '7d', '30d'
  const [intervalo, setIntervalo] = useState('60'); // minutos
  const [tipoGrafico, setTipoGrafico] = useState('line'); // 'line' o 'bar'
  const [paginaGrafico, setPaginaGrafico] = useState(1); // 1: Últimos 15 días, 2: Días 16 a 30

  // Checkboxes de Variables Activas (todas true por defecto)
  const [activeVariables, setActiveVariables] = useState({});

  // Datos estructurados del backend
  const [seriesData, setSeriesData] = useState({});
  const [statsData, setStatsData] = useState({});
  const [chartTimeline, setChartTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado de navegación individual vs multiselección por unidad
  const [isByUnitMode, setIsByUnitMode] = useState(false);
  const [hoveredVar, setHoveredVar] = useState(null);

  // Estado de Modal de Descarga
  const [showModalDescarga, setShowModalDescarga] = useState(false);

  const nodeQueryParam = searchParams.get('nodo');
  const catQueryParam = searchParams.get('categoria');

  // Cargar nodos al montar y seleccionar el nodo inicial
  useEffect(() => {
    setLoading(true);
    let url = `${API_BASE_URL}/nodos`;
    if (catQueryParam) {
      url += `?categoria=${encodeURIComponent(catQueryParam)}`;
    } else if (nodeQueryParam) {
      url += `?id=${encodeURIComponent(nodeQueryParam)}`;
    }

    fetchDeduplicated(url)
      .then(res => res.json())
      .then(data => {
        const nodeList = Array.isArray(data) ? data : [];
        setNodos(nodeList);
        if (nodeList.length > 0) {
          const filtered = catQueryParam
            ? nodeList.filter(n => n.categoria && n.categoria.toLowerCase() === catQueryParam.toLowerCase())
            : nodeList;

          let selectedId = '';

          if (nodeQueryParam) {
            const found = nodeList.find(n => n.id.toString() === nodeQueryParam.toString());
            if (found) selectedId = found.id.toString();
          }

          if (selectedId) {
            setNodoSeleccionadoId(selectedId);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Error fetching nodes in historical view:", err);
        setNodos([]);
        setLoading(false);
      });
  }, [nodeQueryParam, catQueryParam]);

  // Sincronizar parámetro de categoría en URL al cambiar de idioma
  useEffect(() => {
    if (catQueryParam && nodos.length > 0) {
      const foundNode = nodos.find(n =>
        (n.categoria && n.categoria.toLowerCase().trim() === catQueryParam.toLowerCase().trim()) ||
        (n.categoria_es && n.categoria_es.toLowerCase().trim() === catQueryParam.toLowerCase().trim()) ||
        (n.categoria_en && n.categoria_en.toLowerCase().trim() === catQueryParam.toLowerCase().trim())
      );
      if (foundNode) {
        const canonicalCat = isEn
          ? (foundNode.categoria_en || foundNode.categoria_es || foundNode.categoria)
          : (foundNode.categoria_es || foundNode.categoria || foundNode.categoria_en);

        if (canonicalCat && canonicalCat !== catQueryParam) {
          setSearchParams(prev => {
            const p = new URLSearchParams(prev);
            p.set('categoria', canonicalCat);
            return p;
          }, { replace: true });
        }
      }
    }
  }, [language, isEn, nodos, catQueryParam]);

  // Limpiar y resetear el scroll al inicio (0,0) al cambiar de nodo o parámetros en la vista histórica
  useEffect(() => {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [nodoSeleccionadoId, catQueryParam]);

  const nodoActual = nodos.find(n => n.id.toString() === nodoSeleccionadoId.toString());

  // Título dinámico de la pestaña del navegador
  const histPageTitle = nodoActual
    ? `${nodoActual.nombre}${catQueryParam ? ` · ${catQueryParam}` : ''}`
    : catQueryParam
      ? catQueryParam
      : (isEn ? 'Historical Analysis' : 'Análisis Histórico');
  usePageTitle(histPageTitle);

  // Resetear modo de selección al cambiar de nodo
  useEffect(() => {
    setIsByUnitMode(false);
    if (nodoActual && nodoActual.lecturas && nodoActual.lecturas.length > 0) {
      const firstDataType = nodoActual.lecturas[0].data_type;
      setActiveVariables({ [firstDataType]: true });
    } else {
      setActiveVariables({});
    }
  }, [nodoSeleccionadoId, nodos]);

  // Cargar lecturas desde el controlador backend (Promedio diario por día para el gráfico)
  const fetchHistoricalData = useCallback(() => {
    if (!nodoSeleccionadoId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchDeduplicated(`${API_BASE_URL}/public/lecturas/historico?node_id=${nodoSeleccionadoId}&periodo=${periodo}&intervalo=1440`)
      .then(res => res.json())
      .then(data => {
        setSeriesData(data.series || {});
        setStatsData(data.stats || {});

        const mergedMap = new Map();
        const lecturasList = (nodoActual?.lecturas || []);

        lecturasList.forEach(l => {
          const points = data.series?.[l.data_type] || [];
          points.forEach(p => {
            if (!mergedMap.has(p.label)) {
              mergedMap.set(p.label, { time: p.label });
            }
            mergedMap.get(p.label)[l.data_type] = p.valor !== null && p.valor !== undefined ? p.valor : 0;
          });
        });

        let timeline = Array.from(mergedMap.values());
        setChartTimeline(timeline);
        setPaginaGrafico(1); // Resetear a página 1 (días recientes)
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching public historical readings:", err);
        setLoading(false);
      });
  }, [nodoSeleccionadoId, periodo, nodoActual]);

  // División de los 30 días en 2 grupos de 15 días cada uno
  const displayTimeline = useMemo(() => {
    if (!chartTimeline || chartTimeline.length === 0) return [];
    if (chartTimeline.length <= 15) return chartTimeline;
    return paginaGrafico === 1
      ? chartTimeline.slice(15, 30) // Página 1: 15 días más recientes (hasta hoy)
      : chartTimeline.slice(0, 15);  // Página 2: 15 días anteriores (días 16 a 30)
  }, [chartTimeline, paginaGrafico]);

  const lecturas = nodoActual?.lecturas || [];
  const activeLecturas = lecturas.filter(l => Boolean(activeVariables && activeVariables[l.data_type]));
  const isSingleCard = activeLecturas.length === 1;

  // Escala y ticks matemáticamente uniformes para el Eje Y (Saltos idénticos de inicio a fin)
  const yAxisScale = useMemo(() => {
    if (!chartTimeline || chartTimeline.length === 0 || !activeLecturas || activeLecturas.length === 0) {
      return { domain: [0, 10], ticks: [0, 2, 4, 6, 8, 10] };
    }
    let maxVal = 0;
    chartTimeline.forEach(item => {
      activeLecturas.forEach(l => {
        const v = parseFloat(item[l.data_type]);
        if (!isNaN(v) && v > maxVal) {
          maxVal = v;
        }
      });
    });

    if (maxVal <= 0) {
      return { domain: [0, 10], ticks: [0, 2, 4, 6, 8, 10] };
    }

    const targetMax = maxVal * 1.12;
    const roughStep = targetMax / 4;
    const exponent = Math.floor(Math.log10(roughStep));
    const fraction = roughStep / Math.pow(10, exponent);

    let niceFraction = 1;
    if (fraction > 1 && fraction <= 1.5) niceFraction = 1.5;
    else if (fraction > 1.5 && fraction <= 2) niceFraction = 2;
    else if (fraction > 2 && fraction <= 2.5) niceFraction = 2.5;
    else if (fraction > 2.5 && fraction <= 3) niceFraction = 3;
    else if (fraction > 3 && fraction <= 4) niceFraction = 4;
    else if (fraction > 4 && fraction <= 5) niceFraction = 5;
    else if (fraction > 5 && fraction <= 6) niceFraction = 6;
    else if (fraction > 6 && fraction <= 8) niceFraction = 8;
    else niceFraction = 10;

    const step = niceFraction * Math.pow(10, exponent);
    const numSteps = Math.max(3, Math.ceil(targetMax / step));
    const niceMax = step * numSteps;

    const ticks = [];
    for (let i = 0; i <= numSteps; i++) {
      const val = Math.round((i * step) * 100) / 100;
      ticks.push(val);
    }

    return { domain: [0, niceMax], ticks };
  }, [chartTimeline, activeLecturas]);

  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  const activeSelectedUnit = useMemo(() => {
    if (!nodoActual?.lecturas) return null;
    const checkedKey = Object.keys(activeVariables).find(k => activeVariables[k]);
    if (!checkedKey) return null;
    const found = nodoActual.lecturas.find(l => l.data_type === checkedKey);
    return found ? found.unidad : null;
  }, [nodoActual, activeVariables]);

  const toggleVariable = (dataType) => {
    if (!nodoActual?.lecturas) return;
    const targetLectura = nodoActual.lecturas.find(l => l.data_type === dataType);
    if (!targetLectura) return;

    if (!isByUnitMode) {
      // Modo Navegación Individual: solo la variable clickeada está activa
      setActiveVariables({ [dataType]: true });
    } else {
      // Modo Multiselección por Unidad
      setActiveVariables(prev => {
        const isCurrentlyChecked = Boolean(prev[dataType]);
        if (!isCurrentlyChecked && activeSelectedUnit && targetLectura.unidad !== activeSelectedUnit) {
          return prev;
        }
        const next = { ...prev, [dataType]: !isCurrentlyChecked };
        const hasAnyActive = nodoActual.lecturas.some(l => Boolean(next[l.data_type]));
        if (!hasAnyActive) {
          setIsByUnitMode(false);
          const firstDataType = nodoActual.lecturas[0].data_type;
          return { [firstDataType]: true };
        }
        return next;
      });
    }
  };

  const handleNodoTabChange = (id) => {
    setNodoSeleccionadoId(id);
  };

  const handleOpenDescargaModal = () => {
    if (!nodoActual) return;
    setShowModalDescarga(true);
  };

  const nodosFiltrados = catQueryParam
    ? nodos.filter(n =>
        (n.categoria && n.categoria.toLowerCase().trim() === catQueryParam.toLowerCase().trim()) ||
        (n.categoria_es && n.categoria_es.toLowerCase().trim() === catQueryParam.toLowerCase().trim()) ||
        (n.categoria_en && n.categoria_en.toLowerCase().trim() === catQueryParam.toLowerCase().trim())
      )
    : nodos;

  const displayCategoryName = React.useMemo(() => {
    if (!catQueryParam) return '';
    const foundNode = nodos.find(n =>
      (n.categoria && n.categoria.toLowerCase().trim() === catQueryParam.toLowerCase().trim()) ||
      (n.categoria_es && n.categoria_es.toLowerCase().trim() === catQueryParam.toLowerCase().trim()) ||
      (n.categoria_en && n.categoria_en.toLowerCase().trim() === catQueryParam.toLowerCase().trim())
    );
    if (!foundNode) return catQueryParam;
    if (isEn) {
      return foundNode.categoria_en || foundNode.categoria || catQueryParam;
    }
    return foundNode.categoria_es || foundNode.categoria || catQueryParam;
  }, [nodos, catQueryParam, isEn]);

  // Asignar Ejes Y por orden de magnitud
  const axisMapping = React.useMemo(() => {
    const map = {};
    if (!chartTimeline || chartTimeline.length === 0 || !activeLecturas || activeLecturas.length === 0) return map;

    const maxValPerVar = {};
    activeLecturas.forEach(l => {
      let max = 0;
      chartTimeline.forEach(row => {
        const val = parseFloat(row[l.data_type]);
        if (!isNaN(val) && Math.abs(val) > max) max = Math.abs(val);
      });
      maxValPerVar[l.data_type] = max;
    });

    const topMax = Math.max(...Object.values(maxValPerVar), 0);
    activeLecturas.forEach(l => {
      const varMax = maxValPerVar[l.data_type] || 0;
      if (topMax > 0 && varMax >= topMax * 0.15) {
        map[l.data_type] = 'left';
      } else {
        map[l.data_type] = 'right';
      }
    });

    const sideCount = { left: 0, right: 0 };
    Object.values(map).forEach(s => sideCount[s]++);
    if (sideCount.left === 0 || sideCount.right === 0) {
      activeLecturas.forEach((l, idx) => {
        map[l.data_type] = idx % 2 === 0 ? 'left' : 'right';
      });
    }

    return map;
  }, [chartTimeline, activeLecturas]);

  const hasLeftVars = Object.values(axisMapping).includes('left');
  const hasRightVars = Object.values(axisMapping).includes('right');
  const showAxisBadges = activeLecturas.length > 1 && hasLeftVars && hasRightVars;

  const firstLeftVar = activeLecturas.find(l => axisMapping[l.data_type] === 'left');
  const firstRightVar = activeLecturas.find(l => axisMapping[l.data_type] === 'right');

  const leftTheme = firstLeftVar ? getTheme(firstLeftVar.data_type, firstLeftVar.icono, lecturas.findIndex(x => x.data_type === firstLeftVar.data_type)) : null;
  const rightTheme = firstRightVar ? getTheme(firstRightVar.data_type, firstRightVar.icono, lecturas.findIndex(x => x.data_type === firstRightVar.data_type)) : null;

  if (loading && (!nodoActual || Object.keys(seriesData).length === 0)) {
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
          @keyframes hist-custom-spin {
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
          animation: 'hist-custom-spin 0.8s linear infinite',
          marginBottom: '1.25rem'
        }}></div>
        <p style={{
          color: '#334155',
          fontWeight: 700,
          fontFamily: 'sans-serif',
          letterSpacing: '0.08em',
          fontSize: '1.1rem'
        }}>
          {isEn ? 'LOADING...' : 'CARGANDO...'}
        </p>
      </div>
    );
  }

  return (
    <div className="hist-container">

      {/* ── BREADCRUMBS EN HISTÓRICO ── */}
      {catQueryParam && (
        <div className="breadcrumb-nav" style={{ marginBottom: '1.25rem' }}>
          <Link to={`/${language}/${mapSlug}`} className="breadcrumb-link">
            {isEn ? "Categories" : "Categorías"}
          </Link>
          <span className="breadcrumb-separator">/</span>
          <Link to={`/${language}/${mapSlug}?categoria=${encodeURIComponent(catQueryParam)}`} className="breadcrumb-link">
            {displayCategoryName}
          </Link>
          {nodoActual && (
            <>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{nodoActual.nombre}</span>
            </>
          )}
        </div>
      )}

      {/* ── SELECTOR HORIZONTAL DE NODOS ── */}
      <div className="hist-nodes-tabs-row">
        <div className="hist-nodes-list">
          {nodosFiltrados.map(n => {
            const isActive = n.id.toString() === nodoSeleccionadoId;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleNodoTabChange(n.id)}
                className={`hist-node-tab-btn ${isActive ? 'active' : ''}`}
              >
                {n.nombre}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ENCABEZADO Y BARRA DE FILTROS (Período y Agrupación) ── */}
      <div className="hist-chart-header-row">
        <div>
          <h2 className="hist-chart-title">
            {isEn ? 'Historical Telemetry Analysis' : 'Análisis Histórico de Telemetría'}
          </h2>
          <span className="hist-chart-subtitle">
            {isEn ? 'Device:' : 'Dispositivo:'} <strong>{nodoActual?.nombre || (isEn ? 'None' : 'Ninguno')}</strong> | {isEn ? 'Location:' : 'Ubicación:'} {nodoActual?.ubicacion_nombre || 'Campus Uleam Manta'}
          </span>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="hist-chart-filters-toolbar">
          {/* Alternador Línea / Barras */}
          <div className="hist-chart-type-toggle">
            <button
              type="button"
              onClick={() => setTipoGrafico('line')}
              className={`toggle-icon-btn ${tipoGrafico === 'line' ? 'active' : ''}`}
              title={isEn ? "Line chart" : "Gráfico de línea"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <path d="M3 3v18h18" />
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setTipoGrafico('bar')}
              className={`toggle-icon-btn ${tipoGrafico === 'bar' ? 'active' : ''}`}
              title={isEn ? "Bar chart" : "Gráfico de paso/barras"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <rect x="3" y="3" width="4" height="18" />
                <rect x="10" y="8" width="4" height="13" />
                <rect x="17" y="13" width="4" height="8" />
              </svg>
            </button>
          </div>

          {/* Selector de Período de Tiempo (24h, 7d, 30d) */}
          <PublicCustomSelectOption
            label={isEn ? "Period:" : "Período:"}
            value={periodo}
            onChange={setPeriodo}
            options={[
              { value: '24h', label: isEn ? 'Last 24 hours' : 'Últimas 24 horas' },
              { value: '7d', label: isEn ? 'Last 7 days' : 'Últimos 7 días' },
              { value: '30d', label: isEn ? 'Last 30 days' : 'Últimos 30 días' }
            ]}
          />

          {/* Botón Refrescar Datos */}
          <button
            type="button"
            onClick={() => fetchHistoricalData()}
            className="hist-btn-download-trigger"
            style={{ cursor: loading ? 'wait' : 'pointer' }}
            title={isEn ? "Refresh data" : "Refrescar datos"}
          >
            <svg style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>

          {/* Botón Exportar CSV (Abre Modal de Selección) */}
          <button
            type="button"
            onClick={() => setShowModalDescarga(true)}
            className="hist-btn-download-trigger"
            title={isEn ? "Export CSV" : "Exportar CSV"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── BARRA SUPERIOR DE CHIPS / ACCIONES DE VARIABLES EN EL HISTÓRICO ── */}
      {nodoActual && lecturas.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          boxShadow: '0 4px 12px rgba(15, 44, 89, 0.03)'
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {lecturas.map((l, index) => {
              const isChecked = Boolean(activeVariables && activeVariables[l.data_type]);
              const isDisabled = isByUnitMode && activeSelectedUnit && l.unidad !== activeSelectedUnit;
              const theme = getTheme(l.data_type, l.icono, isByUnitMode ? index : null);
              const isRedSingleActive = !isByUnitMode && isChecked;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => !isDisabled && toggleVariable(l.data_type)}
                  className={`dashboard-variable-btn public-var-checkbox-chip ${isChecked ? 'active' : 'inactive'}`}
                  style={{
                    borderColor: isDisabled ? '#e2e8f0' : (isRedSingleActive ? '#b91c1c' : (isChecked ? theme.hex : '#cbd5e1')),
                    backgroundColor: isDisabled ? '#f8fafc' : (isRedSingleActive ? '#b91c1c' : (isChecked ? theme.bg : '#ffffff')),
                    color: isDisabled ? '#94a3b8' : (isRedSingleActive ? '#ffffff' : (isChecked ? '#0f2c59' : '#0f172a')),
                    opacity: isDisabled ? 0.45 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    border: `1.5px solid ${isDisabled ? '#e2e8f0' : (isRedSingleActive ? '#b91c1c' : (isChecked ? theme.hex : '#cbd5e1'))}`,
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    transition: 'all 0.2s ease',
                    boxShadow: isRedSingleActive ? '0 3px 10px rgba(185, 28, 28, 0.35)' : 'none'
                  }}
                  title={isDisabled ? (isEn ? `Different unit (${l.unidad}). Uncheck 'Group by unit' to select.` : `Unidad diferente (${l.unidad}). Desmarca 'Marcar por unidad' para seleccionar.`) : ''}
                >
                  {isByUnitMode && (
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
                  <span>{isEn ? (l.tipo_en || l.nombre_en || l.tipo) : (l.tipo_es || l.tipo)} ({l.unidad})</span>
                </button>
              );
            })}
          </div>

          {/* Checkbox Marcar por unidad */}
          {lecturas.length > 1 && (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700, color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={isByUnitMode}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsByUnitMode(checked);
                  if (!checked && nodoActual?.lecturas?.length > 0) {
                    const firstKey = nodoActual.lecturas[0].data_type;
                    setActiveVariables({ [firstKey]: true });
                  }
                }}
                style={{ accentColor: '#b91c1c', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>{isEn ? 'Group by unit' : 'Marcar por unidad'}</span>
            </label>
          )}
        </div>
      )}

      {/* ── SECCIÓN DE TARJETAS KPI DE RESUMEN (Promedio en grande, Min y Max) ── */}
      {nodoActual && activeLecturas.length > 0 && (
        <div className="public-kpi-grid" style={{
          display: isSingleCard ? 'flex' : 'grid',
          justifyContent: isSingleCard ? 'center' : 'stretch',
          gridTemplateColumns: isSingleCard ? 'none' : 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          {activeLecturas.map(l => {
            const varIndex = lecturas.findIndex(x => x.data_type === l.data_type);
            const theme = getTheme(l.data_type, l.icono, isByUnitMode ? varIndex : null);
            const rawStat = statsData[l.data_type];
            const hasVal = rawStat && rawStat.promedio !== null && rawStat.promedio !== undefined && rawStat.total > 0;
            const stat = {
              promedio: hasVal ? rawStat.promedio : '--',
              min: (rawStat && rawStat.min !== null && rawStat.min !== undefined && rawStat.total > 0) ? rawStat.min : '--',
              min_fecha: (rawStat && rawStat.total > 0) ? rawStat.min_fecha : '--',
              max: (rawStat && rawStat.max !== null && rawStat.max !== undefined && rawStat.total > 0) ? rawStat.max : '--',
              max_fecha: (rawStat && rawStat.total > 0) ? rawStat.max_fecha : '--'
            };

            return (
              <div
                key={l.data_type}
                className="public-kpi-card"
                style={{
                  position: 'relative',
                  background: `linear-gradient(135deg, ${theme.bg || '#ffffff'}, #ffffff)`,
                  border: `1.5px solid ${theme.hex}33`,
                  borderRadius: '16px',
                  padding: '1.25rem 1.35rem',
                  overflow: 'hidden',
                  boxShadow: '0 4px 18px rgba(15, 44, 89, 0.05)',
                  transition: 'all 0.25s ease',
                  maxWidth: isSingleCard ? '460px' : 'none',
                  width: isSingleCard ? '100%' : 'auto',
                  textAlign: isSingleCard ? 'center' : 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '280px'
                }}
              >
                {/* Ícono de Fondo en Marca de Agua */}
                <div
                  style={{
                    position: 'absolute',
                    right: '-10px',
                    bottom: '-12px',
                    opacity: 0.12,
                    color: theme.hex,
                    pointerEvents: 'none',
                    transform: 'scale(3.2)',
                    transformOrigin: 'bottom right'
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="40" height="40">
                    {theme.icon}
                  </svg>
                </div>

                {/* Cabecera de la Tarjeta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSingleCard ? 'center' : 'space-between', marginBottom: '8px', gap: '8px', minHeight: '44px' }}>
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
                        color: theme.hex,
                        flexShrink: 0
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                        {theme.icon}
                      </svg>
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#475569', lineHeight: 1.25 }}>
                      {isEn ? (l.tipo_en || l.nombre_en || l.tipo) : (l.tipo_es || l.tipo)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    lineHeight: 1.15,
                    padding: '4px 7px',
                    borderRadius: '8px',
                    background: `${theme.hex}18`,
                    color: theme.hex,
                    textAlign: 'center',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em'
                  }}>
                    <span>{isEn ? 'OVERALL' : 'PROMEDIO'}</span>
                    <span>{isEn ? 'AVERAGE' : 'GENERAL'}</span>
                  </span>
                </div>

                {/* Promedio en Grande al Centro */}
                <div style={{ textAlign: 'center', padding: '0.4rem 0 0.6rem 0', minHeight: '68px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <div className="notranslate" translate="no" style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0f2c59', lineHeight: 1 }}>
                    <span className="notranslate" translate="no">{stat.promedio}</span> {stat.promedio !== '--' && <span className="notranslate" translate="no" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f2c59' }}>{l.unidad}</span>}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, marginTop: '3px' }}>{isEn ? 'Average value in period' : 'Valor medio en el período'} ({periodo})</span>
                </div>

                {/* Sub-tarjetas de Min y Max alineadas con Fecha y Hora en líneas separadas */}
                {(() => {
                  const splitDate = (raw) => {
                    if (!raw || raw === '--') return { fecha: '--', hora: '' };
                    if (raw.includes(',')) {
                      const parts = raw.split(',');
                      return { fecha: parts[0].trim(), hora: parts.slice(1).join(',').trim() };
                    }
                    const parts = raw.split(' ');
                    if (parts.length > 1) {
                      return { fecha: parts[0].trim(), hora: parts.slice(1).join(' ').trim() };
                    }
                    return { fecha: raw, hora: '' };
                  };

                  const minSplit = splitDate(stat.min_fecha);
                  const maxSplit = splitDate(stat.max_fecha);

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                      {/* Min */}
                      <div style={{ background: '#ffffffcc', padding: '8px 6px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2563eb', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '2px' }}>
                          {isEn ? 'MINIMUM' : 'MÍNIMO'}
                        </div>
                        <div className="notranslate" translate="no" style={{ fontSize: '1rem', fontWeight: 900, color: '#0f2c59', lineHeight: 1.2, margin: '2px 0' }}>
                          <span className="notranslate" translate="no">{stat.min}</span> {stat.min !== '--' && <span className="notranslate" translate="no" style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f2c59' }}>{l.unidad}</span>}
                        </div>
                        <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600, marginTop: '3px', lineHeight: 1.25 }}>
                          <div>{minSplit.fecha}</div>
                          {minSplit.hora && <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 600, marginTop: '1px' }}>{minSplit.hora}</div>}
                        </div>
                      </div>

                      {/* Max */}
                      <div style={{ background: '#ffffffcc', padding: '8px 6px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#dc2626', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '2px' }}>
                          {isEn ? 'MAXIMUM' : 'MÁXIMO'}
                        </div>
                        <div className="notranslate" translate="no" style={{ fontSize: '1rem', fontWeight: 900, color: '#0f2c59', lineHeight: 1.2, margin: '2px 0' }}>
                          <span className="notranslate" translate="no">{stat.max}</span> {stat.max !== '--' && <span className="notranslate" translate="no" style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f2c59' }}>{l.unidad}</span>}
                        </div>
                        <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600, marginTop: '3px', lineHeight: 1.25 }}>
                          <div>{maxSplit.fecha}</div>
                          {maxSplit.hora && <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 600, marginTop: '1px' }}>{maxSplit.hora}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* ── CONTENEDOR DEL GRÁFICO RECHARTS ── */}
      <div className="hist-chart-body-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
        {/* Fila 1: Título a la izquierda, Paginación por Flechas 15 Días + Botones SVG a la derecha */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f2c59' }}>
            {isEn ? 'Grouped Timeline' : 'Línea de Tiempo Agrupada'}
          </h4>

          {/* Grupo de Controles: Flechas de Paginación y Botones SVG */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Control de Paginación en 2 Grupos de 15 Días */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '3px 8px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              {/* Flecha Izquierda: Días Anteriores (Página 2) */}
              <button
                type="button"
                onClick={() => setPaginaGrafico(2)}
                disabled={paginaGrafico === 2}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: `1.5px solid ${paginaGrafico === 2 ? '#e2e8f0' : '#cbd5e1'}`,
                  backgroundColor: paginaGrafico === 2 ? '#f1f5f9' : '#ffffff',
                  color: paginaGrafico === 2 ? '#cbd5e1' : '#0f2c59',
                  cursor: paginaGrafico === 2 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: paginaGrafico === 2 ? 'none' : '0 2px 5px rgba(0,0,0,0.04)'
                }}
                title={isEn ? "Previous 15 Days (Days 16-30)" : "Días Anteriores (Días 16 a 30)"}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              {/* Etiqueta Indicadora de Página */}
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f2c59', padding: '0 4px', whiteSpace: 'nowrap' }}>
                {paginaGrafico === 1
                  ? (isEn ? '1/2: Last 15 Days' : '1/2: Últimos 15 Días')
                  : (isEn ? '2/2: Days 16-30' : '2/2: Días 16 a 30')}
              </span>

              {/* Flecha Derecha: Días Recientes (Página 1) */}
              <button
                type="button"
                onClick={() => setPaginaGrafico(1)}
                disabled={paginaGrafico === 1}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: `1.5px solid ${paginaGrafico === 1 ? '#e2e8f0' : '#cbd5e1'}`,
                  backgroundColor: paginaGrafico === 1 ? '#f1f5f9' : '#ffffff',
                  color: paginaGrafico === 1 ? '#cbd5e1' : '#0f2c59',
                  cursor: paginaGrafico === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: paginaGrafico === 1 ? 'none' : '0 2px 5px rgba(0,0,0,0.04)'
                }}
                title={isEn ? "Recent 15 Days (Today)" : "Días Recientes (Hasta hoy)"}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <div style={{ width: '1px', height: '22px', background: '#cbd5e1' }} />

            {/* SVG Botón: Vista Línea / Área */}
            <button
              type="button"
              onClick={() => setTipoGrafico('line')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: `1.5px solid ${tipoGrafico === 'line' ? '#0284c7' : '#cbd5e1'}`,
                backgroundColor: tipoGrafico === 'line' ? '#e0f2fe' : '#ffffff',
                color: tipoGrafico === 'line' ? '#0284c7' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: tipoGrafico === 'line' ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none'
              }}
              title={isEn ? "Line / Area Chart View" : "Vista Gráfico de Línea / Área"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" width="18" height="18">
                <path d="M3 3v18h18" />
                <path d="M18 9l-5 5-4-4-4 4" />
              </svg>
            </button>

            {/* SVG Botón: Vista Barras */}
            <button
              type="button"
              onClick={() => setTipoGrafico('bar')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: `1.5px solid ${tipoGrafico === 'bar' ? '#0284c7' : '#cbd5e1'}`,
                backgroundColor: tipoGrafico === 'bar' ? '#e0f2fe' : '#ffffff',
                color: tipoGrafico === 'bar' ? '#0284c7' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: tipoGrafico === 'bar' ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none'
              }}
              title={isEn ? "Bar Chart View" : "Vista Gráfico de Barras"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" width="18" height="18">
                <rect x="3" y="12" width="4" height="9" rx="1" />
                <rect x="10" y="7" width="4" height="14" rx="1" />
                <rect x="17" y="3" width="4" height="18" rx="1" />
              </svg>
            </button>

            {/* Separador vertical */}
            <div style={{ width: '1px', height: '22px', background: '#cbd5e1' }} />

            {/* SVG Botón: Refrescar Datos */}
            <button
              type="button"
              onClick={() => fetchHistoricalData()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f2c59',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}
              title={isEn ? "Refresh data" : "Refrescar datos"}
            >
              <svg style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Fila 2: Leyenda Dinámica de Variables en su propia línea abajo */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
          {activeLecturas.map((l, idx) => {
            const theme = getTheme(l.data_type, l.icono, isByUnitMode ? idx : null);
            const isHovered = hoveredVar === l.data_type;
            return (
              <div
                key={l.data_type}
                onMouseEnter={() => setHoveredVar(l.data_type)}
                onMouseLeave={() => setHoveredVar(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: theme.hex,
                  backgroundColor: isHovered ? `${theme.hex}22` : theme.bg,
                  border: `1.5px solid ${isHovered ? theme.hex : theme.hex + '44'}`,
                  padding: '4px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  {theme.icon}
                </svg>
                <span>{isEn ? (l.tipo_en || l.nombre_en || l.tipo) : (l.tipo_es || l.tipo)} ({l.unidad})</span>
              </div>
            );
          })}
        </div>

        {/* Lienzo del Gráfico (Paginado de 15 Días por vista sin scrollbar) */}
        <div className="hist-chart-canvas-wrapper" style={{ width: '100%', height: '340px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
              Cargando lecturas históricas...
            </div>
          ) : activeLecturas.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
              Selecciona al menos una variable para visualizar la gráfica.
            </div>
          ) : displayTimeline.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b', gap: '6px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" width="36" height="36">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>
                No hay lecturas registradas en el período seleccionado
              </span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {tipoGrafico === 'bar' ? (
                <BarChart data={displayTimeline} margin={{ top: 15, right: 40, left: 10, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#cbd5e1" strokeOpacity={0.65} />
                  <XAxis dataKey="time" interval={0} height={56} tick={<CustomXAxisTick />} axisLine={{ stroke: '#334155', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.2 }} />
                  <YAxis orientation="left" domain={yAxisScale.domain} ticks={yAxisScale.ticks} width={45} tick={{ fontSize: 11, fill: '#0f2c59', fontWeight: 800 }} axisLine={{ stroke: '#334155', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.2 }} />
                  <Tooltip content={<CustomPublicChartTooltip activeLecturas={activeLecturas} />} />
                  {activeLecturas.map((l, idx) => {
                    const theme = getTheme(l.data_type, l.icono, isByUnitMode ? idx : null);
                    const isHovered = hoveredVar === l.data_type;
                    const isOtherHovered = hoveredVar && !isHovered;

                    return (
                      <Bar
                        key={l.data_type}
                        dataKey={l.data_type}
                        name={`${isEn ? (l.tipo_en || l.nombre_en || l.tipo) : (l.tipo_es || l.tipo)} (${l.unidad})`}
                        fill={theme.hex}
                        fillOpacity={isOtherHovered ? 0.2 : 1}
                        radius={[4, 4, 0, 0]}
                      />
                    );
                  })}
                </BarChart>
              ) : (
                <AreaChart data={displayTimeline} margin={{ top: 15, right: 40, left: 10, bottom: 45 }}>
                  <defs>
                    {activeLecturas.map((l, idx) => {
                      const theme = getTheme(l.data_type, l.icono, isByUnitMode ? idx : null);
                      return (
                        <linearGradient key={l.data_type} id={`colorHist${l.data_type}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.hex} stopOpacity={0.45} />
                          <stop offset="95%" stopColor={theme.hex} stopOpacity={0.02} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#cbd5e1" strokeOpacity={0.65} />
                  <XAxis dataKey="time" interval={0} height={56} tick={<CustomXAxisTick />} axisLine={{ stroke: '#334155', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.2 }} />
                  <YAxis orientation="left" domain={yAxisScale.domain} ticks={yAxisScale.ticks} width={45} tick={{ fontSize: 11, fill: '#0f2c59', fontWeight: 800 }} axisLine={{ stroke: '#334155', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.2 }} />
                  <Tooltip content={<CustomPublicChartTooltip activeLecturas={activeLecturas} />} />
                  {activeLecturas.map((l, idx) => {
                    const theme = getTheme(l.data_type, l.icono, isByUnitMode ? idx : null);
                    const isHovered = hoveredVar === l.data_type;
                    const isOtherHovered = hoveredVar && !isHovered;

                    return (
                      <Area
                        key={l.data_type}
                        type="monotone"
                        dataKey={l.data_type}
                        connectNulls={true}
                        name={`${isEn ? (l.tipo_en || l.nombre_en || l.tipo) : (l.tipo_es || l.tipo)} (${l.unidad})`}
                        stroke={theme.hex}
                        strokeWidth={isHovered ? 4.5 : 2.5}
                        strokeOpacity={isOtherHovered ? 0.2 : 1}
                        fillOpacity={isOtherHovered ? 0.05 : 1}
                        fill={`url(#colorHist${l.data_type})`}
                        dot={{ r: isHovered ? 5.5 : 4, strokeWidth: 1.5, fill: '#ffffff', stroke: theme.hex }}
                        activeDot={{ r: 7, strokeWidth: 0, fill: theme.hex }}
                      />
                    );
                  })}
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── MODAL POPUP: DESCARGAR CSV ── */}
      <ModalExportarCSV
        show={showModalDescarga}
        onClose={() => setShowModalDescarga(false)}
        nodo={nodoActual}
        defaultPeriodo={periodo}
        defaultIntervalo={intervalo}
        isHistorico={true}
      />

    </div>
  );
}