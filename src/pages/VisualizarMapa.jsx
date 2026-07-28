import { API_BASE_URL } from '../config/api';
import { echo } from '../config/echo';
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/VisualizarMapa.css';
import EditableText from '../components/EditableText';

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

// Componente para dibujar la gráfica Recharts interactiva en tiempo real
const PublicRechartsChart = ({ nodoSeleccionado, activeVariables = {}, liveTrigger, tipoGrafico, onDescargarClick, onAmpliarClick, isAmpliado = false }) => {
  const [chartData, setChartData] = useState([]);

  const lecturas = nodoSeleccionado?.lecturas || [];
  const activeLecturas = lecturas.filter(l => activeVariables[l.data_type] !== false);

  useEffect(() => {
    if (!nodoSeleccionado) return;

    const fetchHistoryData = async () => {
      try {
        const mergedMap = new Map();
        const activeList = lecturas.filter(l => activeVariables[l.data_type] !== false);
        
        if (activeList.length === 0) {
          setChartData([]);
          return;
        }

        for (const l of activeList) {
          const res = await fetch(`${API_BASE_URL}/lecturas?node_id=${nodoSeleccionado.id}&clave_mqtt=${l.data_type}&periodo=24h`);
          const data = await res.json();
          if (Array.isArray(data)) {
            data.forEach(item => {
              const label = item.label || item.fecha;
              if (!mergedMap.has(label)) {
                mergedMap.set(label, { time: label });
              }
              mergedMap.get(label)[l.data_type] = item.valor;
            });
          }
        }

        let mergedArray = Array.from(mergedMap.values());
        setChartData(mergedArray);
      } catch (err) {
        console.error("Error loading public chart data:", err);
      }
    };

    fetchHistoryData();
  }, [nodoSeleccionado, activeVariables]);

  return (
    <div className="dashboard-chart-svg-container" style={{ padding: isAmpliado ? '1rem' : '0.5rem 0' }}>
      {/* Leyenda Dinámica de Variables Activas */}
      <div className="dashboard-chart-legend" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        {activeLecturas.map((l) => {
          const theme = getTheme(l.data_type, l.icono);
          return (
            <div key={l.data_type} className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700', color: theme.hex }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                {theme.icon}
              </svg>
              <span>{l.tipo} ({l.unidad})</span>
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
      <div style={{ width: '100%', height: isAmpliado ? '360px' : '260px' }}>
        {activeLecturas.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontSize: '0.9rem' }}>
            Sin variables activas marcadas
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
              <defs>
                {activeLecturas.map((l, idx) => {
                  const theme = getTheme(l.data_type, l.icono);
                  return (
                    <linearGradient key={idx} id={`colorPub${l.data_type}`} x1="0" y1="0" x2="0" y2="1">
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
                    fill={`url(#colorPub${l.data_type})`}
                  />
                );
              })}
            </AreaChart>
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

  // Forma del gráfico ('line' o 'bar')
  const [tipoGrafico, setTipoGrafico] = useState('line');

  // Modal de gráfico ampliado
  const [showModalAmpliado, setShowModalAmpliado] = useState(false);

  // Valores de telemetría más recientes en BD
  const [valoresUltimos, setValoresUltimos] = useState({});

  // Estados del Modal de Descarga CSV
  const [showModalDescarga, setShowModalDescarga] = useState(false);
  const [descargaMetrics, setDescargaMetrics] = useState({});
  const [descargaRango, setDescargaRango] = useState('30d');
  const [descargaFechaInicio, setDescargaFechaInicio] = useState('2025-07-04');
  const [descargaFechaFin, setDescargaFechaFin] = useState('2025-08-02');

  // Trigger para simulación de telemetría dinámica en tiempo real
  const [liveTrigger, setLiveTrigger] = useState(0);

  // Estado para los checkboxes de variables activas en tiempo real (todas true por defecto)
  const [activeVariables, setActiveVariables] = useState({});

  useEffect(() => {
    if (nodoSeleccionado && nodoSeleccionado.lecturas) {
      const initialMap = {};
      nodoSeleccionado.lecturas.forEach(l => {
        initialMap[l.data_type] = true;
      });
      setActiveVariables(initialMap);
    } else {
      setActiveVariables({});
    }
  }, [nodoSeleccionado]);

  const toggleVariable = (dataType) => {
    setActiveVariables(prev => ({
      ...prev,
      [dataType]: prev[dataType] === false ? true : false
    }));
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
                setNodoSeleccionado(found);
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

  // Cargar lecturas reales registradas en la BD y escuchar eventos en tiempo real via WebSockets / Polling
  useEffect(() => {
    if (!nodoSeleccionado) return;

    const fetchLatestRealReadings = () => {
      fetch(`${API_BASE_URL}/lecturas/ultimas?node_id=${nodoSeleccionado.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const map = {};
            data.forEach(item => {
              if (item.valor !== null && item.valor !== undefined) {
                map[item.clave_mqtt] = {
                  valor: item.valor,
                  fecha: item.fecha
                };
              }
            });
            setValoresUltimos(map);
          }
        })
        .catch(err => {
          console.error("Error loading latest readings from backend:", err);
        });
    };

    fetchLatestRealReadings();

    // Consultar lecturas reales registradas cada 5 segundos
    const pollInterval = setInterval(fetchLatestRealReadings, 5000);

    // Escuchar eventos de telemetría por WebSockets en vivo si están disponibles
    let channel;
    if (nodoSeleccionado.serial_number) {
      try {
        const channelName = `telemetry.${nodoSeleccionado.serial_number}`;
        channel = echo.channel(channelName);
        channel.listen('.LecturaRecibida', () => {
          fetchLatestRealReadings();
        });
      } catch (e) {
        console.warn("WebSocket channel error:", e);
      }
    }

    return () => {
      clearInterval(pollInterval);
      if (channel && nodoSeleccionado.serial_number) {
        echo.leaveChannel(`telemetry.${nodoSeleccionado.serial_number}`);
      }
    };
  }, [nodoSeleccionado]);

  const handleCategoryClick = (catName) => {
    setSearchParams({ categoria: catName });
    setCategoriaSeleccionada(catName);
    setNodoSeleccionado(null);
    setLecturaSeleccionada(null);
  };

  const handleNodeChange = (nodeId) => {
    if (!nodeId) {
      setSearchParams({ categoria: categoriaSeleccionada });
      setNodoSeleccionado(null);
      setLecturaSeleccionada(null);
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
      setNodoSeleccionado(nodeObj);
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
  };

  // Preparar checklist de variables cuando se abre el modal
  const handleOpenDescargaModal = () => {
    if (!nodoSeleccionado) return;
    const initialChecked = {};
    nodoSeleccionado.lecturas.forEach(l => {
      initialChecked[l.data_type] = true;
    });
    setDescargaMetrics(initialChecked);
    setShowModalDescarga(true);
  };

  const handleCheckboxChange = (key) => {
    setDescargaMetrics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Descarga del CSV desde la BD
  const handleDescargarCSVFisico = () => {
    const selectedKeys = Object.keys(descargaMetrics).filter(k => descargaMetrics[k]);
    if (selectedKeys.length === 0) {
      alert("Por favor, selecciona al menos una lectura.");
      return;
    }

    const promises = selectedKeys.map(key => {
      return fetch(`${API_BASE_URL}/lecturas?node_id=${nodoSeleccionado.id}&clave_mqtt=${key}&periodo=${descargaRango}`)
        .then(res => res.json())
        .then(data => ({ key, data }));
    });

    Promise.all(promises)
      .then(results => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Dispositivo,Fecha/Hora,Variable,Valor,Unidad\n";

        results.forEach(res => {
          const lTemplate = nodoSeleccionado.lecturas.find(l => l.data_type === res.key);
          res.data.forEach(item => {
            csvContent += `"${nodoSeleccionado.nombre}","${item.fecha || item.label}","${lTemplate?.tipo || res.key}",${item.valor},"${lTemplate?.unidad || ''}"\n`;
          });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_vivo_${nodoSeleccionado?.nombre.toLowerCase().replace(/\s+/g, '_')}.csv`);
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
    const key = variable.data_type.toLowerCase();
    const nombre = variable.tipo.toLowerCase();

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
      title: variable.tipo,
      value: val.toString(),
      label: 'Registrado',
      color: '#38bdf8',
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

      // Pin personalizado tipo Google Maps (idéntico al de RegistrarNodo)
      const mapPinIcon = window.L.divIcon({
        html: `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.45));">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
            <circle cx="12" cy="10" r="3.2" fill="#ffffff"/>
          </svg>
        `,
        className: 'custom-map-pin-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      window.L.marker([lat, lng], {
        icon: mapPinIcon
      }).addTo(map);

      // Botón de centrado en el mapa (🏠 Home Icon idéntico a RegistrarNodo)
      const CenterControl = window.L.Control.extend({
        onAdd: function () {
          const btn = window.L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-center-btn');
          btn.innerHTML = '🏠';
          btn.style.width = '30px';
          btn.style.height = '30px';
          btn.style.backgroundColor = '#ffffff';
          btn.style.border = 'none';
          btn.style.borderRadius = '4px';
          btn.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
          btn.style.cursor = 'pointer';
          btn.style.fontSize = '14px';
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
          {/* Cabecera de Categoría con Pestañas Flotantes (Solo si no está en pantalla completa) */}
          {tabActiva !== 'mapa' && (
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
                {/* CONDICIONAL: Ocultar Datos Tiempo Real y Mapa si no hay ningún nodo seleccionado */}
                {nodoSeleccionado && (
                  <>
                    <button
                      type="button"
                      onClick={() => setTabActiva('realtime')}
                      className={`dashboard-tab-pill ${tabActiva === 'realtime' ? 'active' : ''}`}
                    >
                      Datos Tiempo Real
                    </button>
                    <button
                      type="button"
                      onClick={() => setTabActiva('mapa')}
                      className={`dashboard-tab-pill ${tabActiva === 'mapa' ? 'active' : ''}`}
                    >
                      Mapa
                    </button>
                  </>
                )}
                <Link
                  to={nodoSeleccionado ? `/analisis-historico?nodo=${nodoSeleccionado.id}&categoria=${encodeURIComponent(categoriaSeleccionada)}` : `/analisis-historico?categoria=${encodeURIComponent(categoriaSeleccionada)}`}
                  className="dashboard-tab-pill-link"
                >
                  Histórico
                </Link>
              </div>
            </div>
          )}

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

              {/* Barra de Filtros: Dropdown Personalizado de Nodos */}
              <div className="dashboard-filters-toolbar" style={{ borderBottom: nodoSeleccionado ? '1px solid #f1f5f9' : 'none' }}>
                <PublicCustomSelectNode
                  nodos={nodosFiltrados}
                  selectedNodeId={nodoSeleccionado?.id || ''}
                  onSelect={(nodeId) => handleNodeChange(nodeId)}
                />

                {/* Lista de Botones Horizontales de Variables (Checkboxes activos por defecto) */}
                {nodoSeleccionado && (
                  <div className="dashboard-variables-scroll-container">
                    <div className="dashboard-variables-list">
                      {nodoSeleccionado.lecturas && nodoSeleccionado.lecturas.map((l, index) => {
                        const isChecked = activeVariables[l.data_type] !== false;
                        const theme = getTheme(l.data_type, l.icono);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => toggleVariable(l.data_type)}
                            className={`dashboard-variable-btn public-var-checkbox-chip ${isChecked ? 'active' : 'inactive'}`}
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
                  {nodoSeleccionado && nodoSeleccionado.lecturas && (
                    <div className="public-readings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      {nodoSeleccionado.lecturas
                        .filter(l => activeVariables[l.data_type] !== false)
                        .map((l) => {
                          const theme = getTheme(l.data_type, l.icono);
                          const liveVal = generarValorLive(l.data_type);
                          const timestamp = valoresUltimos[l.data_type]?.fecha 
                            ? new Date(valoresUltimos[l.data_type].fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium', hour12: true })
                            : `${new Date().toLocaleDateString('es-ES')}, ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`;

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
                                transition: 'all 0.25s ease'
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
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

                              {/* Valor Grande en Real-Time */}
                              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f2c59', lineHeight: 1.15, margin: '4px 0 8px 0' }}>
                                {liveVal} <span style={{ fontSize: '0.95rem', fontWeight: 700, color: theme.hex }}>{l.unidad}</span>
                              </div>

                              {/* Timestamp Exacto con Hora, Minuto y Segundo */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
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
                  )}

                  {/* Lienzo del Gráfico Analítico Recharts en Tiempo Real */}
                  {nodoSeleccionado && nodoSeleccionado.lecturas && nodoSeleccionado.lecturas.length > 0 && (
                    <PublicRechartsChart
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

          {/* TAB 2: GEOLOCALIZACIÓN / MAPA (CON ESTILOS FULL SCREEN DE LA VISTA PREVIA DE REGISTRARNODO.JSX) */}
          {tabActiva === 'mapa' && (
            <>
              {!nodoSeleccionado ? (
                <div className="dashboard-content-card">
                  <div className="empty-dashboard-prompt">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                      Selecciona un dispositivo para inicializar el mapa
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.5' }}>
                      Elige uno de los nodos de hardware de la categoría "{categoriaSeleccionada}" para cargar el mapa satelital híbrido.
                    </p>
                    <button onClick={() => setTabActiva('realtime')} className="modal-btn-confirm" style={{ marginTop: '1.5rem' }}>
                      Volver a Datos Tiempo Real
                    </button>
                  </div>
                </div>
              ) : (
                <div className="node-fullscreen-overlay">
                  {/* Lienzo del mapa Leaflet a pantalla completa */}
                  <div id="leaflet-public-map-preview" className="node-fullscreen-map"></div>

                  {/* Botón flotante para re-centrar en el mapa */}
                  <button
                    type="button"
                    className="node-fullscreen-home-btn"
                    onClick={() => {
                      if (window.leafletPublicMapInstance) {
                        const lat = parseFloat(mapLatitud);
                        const lng = parseFloat(mapLongitud);
                        window.leafletPublicMapInstance.setView([lat, lng], 17);
                      }
                    }}
                    title="Centrar mapa en la ubicación"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" width="16" height="16">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </button>

                  {/* Tarjeta flotante de información (Estilo RegistrarNodo.jsx) */}
                  <div className="node-fullscreen-card">

                    {/* Encabezado */}
                    <div className="node-fullscreen-header">
                      <div className="node-fullscreen-header-main">
                        <span className="node-fullscreen-info-label">INFORMACIÓN</span>
                        <button
                          type="button"
                          className="node-fullscreen-close-btn"
                          onClick={() => setTabActiva('realtime')}
                          title="Cerrar vista de mapa"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>

                      <h3 className="node-fullscreen-node-name">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {nodoSeleccionado.nombre}
                      </h3>

                      <p className="node-fullscreen-address">
                        {mapUbicacionNombre}
                      </p>
                    </div>

                    {/* Sección de Indicador Dinámico / Gauge (Estilo RegistrarNodo.jsx) */}
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
                            <span className="node-fullscreen-index-badge" style={{ backgroundColor: status.color }}>
                              {status.label}
                            </span>
                          </div>

                          {/* Barra de espectro de color */}
                          <div className="node-fullscreen-gauge-bar-wrapper">
                            <div className="node-fullscreen-gauge-bar" style={{
                              background: status.type === 'air'
                                ? 'linear-gradient(to right, #10b981, #eab308, #f97316, #ef4444, #a855f7, #7f1d1d)'
                                : status.type === 'soil'
                                  ? 'linear-gradient(to right, #f97316, #eab308, #10b981, #2563eb)'
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

                    {/* Sensor Readings List (Clickable para cambiar variable) */}
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
                              <span className="node-fullscreen-reading-value font-mono">
                                {valStr} <span className="node-fullscreen-reading-unit">{l.unidad}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      )}

      {/* ── MODAL POPUP: DESCARGAR CSV ── */}
      {showModalDescarga && nodoSeleccionado && (
        <div className="modal-descarga-overlay">
          <div className="modal-descarga-card">
            <h3 className="modal-descarga-title">Descargar CSV</h3>
            <p className="modal-descarga-subtitle">
              Se descargará un archivo CSV para el dispositivo: <br />
              <strong>{nodoSeleccionado.nombre}</strong>
            </p>

            <div className="modal-section-group">
              <span className="modal-section-label">Selecciona las lecturas:</span>
              <div className="modal-checkbox-list">
                {nodoSeleccionado.lecturas.map(l => (
                  <label key={l.data_type} className="modal-checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!descargaMetrics[l.data_type]}
                      onChange={() => handleCheckboxChange(l.data_type)}
                      className="modal-checkbox-input"
                    />
                    <span>{l.tipo} ({l.unidad})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-section-group">
              <span className="modal-section-label">Selecciona el rango de fechas: *</span>
              <div className="modal-range-pills">
                {['hoy', '7d', '30d', '90d'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setDescargaRango(r);
                      const DashboardNow = new Date();
                      let days = 30;
                      if (r === '7d') days = 7;
                      else if (r === '90d') days = 90;
                      else if (r === 'hoy') days = 0;

                      const past = new Date();
                      past.setDate(DashboardNow.getDate() - days);

                      setDescargaFechaInicio(past.toISOString().split('T')[0]);
                      setDescargaFechaFin(DashboardNow.toISOString().split('T')[0]);
                    }}
                    className={`modal-range-pill ${descargaRango === r ? 'active' : ''}`}
                  >
                    {r === 'hoy' ? 'Hoy' : r === '7d' ? 'Últimos 7 días' : r === '30d' ? 'Últimos 30 días' : 'Últimos 90 días'}
                  </button>
                ))}
              </div>

              <div className="modal-date-picker-row">
                <div className="date-input-wrapper">
                  <label>Fecha de inicio: *</label>
                  <div className="date-picker-box">
                    <input
                      type="date"
                      value={descargaFechaInicio}
                      onChange={(e) => setDescargaFechaInicio(e.target.value)}
                    />
                    <CalendarIcon />
                  </div>
                </div>

                <span className="date-arrow-separator">→</span>

                <div className="date-input-wrapper">
                  <label>Fecha de fin: *</label>
                  <div className="date-picker-box">
                    <input
                      type="date"
                      value={descargaFechaFin}
                      onChange={(e) => setDescargaFechaFin(e.target.value)}
                    />
                    <CalendarIcon />
                  </div>
                </div>
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

      {/* ── MODAL POPUP: GRÁFICO AMPLIADO ── */}
      {showModalAmpliado && nodoSeleccionado && lecturaSeleccionada && (
        <div className="modal-descarga-overlay" onClick={() => setShowModalAmpliado(false)}>
          <div className="modal-descarga-card" style={{ maxWidth: '850px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <h3 className="modal-descarga-title" style={{ fontSize: '1.25rem' }}>
                Gráfico Ampliado - {nodoSeleccionado.nombre}
              </h3>
              <button
                onClick={() => setShowModalAmpliado(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            {/* Selector de gráfico y variable interno */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#64748b' }}>
                Ubicación: {mapUbicacionNombre}
              </span>

              <div className="hist-chart-filters-toolbar" style={{ margin: 0 }}>
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
              </div>
            </div>

            {/* Canvas del gráfico ampliado */}
            <PublicRechartsChart
              nodoSeleccionado={nodoSeleccionado}
              activeVariables={activeVariables}
              liveTrigger={liveTrigger}
              tipoGrafico={tipoGrafico}
              isAmpliado={true}
            />

            <div className="modal-action-buttons-row" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setShowModalAmpliado(false)}
                className="modal-btn-cancel"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}