import { API_BASE_URL, fetchWithAuth, fetchDeduplicated } from '../../config/api';
import { echo } from '../../config/echo';
import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/components/admin/Dashboard.css';
import '../../styles/pages/admin/MonitorEnVivo.css';
import ModalExportarCSV from '../../components/ModalExportarCSV';

// Dynamic Icons and Themes matching En Vivo interface
const DYNAMIC_ICONS_VIVO = {
  termometro: { class: 'theme-orange', hex: '#ea580c', bg: '#fff7ed', icon: <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /> },
  humedad: { class: 'theme-blue', hex: '#3b82f6', bg: '#eff6ff', icon: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /> },
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
  let baseTheme = DYNAMIC_ICONS_VIVO.general;
  const t = (clave || '').toLowerCase();
  if (t.includes('temp')) baseTheme = DYNAMIC_ICONS_VIVO.termometro;
  else if (t.includes('hum') || t.includes('soil')) baseTheme = DYNAMIC_ICONS_VIVO.humedad;
  else if (t.includes('press') || t.includes('presion')) baseTheme = DYNAMIC_ICONS_VIVO.presion;
  else if (t.includes('wind') || t.includes('viento')) baseTheme = DYNAMIC_ICONS_VIVO.viento;
  else if (t.includes('rain') || t.includes('lluvia')) baseTheme = DYNAMIC_ICONS_VIVO.lluvia;

  if (icono && DYNAMIC_ICONS_VIVO[icono]) {
    return DYNAMIC_ICONS_VIVO[icono];
  }
  return baseTheme;
};

// Custom Inline SVG Icons matching the image
const NodesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
    <rect x="2" y="2" width="20" height="8" rx="1.5" />
    <rect x="2" y="14" width="20" height="8" rx="1.5" />
    <circle cx="6" cy="6" r="1.5" fill="currentColor" />
    <circle cx="6" cy="18" r="1.5" fill="currentColor" />
  </svg>
);

const LocationsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-6 9-6 9h24s-6-2-6-9z" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
// Componente de Select Personalizado para Estación / Nodo (igual a MonitorEnVivo & HistoricoAgregado)
const DashboardCustomSelectNode = ({ nodos, selectedSerial, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const ref = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearchQuery('');
        setExpandedCategories({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedNode = nodos.find(n => n.serial_number === selectedSerial);

  const groupedNodos = React.useMemo(() => {
    const groups = {};
    (nodos || []).forEach(n => {
      const cat = n.categoria || 'Estación meteorológica';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(n);
    });
    return groups;
  }, [nodos]);

  const activeCategoryKey = Object.keys(expandedCategories).find(k => expandedCategories[k]);

  const filteredNodos = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return (nodos || []).filter(n =>
      (n.serial_number && n.serial_number.toLowerCase().includes(q)) ||
      (n.nombre && n.nombre.toLowerCase().includes(q)) ||
      (n.categoria && n.categoria.toLowerCase().includes(q))
    );
  }, [nodos, searchQuery]);

  return (
    <div className="dash-select-container" ref={ref} style={{ position: 'relative' }}>
      <label className="dash-select-label">Seleccione estación</label>
      <button
        type="button"
        className={`dash-select-trigger ${open ? 'active' : ''}`}
        onClick={() => {
          setOpen(!open);
          if (open) {
            setSearchQuery('');
            setExpandedCategories({});
          }
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedNode ? (selectedNode.nombre || `${selectedNode.categoria || 'Nodo'} (${selectedNode.serial_number})`) : '-- Nodo --'}
        </span>
        <svg className={`dash-select-chevron ${open ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', zIndex: 100, display: 'flex' }}>
          <div className="custom-dropdown-menu" style={{ position: 'relative', top: 0, marginTop: 0, minWidth: '280px' }}>
            <div className="dropdown-search-wrapper" onClick={e => e.stopPropagation()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Buscar nodo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="dropdown-list-wrapper">
              {searchQuery.trim() !== '' ? (
                filteredNodos.length > 0 ? (
                  filteredNodos.map(n => (
                    <div
                      key={n.id || n.serial_number}
                      className={`custom-dropdown-item ${selectedSerial === n.serial_number ? 'active' : ''}`}
                      onClick={() => {
                        onSelect(n.serial_number);
                        setOpen(false);
                        setSearchQuery('');
                        setExpandedCategories({});
                      }}
                    >
                      {n.nombre || n.categoria} ({n.serial_number})
                    </div>
                  ))
                ) : (
                  <div className="dropdown-no-results">No se encontraron nodos</div>
                )
              ) : (
                <>
                  <div
                    className={`custom-dropdown-item ${!selectedSerial ? 'active' : ''}`}
                    onClick={() => {
                      onSelect('');
                      setOpen(false);
                      setSearchQuery('');
                      setExpandedCategories({});
                    }}
                  >
                    -- Todos los nodos --
                  </div>
                  {Object.entries(groupedNodos).map(([cat, catNodos]) => (
                    <div key={cat} className="dropdown-category-group">
                      <div
                        className="dropdown-category-header"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCategories(prev => {
                            if (prev[cat]) return {};
                            return { [cat]: true };
                          });
                        }}
                        style={{ background: expandedCategories[cat] ? '#f1f5f9' : '' }}
                      >
                        <span className="dropdown-category-title">{cat}</span>
                        <span className="dropdown-category-count">{catNodos.length}</span>
                        <svg className="dropdown-category-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ transform: 'rotate(-90deg)', transition: 'none' }}>
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Sub Menu / Flyout */}
          {searchQuery.trim() === '' && activeCategoryKey && groupedNodos[activeCategoryKey] && (
            <div className="custom-dropdown-menu" style={{ position: 'relative', top: 0, marginTop: 0, marginLeft: '4px', minWidth: '220px' }}>
              <div className="dropdown-category-header" style={{ cursor: 'default', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <span className="dropdown-category-title" style={{ color: '#0f2c59' }}>
                  {activeCategoryKey}
                </span>
              </div>
              <div className="dropdown-list-wrapper">
                {groupedNodos[activeCategoryKey].map(n => (
                  <div
                    key={n.id || n.serial_number}
                    className={`custom-dropdown-item ${selectedSerial === n.serial_number ? 'active' : ''}`}
                    onClick={() => {
                      onSelect(n.serial_number);
                      setOpen(false);
                      setSearchQuery('');
                      setExpandedCategories({});
                    }}
                  >
                    {n.nombre || n.categoria} ({n.serial_number})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente de Select Personalizado para Métrica / Variable
const DashboardCustomSelectVar = ({ lecturas, selectedKey, disabled, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLectura = lecturas.find(l => l.data_type === selectedKey);
  const triggerLabel = selectedKey === 'TODAS'
    ? '-- Todas las variables --'
    : (selectedLectura ? selectedLectura.tipo : '-- Variable --');

  return (
    <div className="dash-select-container" ref={ref}>
      <label className="dash-select-label">Seleccione métrica</label>
      <button
        type="button"
        disabled={disabled}
        className={`dash-select-trigger ${open ? 'active' : ''}`}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {triggerLabel}
        </span>
        <svg className={`dash-select-chevron ${open ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !disabled && (
        <div className="dash-select-dropdown">
          <div
            className={`dash-select-item ${!selectedKey ? 'selected' : ''}`}
            onClick={() => {
              onSelect('');
              setOpen(false);
            }}
          >
            <span>-- Variable --</span>
            {!selectedKey && (
              <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" width="14" height="14">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>

          {/* Opción TODAS las variables */}
          {lecturas.length > 0 && (
            <div
              className={`dash-select-item ${selectedKey === 'TODAS' ? 'selected' : ''}`}
              style={{ fontWeight: 700, color: '#2563eb', background: selectedKey === 'TODAS' ? '#eff6ff' : '#f8fafc', borderBottom: '1px dashed #e2e8f0' }}
              onClick={() => {
                onSelect('TODAS');
                setOpen(false);
              }}
            >
              <span>-- Todas las variables --</span>
              {selectedKey === 'TODAS' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" width="14" height="14">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          )}

          {lecturas.map(l => {
            const isSelected = selectedKey === l.data_type;
            return (
              <div
                key={l.data_type}
                className={`dash-select-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelect(l.data_type);
                  setOpen(false);
                }}
              >
                <span>{l.tipo} ({l.unidad})</span>
                {isSelected && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" width="14" height="14">
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

export default function Dashboard() {
  const { language, triggerContentLoading } = useLanguage();
  usePageTitle({ es: 'Panel de Control', en: 'Dashboard' }, 'Admin · IoT ULEAM');
  const [loading, setLoading] = useState(true);
  const hasInitialCenteredRef = React.useRef(false);
  // Database states
  const [nodos, setNodos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [noticias, setNoticias] = useState([]);
  const [categorias, setCategorias] = useState([]);

  // Live Dashboard & Historical Date states
  const todayDateStr = React.useMemo(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [liveData, setLiveData] = useState([]);
  const [allVarsLiveData, setAllVarsLiveData] = useState([]);
  const [chartOffset, setChartOffset] = useState(0); // Offset desde el final de liveData (ventana de 10)

  // Telemetry section category, node & variable selection mode (Same-Unit Multi-variable)
  const [selectedTelemetryCategory, setSelectedTelemetryCategory] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [selectedTelemetryNodeSerial, setSelectedTelemetryNodeSerial] = useState('');
  const [checkedVarKeys, setCheckedVarKeys] = useState([]); // array of checked data_type keys
  const [liveMode, setLiveMode] = useState(false); // false = Base de datos (por fecha), true = En vivo (WebSockets / Buffer)
  const [isByUnitMode, setIsByUnitMode] = useState(false); // false = Navegación libre de variable única, true = Multiselección por unidad
  const [chartMode, setChartMode] = useState('area'); // 'area', 'bar', 'line'
  const [nodeDropdownOpen, setNodeDropdownOpen] = useState(false);
  const [maxReadingsToShow, setMaxReadingsToShow] = useState(15); // Límite configurable de lecturas por ventana (1 a 15)
  const [showExportModal, setShowExportModal] = useState(false);

  const categoryDropdownRef = React.useRef(null);
  const nodeDropdownRef = React.useRef(null);
  const dateInputRef = React.useRef(null);

  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.focus();
        dateInputRef.current.click();
      }
    }
  };

  // Cerrar menús desplegables al hacer clic en cualquier lugar fuera de ellos
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setCategoryDropdownOpen(false);
      }
      if (nodeDropdownRef.current && !nodeDropdownRef.current.contains(e.target)) {
        setNodeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fecha del día actual en formato legible (Español / Inglés)
  const todayFormatted = React.useMemo(() => {
    const d = new Date();
    const str = d.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [language]);

  // Adaptabilidad y Zoom Dinámico: Límite configurable de lecturas a mostrar (1 a 15 lecturas en pantalla)
  const { visibleLiveData, startIndex, endIndex, isAtLatest, canGoPrev, canGoNext, showPagination } = React.useMemo(() => {
    if (!liveData || liveData.length === 0) {
      return { visibleLiveData: [], startIndex: 0, endIndex: 0, isAtLatest: true, canGoPrev: false, canGoNext: false, showPagination: false };
    }

    const pageSize = Math.min(15, Math.max(1, maxReadingsToShow));
    const total = liveData.length;

    let maxOffset = Math.max(0, total - pageSize);
    let clampedOffset = Math.min(Math.max(0, chartOffset), maxOffset);

    let end = total - clampedOffset;
    let start = Math.max(0, end - pageSize);
    end = Math.min(total, start + pageSize);

    return {
      visibleLiveData: liveData.slice(start, end),
      startIndex: start + 1,
      endIndex: end,
      isAtLatest: clampedOffset === 0,
      canGoPrev: start > 0,
      canGoNext: clampedOffset > 0,
      showPagination: total > pageSize
    };
  }, [liveData, chartOffset, maxReadingsToShow]);

  const handlePrevPage = () => {
    setChartOffset(prev => prev + maxReadingsToShow);
  };

  const handleNextPage = () => {
    setChartOffset(prev => Math.max(0, prev - maxReadingsToShow));
  };

  const handleResetToLatest = () => {
    setChartOffset(0);
  };

  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  const [isShaking, setIsShaking] = useState(false);

  // Map refs and state
  const mapContainerRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const tileLayerRef = React.useRef(null);
  const markersRefMap = React.useRef({});
  const centerCurrentNodeRef = React.useRef(null);

  const [mapStyle, setMapStyle] = useState('google'); // 'google', 'satellite', 'dark'
  const [selectedActiveNodeIndex, setSelectedActiveNodeIndex] = useState(0);

  // Active nodes filtering & mapping
  const activeNodos = React.useMemo(() => {
    return (nodos || []).filter(n => n.is_online);
  }, [nodos]);

  const targetNavList = React.useMemo(() => {
    return nodos || [];
  }, [nodos]);

  const activeNodeNumberMap = React.useMemo(() => {
    const map = {};
    (nodos || []).forEach((n, idx) => {
      map[n.serial_number || n.id] = idx + 1;
    });
    return map;
  }, [nodos]);

  // Create SVG/HTML numbered pin marker for Leaflet
  const createNumberedMarkerIcon = React.useCallback((number, isActive, isSelected = false) => {
    const bg = isActive ? '#10b981' : '#64748b'; // Green when Online/Active, Gray when Offline
    const borderColor = isSelected ? '#3b82f6' : '#ffffff';
    const borderWidth = isSelected ? '3.5' : '2';

    // Glow and pulse ring colors matching the pin point color
    const ringBg = isActive ? 'rgba(16, 185, 129, 0.45)' : 'rgba(100, 116, 139, 0.45)';
    const ringShadow = isActive ? '0 0 14px rgba(16, 185, 129, 0.85)' : '0 0 14px rgba(100, 116, 139, 0.85)';
    const shadowFilter = isSelected
      ? (isActive ? 'drop-shadow(0px 8px 14px rgba(16, 185, 129, 0.65))' : 'drop-shadow(0px 8px 14px rgba(100, 116, 139, 0.65))')
      : (isActive ? 'drop-shadow(0px 4px 8px rgba(16, 185, 129, 0.45))' : 'drop-shadow(0px 2px 5px rgba(0,0,0,0.25))');

    const pulseRings = isSelected ? `
      <div class="marker-pulse-ring" style="background: ${ringBg}; box-shadow: ${ringShadow};"></div>
      <div class="marker-pulse-ring ring-delay" style="background: ${ringBg}; box-shadow: ${ringShadow};"></div>
    ` : '';

    return new L.DivIcon({
      className: `custom-numbered-leaflet-marker ${isSelected ? 'marker-selected-node' : ''}`,
      html: `
        <div style="position: relative; width: 34px; height: 44px; display: flex; justify-content: center; align-items: flex-start; cursor: pointer;">
          ${pulseRings}
          <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: ${shadowFilter}; position: relative; z-index: 2;">
            <path d="M17 1C8.163 1 1 8.163 1 17C1 27.8 17 43 17 43C17 43 33 27.8 33 17C33 8.163 25.837 1 17 1Z" fill="${bg}" stroke="${borderColor}" stroke-width="${borderWidth}"/>
            <text x="17" y="17" fill="#ffffff" font-size="13" font-weight="800" font-family="'Outfit', 'Inter', sans-serif" text-anchor="middle" dominant-baseline="central">${number}</text>
          </svg>
        </div>
      `,
      iconSize: [34, 44],
      iconAnchor: [17, 44],
      popupAnchor: [0, -42]
    });
  }, []);

  // Dynamic Map Layer Switcher (Google Roadmap, Google Satellite, CartoDB Dark)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    let tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    let tileAttr = '&copy; Google Maps';
    if (mapStyle === 'satellite') {
      tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      tileAttr = '&copy; Google Maps';
    } else if (mapStyle === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      tileAttr = '&copy; OpenStreetMap contributors &copy; CARTO';
    }

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: tileAttr,
      maxZoom: 20
    }).addTo(mapInstanceRef.current);
  }, [mapStyle]);

  useEffect(() => {
    document.title = "Dashboard - IoT ULEAM";

    // Fetch dashboard stats from backend database APIs with deduplicated requests
    Promise.all([
      fetchDeduplicated(`${API_BASE_URL}/nodos?lang=${language}`).then(res => res.json()),
      fetchWithAuth(`${API_BASE_URL}/ubicaciones?lang=${language}`).then(res => res.json()),
      fetchDeduplicated(`${API_BASE_URL}/noticias?lang=${language}`).then(res => res.json()),
      fetchWithAuth(`${API_BASE_URL}/users/count`).then(res => res.json()),
      fetchDeduplicated(`${API_BASE_URL}/categorias?lang=${language}`).then(res => res.json())
    ])
      .then(([nodosData, ubiData, noticiasData, userCountData, catsData]) => {
        setNodos(Array.isArray(nodosData) ? nodosData : []);
        setUbicaciones(Array.isArray(ubiData) ? ubiData : []);
        setNoticias(Array.isArray(noticiasData) ? noticiasData : []);
        setTotalUsuarios(userCountData?.total_users ?? (typeof userCountData === 'number' ? userCountData : 0));
        setCategorias(Array.isArray(catsData) ? catsData : []);

        if (Array.isArray(nodosData) && nodosData.length > 0) {
          // 1. Verificar parámetro URL ?nodo=nombre-id
          const searchParams = new URLSearchParams(window.location.search);
          const nodoUrlParam = searchParams.get('nodo');
          let foundFromUrl = null;
          if (nodoUrlParam) {
            const parts = nodoUrlParam.split('-');
            const possibleId = parts[parts.length - 1];
            if (possibleId && !isNaN(possibleId)) {
              foundFromUrl = nodosData.find(n => String(n.id) === String(possibleId));
            }
          }

          // 2. Verificar localStorage
          const sharedNodeId = localStorage.getItem('shared_node_id');
          const sharedNodeSerial = localStorage.getItem('shared_node_serial');
          const foundFromStorage = nodosData.find(n => String(n.id) === String(sharedNodeId) || n.serial_number === sharedNodeSerial);

          const initialNode = foundFromUrl || foundFromStorage || nodosData[0];

          setSelectedTelemetryNodeSerial(initialNode.serial_number);
          localStorage.setItem('shared_node_id', String(initialNode.id));
          localStorage.setItem('shared_node_serial', String(initialNode.serial_number));

          const savedFilters = localStorage.getItem('dashboardFilters');
          if (savedFilters) {
            try {
              const parsedFilters = JSON.parse(savedFilters);
              setAppliedSelections(parsedFilters);
              setPendingSelections(parsedFilters);
            } catch (e) {
              console.error("Error parsing saved filters", e);
            }
          } else {
            const defaultSel = [];
            for (let i = 0; i < Math.min(nodosData.length, 3); i++) {
              const firstVar = nodosData[i].lecturas?.[0];
              if (firstVar) {
                defaultSel.push({
                  serial_number: nodosData[i].serial_number,
                  nombre_nodo: nodosData[i].nombre,
                  clave_mqtt: firstVar.data_type,
                  nombre_var: firstVar.tipo,
                  unidad: firstVar.unidad
                });
              }
            }
            setAppliedSelections(defaultSel);
            setPendingSelections(defaultSel);
          }
        }
      })
      .catch(err => {
        console.error("Error loading dashboard data from backend APIs:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [language]);


  // Sincronizar el nodo seleccionado en el Dashboard hacia el almacenamiento compartido
  useEffect(() => {
    if (selectedTelemetryNodeSerial && nodos.length > 0) {
      const node = nodos.find(n => n.serial_number === selectedTelemetryNodeSerial);
      if (node) {
        localStorage.setItem('shared_node_id', String(node.id));
        localStorage.setItem('shared_node_serial', String(node.serial_number));
      }
    }
    // Mantener la URL limpia en el Dashboard sin parámetros
    if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [selectedTelemetryNodeSerial, nodos]);

  // Sincronizar interacción del mapa con la sección inferior de telemetría y gráficos (Mapa -> Telemetría)
  useEffect(() => {
    if (targetNavList && targetNavList.length > 0) {
      const mapNode = targetNavList[selectedActiveNodeIndex];
      if (mapNode && mapNode.serial_number && mapNode.serial_number !== selectedTelemetryNodeSerial) {
        if (mapNode.categoria) {
          setSelectedTelemetryCategory(mapNode.categoria);
        }
        setSelectedTelemetryNodeSerial(mapNode.serial_number);
      }
    }
  }, [selectedActiveNodeIndex, targetNavList]);

  // Sincronizar interacción inferior con el mapa (Telemetría -> Mapa)
  useEffect(() => {
    if (!selectedTelemetryNodeSerial || !targetNavList || targetNavList.length === 0) return;
    const matchIdx = targetNavList.findIndex(n => (n.serial_number || n.id) === selectedTelemetryNodeSerial);
    if (matchIdx >= 0) {
      if (matchIdx !== selectedActiveNodeIndex) {
        setSelectedActiveNodeIndex(matchIdx);
      }
      const targetNode = targetNavList[matchIdx];
      if (targetNode && mapInstanceRef.current) {
        let lat = parseFloat(targetNode.latitud);
        let lng = parseFloat(targetNode.longitud);
        if (isNaN(lat) || isNaN(lng)) {
          const originalIdx = nodos.findIndex(n => n.id === targetNode.id);
          const numId = Number(targetNode.id) || (originalIdx >= 0 ? originalIdx : 0);
          lat = -0.95 + ((numId % 10) - 5) * 0.002;
          lng = -80.73 + (((numId * 3) % 10) - 5) * 0.002;
        }
        mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true, duration: 0.8 });
      }
    }
  }, [selectedTelemetryNodeSerial, targetNavList]);

  // Map Initialization and Markers
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([-0.95, -80.73], 13);
      mapInstanceRef.current = map;

      let tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      let tileAttr = '&copy; Google Maps';
      if (mapStyle === 'satellite') {
        tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      } else if (mapStyle === 'dark') {
        tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        tileAttr = '&copy; OpenStreetMap contributors &copy; CARTO';
      }
      tileLayerRef.current = L.tileLayer(tileUrl, { attribution: tileAttr, maxZoom: 20 }).addTo(map);

      // Create Custom Center Control under Zoom controls (topleft)
      const CenterControl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function () {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
          const btn = L.DomUtil.create('a', 'leaflet-center-control-btn', container);
          btn.href = '#';
          btn.title = 'Centrar mapa en el nodo actual';
          btn.role = 'button';
          btn.style.width = '30px';
          btn.style.height = '30px';
          btn.style.lineHeight = '30px';
          btn.style.display = 'flex';
          btn.style.alignItems = 'center';
          btn.style.justifyContent = 'center';
          btn.style.backgroundColor = '#ffffff';
          btn.style.color = '#0f2c59';
          btn.style.cursor = 'pointer';
          btn.style.textDecoration = 'none';
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <circle cx="12" cy="12" r="7" stroke-width="1.5" />
            </svg>
          `;
          L.DomEvent.on(btn, 'click', function (e) {
            L.DomEvent.preventDefault(e);
            L.DomEvent.stopPropagation(e);
            if (centerCurrentNodeRef.current) {
              centerCurrentNodeRef.current();
            }
          });
          return container;
        }
      });
      new CenterControl().addTo(map);
    }

    // Clear existing markers
    Object.values(markersRefMap.current).forEach(m => {
      if (mapInstanceRef.current) mapInstanceRef.current.removeLayer(m);
    });
    markersRefMap.current = {};

    nodos.forEach((nodo, idx) => {
      let lat = parseFloat(nodo.latitud);
      let lng = parseFloat(nodo.longitud);
      if (isNaN(lat) || isNaN(lng)) {
        const numId = Number(nodo.id) || idx;
        lat = -0.95 + ((numId % 10) - 5) * 0.002;
        lng = -80.73 + (((numId * 3) % 10) - 5) * 0.002;
      }
      const isActive = nodo.is_online;
      const activeNum = activeNodeNumberMap[nodo.serial_number || nodo.id];
      const displayNum = activeNum ? activeNum : (idx + 1);
      const isSelected = targetNavList[selectedActiveNodeIndex]?.id === nodo.id;

      const icon = createNumberedMarkerIcon(displayNum, isActive, isSelected);

      const statusBadgeText = isActive
        ? (language === 'en' ? '● Online' : '● Activo')
        : (language === 'en' ? '○ Offline' : '○ Inactivo');
      const statusLineText = isActive
        ? (language === 'en' ? '● Online / Transmitting' : '● Activo / Transmitiendo')
        : (language === 'en' ? '○ Offline (No data)' : '○ Inactivo (Sin datos)');

      const popupContent = `
        <div style="font-family:'Outfit','Inter',sans-serif; padding: 4px; min-width: 180px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:6px;">
            <strong style="color:#0f2c59; font-size:0.95rem;">${nodo.nombre}</strong>
            ${isActive ? `<span style="background:#10b981; color:white; font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:10px;">${statusBadgeText}</span>` : `<span style="background:#ef4444; color:white; font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:10px;">${statusBadgeText}</span>`}
          </div>
          <div style="font-size:0.8rem; color:#64748b; margin-bottom:3px;">${language === 'en' ? 'Category:' : 'Categoría:'} <b style="color:#334155">${nodo.categoria || 'N/A'}</b></div>
          <div style="font-size:0.8rem; color:#64748b; margin-bottom:3px;">Serial: <code style="color:#0f2c59; background:#f1f5f9; padding:1px 4px; border-radius:4px">${nodo.serial_number || 'N/A'}</code></div>
          <div style="font-size:0.8rem; font-weight:700; color:${isActive ? '#10b981' : '#ef4444'}; border-top:1px solid #f1f5f9; padding-top:5px; margin-top:4px;">
            ${statusLineText}
          </div>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon }).bindPopup(popupContent);

      // Open popup on mouse hover (mouseenter / mouseover)
      marker.on('mouseover', function () {
        this.openPopup();
      });

      // Close popup on mouseout
      marker.on('mouseout', function () {
        this.closePopup();
      });

      marker.on('click', () => {
        const matchIdx = targetNavList.findIndex(n => (n.serial_number || n.id) === (nodo.serial_number || nodo.id));
        if (matchIdx >= 0) {
          setSelectedActiveNodeIndex(matchIdx);
        }
        if (nodo.categoria) {
          setSelectedTelemetryCategory(nodo.categoria);
        }
        if (nodo.serial_number) {
          setSelectedTelemetryNodeSerial(nodo.serial_number);
        }
        if (nodo.lecturas && nodo.lecturas.length > 0) {
          setCheckedVarKeys([nodo.lecturas[0].data_type]);
        }
      });

      marker.addTo(mapInstanceRef.current);
      markersRefMap.current[nodo.serial_number || nodo.id] = marker;
    });
  }, [nodos, activeNodos, activeNodeNumberMap, targetNavList, selectedActiveNodeIndex, createNumberedMarkerIcon, mapStyle]);

  // Handler for arrow navigation in map
  const handleNavigateNode = (direction) => {
    if (!targetNavList || targetNavList.length === 0) return;

    let newIndex = 0;
    if (direction === 'next') {
      newIndex = (selectedActiveNodeIndex + 1) % targetNavList.length;
    } else {
      newIndex = (selectedActiveNodeIndex - 1 + targetNavList.length) % targetNavList.length;
    }

    setSelectedActiveNodeIndex(newIndex);
    const targetNode = targetNavList[newIndex];
    if (!targetNode) return;

    let lat = parseFloat(targetNode.latitud);
    let lng = parseFloat(targetNode.longitud);
    if (isNaN(lat) || isNaN(lng)) {
      const originalIdx = nodos.findIndex(n => n.id === targetNode.id);
      const numId = Number(targetNode.id) || (originalIdx >= 0 ? originalIdx : 0);
      lat = -0.95 + ((numId % 10) - 5) * 0.002;
      lng = -80.73 + (((numId * 3) % 10) - 5) * 0.002;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true, duration: 0.8 });
    }
  };

  // Handler for centering map on current node with SVG target button under zoom control
  const handleCenterCurrentNode = React.useCallback(() => {
    const currentNode = targetNavList[selectedActiveNodeIndex];
    if (!currentNode) return;

    let lat = parseFloat(currentNode.latitud);
    let lng = parseFloat(currentNode.longitud);
    if (isNaN(lat) || isNaN(lng)) {
      const originalIdx = nodos.findIndex(n => n.id === currentNode.id);
      const numId = Number(currentNode.id) || (originalIdx >= 0 ? originalIdx : 0);
      lat = -0.95 + ((numId % 10) - 5) * 0.002;
      lng = -80.73 + (((numId * 3) % 10) - 5) * 0.002;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 0.8 });
    }
  }, [targetNavList, selectedActiveNodeIndex, nodos]);

  // Keep ref up to date for Leaflet control button
  centerCurrentNodeRef.current = handleCenterCurrentNode;

  // Dynamic location subtitle text for selected node (Clean location name only, no lat/lng)
  const currentNodeLocationText = React.useMemo(() => {
    if (!targetNavList || targetNavList.length === 0) return 'Ubicación y navegación en tiempo real';
    const curr = targetNavList[selectedActiveNodeIndex];
    if (!curr) return 'Ubicación y navegación en tiempo real';

    const ubiMatch = ubicaciones.find(u => String(u.id) === String(curr.ubicacion_id));
    const locationName = curr.ubicacion_nombre || ubiMatch?.nombre || 'Campus ULEAM Manta';

    return locationName;
  }, [targetNavList, selectedActiveNodeIndex, ubicaciones]);

  const formatEcuadorDateTime = (val) => {
    if (!val) return '';
    let d;
    if (typeof val === 'number') {
      d = new Date(val > 1e11 ? val : val * 1000);
    } else if (typeof val === 'string') {
      if (val.includes('/') && val.includes(':')) return val;
      const isoStr = val.includes(' ') && !val.includes('T') ? val.replace(' ', 'T') : val;
      d = new Date(isoStr);
    } else if (val instanceof Date) {
      d = val;
    } else {
      return '';
    }

    if (isNaN(d.getTime())) return '';

    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // Helper to generate smooth realistic stream fallback data if backend live history is empty
  const generateMockLiveData = React.useCallback((selections) => {
    if (!selections || selections.length === 0) return [];
    const now = new Date();
    const points = [];
    const pad = (n) => String(n).padStart(2, '0');

    for (let i = 12; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 45 * 1000);
      const timeStr = `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
      const fullDateTimeStr = `${pad(t.getDate())}/${pad(t.getMonth() + 1)}/${t.getFullYear()} ${timeStr}`;
      const point = { time: timeStr, fullDateTime: fullDateTimeStr };

      selections.forEach(sel => {
        const key = `${sel.serial_number}_${sel.clave_mqtt}`;
        let baseVal = 24.5;
        const nameLower = (sel.nombre_var || '').toLowerCase();
        if (nameLower.includes('humedad')) baseVal = 65.0;
        else if (nameLower.includes('ph')) baseVal = 7.2;
        else if (nameLower.includes('presion') || nameLower.includes('presión')) baseVal = 1013;
        else if (nameLower.includes('conductividad')) baseVal = 450;
        else if (nameLower.includes('oxigeno') || nameLower.includes('oxígeno')) baseVal = 6.8;

        const noise = (Math.sin(i * 0.8 + (sel.serial_number ? sel.serial_number.length : 1)) * 2.2) + ((Math.random() - 0.5) * 0.6);
        point[key] = parseFloat((baseVal + noise).toFixed(2));
      });

      points.push(point);
    }

    return points;
  }, []);

  // Auto-center map on Node #1 ONCE when targetNavList is first available
  useEffect(() => {
    if (!hasInitialCenteredRef.current && targetNavList.length > 0 && mapInstanceRef.current) {
      hasInitialCenteredRef.current = true;
      setSelectedActiveNodeIndex(0);
      const node1 = targetNavList[0];
      let lat = parseFloat(node1.latitud);
      let lng = parseFloat(node1.longitud);
      if (isNaN(lat) || isNaN(lng)) {
        const numId = Number(node1.id) || 0;
        lat = -0.95 + ((numId % 10) - 5) * 0.002;
        lng = -80.73 + (((numId * 3) % 10) - 5) * 0.002;
      }
      mapInstanceRef.current.setView([lat, lng], 15);
    }
  }, [targetNavList]);

  // Auto-seleccionar Categoría 1 por defecto al cargar las categorías
  useEffect(() => {
    if (categorias && categorias.length > 0 && (!selectedTelemetryCategory || !categorias.some(c => c.nombre === selectedTelemetryCategory))) {
      setSelectedTelemetryCategory(categorias[0].nombre);
    }
  }, [categorias, selectedTelemetryCategory]);

  // Nodos pertenecientes a la categoría seleccionada
  const currentCategoryNodes = React.useMemo(() => {
    if (!selectedTelemetryCategory || !nodos) return [];
    return nodos.filter(n => n.categoria === selectedTelemetryCategory);
  }, [nodos, selectedTelemetryCategory]);

  // Computed current telemetry node and active applied selections
  const currentTelemetryNode = React.useMemo(() => {
    if (!currentCategoryNodes || currentCategoryNodes.length === 0) return null;
    return currentCategoryNodes.find(n => n.serial_number === selectedTelemetryNodeSerial) || currentCategoryNodes[0] || null;
  }, [currentCategoryNodes, selectedTelemetryNodeSerial]);

  const appliedSelections = React.useMemo(() => {
    if (!currentTelemetryNode) return [];
    const lecturas = currentTelemetryNode.lecturas || [];
    return lecturas
      .filter(l => checkedVarKeys.includes(l.data_type))
      .map(l => ({
        serial_number: currentTelemetryNode.serial_number,
        nombre_nodo: currentTelemetryNode.nombre,
        clave_mqtt: l.data_type,
        nombre_var: l.tipo,
        unidad: l.unidad
      }));
  }, [currentTelemetryNode, checkedVarKeys]);

  // Unidad de medida de la primera variable activa seleccionada
  const activeSelectedUnit = React.useMemo(() => {
    if (!currentTelemetryNode?.lecturas || checkedVarKeys.length === 0) return null;
    const selectedLectura = currentTelemetryNode.lecturas.find(l => checkedVarKeys.includes(l.data_type));
    return selectedLectura ? selectedLectura.unidad : null;
  }, [currentTelemetryNode, checkedVarKeys]);

  // Determinación de Eje Y (Izquierdo para valores normales, Derecho para magnitudes grandes)
  const getAxisForSelection = React.useCallback((sel) => {
    if (appliedSelections.length <= 1) return 'left';
    const dataKey = `${sel.serial_number}_${sel.clave_mqtt}`;
    let maxVal = 0;
    (liveData || []).forEach(item => {
      if (item && item[dataKey] !== undefined && item[dataKey] !== null) {
        const val = Math.abs(parseFloat(item[dataKey]));
        if (!isNaN(val) && val > maxVal) maxVal = val;
      }
    });
    return maxVal > 100 ? 'right' : 'left';
  }, [liveData, appliedSelections]);

  const hasRightAxisVariables = React.useMemo(() => {
    return appliedSelections.some(sel => getAxisForSelection(sel) === 'right');
  }, [appliedSelections, getAxisForSelection]);

  // Helper para extraer hora HH:mm:ss y fecha completa de cualquier payload telemétrico
  const extractTimeAndDate = (item) => {
    if (!item) return { time: '', fullDateTime: '' };

    let shortT = item.shortTime || item.time;
    let fullT = item.fullDateTime || item.dateTime;

    if (shortT && typeof shortT === 'string' && shortT.length === 8 && shortT.includes(':')) {
      // Ya tiene formato "HH:mm:ss"
    } else if (fullT && typeof fullT === 'string') {
      if (fullT.includes(' ')) {
        const parts = fullT.trim().split(' ');
        shortT = parts[parts.length - 1];
      } else if (fullT.includes('T')) {
        shortT = fullT.split('T')[1].split('.')[0];
      } else if (fullT.includes(',')) {
        shortT = fullT.split(', ')[1];
      }
    } else if (item.created_at) {
      const d = new Date(item.created_at);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        shortT = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        fullT = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${shortT}`;
      }
    } else if (item.timestamp) {
      const ts = typeof item.timestamp === 'number' ? (item.timestamp > 1e11 ? item.timestamp : item.timestamp * 1000) : Date.now();
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        shortT = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        fullT = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${shortT}`;
      }
    }

    if (!shortT) {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      shortT = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      fullT = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${shortT}`;
    }

    if (shortT) shortT = shortT.replace(/\s*([ap]\.?m\.?|AM|PM)/gi, '').trim();

    return { time: shortT, fullDateTime: fullT || shortT };
  };

  // Helper para formatear cualquier item de telemetría hacia la estructura de Recharts
  const formatTelemetryItemToPoint = (item, selections) => {
    const { time, fullDateTime } = extractTimeAndDate(item);
    const pt = { time, fullDateTime };

    selections.forEach(sel => {
      const dataKey = `${sel.serial_number}_${sel.clave_mqtt}`;
      let val = undefined;

      if (item[dataKey] !== undefined && item[dataKey] !== null) {
        val = parseFloat(item[dataKey]);
      } else if (item[sel.clave_mqtt] !== undefined && item[sel.clave_mqtt] !== null) {
        val = parseFloat(item[sel.clave_mqtt]);
      } else if (item.data_type === sel.clave_mqtt && (item.valor !== undefined || item.value !== undefined)) {
        val = parseFloat(item.valor ?? item.value);
      }

      if (val !== undefined && !isNaN(val)) {
        pt[dataKey] = val;
      }
    });

    return pt;
  };

  const appliedSelectionsKey = React.useMemo(() => JSON.stringify(appliedSelections), [appliedSelections]);
  const lecturasTypesKey = React.useMemo(() => currentTelemetryNode?.lecturas?.map(l => l.data_type).join(',') || '', [currentTelemetryNode]);

  // Cargar historial telemétrico en una ÚNICA llamada a la API por nodo y fecha (sirve para gráfico y tarjetas KPI)
  useEffect(() => {
    if (!currentTelemetryNode || !currentTelemetryNode.lecturas || currentTelemetryNode.lecturas.length === 0) {
      setLiveData([]);
      setAllVarsLiveData([]);
      return;
    }

    const serial = currentTelemetryNode.serial_number;
    const allSelections = currentTelemetryNode.lecturas.map(l => ({
      serial_number: serial,
      nombre_nodo: currentTelemetryNode.nombre,
      clave_mqtt: l.data_type,
      nombre_var: l.tipo,
      unidad: l.unidad
    }));

    if (liveMode) {
      // ── MODO EN VIVO (WEBSOCKETS PUROS & BUFFER INICIAL) ──
      const fetchLiveBuffer = async () => {
        try {
          const res = await fetchDeduplicated(`${API_BASE_URL}/lecturas/recientes?serial_number=${serial}&live=1&limit=15`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const formattedPoints = data.map(item => formatTelemetryItemToPoint(item, allSelections));
              setLiveData(formattedPoints);
              setAllVarsLiveData(formattedPoints);
            }
          }
        } catch (e) {
          console.error("Error loading live buffer:", e);
        }
      };

      fetchLiveBuffer();

    } else {
      // ── MODO BASE DE DATOS (HISTORIAL ESTÁTICO POR FECHA - 1 SOLA PETICIÓN PARA TODAS LAS VARIABLES) ──
      fetchDeduplicated(`${API_BASE_URL}/lecturas/live-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ selections: allSelections, fecha: selectedDate })
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLiveData(data);
            setAllVarsLiveData(data);
          } else {
            setLiveData([]);
            setAllVarsLiveData([]);
          }
        })
        .catch(err => {
          console.error("Error fetching live history for selected date:", err);
          setLiveData([]);
          setAllVarsLiveData([]);
        });
    }

  }, [currentTelemetryNode?.serial_number, selectedDate, liveMode, lecturasTypesKey]);

  // WebSockets para Telemetría en Vivo: Suscripción ÚNICA sin duplicaciones
  useEffect(() => {
    if (appliedSelections.length === 0 || selectedDate !== todayDateStr) return;

    const serial = currentTelemetryNode?.serial_number;
    if (!serial) return;

    let channel;
    try {
      channel = echo.channel(`telemetry.${serial}`);
      channel.listen('.LecturaRecibida', (e) => {
        const newData = e.data || e;
        if (!newData) return;

        // 1. Actualizar el gráfico de líneas/barras (solo en modo en vivo liveMode)
        if (liveMode) {
          const pt = formatTelemetryItemToPoint(newData, appliedSelections);
          setLiveData(prev => {
            if (!prev || prev.length === 0) return [pt];
            const last = prev[prev.length - 1];

            // Si la última lectura tiene la misma hora/fecha, se fusionan los datos
            if ((pt.fullDateTime && last.fullDateTime === pt.fullDateTime) || (pt.time && last.time === pt.time)) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...last, ...pt };
              return updated;
            }

            // Evitar duplicados comprobando si ya existe en cualquier punto del historial
            const existingIdx = prev.findIndex(item =>
              (pt.fullDateTime && item.fullDateTime === pt.fullDateTime) ||
              (pt.time && item.time === pt.time)
            );
            if (existingIdx !== -1) {
              const updated = [...prev];
              updated[existingIdx] = { ...updated[existingIdx], ...pt };
              return updated;
            }

            const next = [...prev, pt];
            return next.length > 15 ? next.slice(-15) : next;
          });
        }

        // 2. Actualizar las tarjetas KPI inferiores (todas las variables del nodo)
        if (currentTelemetryNode?.lecturas && currentTelemetryNode.lecturas.length > 0) {
          const allSelections = currentTelemetryNode.lecturas.map(l => ({
            serial_number: currentTelemetryNode.serial_number,
            nombre_nodo: currentTelemetryNode.nombre,
            clave_mqtt: l.data_type,
            nombre_var: l.tipo,
            unidad: l.unidad
          }));
          const ptAll = formatTelemetryItemToPoint(newData, allSelections);
          setAllVarsLiveData(prev => {
            if (!prev || prev.length === 0) return [ptAll];
            const last = prev[prev.length - 1];

            if ((ptAll.fullDateTime && last.fullDateTime === ptAll.fullDateTime) || (ptAll.time && last.time === ptAll.time)) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...last, ...ptAll };
              return updated;
            }

            const existingIdx = prev.findIndex(item =>
              (ptAll.fullDateTime && item.fullDateTime === ptAll.fullDateTime) ||
              (ptAll.time && item.time === ptAll.time)
            );
            if (existingIdx !== -1) {
              const updated = [...prev];
              updated[existingIdx] = { ...updated[existingIdx], ...ptAll };
              return updated;
            }

            const next = [...prev, ptAll];
            return next.length > 30 ? next.slice(-30) : next;
          });
        }
      });
    } catch (err) {
      console.warn("WebSocket channel error in Dashboard:", err);
    }

    return () => {
      if (channel) {
        channel.stopListening('.LecturaRecibida');
        try { echo.leaveChannel(`telemetry.${serial}`); } catch (_) {}
      }
    };
  }, [appliedSelections, selectedDate, todayDateStr, liveMode, currentTelemetryNode?.serial_number, currentTelemetryNode?.lecturas]);

  // Pre-seleccionar la 1ra variable por defecto si no hay ningún nodo telemétrico seleccionado
  useEffect(() => {
    if (currentCategoryNodes.length > 0 && !selectedTelemetryNodeSerial) {
      const firstNode = currentCategoryNodes[0];
      setSelectedTelemetryNodeSerial(firstNode.serial_number);
      if (firstNode.lecturas && firstNode.lecturas.length > 0) {
        setCheckedVarKeys([firstNode.lecturas[0].data_type]);
      } else {
        setCheckedVarKeys([]);
      }
    }
  }, [currentCategoryNodes, selectedTelemetryNodeSerial]);

  // Handler para seleccionar una categoría en el menú desplegable de la telemetría
  const handleSelectTelemetryCategory = (catName) => {
    setSelectedTelemetryCategory(catName);
    setCategoryDropdownOpen(false);
    setNodeDropdownOpen(false);

    const catNodes = (nodos || []).filter(n => n.categoria === catName);
    if (catNodes.length > 0) {
      const firstNode = catNodes[0];
      setSelectedTelemetryNodeSerial(firstNode.serial_number);
      if (firstNode.lecturas && firstNode.lecturas.length > 0) {
        setCheckedVarKeys([firstNode.lecturas[0].data_type]);
      } else {
        setCheckedVarKeys([]);
      }
    } else {
      setSelectedTelemetryNodeSerial('');
      setCheckedVarKeys([]);
    }
  };

  // Handler para navegación de nodos dentro de la misma categoría con flechas (< y >)
  const handleNavigateTelemetryNode = (direction) => {
    if (!currentCategoryNodes || currentCategoryNodes.length <= 1) return;
    const currentIdx = currentCategoryNodes.findIndex(n => n.serial_number === selectedTelemetryNodeSerial);
    let newIdx = 0;
    if (direction === 'next') {
      newIdx = (currentIdx + 1) % currentCategoryNodes.length;
    } else {
      newIdx = (currentIdx - 1 + currentCategoryNodes.length) % currentCategoryNodes.length;
    }
    const nextNode = currentCategoryNodes[newIdx];
    if (nextNode) {
      setSelectedTelemetryNodeSerial(nextNode.serial_number);
      if (nextNode.lecturas && nextNode.lecturas.length > 0) {
        setCheckedVarKeys([nextNode.lecturas[0].data_type]);
      } else {
        setCheckedVarKeys([]);
      }
    }
  };

  // Resetear selección a la 1ra variable al cambiar de nodo (preservando la fecha elegida)
  useEffect(() => {
    if (currentTelemetryNode?.lecturas && currentTelemetryNode.lecturas.length > 0) {
      const defaultKey = currentTelemetryNode.lecturas[0].data_type;
      setCheckedVarKeys(prev => {
        if (prev.length === 1 && prev[0] === defaultKey) return prev;
        const availableKeys = currentTelemetryNode.lecturas.map(l => l.data_type);
        const validPrev = prev.filter(k => availableKeys.includes(k));
        if (validPrev.length > 0) return prev;
        return [defaultKey];
      });
    } else {
      setCheckedVarKeys(prev => (prev.length === 0 ? prev : []));
    }
  }, [currentTelemetryNode?.serial_number]);

  const handleToggleByUnitMode = () => {
    setIsByUnitMode(prev => {
      const nextMode = !prev;
      if (!nextMode) {
        // Al desmarcar "Marcar por unidad": si hay 1 sola variable marcada, se queda en la actual.
        // Si hay 2 o más marcadas, redirige a la primera variable del nodo.
        if (checkedVarKeys.length > 1) {
          if (currentTelemetryNode?.lecturas && currentTelemetryNode.lecturas.length > 0) {
            setCheckedVarKeys([currentTelemetryNode.lecturas[0].data_type]);
          }
        }
      }
      return nextMode;
    });
  };

  // Handler para selección de variables (Navegación libre por defecto vs Multiselección por Unidad)
  const handleToggleVarKey = (varKey) => {
    if (!currentTelemetryNode?.lecturas) return;
    const targetVar = currentTelemetryNode.lecturas.find(l => l.data_type === varKey);
    if (!targetVar) return;

    if (!isByUnitMode) {
      // Modo Navegación Libre por defecto: muestra únicamente la variable seleccionada sin restricciones de unidad
      setCheckedVarKeys([varKey]);
    } else {
      // Modo Multiselección por Unidad: permite marcar múltiples variables sólo si pertenecen a la misma unidad
      setCheckedVarKeys(prev => {
        if (prev.includes(varKey)) {
          const next = prev.filter(k => k !== varKey);
          if (next.length === 0) {
            return [varKey]; // Mantener al menos 1 variable seleccionada
          }
          return next;
        } else {
          const firstSelected = currentTelemetryNode.lecturas.find(l => prev.includes(l.data_type));
          if (!firstSelected || firstSelected.unidad === targetVar.unidad) {
            return [...prev, varKey];
          }
          return prev;
        }
      });
    }
  };

  const handleRemoveFilter = (index) => {
    const updated = pendingSelections.filter((_, i) => i !== index);
    setPendingSelections(updated);
    setAppliedSelections(updated);
    localStorage.setItem('dashboardFilters', JSON.stringify(updated));
  };

  const handleApplyFilters = () => {
    if (pendingSelections.length === 0) {
      alert("Debes seleccionar al menos una variable.");
      return;
    }
    setAppliedSelections([...pendingSelections]);
    localStorage.setItem('dashboardFilters', JSON.stringify(pendingSelections));

    const id = Date.now();
    setToasts(prev => [...prev, { id, msg: "Filtros aplicados correctamente al gráfico" }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const totalNodos = nodos.length;
  const totalUbicaciones = ubicaciones.length;
  const totalNoticias = noticias.length;

  // 1. DOUGHNUT RADIAL PERCENTAGE (Right visual card - Dynamic multi-category distribution)
  const doughnutGradient = React.useMemo(() => {
    if (!nodos || nodos.length === 0 || !categorias || categorias.length === 0) {
      return { background: `conic-gradient(#0f2c59 0% 100%)` };
    }

    const defaultColors = ['#ff9f1c', '#0f2c59', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'];
    let currentPct = 0;
    const gradientStops = [];

    categorias.forEach((cat, idx) => {
      const count = nodos.filter(n => n.categoria === cat.nombre).length;
      if (count > 0) {
        const pct = (count / nodos.length) * 100;
        const color = cat.colorHex || defaultColors[idx % defaultColors.length];
        gradientStops.push(`${color} ${currentPct}% ${currentPct + pct}%`);
        currentPct += pct;
      }
    });

    if (gradientStops.length === 0) {
      return { background: `conic-gradient(#0f2c59 0% 100%)` };
    }

    if (currentPct < 100) {
      gradientStops.push(`#cbd5e1 ${currentPct}% 100%`);
    }

    return { background: `conic-gradient(${gradientStops.join(', ')})` };
  }, [nodos, categorias]);

  // 2. DOUBLE MONTHLY BAR CHART DATA (Center Card)
  // Months Jan to Sep
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

  // Real counts derived from node timestamp IDs
  const realSeries1 = Array(9).fill(0); // Primary Category
  const realSeries2 = Array(9).fill(0); // Others

  nodos.forEach(nodo => {
    let date;
    try {
      date = new Date(Number(nodo.id));
    } catch (e) {
      date = new Date();
    }
    const m = date.getMonth(); // 0-11
    if (m >= 0 && m < 9) {
      if (nodo.categoria === firstCatName) {
        realSeries1[m] += 1;
      } else {
        realSeries2[m] += 1;
      }
    }
  });

  // Base historic registrations to populate the chart beautifully like the mockup image
  const baseSeries1 = [2, 4, 3, 5, 2, 6, 2, 3, 2];
  const baseSeries2 = [1, 3, 2, 4, 3, 2, 4, 2, 5];

  // Combine baseline + real records
  const finalSeries1 = baseSeries1.map((val, idx) => val + realSeries1[idx]);
  const finalSeries2 = baseSeries2.map((val, idx) => val + realSeries2[idx]);

  const maxBarValue = Math.max(...finalSeries1, ...finalSeries2, 1);

  // We find which month index has the peak registration to display the tooltip pointer (mockup details)
  const maxMonthIdx = finalSeries1.indexOf(Math.max(...finalSeries1));

  // 3. CALENDAR WIDGET DETAILS (Bottom Card Right Column)
  const today = new Date();
  const currentMonthName = today.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Find node creation days in current month to highlight in navy
  const nodeDays = nodos.map(nodo => {
    try {
      const d = new Date(Number(nodo.id));
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        return d.getDate();
      }
    } catch (e) { }
    return null;
  }).filter(Boolean);

  // Calendar cells mapping helper
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay(); // 0: Sunday, 1: Monday...

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const calendarCells = [];
  // Push empty placeholder days
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push({ dayNum: '', isEmpty: true });
  }
  // Push actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === currentDay;
    const isNodeDay = nodeDays.includes(d);
    calendarCells.push({ dayNum: d, isEmpty: false, isToday, isNodeDay });
  }

  // 4. DOUBLE AREA WAVE SVG SHAPE SCALE (Bottom Card Left Column)
  // Scale height slightly based on real metric/sensor entries
  const totalLecturas = nodos.reduce((acc, n) => acc + (n.lecturas?.length || 0), 0);
  const navyWaveOffset = Math.min(totalLecturas * 3, 25);
  const orangeWaveOffset = Math.min(totalNodos * 4, 20);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="spinner-dot" style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#2563eb', animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
          <span style={{ fontSize: '1.05rem', fontWeight: '600', color: '#475569' }}>
            {language === 'en' ? 'Loading dashboard...' : 'Cargando dashboard general...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">

      {/* TOP ROW: 4 KPI CARDS MATCHING MOCKUP */}
      <div className="kpi-row">
        {/* Card 1: Highlighted Navy Card */}
        <div className="kpi-card highlighted">
          <div className="kpi-card-header">
            <span className="kpi-card-title">{language === 'en' ? 'Active Nodes' : 'Nodos Activos'}</span>
            <div className="kpi-card-icon">
              <NodesIcon />
            </div>
          </div>
          <h2 className="kpi-card-value notranslate" translate="no">{totalNodos}</h2>
        </div>

        {/* Card 2: Ubicaciones */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">{language === 'en' ? 'Locations' : 'Ubicaciones'}</span>
            <div className="kpi-card-icon">
              <LocationsIcon />
            </div>
          </div>
          <h2 className="kpi-card-value notranslate" translate="no">{totalUbicaciones}</h2>
        </div>

        {/* Card 3: Usuarios */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">{language === 'en' ? 'Users' : 'Usuarios'}</span>
            <div className="kpi-card-icon">
              <UsersIcon />
            </div>
          </div>
          <h2 className="kpi-card-value notranslate" translate="no">{totalUsuarios}</h2>
        </div>

        {/* Card 4: Artículos/Noticias */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">{language === 'en' ? 'Dissemination' : 'Divulgación'}</span>
            <div className="kpi-card-icon">
              <StarIcon />
            </div>
          </div>
          <h2 className="kpi-card-value notranslate" translate="no">{totalNoticias}</h2>
        </div>
      </div>

      {/* MAIN ROW: COMPARATIVE BAR CHART AND CIRCULAR doughnut */}
      <div className="dashboard-main-grid">

        {/* CENTER COLUMN: Leaflet Map */}
        <div className="visual-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="visual-card-header" style={{ padding: '1.25rem 1.5rem 0.5rem 1.5rem', marginBottom: '0.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <h3 className="visual-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", fontSize: '1.15rem', fontWeight: 800, color: '#0f2c59', letterSpacing: '-0.01em' }}>
                {language === 'en' ? 'Node Map' : 'Mapa de Nodos'}
                {nodos.length > 0 && (
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: '#f1f5f9', color: '#0f2c59', border: '1px solid #cbd5e1', fontWeight: 700 }}>
                    {nodos.length} {language === 'en' ? 'Nodes' : 'Nodo'}{nodos.length !== 1 ? 's' : ''} ({activeNodos.length} {language === 'en' ? 'Active' : 'Activo'}{activeNodos.length !== 1 ? 's' : ''})
                  </span>
                )}
              </h3>
              <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', fontWeight: 600 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={targetNavList[selectedActiveNodeIndex]?.is_online ? "#10b981" : "#64748b"} strokeWidth="2.5" width="13" height="13" style={{ flexShrink: 0 }}>
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                  <circle cx="12" cy="10" r="3" fill={targetNavList[selectedActiveNodeIndex]?.is_online ? "#10b981" : "#64748b"} />
                </svg>
                <span style={{ color: '#0f2c59', fontWeight: 700 }}>{language === 'en' ? 'Location:' : 'Ubicación:'}</span> {currentNodeLocationText}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginRight: '2px' }}>{language === 'en' ? 'Map View:' : 'Vista de mapa:'}</span>
              {/* Map Layer Switcher Tabs: Mapa | Satélite */}
              <div className="dash-map-style-selector">
                <button
                  type="button"
                  onClick={() => setMapStyle('google')}
                  className={`dash-btn-style ${mapStyle === 'google' ? 'active' : ''}`}
                  title={language === 'en' ? "Standard Google Maps" : "Google Maps Estándar"}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" style={{ marginRight: '4px' }}>
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                    <line x1="9" y1="3" x2="9" y2="18" />
                    <line x1="15" y1="6" x2="15" y2="21" />
                  </svg>
                  {language === 'en' ? 'Map' : 'Mapa'}
                </button>
                <button
                  type="button"
                  onClick={() => setMapStyle('satellite')}
                  className={`dash-btn-style ${mapStyle === 'satellite' ? 'active' : ''}`}
                  title={language === 'en' ? "Satellite Google Maps" : "Google Maps Satélite (Híbrido)"}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" style={{ marginRight: '4px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  {language === 'en' ? 'Satellite' : 'Satélite'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '340px', width: '100%', position: 'relative' }}>
            <div ref={mapContainerRef} style={{ height: '100%', width: '100%', minHeight: '340px' }}></div>

            {/* Floating Navigation Controls Overlay inside the Map */}
            {targetNavList.length > 0 && (
              <div className="dash-map-nav-overlay">
                <button
                  type="button"
                  className="dash-map-nav-btn"
                  onClick={() => handleNavigateNode('prev')}
                  title={language === 'en' ? "Previous node" : "Nodo anterior"}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <div className="dash-map-nav-info">
                  <span className="dash-map-nav-badge">
                    {targetNavList[selectedActiveNodeIndex]?.is_online && activeNodeNumberMap[targetNavList[selectedActiveNodeIndex]?.serial_number || targetNavList[selectedActiveNodeIndex]?.id] ? (
                      `${language === 'en' ? 'Node' : 'Nodo'} #${activeNodeNumberMap[targetNavList[selectedActiveNodeIndex]?.serial_number || targetNavList[selectedActiveNodeIndex]?.id]} (${selectedActiveNodeIndex + 1}/${targetNavList.length})`
                    ) : (
                      `${selectedActiveNodeIndex + 1} / ${targetNavList.length}`
                    )}
                  </span>
                  <span className="dash-map-nav-name">
                    {targetNavList[selectedActiveNodeIndex]?.nombre || (language === 'en' ? 'Selecting node...' : 'Seleccionando nodo...')}
                  </span>
                  <span className={`dash-map-nav-status ${targetNavList[selectedActiveNodeIndex]?.is_online ? 'online' : 'offline'}`}>
                    {targetNavList[selectedActiveNodeIndex]?.is_online
                      ? (language === 'en' ? '● Online' : '● Activo')
                      : (language === 'en' ? '○ Offline' : '○ Inactivo')}
                  </span>
                </div>

                <button
                  type="button"
                  className="dash-map-nav-btn"
                  onClick={() => handleNavigateNode('next')}
                  title={language === 'en' ? "Next node" : "Siguiente nodo"}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Doughnut percentage visualizer */}
        <div className="visual-card">
          <div className="visual-card-header" style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="visual-card-title" style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", fontSize: '1.15rem', fontWeight: 800, color: '#0f2c59', letterSpacing: '-0.01em' }}>
              {language === 'en' ? 'Distribution' : 'Distribución'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
              <span className="notranslate" translate="no">{categorias.length}</span> {language === 'en' ? 'Categories' : `Categoría${categorias.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          <div className="radial-container">
            <div className="radial-progress-ring" style={doughnutGradient}>
              <div className="radial-progress-mask">
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                  <strong className="notranslate" translate="no" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f2c59' }}>{totalNodos}</strong>
                  <small style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
                    {totalNodos === 1 ? (language === 'en' ? 'Node' : 'Nodo') : (language === 'en' ? 'Nodes' : 'Nodos')}
                  </small>
                </span>
              </div>
            </div>

            <div className="radial-list">
              {categorias.map((cat, idx) => {
                const count = nodos.filter(n => n.categoria === cat.nombre).length;
                const defaultColors = ['#ff9f1c', '#0f2c59', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'];
                const dotColor = cat.colorHex || defaultColors[idx % defaultColors.length];
                const pct = totalNodos > 0 ? Math.round((count / totalNodos) * 100) : 0;
                return (
                  <div className="radial-list-item" key={cat.id || idx}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <span className="radial-list-dot" style={{ backgroundColor: dotColor, flexShrink: 0 }} />
                      <span className="radial-list-name" title={cat.nombre} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cat.nombre}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span className="radial-list-val notranslate" translate="no" style={{ fontWeight: 800 }}>{count}</span>
                      <span className="notranslate" translate="no" style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>({pct}%)</span>
                    </div>
                  </div>
                );
              })}
              {categorias.length === 0 && (
                <p className="text-xs text-gray-500 italic text-center py-2">
                  {language === 'en' ? 'No registered categories.' : 'No hay categorías registradas.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: TELEMETRY CHART AND NODE NAVIGATION */}
      <div className="bottom-sections-row" style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <div className="bottom-widget-card" style={{ display: 'block', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>

            {/* SECCIÓN 1: CONTROLES DE NAVEGACIÓN Y RUTA DE NODO FIJA */}
            <div style={{ marginBottom: '1.2rem', width: '100%', maxWidth: '100%', minWidth: 0 }}>

              {/* Fila 1: Selectores de Categoría y Nodo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

                  {/* SELECTOR 1: Categoría Dropdown */}
                  <div ref={categoryDropdownRef} style={{ position: 'relative', flexShrink: 0, zIndex: 100 }}>
                    <button
                      type="button"
                      className="dash-select-trigger"
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      style={{
                        height: '38px',
                        padding: '0 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #0f2c59',
                        background: '#0f2c59',
                        color: '#ffffff',
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(15, 44, 89, 0.2)'
                      }}
                      title={language === 'en' ? "Select Category" : "Seleccionar Categoría"}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{language === 'en' ? 'Category:' : 'Categoría:'} <strong>{selectedTelemetryCategory || 'Categoría 1'}</strong></span>
                      <svg className={`dash-select-chevron ${categoryDropdownOpen ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Menú Desplegable de Categorías (Montado por encima con alto zIndex) */}
                    {categoryDropdownOpen && (
                      <div className="custom-dropdown-menu" style={{ position: 'absolute', top: '105%', left: 0, minWidth: '240px', zIndex: 10000, boxShadow: '0 12px 30px rgba(0,0,0,0.22)', borderRadius: '12px', background: '#fff', border: '1px solid #cbd5e1', padding: '4px' }}>
                        <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                          {categorias.map((cat, idx) => {
                            const catNodes = nodos.filter(n => n.categoria === cat.nombre);
                            const isSel = cat.nombre === selectedTelemetryCategory;
                            return (
                              <div
                                key={cat.id || idx}
                                onClick={() => handleSelectTelemetryCategory(cat.nombre)}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.83rem',
                                  fontWeight: isSel ? 800 : 600,
                                  color: isSel ? '#2563eb' : '#334155',
                                  background: isSel ? '#eff6ff' : 'transparent',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: '2px'
                                }}
                              >
                                <span>{cat.nombre}</span>
                                <small style={{ fontSize: '0.72rem', color: catNodes.length > 0 ? '#2563eb' : '#94a3b8', fontStyle: catNodes.length === 0 ? 'italic' : 'normal' }}>
                                  {catNodes.length > 0 ? `(${catNodes.length} ${language === 'en' ? 'nodes' : 'nodos'})` : (language === 'en' ? 'No nodes' : 'Sin nodos')}
                                </small>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SI LA CATEGORÍA NO TIENE NODOS */}
                  {currentCategoryNodes.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', fontStyle: 'italic', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" width="16" height="16">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      {language === 'en' ? 'No nodes in this category' : 'No hay nodos en esta categoría'}
                    </div>
                  ) : (
                    <>
                      {/* Flecha Anterior < */}
                      <button
                        type="button"
                        className="dash-map-nav-btn"
                        disabled={currentCategoryNodes.length <= 1}
                        onClick={() => handleNavigateTelemetryNode('prev')}
                        title={currentCategoryNodes.length <= 1 ? (language === 'en' ? "No more nodes in this category" : "No hay más nodos en esta categoría") : (language === 'en' ? "Previous node" : "Nodo anterior")}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: currentCategoryNodes.length <= 1 ? '#f1f5f9' : '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          color: currentCategoryNodes.length <= 1 ? '#94a3b8' : '#0f2c59',
                          cursor: currentCategoryNodes.length <= 1 ? 'not-allowed' : 'pointer',
                          opacity: currentCategoryNodes.length <= 1 ? 0.45 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: currentCategoryNodes.length <= 1 ? 'none' : '0 2px 4px rgba(0,0,0,0.04)',
                          flexShrink: 0,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>

                      {/* SELECTOR 2: Selector de Nodos Dropdown */}
                      <div ref={nodeDropdownRef} style={{ position: 'relative', flexShrink: 0, zIndex: 100 }}>
                        <button
                          type="button"
                          className="dash-select-trigger"
                          onClick={() => setNodeDropdownOpen(!nodeDropdownOpen)}
                          style={{ height: '38px', padding: '0 14px', borderRadius: '10px', border: '1.5px solid #2563eb', background: '#eff6ff', color: '#0f2c59', fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.12)' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" width="16" height="16">
                            <rect x="2" y="2" width="20" height="8" rx="2" />
                            <rect x="2" y="14" width="20" height="8" rx="2" />
                          </svg>
                          <span className="notranslate" translate="no">{currentTelemetryNode ? currentTelemetryNode.nombre : (language === 'en' ? 'Select Node' : 'Seleccionar Nodo')}</span>
                          <svg className={`dash-select-chevron ${nodeDropdownOpen ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {/* Menú Desplegable de Nodos de esta Categoría (Montado por encima con alto zIndex) */}
                        {nodeDropdownOpen && (
                          <div className="custom-dropdown-menu" style={{ position: 'absolute', top: '105%', left: 0, minWidth: '280px', zIndex: 10000, boxShadow: '0 12px 30px rgba(0,0,0,0.22)', borderRadius: '12px', background: '#fff', border: '1px solid #cbd5e1', padding: '6px' }}>
                            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                              {currentCategoryNodes.map((n, idx) => {
                                const ubiName = n.ubicacion_nombre || ubicaciones.find(u => String(u.id) === String(n.ubicacion_id))?.nombre || 'Campus ULEAM';
                                const isSelected = n.serial_number === selectedTelemetryNodeSerial;
                                return (
                                  <div
                                    key={n.serial_number || idx}
                                    onClick={() => {
                                      if (selectedTelemetryNodeSerial !== n.serial_number) {
                                        triggerContentLoading();
                                        setSelectedTelemetryNodeSerial(n.serial_number);
                                        localStorage.setItem('shared_node_id', String(n.id));
                                        localStorage.setItem('shared_node_serial', String(n.serial_number));
                                      }
                                      if (n.lecturas && n.lecturas.length > 0) {
                                        setCheckedVarKeys([n.lecturas[0].data_type]);
                                      } else {
                                        setCheckedVarKeys([]);
                                      }
                                      setNodeDropdownOpen(false);
                                    }}
                                    style={{
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      fontSize: '0.82rem',
                                      fontWeight: isSelected ? 800 : 600,
                                      color: isSelected ? '#2563eb' : '#334155',
                                      background: isSelected ? '#eff6ff' : 'transparent',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      marginBottom: '2px',
                                      gap: '8px'
                                    }}
                                  >
                                    <span className="notranslate" translate="no">{n.nombre}</span>
                                    <small className="notranslate" translate="no" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>({ubiName})</small>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Flecha Siguiente > */}
                      <button
                        type="button"
                        className="dash-map-nav-btn"
                        disabled={currentCategoryNodes.length <= 1}
                        onClick={() => handleNavigateTelemetryNode('next')}
                        title={currentCategoryNodes.length <= 1 ? (language === 'en' ? "No more nodes in this category" : "No hay más nodos en esta categoría") : (language === 'en' ? "Next node" : "Siguiente nodo")}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: currentCategoryNodes.length <= 1 ? '#f1f5f9' : '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          color: currentCategoryNodes.length <= 1 ? '#94a3b8' : '#0f2c59',
                          cursor: currentCategoryNodes.length <= 1 ? 'not-allowed' : 'pointer',
                          opacity: currentCategoryNodes.length <= 1 ? 0.45 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: currentCategoryNodes.length <= 1 ? 'none' : '0 2px 4px rgba(0,0,0,0.04)',
                          flexShrink: 0,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Insignia de Estado Activo/Inactivo y Botón de Exportar CSV (Fijos a la Derecha) */}
                {currentTelemetryNode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{
                      background: currentTelemetryNode.is_online ? '#ecfdf5' : '#fef2f2',
                      color: currentTelemetryNode.is_online ? '#047857' : '#dc2626',
                      border: currentTelemetryNode.is_online ? '1px solid #a7f3d0' : '1px solid #fca5a5',
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexShrink: 0
                    }}>
                      {currentTelemetryNode.is_online ? '● ' : '○ '}
                      {currentTelemetryNode.is_online
                        ? (language === 'en' ? 'Online' : 'Activo')
                        : (language === 'en' ? 'Offline' : 'Inactivo')}
                    </span>

                    {/* Botón de Exportar CSV */}
                    <button
                      type="button"
                      onClick={() => setShowExportModal(true)}
                      title={language === 'en' ? "Export node telemetry to CSV" : "Exportar lecturas de este nodo a CSV"}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #93c5fd',
                        borderRadius: '10px',
                        padding: '6px 14px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 5px rgba(37, 99, 235, 0.08)',
                        flexShrink: 0
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" width="16" height="16">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>{language === 'en' ? 'Export CSV' : 'Exportar CSV'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Fila 2: BARRA DE RUTA/BREADCRUMB FIJA EN SU PROPIA LÍNEA (SIEMPRE FIJA ABAJO) */}
              {currentTelemetryNode && (
                <div style={{ width: '100%', marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 800 }}>/</span>
                  <span style={{ color: '#2563eb', fontWeight: 700 }}>{currentTelemetryNode.categoria || 'IoT'}</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 800 }}>/</span>
                  <span className="notranslate" translate="no" style={{ color: '#475569' }}>
                    {currentTelemetryNode.ubicacion_nombre || ubicaciones.find(u => String(u.id) === String(currentTelemetryNode.ubicacion_id))?.nombre || 'Campus ULEAM'}
                  </span>
                  <span style={{ color: '#cbd5e1', fontWeight: 800 }}>/</span>
                  <strong className="notranslate" translate="no" style={{ color: '#0f2c59' }}>{currentTelemetryNode.nombre}</strong>
                </div>
              )}

            </div>

            {/* SECCIÓN 2: SELECCIÓN DE VARIABLES EN ÚNICA LÍNEA CON SCROLL + MENÚ DE FECHA SELECCIONABLE */}
            <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', paddingTop: '0.85rem', paddingBottom: '0.85rem', marginBottom: '1.25rem', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '0.83rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{language === 'en' ? 'Available variables:' : 'Variables disponibles:'}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f2c59', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                      <strong className="notranslate" translate="no">{checkedVarKeys.length}</strong> {language === 'en' ? 'of' : 'de'} <strong className="notranslate" translate="no">{currentTelemetryNode?.lecturas?.length || 0}</strong> {language === 'en' ? 'selected' : 'marcadas'}
                    </span>
                  </label>

                  {/* Menú Interactivo de Selección de Fecha (Superficie 100% interactiva sin anidamientos de HTML inválidos) */}
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <div
                      onClick={handleOpenDatePicker}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#eff6ff',
                        border: '1.5px solid #2563eb',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.12)',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        color: '#0f2c59',
                        userSelect: 'none',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      title={language === 'en' ? "Click to select date" : "Click para seleccionar fecha"}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" width="16" height="16" style={{ pointerEvents: 'none' }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="notranslate" translate="no" style={{ pointerEvents: 'none' }}>
                        {language === 'en' ? 'Date:' : 'Fecha:'} <strong style={{ color: '#2563eb', pointerEvents: 'none' }}>{selectedDate}</strong>
                      </span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" width="14" height="14" style={{ pointerEvents: 'none' }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>

                      <input
                        ref={dateInputRef}
                        id="dash-date-picker"
                        type="date"
                        value={selectedDate}
                        max={todayDateStr}
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedDate(e.target.value);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          zIndex: 10
                        }}
                      />
                    </div>
                    {selectedDate !== todayDateStr && (
                      <button
                        type="button"
                        onClick={() => setSelectedDate(todayDateStr)}
                        style={{
                          marginLeft: '6px',
                          border: '1px solid #bfdbfe',
                          background: '#ffffff',
                          color: '#2563eb',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '5px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                        title={language === 'en' ? 'Reset to today' : 'Volver a la fecha actual'}
                      >
                        {language === 'en' ? 'Today' : 'Hoy'}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Botón Marcar por Unidad (Alternador de modo Navegación Libre vs Multiselección) */}
                  {currentTelemetryNode && (currentTelemetryNode.lecturas?.length > 0) && (
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
                        transition: 'all 0.2s ease'
                      }}
                      title={isByUnitMode ? (language === 'en' ? "Disable unit multi-selection" : "Desactivar multiselección por unidad") : (language === 'en' ? "Enable unit multi-selection" : "Marcar variables por misma unidad de medida")}
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
                        {isByUnitMode ? '✕' : ''}
                      </span>
                      {isByUnitMode
                        ? (language === 'en' ? 'Mark by Unit (Active)' : 'Marcar por unidad (Activo)')
                        : (language === 'en' ? 'Mark by Unit' : 'Marcar por unidad')}
                    </button>
                  )}

                  {isByUnitMode && activeSelectedUnit && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '8px' }}>
                      {language === 'en' ? `Active Unit: ${activeSelectedUnit}` : `Unidad activa: ${activeSelectedUnit}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Lista de Variables en una Sola Línea con Scroll Horizontal Garantizado + Cuadraditos solo si Marcar por Unidad está Activo */}
              <div className="custom-horizontal-scrollbar" style={{
                display: 'flex',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                gap: '8px',
                alignItems: 'center',
                paddingBottom: '10px',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'auto',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}>
                {currentTelemetryNode?.lecturas && currentTelemetryNode.lecturas.length > 0 ? (
                  currentTelemetryNode.lecturas.map((l, idx) => {
                    const isChecked = checkedVarKeys.includes(l.data_type);
                    const isSameUnit = !activeSelectedUnit || l.unidad === activeSelectedUnit;
                    const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
                    const mainColor = palette[idx % palette.length];

                    // Bloqueo de mouse sólo aplica en modo Multiselección "Marcar por Unidad"
                    const isBlocked = isByUnitMode && !isChecked && !isSameUnit;
                    const tooltipText = isBlocked
                      ? (language === 'en' ? `Different measurement units (${l.unidad} vs ${activeSelectedUnit})` : `Unidades de medidas diferentes (${l.unidad} vs ${activeSelectedUnit})`)
                      : isByUnitMode
                        ? (isChecked
                          ? (language === 'en' ? 'Click to deselect variable' : 'Click para desmarcar variable')
                          : (language === 'en' ? 'Click to select and compare variable' : 'Click para seleccionar y comparar variable'))
                        : (language === 'en' ? `Show ${l.tipo} (${l.unidad})` : `Mostrar ${l.tipo} (${l.unidad})`);

                    return (
                      <button
                        key={l.data_type}
                        type="button"
                        disabled={isBlocked}
                        onClick={() => !isBlocked && handleToggleVarKey(l.data_type)}
                        title={tooltipText}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: `1.5px solid ${isBlocked ? '#cbd5e1' : isChecked ? mainColor : '#cbd5e1'}`,
                          background: isBlocked ? '#f8fafc' : isChecked ? `${mainColor}14` : '#ffffff',
                          color: isBlocked ? '#94a3b8' : isChecked ? '#0f2c59' : '#475569',
                          fontSize: '0.83rem',
                          fontWeight: isChecked ? 800 : 600,
                          cursor: isBlocked ? 'not-allowed' : 'pointer',
                          opacity: isBlocked ? 0.6 : 1,
                          boxShadow: isChecked ? `0 2px 6px ${mainColor}25` : 'none',
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {/* El cuadradito de selección solo aparece cuando "Marcar por unidad" está ACTIVO */}
                        {isByUnitMode && (
                          <span style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1.5px solid ${isBlocked ? '#cbd5e1' : isChecked ? mainColor : '#94a3b8'}`, background: isBlocked ? '#f1f5f9' : isChecked ? mainColor : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '10px', fontWeight: 900 }}>
                            {isChecked ? '✓' : isBlocked ? '✕' : ''}
                          </span>
                        )}
                        <span>{l.tipo} <small style={{ opacity: 0.75, fontWeight: 700 }}>({l.unidad})</small></span>
                      </button>
                    );
                  })
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    {language === 'en' ? 'This node has no registered telemetry variables.' : 'Este nodo no tiene variables de telemetría registradas.'}
                  </span>
                )}
              </div>
            </div>

            {/* SECCIÓN 3: GRÁFICO RECHARTS DUAL-AXIS Y LEYENDAS MULTIVARIABLE */}
            <div className="dashboard-chart-card" style={{ background: '#fff', borderRadius: '12px', padding: '1.2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>

              {/* Encabezado del gráfico: Leyendas claras para cada variable + Paginación + Conmutador de Vista */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {appliedSelections.map((sel, idx) => {
                    const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
                    const origIdx = currentTelemetryNode?.lecturas?.findIndex(l => l.data_type === sel.clave_mqtt) ?? -1;
                    const color = origIdx >= 0 ? palette[origIdx % palette.length] : palette[idx % palette.length];
                    const axisId = getAxisForSelection(sel);
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: '600', color: '#334155' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color }} />
                        <span>{sel.nombre_var} <small style={{ opacity: 0.75, fontWeight: 700 }}>({sel.unidad})</small></span>
                        {hasRightAxisVariables && (
                          <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '6px', background: axisId === 'right' ? '#ffedd5' : '#d1fae5', color: axisId === 'right' ? '#c2410c' : '#047857', fontWeight: 800 }}>
                            {axisId === 'right' ? (language === 'en' ? 'Right Axis' : 'Eje Der.') : (language === 'en' ? 'Left Axis' : 'Eje Izq.')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {appliedSelections.length === 0 && (
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                      {language === 'en' ? 'No variables checked' : 'Sin métricas marcadas'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Selector de Lecturas a Mostrar */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '3px 10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                      {language === 'en' ? 'Readings to show:' : 'Lecturas a mostrar:'}
                    </span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '7px', padding: '1px 3px' }}>
                      <button
                        type="button"
                        onClick={() => setMaxReadingsToShow(prev => Math.max(1, prev - 1))}
                        disabled={maxReadingsToShow <= 1}
                        style={{ border: 'none', background: 'none', color: maxReadingsToShow <= 1 ? '#cbd5e1' : '#0f2c59', fontWeight: 900, cursor: maxReadingsToShow <= 1 ? 'not-allowed' : 'pointer', padding: '1px 5px', fontSize: '0.78rem' }}
                      >
                        ▼
                      </button>
                      <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#2563eb', minWidth: '20px', textAlign: 'center' }}>
                        {maxReadingsToShow}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMaxReadingsToShow(prev => Math.min(15, prev + 1))}
                        disabled={maxReadingsToShow >= 15}
                        style={{ border: 'none', background: 'none', color: maxReadingsToShow >= 15 ? '#cbd5e1' : '#0f2c59', fontWeight: 900, cursor: maxReadingsToShow >= 15 ? 'not-allowed' : 'pointer', padding: '1px 5px', fontSize: '0.78rem' }}
                      >
                        ▲
                      </button>
                    </div>
                  </div>

                  {/* Paginador */}
                  {showPagination && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '3px 10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <button
                        type="button"
                        onClick={handlePrevPage}
                        disabled={!canGoPrev}
                        style={{ padding: '3px 8px', fontSize: '0.78rem', fontWeight: 700, borderRadius: '6px', border: '1px solid #cbd5e1', background: canGoPrev ? '#ffffff' : '#f1f5f9', color: canGoPrev ? '#0f2c59' : '#94a3b8', cursor: canGoPrev ? 'pointer' : 'not-allowed' }}
                      >
                        ◀ {language === 'en' ? 'Prev' : 'Ant.'}
                      </button>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                        {startIndex} - {endIndex} / {liveData.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextPage}
                        disabled={!canGoNext}
                        style={{ padding: '3px 8px', fontSize: '0.78rem', fontWeight: 700, borderRadius: '6px', border: '1px solid #cbd5e1', background: canGoNext ? '#ffffff' : '#f1f5f9', color: canGoNext ? '#0f2c59' : '#94a3b8', cursor: canGoNext ? 'pointer' : 'not-allowed' }}
                      >
                        {language === 'en' ? 'Next' : 'Sig.'} ▶
                      </button>
                    </div>
                  )}

                  {/* Conmutador de Modo de Gráfico & Botón Reloj (En vivo / BD) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setLiveMode(prev => !prev)}
                      className={`dash-btn-style ${liveMode ? 'active' : ''}`}
                      style={{ 
                        padding: '5px 10px', 
                        borderRadius: '7px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        cursor: 'pointer',
                        backgroundColor: liveMode ? '#2563eb' : '#ffffff',
                        color: liveMode ? '#ffffff' : '#2563eb',
                        border: '1px solid #2563eb',
                        transition: 'all 0.2s ease'
                      }}
                      title={
                        liveMode
                          ? (language === 'en' ? 'Showing Live Data (Click for DB data)' : 'Mostrando Datos en Vivo (Clic para ver Base de Datos)')
                          : (language === 'en' ? 'Showing DB Data (Click for Live data)' : 'Mostrando Base de Datos (Clic para ver Datos en Vivo)')
                      }
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </button>

                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', margin: '0 2px 0 4px' }}>{language === 'en' ? 'View:' : 'Vista:'}</span>
                    <button type="button" onClick={() => setChartMode('area')} className={`dash-btn-style ${chartMode === 'area' ? 'active' : ''}`} style={{ padding: '5px 10px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title={language === 'en' ? "Area Chart" : "Gráfico de Área"}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16"><path d="M3 3v18h18" /><path d="M7 15l4-5 4 3 5-7v9H7z" fill="currentColor" fillOpacity="0.25" /><path d="M7 15l4-5 4 3 5-7" /></svg>
                    </button>
                    <button type="button" onClick={() => setChartMode('bar')} className={`dash-btn-style ${chartMode === 'bar' ? 'active' : ''}`} style={{ padding: '5px 10px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title={language === 'en' ? "Bar Chart" : "Gráfico de Barras"}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16"><rect x="5" y="11" width="3" height="9" rx="1" fill="currentColor" fillOpacity="0.3" /><rect x="11" y="6" width="3" height="14" rx="1" fill="currentColor" fillOpacity="0.3" /><rect x="17" y="14" width="3" height="6" rx="1" fill="currentColor" fillOpacity="0.3" /><path d="M3 21h18" /></svg>
                    </button>
                    <button type="button" onClick={() => setChartMode('line')} className={`dash-btn-style ${chartMode === 'line' ? 'active' : ''}`} style={{ padding: '5px 10px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title={language === 'en' ? "Line Chart" : "Gráfico de Líneas"}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M3 3v18h18" /><polyline points="6 15 11 9 15 13 21 6" /><circle cx="6" cy="15" r="2" fill="currentColor" /><circle cx="11" cy="9" r="2" fill="currentColor" /><circle cx="15" cy="13" r="2" fill="currentColor" /><circle cx="21" cy="6" r="2" fill="currentColor" /></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Área del Gráfico con Leyenda Recharts Incluida */}
              <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, height: '380px', position: 'relative', overflow: 'hidden' }}>
                {appliedSelections.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', color: '#64748b', gap: '12px', padding: '2rem', textAlign: 'center' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" width="48" height="48"><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" strokeDasharray="3 3" /><circle cx="12" cy="12" r="9" stroke="#cbd5e1" strokeDasharray="2 2" /></svg>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f2c59' }}>{language === 'en' ? 'No variables selected' : 'Sin variables seleccionadas'}</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>{language === 'en' ? 'Select a node and check one or more variables above with the same measurement unit to visualize.' : 'Selecciona un nodo y marca una o varias de sus variables arriba con la misma unidad de medida para visualizar.'}</p>
                    </div>
                  </div>
                ) : visibleLiveData.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', gap: '10px', padding: '2rem', textAlign: 'center' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" width="44" height="44">
                      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                    </svg>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f2c59' }}>
                        {selectedDate === todayDateStr
                          ? (language === 'en' ? 'No readings received today' : 'El día de hoy no se han recibido lecturas')
                          : (language === 'en' ? `No readings received on ${selectedDate}` : `En la fecha ${selectedDate} no se han recibido lecturas`)}
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                        {language === 'en' ? 'Try selecting another date from the date picker menu above.' : 'Prueba seleccionando otra fecha desde el menú de fecha de arriba.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    {(() => {
                      const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
                      const firstSel = appliedSelections[0];
                      const firstOrigIdx = firstSel ? (currentTelemetryNode?.lecturas?.findIndex(l => l.data_type === firstSel.clave_mqtt) ?? 0) : 0;
                      const leftAxisColor = palette[(firstOrigIdx >= 0 ? firstOrigIdx : 0) % palette.length];

                      return chartMode === 'area' ? (
                        <AreaChart data={visibleLiveData} margin={{ top: 10, right: hasRightAxisVariables ? 15 : 10, left: 0, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
                          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} angle={-35} textAnchor="end" height={55} tickMargin={10} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} padding={{ left: 0, right: 0 }} />
                          <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11, fill: leftAxisColor, fontWeight: 700 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} width={45} />
                          {hasRightAxisVariables && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#f97316', fontWeight: 700 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} width={50} />}
                          <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', background: '#ffffff', fontWeight: 700 }} labelStyle={{ fontWeight: 800, color: '#0f2c59', marginBottom: '4px' }} cursor={{ stroke: '#2563eb', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.82rem', fontWeight: 700 }} />
                          {appliedSelections.map((sel, idx) => {
                            const origIdx = currentTelemetryNode?.lecturas?.findIndex(l => l.data_type === sel.clave_mqtt) ?? -1;
                            const color = origIdx >= 0 ? palette[origIdx % palette.length] : palette[idx % palette.length];
                            const axisId = getAxisForSelection(sel);
                            return (
                              <Area
                                key={sel.clave_mqtt}
                                yAxisId={axisId}
                                connectNulls={true}
                                type="monotone"
                                name={`${sel.nombre_var} (${sel.unidad})`}
                                dataKey={`${sel.serial_number}_${sel.clave_mqtt}`}
                                stroke={color}
                                fillOpacity={0.2}
                                fill={color}
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: color, strokeWidth: 1.5, stroke: '#ffffff' }}
                                activeDot={{ r: 8, fill: color, strokeWidth: 3, stroke: '#ffffff' }}
                                isAnimationActive={false}
                              />
                            );
                          })}
                        </AreaChart>
                      ) : chartMode === 'bar' ? (
                        <BarChart data={visibleLiveData} margin={{ top: 10, right: hasRightAxisVariables ? 15 : 10, left: 0, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
                          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} angle={-35} textAnchor="end" height={55} tickMargin={10} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} padding={{ left: 0, right: 0 }} />
                          <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11, fill: leftAxisColor, fontWeight: 700 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} width={45} />
                          {hasRightAxisVariables && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#f97316', fontWeight: 700 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} width={50} />}
                          <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', background: '#ffffff', fontWeight: 700 }} labelStyle={{ fontWeight: 800, color: '#0f2c59', marginBottom: '4px' }} cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }} />
                          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.82rem', fontWeight: 700 }} />
                          {appliedSelections.map((sel, idx) => {
                            const origIdx = currentTelemetryNode?.lecturas?.findIndex(l => l.data_type === sel.clave_mqtt) ?? -1;
                            const color = origIdx >= 0 ? palette[origIdx % palette.length] : palette[idx % palette.length];
                            const axisId = getAxisForSelection(sel);
                            return (
                              <Bar
                                key={sel.clave_mqtt}
                                yAxisId={axisId}
                                name={`${sel.nombre_var} (${sel.unidad})`}
                                dataKey={`${sel.serial_number}_${sel.clave_mqtt}`}
                                fill={color}
                                radius={[4, 4, 0, 0]}
                                activeBar={{ stroke: '#0f2c59', strokeWidth: 2, fillOpacity: 0.95 }}
                                isAnimationActive={false}
                              />
                            );
                          })}
                        </BarChart>
                      ) : (
                        <LineChart data={visibleLiveData} margin={{ top: 10, right: hasRightAxisVariables ? 15 : 10, left: 0, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#64748b" strokeOpacity={0.4} />
                          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} angle={-35} textAnchor="end" height={55} tickMargin={10} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} padding={{ left: 0, right: 0 }} />
                          <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11, fill: leftAxisColor, fontWeight: 700 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} width={45} />
                          {hasRightAxisVariables && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#f97316', fontWeight: 700 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} width={50} />}
                          <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', background: '#ffffff', fontWeight: 700 }} labelStyle={{ fontWeight: 800, color: '#0f2c59', marginBottom: '4px' }} cursor={{ stroke: '#2563eb', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.82rem', fontWeight: 700 }} />
                          {appliedSelections.map((sel, idx) => {
                            const origIdx = currentTelemetryNode?.lecturas?.findIndex(l => l.data_type === sel.clave_mqtt) ?? -1;
                            const color = origIdx >= 0 ? palette[origIdx % palette.length] : palette[idx % palette.length];
                            const axisId = getAxisForSelection(sel);
                            return (
                              <Line
                                key={sel.clave_mqtt}
                                yAxisId={axisId}
                                connectNulls={true}
                                type="monotone"
                                name={`${sel.nombre_var} (${sel.unidad})`}
                                dataKey={`${sel.serial_number}_${sel.clave_mqtt}`}
                                stroke={color}
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: color, strokeWidth: 1.5, stroke: '#ffffff' }}
                                activeDot={{ r: 8, fill: color, strokeWidth: 3, stroke: '#ffffff' }}
                                isAnimationActive={false}
                              />
                            );
                          })}
                        </LineChart>
                      );
                    })()}
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* SECCIÓN 4: TARJETAS DE ESTADÍSTICAS PARA TODAS LAS VARIABLES SEGÚN FECHA SELECCIONADA (ESTILO EN VIVO) */}
            <div style={{ marginTop: '2rem' }}>
              <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f2c59', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" width="20" height="20">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  <span>
                    {language === 'en' ? 'Readings for all node variables (' : 'Lecturas de todas las variables ('}
                    <strong className="notranslate" translate="no" style={{ color: '#2563eb' }}>
                      {selectedDate === todayDateStr ? (language === 'en' ? 'Today' : 'Día de hoy') : selectedDate}
                    </strong>
                    )
                  </span>
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    {language === 'en' ? 'Node:' : 'Nodo:'} <strong className="notranslate" translate="no" style={{ color: '#2563eb' }}>{currentTelemetryNode?.nombre}</strong>
                  </span>
                  <span style={{
                    background: currentTelemetryNode?.is_online ? '#ecfdf5' : '#fef2f2',
                    color: currentTelemetryNode?.is_online ? '#047857' : '#dc2626',
                    border: currentTelemetryNode?.is_online ? '1px solid #a7f3d0' : '1px solid #fca5a5',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}>
                    {currentTelemetryNode?.is_online ? '● ' : '○ '}
                    {currentTelemetryNode?.is_online
                      ? (language === 'en' ? 'Online' : 'Activo')
                      : (language === 'en' ? 'Offline' : 'Inactivo')}
                  </span>
                </div>
              </div>

              <div className="monitor-kpi-grid">
                {currentTelemetryNode?.lecturas && currentTelemetryNode.lecturas.length > 0 ? (
                  currentTelemetryNode.lecturas.map((lecturaObj, idx) => {
                    const theme = getTheme(lecturaObj.data_type, lecturaObj.icono);
                    const dataKey = `${currentTelemetryNode.serial_number}_${lecturaObj.data_type}`;

                    let currentVal = null;
                    let lastTimestampStr = '';

                    if (allVarsLiveData && allVarsLiveData.length > 0) {
                      for (let k = allVarsLiveData.length - 1; k >= 0; k--) {
                        const item = allVarsLiveData[k];
                        if (item && item[dataKey] !== undefined && item[dataKey] !== null) {
                          currentVal = item[dataKey];
                          if (item.fullDateTime) {
                            lastTimestampStr = item.fullDateTime;
                          } else {
                            lastTimestampStr = formatEcuadorDateTime(item.fecha || item.created_at || item.dateTime || item.timestamp || item.time);
                          }
                          break;
                        }
                      }
                    }

                    const hasReading = currentVal !== null && currentVal !== undefined;

                    if (!hasReading) {
                      const noReadingsMsg = selectedDate === todayDateStr
                        ? (language === 'en' ? 'No readings received today' : 'El día de hoy no se han recibido lecturas')
                        : (language === 'en' ? 'No readings on this date' : 'En esta fecha no se han recibido lecturas');

                      return (
                        <div key={lecturaObj.data_type || idx} className={`monitor-kpi-card ${theme.class}`}>
                          <div className="kpi-card-header">
                            <div className="kpi-title-area">
                              <div className="kpi-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                  {theme.icon}
                                </svg>
                              </div>
                              <div className="kpi-title-text">
                                <strong>{lecturaObj.tipo}</strong>
                                <span>{lecturaObj.unidad || ''}</span>
                              </div>
                            </div>
                          </div>

                          <div className="kpi-main-value">
                            <h2>
                              <span className="notranslate" translate="no">--</span>{' '}
                              <span className="kpi-unit notranslate" translate="no">{lecturaObj.unidad || ''}</span>
                            </h2>
                            <div style={{ marginTop: '8px' }}>
                              <span className="kpi-status-badge" style={{ background: '#fffbe6', color: '#d97706', border: '1px solid #fde68a', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                  <line x1="12" y1="9" x2="12" y2="13" />
                                  <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                {noReadingsMsg}
                              </span>
                            </div>
                          </div>

                          <div className="kpi-card-footer">
                            <span>{language === 'en' ? 'Last reading:' : 'Última lectura:'}</span>
                            <span className="notranslate" translate="no" style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
                              {language === 'en' ? 'No data' : 'Sin datos'}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    const numVal = Number(currentVal);
                    const minExp = (lecturaObj?.minExpected !== undefined && lecturaObj?.minExpected !== null && lecturaObj?.minExpected !== '')
                      ? parseFloat(lecturaObj.minExpected)
                      : (lecturaObj?.min_expected !== undefined && lecturaObj?.min_expected !== null && lecturaObj?.min_expected !== '')
                        ? parseFloat(lecturaObj.min_expected)
                        : (lecturaObj?.min_alerta !== undefined && lecturaObj?.min_alerta !== null && lecturaObj?.min_alerta !== '')
                          ? parseFloat(lecturaObj.min_alerta)
                          : (lecturaObj?.valor_minimo !== undefined && lecturaObj?.valor_minimo !== null && lecturaObj?.valor_minimo !== '')
                            ? parseFloat(lecturaObj.valor_minimo)
                            : (lecturaObj?.min !== undefined && lecturaObj?.min !== null && lecturaObj?.min !== '')
                              ? parseFloat(lecturaObj.min)
                              : null;

                    const maxExp = (lecturaObj?.maxExpected !== undefined && lecturaObj?.maxExpected !== null && lecturaObj?.maxExpected !== '')
                      ? parseFloat(lecturaObj.maxExpected)
                      : (lecturaObj?.max_expected !== undefined && lecturaObj?.max_expected !== null && lecturaObj?.max_expected !== '')
                        ? parseFloat(lecturaObj.max_expected)
                        : (lecturaObj?.max_alerta !== undefined && lecturaObj?.max_alerta !== null && lecturaObj?.max_alerta !== '')
                          ? parseFloat(lecturaObj.max_alerta)
                          : (lecturaObj?.valor_maximo !== undefined && lecturaObj?.valor_maximo !== null && lecturaObj?.valor_maximo !== '')
                            ? parseFloat(lecturaObj.valor_maximo)
                            : (lecturaObj?.max !== undefined && lecturaObj?.max !== null && lecturaObj?.max !== '')
                              ? parseFloat(lecturaObj.max)
                              : null;

                    let isLowAlert = false;
                    let isHighAlert = false;

                    if (minExp !== null && !isNaN(minExp) && numVal < minExp) {
                      isLowAlert = true;
                    } else if (maxExp !== null && !isNaN(maxExp) && numVal > maxExp) {
                      isHighAlert = true;
                    }

                    const alertMsg = isLowAlert
                      ? (language === 'en' ? `Low Level: Value (${numVal} ${lecturaObj.unidad || ''}) is below min (${minExp} ${lecturaObj.unidad || ''})` : `Nivel Bajo: El valor registrado (${numVal} ${lecturaObj.unidad || ''}) está por debajo del mínimo esperado (${minExp} ${lecturaObj.unidad || ''})`)
                      : isHighAlert
                        ? (language === 'en' ? `High Level: Value (${numVal} ${lecturaObj.unidad || ''}) exceeded max (${maxExp} ${lecturaObj.unidad || ''})` : `Nivel Alto: El valor registrado (${numVal} ${lecturaObj.unidad || ''}) sobrepasó el máximo esperado (${maxExp} ${lecturaObj.unidad || ''})`)
                        : (language === 'en' ? `Normal: Value (${numVal} ${lecturaObj.unidad || ''}) is in safe range.` : `Estado Normal: El valor (${numVal} ${lecturaObj.unidad || ''}) se encuentra dentro del rango seguro.`);

                    return (
                      <div key={lecturaObj.data_type || idx} className={`monitor-kpi-card ${theme.class}`}>
                        <div className="kpi-card-header">
                          <div className="kpi-title-area">
                            <div className="kpi-icon-wrapper">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                {theme.icon}
                              </svg>
                            </div>
                            <div className="kpi-title-text">
                              <strong>{lecturaObj.tipo}</strong>
                              <span>{language === 'en' ? 'Recorded Value' : 'Valor Registrado'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="kpi-main-value">
                          <h2>
                            <span className="notranslate" translate="no">{currentVal}</span>{' '}
                            <span className="kpi-unit notranslate" translate="no">{lecturaObj.unidad || ''}</span>
                          </h2>

                          <div style={{ marginTop: '8px' }}>
                            {isLowAlert ? (
                              <span title={alertMsg} className="kpi-status-badge" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #93c5fd', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'help', display: 'inline-block' }}>
                                {language === 'en' ? 'Stability: Low' : 'Estabilidad: Baja'}
                              </span>
                            ) : isHighAlert ? (
                              <span title={alertMsg} className="kpi-status-badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'help', display: 'inline-block' }}>
                                {language === 'en' ? 'Stability: High' : 'Estabilidad: Alta'}
                              </span>
                            ) : (
                              <span title={alertMsg} className="kpi-status-badge" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'help', display: 'inline-block' }}>
                                {language === 'en' ? 'Stability: Normal' : 'Estabilidad: Normal'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="kpi-card-footer">
                          <span>{language === 'en' ? 'Last update:' : 'Última actualización:'}</span>
                          <span className="notranslate" translate="no" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a', fontWeight: 600, fontSize: '0.78rem' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {lastTimestampStr || '--:--'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ gridColumn: '1 / -1', padding: '1.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#94a3b8' }}>
                    {language === 'en' ? 'No telemetry variables available for this node.' : 'No hay variables de telemetría disponibles para este nodo.'}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATIONS & CSS */}
      <style>{`
        @keyframes shake-blink {
          0% { transform: translateX(0); background-color: #ef4444; }
          25% { transform: translateX(-4px); background-color: #ef4444; }
          50% { transform: translateX(4px); background-color: #ef4444; }
          75% { transform: translateX(-4px); background-color: #ef4444; }
          100% { transform: translateX(0); background-color: #10b981; }
        }
        .add-btn-custom {
          background: #10b981; border: none; padding: 0.4rem 1.2rem; border-radius: 50px; color: #fff; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.3rem; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }
        .add-btn-custom:hover:not(.btn-shake) {
          background: #059669; transform: translateY(-1px);
        }
        .btn-shake {
          animation: shake-blink 0.4s ease-in-out;
          background-color: #ef4444 !important;
        }
        .toast-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 9999;
        }
        .toast-item {
          background-color: #1e293b;
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
          font-weight: 500;
          border-left: 4px solid #ef4444;
          animation: slide-in-toast 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes slide-in-toast {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .toast-close {
          background: none;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: color 0.2s;
          margin-left: 10px;
        }
        .toast-close:hover {
          color: white;
        }
      `}</style>
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>{toast.msg}</span>
            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>×</button>
          </div>
        ))}
      </div>

      {/* Modal de Exportación CSV */}
      <ModalExportarCSV
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        nodo={currentTelemetryNode}
      />
    </div>
  );
}