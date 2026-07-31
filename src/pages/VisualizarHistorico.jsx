import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/VisualizarHistorico.css';
import EditableText from '../components/EditableText';
import ModalExportarCSV from '../components/ModalExportarCSV';

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
  const [searchParams] = useSearchParams();
  const [nodos, setNodos] = useState([]);

  // Filtros de Consulta
  const [nodoSeleccionadoId, setNodoSeleccionadoId] = useState('');
  const [periodo, setPeriodo] = useState('30d'); // '24h', '7d', '30d'
  const [intervalo, setIntervalo] = useState('60'); // minutos
  const [tipoGrafico, setTipoGrafico] = useState('line'); // 'line' o 'bar'

  // Checkboxes de Variables Activas (todas true por defecto)
  const [activeVariables, setActiveVariables] = useState({});

  // Datos estructurados del backend
  const [seriesData, setSeriesData] = useState({});
  const [statsData, setStatsData] = useState({});
  const [chartTimeline, setChartTimeline] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estado de navegación individual vs multiselección
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [hoveredVar, setHoveredVar] = useState(null);

  // Estado de Modal de Descarga
  const [showModalDescarga, setShowModalDescarga] = useState(false);

  const nodeQueryParam = searchParams.get('nodo');
  const catQueryParam = searchParams.get('categoria');

  // Cargar nodos al montar y seleccionar el nodo inicial
  useEffect(() => {
    fetch(`${API_BASE_URL}/nodos`)
      .then(res => res.json())
      .then(data => {
        const nodeList = Array.isArray(data) ? data : [];
        setNodos(nodeList);
        if (nodeList.length > 0) {
          const filtered = catQueryParam
            ? nodeList.filter(n => n.categoria && n.categoria.toLowerCase() === catQueryParam.toLowerCase())
            : nodeList;

          let selectedId = filtered.length > 0 ? filtered[0].id.toString() : '';

          if (nodeQueryParam) {
            const found = nodeList.find(n => n.id.toString() === nodeQueryParam.toString());
            if (found) selectedId = found.id.toString();
          }

          if (selectedId) setNodoSeleccionadoId(selectedId);
        }
      })
      .catch(err => {
        console.error("Error fetching nodes in historical view:", err);
        setNodos([]);
      });
  }, [nodeQueryParam, catQueryParam]);

  // Limpiar y resetear el scroll al inicio (0,0) al cambiar de nodo o parámetros en la vista histórica
  useEffect(() => {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [nodoSeleccionadoId, catQueryParam]);

  const nodoActual = nodos.find(n => n.id.toString() === nodoSeleccionadoId.toString());

  // Resetear modo de selección al cambiar de nodo
  useEffect(() => {
    setIsMultiSelectMode(false);
    if (nodoActual && nodoActual.lecturas && nodoActual.lecturas.length > 0) {
      const firstDataType = nodoActual.lecturas[0].data_type;
      setActiveVariables({ [firstDataType]: true });
    } else {
      setActiveVariables({});
    }
  }, [nodoSeleccionadoId, nodos]);

  // Actualizar variables activas cuando el usuario altera isMultiSelectMode manualmente
  useEffect(() => {
    if (!nodoActual || !nodoActual.lecturas || nodoActual.lecturas.length === 0) return;
    if (isMultiSelectMode) {
      const initialMap = {};
      nodoActual.lecturas.forEach(l => {
        initialMap[l.data_type] = true;
      });
      setActiveVariables(initialMap);
    }
  }, [isMultiSelectMode]);

  // Cargar lecturas desde el controlador backend
  useEffect(() => {
    if (!nodoSeleccionadoId) return;

    setLoading(true);
    fetch(`${API_BASE_URL}/public/lecturas/historico?node_id=${nodoSeleccionadoId}&periodo=${periodo}&intervalo=${intervalo}`)
      .then(res => res.json())
      .then(data => {
        setSeriesData(data.series || {});
        setStatsData(data.stats || {});

        // Fusionar timeline para el gráfico Recharts
        const mergedMap = new Map();
        const activeLecturas = (nodoActual?.lecturas || []);

        activeLecturas.forEach(l => {
          const points = data.series?.[l.data_type] || [];
          points.forEach(p => {
            if (!mergedMap.has(p.label)) {
              mergedMap.set(p.label, { time: p.label });
            }
            mergedMap.get(p.label)[l.data_type] = p.valor;
          });
        });

        let timeline = Array.from(mergedMap.values());
        setChartTimeline(timeline);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching public historical readings:", err);
        setLoading(false);
      });
  }, [nodoSeleccionadoId, periodo, intervalo, nodos]);

  const toggleVariable = (dataType) => {
    if (!isMultiSelectMode) {
      setActiveVariables({ [dataType]: true });
    } else {
      setActiveVariables(prev => {
        const nextState = {
          ...prev,
          [dataType]: !prev[dataType]
        };
        const hasAnyActive = nodoActual?.lecturas?.some(l => Boolean(nextState[l.data_type]));
        if (!hasAnyActive) {
          setIsMultiSelectMode(false);
          const firstDataType = nodoActual.lecturas[0].data_type;
          return { [firstDataType]: true };
        }
        return nextState;
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
    ? nodos.filter(n => n.categoria && n.categoria.toLowerCase() === catQueryParam.toLowerCase())
    : nodos;

  const lecturas = nodoActual?.lecturas || [];
  const activeLecturas = lecturas.filter(l => Boolean(activeVariables && activeVariables[l.data_type]));
  const isSingleCard = activeLecturas.length === 1;

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

  const hoveredAxisSide = hoveredVar ? axisMapping[hoveredVar] : null;

  return (
    <div className="hist-container">

      {/* ── BREADCRUMBS EN HISTÓRICO ── */}
      {catQueryParam && (
        <div className="breadcrumb-nav" style={{ marginBottom: '1.25rem' }}>
          <Link to="/mapa-tiempo-real" className="breadcrumb-link"><EditableText textKey="hist_breadcrumb_root" defaultText="Categorías" /></Link>
          <span className="breadcrumb-separator">/</span>
          <Link to={`/mapa-tiempo-real?categoria=${encodeURIComponent(catQueryParam)}`} className="breadcrumb-link">
            {catQueryParam}
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
            Análisis Histórico de Telemetría
          </h2>
          <span className="hist-chart-subtitle">
            Dispositivo: <strong>{nodoActual?.nombre || 'Ninguno'}</strong> | Ubicación: {nodoActual?.ubicacion_nombre || 'Campus Uleam Manta'}
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
              title="Gráfico de línea"
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
              title="Gráfico de paso/barras"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <rect x="3" y="3" width="4" height="18" />
                <rect x="10" y="8" width="4" height="13" />
                <rect x="17" y="13" width="4" height="8" />
              </svg>
            </button>
          </div>

          {/* Selector de Período Personalizado (24h, 7d, 30d) */}
          <PublicCustomSelectOption
            label="Período:"
            value={periodo}
            onChange={setPeriodo}
            options={[
              { value: '24h', label: 'Últimas 24 horas' },
              { value: '7d', label: 'Últimos 7 días' },
              { value: '30d', label: 'Últimos 30 días' }
            ]}
          />

          {/* Selector de Agrupación de Tiempo Personalizado */}
          <PublicCustomSelectOption
            label="Agrupación:"
            value={intervalo}
            onChange={setIntervalo}
            options={agrupacionOptions}
          />

          {/* Botón Exportar CSV */}
          <button
            type="button"
            onClick={handleOpenDescargaModal}
            className="hist-btn-download-trigger"
            title="Exportar CSV"
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
          </div>

          {/* Botones de Acción (Marcar Todas / Desmarcar Todas) */}
          {(() => {
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
                  }}
                />
              </div>
            );
          })()}
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
            const theme = getTheme(l.data_type, l.icono, isMultiSelectMode ? varIndex : null);
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
                      {l.tipo}
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
                    <span>PROMEDIO</span>
                    <span>GENERAL</span>
                  </span>
                </div>

                {/* Promedio en Grande al Centro */}
                <div style={{ textAlign: 'center', padding: '0.4rem 0 0.6rem 0', minHeight: '68px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0f2c59', lineHeight: 1 }}>
                    {stat.promedio} {stat.promedio !== '--' && <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f2c59' }}>{l.unidad}</span>}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, marginTop: '3px' }}>Valor medio en el período ({periodo})</span>
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
                          MÍNIMO
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f2c59', lineHeight: 1.2, margin: '2px 0' }}>
                          {stat.min} {stat.min !== '--' && <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f2c59' }}>{l.unidad}</span>}
                        </div>
                        <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600, marginTop: '3px', lineHeight: 1.25 }}>
                          <div>{minSplit.fecha}</div>
                          {minSplit.hora && <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 600, marginTop: '1px' }}>{minSplit.hora}</div>}
                        </div>
                      </div>

                      {/* Max */}
                      <div style={{ background: '#ffffffcc', padding: '8px 6px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#dc2626', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '2px' }}>
                          MÁXIMO
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f2c59', lineHeight: 1.2, margin: '2px 0' }}>
                          {stat.max} {stat.max !== '--' && <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f2c59' }}>{l.unidad}</span>}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f2c59' }}>
            Línea de Tiempo Agrupada
          </h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {activeLecturas.map(l => {
              const varIndex = lecturas.findIndex(x => x.data_type === l.data_type);
              const theme = getTheme(l.data_type, l.icono, isMultiSelectMode ? varIndex : null);
              const isHovered = hoveredVar === l.data_type;
              const axisSide = axisMapping[l.data_type];

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
                    fontWeight: isHovered ? 900 : 700,
                    color: theme.hex,
                    backgroundColor: isHovered ? `${theme.hex}18` : 'transparent',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    opacity: hoveredVar ? (isHovered ? 1 : 0.45) : 1,
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                  }}
                  title={`Resaltar ${l.tipo} en la gráfica (${axisSide === 'left' ? 'Eje Izquierdo' : 'Eje Derecho'})`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    {theme.icon}
                  </svg>
                  <span>{l.tipo} ({l.unidad})</span>
                  {showAxisBadges && (
                    <span style={{
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: `${theme.hex}22`,
                      color: theme.hex,
                      marginLeft: '2px'
                    }}>
                      {axisSide === 'left' ? '◄ Eje Izq.' : 'Eje Der. ►'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lienzo del Gráfico */}
        <div style={{ width: '100%', height: '340px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
              Cargando lecturas históricas...
            </div>
          ) : activeLecturas.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
              Selecciona al menos una variable para visualizar la gráfica.
            </div>
          ) : chartTimeline.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b', gap: '6px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" width="36" height="36">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>
                No hay lecturas registradas en el período seleccionado ({periodo === '24h' ? 'Últimas 24 horas' : periodo === '7d' ? 'Últimos 7 días' : 'Últimos 30 días'})
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                El dispositivo no ha enviado datos durante este intervalo de tiempo.
              </span>
            </div>
          ) : (
            (() => {
              const minWidthPx = Math.max((chartTimeline || []).length * 60, 600);
              const needsScroll = (chartTimeline || []).length > 12;

              return (
                <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '6px' }}>
                  <div style={{ width: needsScroll ? `${minWidthPx}px` : '100%', height: '340px', minWidth: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {tipoGrafico === 'bar' ? (
                        <BarChart data={chartTimeline} margin={{ top: 10, right: showAxisBadges ? 25 : 40, left: 10, bottom: 28 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="time" height={52} tick={<CustomXAxisTick />} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />

                          {leftTheme && (
                            <YAxis
                              yAxisId="left"
                              width={55}
                              tick={{
                                fontSize: hoveredAxisSide === 'left' ? 12 : 10,
                                fill: leftTheme.hex,
                                fontWeight: hoveredAxisSide === 'left' ? 900 : 700,
                                opacity: hoveredAxisSide && hoveredAxisSide !== 'left' ? 0.35 : 1
                              }}
                              axisLine={false}
                              tickLine={false}
                            />
                          )}

                          {rightTheme && (
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              width={55}
                              tick={{
                                fontSize: hoveredAxisSide === 'right' ? 12 : 10,
                                fill: rightTheme.hex,
                                fontWeight: hoveredAxisSide === 'right' ? 900 : 700,
                                opacity: hoveredAxisSide && hoveredAxisSide !== 'right' ? 0.35 : 1
                              }}
                              axisLine={false}
                              tickLine={false}
                            />
                          )}

                          <Tooltip content={<CustomPublicChartTooltip showAxisBadges={showAxisBadges} axisMapping={axisMapping} activeLecturas={activeLecturas} />} />

                          {activeLecturas.map((l) => {
                            const varIndex = lecturas.findIndex(x => x.data_type === l.data_type);
                            const theme = getTheme(l.data_type, l.icono, isMultiSelectMode ? varIndex : null);
                            const ySide = axisMapping[l.data_type] || 'left';
                            const isHovered = hoveredVar === l.data_type;

                            return (
                              <Bar
                                key={l.data_type}
                                yAxisId={ySide}
                                dataKey={l.data_type}
                                name={`${l.tipo} (${l.unidad})`}
                                fill={theme.hex}
                                fillOpacity={hoveredVar ? (isHovered ? 0.9 : 0.2) : 0.75}
                                radius={[4, 4, 0, 0]}
                              />
                            );
                          })}
                        </BarChart>
                      ) : (
                        <AreaChart data={chartTimeline} margin={{ top: 10, right: showAxisBadges ? 25 : 40, left: 10, bottom: 28 }}>
                          <defs>
                            {activeLecturas.map((l) => {
                              const varIndex = lecturas.findIndex(x => x.data_type === l.data_type);
                              const theme = getTheme(l.data_type, l.icono, isMultiSelectMode ? varIndex : null);
                              return (
                                <linearGradient key={l.data_type} id={`colorHist${l.data_type}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={theme.hex} stopOpacity={0.45} />
                                  <stop offset="95%" stopColor={theme.hex} stopOpacity={0.02} />
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
                                fontSize: hoveredAxisSide === 'left' ? 12 : 10,
                                fill: leftTheme.hex,
                                fontWeight: hoveredAxisSide === 'left' ? 900 : 700,
                                opacity: hoveredAxisSide && hoveredAxisSide !== 'left' ? 0.35 : 1
                              }}
                              axisLine={false}
                              tickLine={false}
                            />
                          )}

                          {rightTheme && (
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              width={55}
                              tick={{
                                fontSize: hoveredAxisSide === 'right' ? 12 : 10,
                                fill: rightTheme.hex,
                                fontWeight: hoveredAxisSide === 'right' ? 900 : 700,
                                opacity: hoveredAxisSide && hoveredAxisSide !== 'right' ? 0.35 : 1
                              }}
                              axisLine={false}
                              tickLine={false}
                            />
                          )}

                          <Tooltip content={<CustomPublicChartTooltip showAxisBadges={showAxisBadges} axisMapping={axisMapping} activeLecturas={activeLecturas} />} />

                          {activeLecturas.map((l) => {
                            const varIndex = lecturas.findIndex(x => x.data_type === l.data_type);
                            const theme = getTheme(l.data_type, l.icono, isMultiSelectMode ? varIndex : null);
                            const ySide = axisMapping[l.data_type] || 'left';
                            const isHovered = hoveredVar === l.data_type;

                            return (
                              <Area
                                key={l.data_type}
                                yAxisId={ySide}
                                type="monotone"
                                dataKey={l.data_type}
                                name={`${l.tipo} (${l.unidad})`}
                                stroke={theme.hex}
                                strokeWidth={isHovered ? 4.5 : 2.5}
                                strokeOpacity={hoveredVar ? (isHovered ? 1 : 0.2) : 1}
                                fillOpacity={hoveredVar ? (isHovered ? 0.45 : 0.05) : 0.25}
                                fill={`url(#colorHist${l.data_type})`}
                                activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                              />
                            );
                          })}
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* ── MODAL POPUP: DESCARGAR CSV ── */}
      <ModalExportarCSV
        show={showModalDescarga}
        onClose={() => setShowModalDescarga(false)}
        nodo={nodoActual}
      />

    </div>
  );
}