import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/VisualizarHistorico.css';
import EditableText from '../components/EditableText';

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

const getTheme = (clave, icono) => {
  let baseTheme = DYNAMIC_ICONS_PUBLIC.general;
  const t = (clave || '').toLowerCase();
  if (t.includes('temp')) baseTheme = DYNAMIC_ICONS_PUBLIC.termometro;
  else if (t.includes('hum') || t.includes('soil')) baseTheme = DYNAMIC_ICONS_PUBLIC.humedad;
  else if (t.includes('press') || t.includes('presion')) baseTheme = DYNAMIC_ICONS_PUBLIC.presion;
  else if (t.includes('wind') || t.includes('viento')) baseTheme = DYNAMIC_ICONS_PUBLIC.viento;
  else if (t.includes('rain') || t.includes('lluvia')) baseTheme = DYNAMIC_ICONS_PUBLIC.lluvia;

  if (icono && DYNAMIC_ICONS_PUBLIC[icono]) {
    return DYNAMIC_ICONS_PUBLIC[icono];
  }
  return baseTheme;
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
              <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" width="14" height="14">
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" width="14" height="14">
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" width="14" height="14">
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

  // Estado de Modal de Descarga
  const [showModalDescarga, setShowModalDescarga] = useState(false);
  const [descargaMetrics, setDescargaMetrics] = useState({});
  const [descargaRango, setDescargaRango] = useState('30d');

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

  const nodoActual = nodos.find(n => n.id.toString() === nodoSeleccionadoId.toString());

  // Inicializar checkboxes cuando cambia el nodo
  useEffect(() => {
    if (nodoActual && nodoActual.lecturas) {
      const initialMap = {};
      nodoActual.lecturas.forEach(l => {
        initialMap[l.data_type] = true;
      });
      setActiveVariables(initialMap);
    } else {
      setActiveVariables({});
    }
  }, [nodoSeleccionadoId, nodos]);

  // Cargar lecturas desde el nuevo controlador backend limitado a 30 días
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

        // Fallback de simulación en caso de base de datos vacía
        if (timeline.length === 0 && activeLecturas.length > 0) {
          const sampleLabels = periodo === '24h'
            ? ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']
            : periodo === '7d'
              ? ['Lun 20/07', 'Mar 21/07', 'Mié 22/07', 'Jue 23/07', 'Vie 24/07']
              : ['01/07', '05/07', '10/07', '15/07', '20/07', '24/07'];

          timeline = sampleLabels.map((lbl, idx) => {
            const point = { time: lbl };
            activeLecturas.forEach(l => {
              const baseVal = l.data_type.includes('temp') ? 24 : l.data_type.includes('hum') ? 56 : 1012;
              point[l.data_type] = parseFloat((baseVal + Math.sin(idx) * (l.data_type.includes('temp') ? 2 : 5)).toFixed(1));
            });
            return point;
          });

          // Fallback de stats simulados
          const fallbackStats = {};
          activeLecturas.forEach(l => {
            const baseVal = l.data_type.includes('temp') ? 24 : l.data_type.includes('hum') ? 56 : 1012;
            fallbackStats[l.data_type] = {
              tipo: l.tipo,
              unidad: l.unidad,
              icono: l.icono,
              promedio: baseVal,
              min: baseVal - 3,
              min_fecha: '20/07/2026, 04:00 a. m.',
              max: baseVal + 4,
              max_fecha: '24/07/2026, 02:30 p. m.',
              total: 24
            };
          });
          setStatsData(fallbackStats);
        }

        setChartTimeline(timeline);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching public historical readings:", err);
        setLoading(false);
      });
  }, [nodoSeleccionadoId, periodo, intervalo, nodos]);

  const toggleVariable = (dataType) => {
    setActiveVariables(prev => ({
      ...prev,
      [dataType]: prev[dataType] === false ? true : false
    }));
  };

  const handleNodoTabChange = (id) => {
    setNodoSeleccionadoId(id);
  };

  const handleOpenDescargaModal = () => {
    if (!nodoActual) return;
    const initialChecked = {};
    (nodoActual.lecturas || []).forEach(l => {
      initialChecked[l.data_type] = true;
    });
    setDescargaMetrics(initialChecked);
    setShowModalDescarga(true);
  };

  const handleCheckboxChangeModal = (key) => {
    setDescargaMetrics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDescargarCSVFisico = () => {
    const selectedKeys = Object.keys(descargaMetrics).filter(k => descargaMetrics[k]);
    if (selectedKeys.length === 0) {
      alert("Por favor, selecciona al menos una variable para exportar.");
      return;
    }

    const promises = selectedKeys.map(key => {
      return fetch(`${API_BASE_URL}/public/lecturas/historico?node_id=${nodoSeleccionadoId}&periodo=${descargaRango}&clave_mqtt=${key}`)
        .then(res => res.json())
        .then(data => ({ key, data }));
    });

    Promise.all(promises)
      .then(results => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Dispositivo,Fecha/Hora,Variable,Valor Promedio,Min,Max,Unidad\n";

        results.forEach(res => {
          const lTemplate = nodoActual.lecturas.find(l => l.data_type === res.key);
          const points = res.data.series?.[res.key] || [];
          points.forEach(item => {
            csvContent += `"${nodoActual.nombre}","${item.fecha || item.label}","${lTemplate?.tipo || res.key}",${item.valor},${item.min || item.valor},${item.max || item.valor},"${lTemplate?.unidad || ''}"\n`;
          });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_historico_${nodoActual?.nombre.toLowerCase().replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowModalDescarga(false);
      })
      .catch(err => {
        console.error("Error al exportar CSV:", err);
        alert("Ocurrió un error al obtener las lecturas para la descarga.");
      });
  };

  const nodosFiltrados = catQueryParam
    ? nodos.filter(n => n.categoria && n.categoria.toLowerCase() === catQueryParam.toLowerCase())
    : nodos;

  const lecturas = nodoActual?.lecturas || [];
  const activeLecturas = lecturas.filter(l => activeVariables[l.data_type] !== false);

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

      {/* ── SECCIÓN DE TARJETAS KPI DE RESUMEN (Promedio en grande, Min y Max) ── */}
      {nodoActual && (
        <div className="public-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {activeLecturas.map(l => {
            const theme = getTheme(l.data_type, l.icono);
            const stat = statsData[l.data_type] || {
              promedio: 0,
              min: 0,
              min_fecha: '--',
              max: 0,
              max_fecha: '--'
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
                  padding: '1.25rem 1.5rem',
                  overflow: 'hidden',
                  boxShadow: '0 4px 18px rgba(15, 44, 89, 0.05)',
                  transition: 'all 0.25s ease'
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
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
                        color: theme.hex 
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                        {theme.icon}
                      </svg>
                    </span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                      {l.tipo}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: `${theme.hex}15`, color: theme.hex }}>
                    Promedio General
                  </span>
                </div>

                {/* Promedio en Grande al Centro */}
                <div style={{ textAlign: 'center', padding: '0.5rem 0 0.75rem 0' }}>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0f2c59', lineHeight: 1 }}>
                    {stat.promedio} <span style={{ fontSize: '1.1rem', fontWeight: 700, color: theme.hex }}>{l.unidad}</span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Valor medio en el período ({periodo})</span>
                </div>

                {/* Sub-tarjetas de Min y Max */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                  {/* Min */}
                  <div style={{ background: '#ffffff80', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3b82f6' }}>MÍNIMO</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f2c59' }}>{stat.min} {l.unidad}</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>{stat.min_fecha}</div>
                  </div>

                  {/* Max */}
                  <div style={{ background: '#ffffff80', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444' }}>MÁXIMO</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f2c59' }}>{stat.max} {l.unidad}</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>{stat.max_fecha}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CONTENEDOR DEL GRÁFICO RECHARTS ── */}
      <div className="hist-chart-body-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f2c59' }}>
            Línea de Tiempo Agrupada
          </h4>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {activeLecturas.map(l => {
              const theme = getTheme(l.data_type, l.icono);
              return (
                <div key={l.data_type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: theme.hex }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    {theme.icon}
                  </svg>
                  <span>{l.tipo} ({l.unidad})</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lienzo del Gráfico */}
        <div style={{ width: '100%', height: '320px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
              Cargando lecturas históricas...
            </div>
          ) : activeLecturas.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
              Selecciona al menos una variable en los checkboxes inferiores para visualizar la gráfica.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartTimeline} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  {activeLecturas.map((l, idx) => {
                    const theme = getTheme(l.data_type, l.icono);
                    return (
                      <linearGradient key={idx} id={`colorHist${l.data_type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.hex} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={theme.hex} stopOpacity={0} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} tickMargin={10} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                
                {activeLecturas[0] && (
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: getTheme(activeLecturas[0].data_type, activeLecturas[0].icono).hex }} axisLine={false} tickLine={false} dx={-10} />
                )}
                {activeLecturas[1] && (
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: getTheme(activeLecturas[1].data_type, activeLecturas[1].icono).hex }} axisLine={false} tickLine={false} dx={10} />
                )}

                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />

                {activeLecturas.map((l, idx) => {
                  const theme = getTheme(l.data_type, l.icono);
                  return (
                    <Area
                      key={l.data_type}
                      yAxisId={idx % 2 === 0 ? "left" : "right"}
                      type={tipoGrafico === 'bar' ? 'stepAfter' : 'monotone'}
                      dataKey={l.data_type}
                      name={`${l.tipo} (${l.unidad})`}
                      stroke={theme.hex}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill={`url(#colorHist${l.data_type})`}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── CHECKBOXES DE VARIABLES DEBAJO DEL GRÁFICO (DEBAJO DE LA TARJETA) ── */}
      {nodoActual && (
        <div className="hist-variables-bottom-bar" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1rem 1.25rem', boxShadow: '0 4px 12px rgba(15, 44, 89, 0.03)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2c59', marginBottom: '0.75rem' }}>
            Activar / Desactivar Variables en el Histórico:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {lecturas.map((l, index) => {
              const isChecked = activeVariables[l.data_type] !== false;
              const theme = getTheme(l.data_type, l.icono);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleVariable(l.data_type)}
                  className={`public-var-checkbox-chip ${isChecked ? 'active' : 'inactive'}`}
                  style={{
                    borderColor: isChecked ? theme.hex : '#cbd5e1',
                    backgroundColor: isChecked ? theme.bg : '#f8fafc',
                    color: isChecked ? '#0f2c59' : '#64748b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: `1.5px solid ${isChecked ? theme.hex : '#cbd5e1'}`,
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', color: theme.hex }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      {theme.icon}
                    </svg>
                  </span>
                  <span>{l.tipo} ({l.unidad})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL DE EXPORTACIÓN CSV ── */}
      {showModalDescarga && nodoActual && (
        <div className="modal-descarga-overlay" onClick={() => setShowModalDescarga(false)}>
          <div className="modal-descarga-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-descarga-title">Exportar Datos Históricos en CSV</h3>
            
            <div className="modal-field-group">
              <label className="modal-field-label">Dispositivo Seleccionado:</label>
              <input type="text" value={nodoActual.nombre} readOnly className="modal-field-input" />
            </div>

            <div className="modal-field-group">
              <label className="modal-field-label">Período de Exportación:</label>
              <select 
                value={descargaRango} 
                onChange={(e) => setDescargaRango(e.target.value)}
                className="modal-field-input"
              >
                <option value="24h">Últimas 24 Horas</option>
                <option value="7d">Últimos 7 Días</option>
                <option value="30d">Últimos 30 Días (Máximo)</option>
              </select>
            </div>

            <div className="modal-field-group">
              <label className="modal-field-label">Variables a Incluir:</label>
              <div className="modal-checkbox-list">
                {lecturas.map(l => (
                  <label key={l.data_type} className="modal-checkbox-item">
                    <input 
                      type="checkbox"
                      checked={!!descargaMetrics[l.data_type]}
                      onChange={() => handleCheckboxChangeModal(l.data_type)}
                    />
                    <span>{l.tipo} ({l.unidad})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-action-buttons-row">
              <button 
                type="button" 
                onClick={() => setShowModalDescarga(false)}
                className="modal-btn-cancel"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleDescargarCSVFisico}
                className="modal-btn-confirm"
              >
                Descargar CSV
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}