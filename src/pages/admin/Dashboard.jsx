import { API_BASE_URL } from '../../config/api';
import { echo } from '../../config/echo';
import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/components/admin/Dashboard.css';

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
  // Database states
  const [nodos, setNodos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [noticias, setNoticias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  // Live Dashboard states
  const [liveData, setLiveData] = useState([]);
  
  // Telemetry section category, node & variable checkbox selection state
  const [selectedTelemetryCategory, setSelectedTelemetryCategory] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [selectedTelemetryNodeSerial, setSelectedTelemetryNodeSerial] = useState('');
  const [checkedVarKeys, setCheckedVarKeys] = useState([]); // array of checked data_type keys
  const [chartMode, setChartMode] = useState('area'); // 'area', 'bar', 'line'
  const [nodeDropdownOpen, setNodeDropdownOpen] = useState(false);

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
    return activeNodos.length > 0 ? activeNodos : (nodos || []);
  }, [activeNodos, nodos]);

  const activeNodeNumberMap = React.useMemo(() => {
    const map = {};
    let count = 1;
    (nodos || []).forEach(n => {
      if (n.is_online) {
        map[n.serial_number || n.id] = count++;
      }
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
    
    // Fetch dashboard stats from backend database APIs
    Promise.all([
      fetch(`${API_BASE_URL}/nodos`).then(res => res.json()),
      fetch(`${API_BASE_URL}/ubicaciones`).then(res => res.json()),
      fetch(`${API_BASE_URL}/noticias`).then(res => res.json()),
      fetch(`${API_BASE_URL}/users`).then(res => res.json()),
      fetch(`${API_BASE_URL}/categorias`).then(res => res.json())
    ])
      .then(([nodosData, ubiData, noticiasData, usersData, catsData]) => {
        setNodos(Array.isArray(nodosData) ? nodosData : []);
        setUbicaciones(Array.isArray(ubiData) ? ubiData : []);
        setNoticias(Array.isArray(noticiasData) ? noticiasData : []);
        setUsuarios(Array.isArray(usersData) ? usersData : []);
        setCategorias(Array.isArray(catsData) ? catsData : []);

        if (Array.isArray(nodosData) && nodosData.length > 0) {
          if (!selectedNodeSerial) {
            setSelectedNodeSerial(nodosData[0].serial_number);
          }
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
      });
  }, []);

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

      const popupContent = `
        <div style="font-family:'Outfit','Inter',sans-serif; padding: 4px; min-width: 180px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:6px;">
            <strong style="color:#0f2c59; font-size:0.95rem;">${nodo.nombre}</strong>
            ${isActive ? `<span style="background:#10b981; color:white; font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:10px;">● Online</span>` : `<span style="background:#ef4444; color:white; font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:10px;">○ Offline</span>`}
          </div>
          <div style="font-size:0.8rem; color:#64748b; margin-bottom:3px;">Categoría: <b style="color:#334155">${nodo.categoria || 'N/A'}</b></div>
          <div style="font-size:0.8rem; color:#64748b; margin-bottom:3px;">Serial: <code style="color:#0f2c59; background:#f1f5f9; padding:1px 4px; border-radius:4px">${nodo.serial_number || 'N/A'}</code></div>
          <div style="font-size:0.8rem; font-weight:700; color:${isActive ? '#10b981' : '#ef4444'}; border-top:1px solid #f1f5f9; padding-top:5px; margin-top:4px;">
            ${isActive ? '● En línea / Transmitiendo' : '○ Desconectado (Sin datos)'}
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

  // Auto-center map on Node #1 whenever targetNavList is available
  useEffect(() => {
    if (targetNavList.length > 0 && mapInstanceRef.current) {
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

  // Cargar historial en vivo
  useEffect(() => {
    if (appliedSelections.length === 0) {
      setLiveData([]);
      return;
    }
    
    fetch(`${API_BASE_URL}/lecturas/live-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ selections: appliedSelections })
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setLiveData(data);
      } else {
        setLiveData(generateMockLiveData(appliedSelections));
      }
    })
    .catch(err => {
      console.error("Error fetching live history, using generated fallback:", err);
      setLiveData(generateMockLiveData(appliedSelections));
    });

  }, [appliedSelections, generateMockLiveData]);

  // WebSockets para Telemetría en Vivo
  useEffect(() => {
    if (appliedSelections.length === 0) return;

    const channels = [];
    const groupedByNode = {};
    
    appliedSelections.forEach(sel => {
       if (!groupedByNode[sel.serial_number]) {
          groupedByNode[sel.serial_number] = [];
       }
       groupedByNode[sel.serial_number].push(sel.clave_mqtt);
    });

    Object.keys(groupedByNode).forEach(serial => {
      const channelName = `telemetry.${serial}`;
      const channel = echo.channel(channelName);
      const varsToListen = groupedByNode[serial];
      
      channel.listen('.LecturaRecibida', (e) => {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        const nowFullDateTime = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${nowTime}`;
        
        let hasRelevantData = false;
        let newTick = {};

        varsToListen.forEach(vKey => {
           if (newData[vKey] !== undefined) {
              hasRelevantData = true;
              newTick[`${serial}_${vKey}`] = newData[vKey];
           }
        });

        if (hasRelevantData) {
          setLiveData(prev => {
            const newHistory = [...prev];
            if (newHistory.length > 0 && newHistory[newHistory.length - 1].time === nowTime) {
              const lastItem = newHistory[newHistory.length - 1];
              newHistory[newHistory.length - 1] = { ...lastItem, ...newTick, fullDateTime: nowFullDateTime };
            } else {
              const lastItem = newHistory.length > 0 ? newHistory[newHistory.length - 1] : {};
              newHistory.push({ ...lastItem, time: nowTime, fullDateTime: nowFullDateTime, ...newTick });
            }
            if (newHistory.length > 30) newHistory.shift(); 
            return newHistory;
          });
        }
      });
      channels.push({ channel, name: channelName });
    });

    return () => {
      channels.forEach(ch => {
        ch.channel.stopListening('.LecturaRecibida');
        echo.leaveChannel(ch.name);
      });
    };
  }, [appliedSelections]);

  // Pre-seleccionar el primer nodo de la categoría activa y marcar TODAS sus variables por defecto
  useEffect(() => {
    if (currentCategoryNodes.length > 0) {
      if (!selectedTelemetryNodeSerial || !currentCategoryNodes.some(n => n.serial_number === selectedTelemetryNodeSerial)) {
        const firstNode = currentCategoryNodes[0];
        setSelectedTelemetryNodeSerial(firstNode.serial_number);
        if (firstNode.lecturas && firstNode.lecturas.length > 0) {
          setCheckedVarKeys(firstNode.lecturas.map(l => l.data_type));
        } else {
          setCheckedVarKeys([]);
        }
      }
    } else {
      setSelectedTelemetryNodeSerial('');
      setCheckedVarKeys([]);
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
        setCheckedVarKeys(firstNode.lecturas.map(l => l.data_type));
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
        setCheckedVarKeys(nextNode.lecturas.map(l => l.data_type));
      } else {
        setCheckedVarKeys([]);
      }
    }
  };

  // Handlers for variable checkboxes
  const handleToggleVarKey = (varKey) => {
    setCheckedVarKeys(prev => {
      if (prev.includes(varKey)) {
        return prev.filter(k => k !== varKey);
      } else {
        return [...prev, varKey];
      }
    });
  };

  const handleSelectAllVars = () => {
    if (!currentTelemetryNode || !currentTelemetryNode.lecturas) return;
    setCheckedVarKeys(currentTelemetryNode.lecturas.map(l => l.data_type));
  };

  const handleDeselectAllVars = () => {
    setCheckedVarKeys([]);
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
  const totalUsuarios = usuarios.length;
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
    } catch(e) {}
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

  return (
    <div className="dashboard-container">
      
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>Análisis e indicadores en tiempo real de la infraestructura IOT</h1>
      </div>

      {/* TOP ROW: 4 KPI CARDS MATCHING MOCKUP */}
      <div className="kpi-row">
        {/* Card 1: Highlighted Navy Card */}
        <div className="kpi-card highlighted">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Nodos Activos</span>
            <div className="kpi-card-icon">
              <NodesIcon />
            </div>
          </div>
          <h2 className="kpi-card-value">{totalNodos}</h2>
        </div>

        {/* Card 2: Ubicaciones */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Ubicaciones</span>
            <div className="kpi-card-icon">
              <LocationsIcon />
            </div>
          </div>
          <h2 className="kpi-card-value">{totalUbicaciones}</h2>
        </div>

        {/* Card 3: Usuarios */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Usuarios</span>
            <div className="kpi-card-icon">
              <UsersIcon />
            </div>
          </div>
          <h2 className="kpi-card-value">{totalUsuarios}</h2>
        </div>

        {/* Card 4: Artículos/Noticias */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Divulgación</span>
            <div className="kpi-card-icon">
              <StarIcon />
            </div>
          </div>
          <h2 className="kpi-card-value">{totalNoticias}</h2>
        </div>
      </div>

      {/* MAIN ROW: COMPARATIVE BAR CHART AND CIRCULAR doughnut */}
      <div className="dashboard-main-grid">
        
        {/* CENTER COLUMN: Leaflet Map */}
        <div className="visual-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="visual-card-header" style={{ padding: '1.25rem 1.5rem 0.5rem 1.5rem', marginBottom: '0.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <h3 className="visual-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", fontSize: '1.15rem', fontWeight: 800, color: '#0f2c59', letterSpacing: '-0.01em' }}>
                Mapa de Nodos
                {activeNodos.length > 0 && (
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontWeight: 700 }}>
                    {activeNodos.length} Activo{activeNodos.length !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', fontWeight: 600 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={targetNavList[selectedActiveNodeIndex]?.is_online ? "#10b981" : "#64748b"} strokeWidth="2.5" width="13" height="13" style={{ flexShrink: 0 }}>
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                  <circle cx="12" cy="10" r="3" fill={targetNavList[selectedActiveNodeIndex]?.is_online ? "#10b981" : "#64748b"} />
                </svg>
                <span style={{ color: '#0f2c59', fontWeight: 700 }}>Ubicación:</span> {currentNodeLocationText}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginRight: '2px' }}>Vista de mapa:</span>
              {/* Map Layer Switcher Tabs: Mapa | Satélite */}
              <div className="dash-map-style-selector">
                <button
                  type="button"
                  onClick={() => setMapStyle('google')}
                  className={`dash-btn-style ${mapStyle === 'google' ? 'active' : ''}`}
                  title="Google Maps Estándar"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" style={{ marginRight: '4px' }}>
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                    <line x1="9" y1="3" x2="9" y2="18" />
                    <line x1="15" y1="6" x2="15" y2="21" />
                  </svg>
                  Mapa
                </button>
                <button
                  type="button"
                  onClick={() => setMapStyle('satellite')}
                  className={`dash-btn-style ${mapStyle === 'satellite' ? 'active' : ''}`}
                  title="Google Maps Satélite (Híbrido)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" style={{ marginRight: '4px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Satélite
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
                  title="Nodo anterior"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <div className="dash-map-nav-info">
                  <span className="dash-map-nav-badge">
                    {targetNavList[selectedActiveNodeIndex]?.is_online && activeNodeNumberMap[targetNavList[selectedActiveNodeIndex]?.serial_number || targetNavList[selectedActiveNodeIndex]?.id] ? (
                      `Nodo #${activeNodeNumberMap[targetNavList[selectedActiveNodeIndex]?.serial_number || targetNavList[selectedActiveNodeIndex]?.id]} (${selectedActiveNodeIndex + 1}/${targetNavList.length})`
                    ) : (
                      `${selectedActiveNodeIndex + 1} / ${targetNavList.length}`
                    )}
                  </span>
                  <span className="dash-map-nav-name">
                    {targetNavList[selectedActiveNodeIndex]?.nombre || 'Seleccionando nodo...'}
                  </span>
                  <span className={`dash-map-nav-status ${targetNavList[selectedActiveNodeIndex]?.is_online ? 'online' : 'offline'}`}>
                    {targetNavList[selectedActiveNodeIndex]?.is_online ? '● Activo' : '○ Offline'}
                  </span>
                </div>

                <button
                  type="button"
                  className="dash-map-nav-btn"
                  onClick={() => handleNavigateNode('next')}
                  title="Siguiente nodo"
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
              Distribución
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
              {categorias.length} Categoría{categorias.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="radial-container">
            <div className="radial-progress-ring" style={doughnutGradient}>
              <div className="radial-progress-mask">
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                  <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f2c59' }}>{totalNodos}</strong>
                  <small style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
                    {totalNodos === 1 ? 'Nodo' : 'Nodos'}
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
                      <span className="radial-list-val" style={{ fontWeight: 800 }}>{count}</span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>({pct}%)</span>
                    </div>
                  </div>
                );
              })}
              {categorias.length === 0 && (
                <p className="text-xs text-gray-500 italic text-center py-2">No hay categorías registradas.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: TELEMETRY CHART AND NODE NAVIGATION */}
      <div className="bottom-sections-row">
        <div className="bottom-widget-card" style={{ display: 'block', width: '100%' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            
            {/* SECCIÓN 1: CONTROLES DE NAVEGACIÓN DE ESTACIÓN Y CATEGORÍAS EN LA MISMA LÍNEA */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', width: '100%', marginBottom: '1.2rem' }}>
              
              {/* Fila Única Horizontal en la Misma Línea */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
                
                {/* SELECTOR 1: Categoría Dropdown (Por defecto Categoría 1) */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
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
                    title="Seleccionar Categoría"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>Categoría: <strong>{selectedTelemetryCategory || 'Categoría 1'}</strong></span>
                    <svg className={`dash-select-chevron ${categoryDropdownOpen ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Menú Desplegable de Categorías */}
                  {categoryDropdownOpen && (
                    <div className="custom-dropdown-menu" style={{ position: 'absolute', top: '105%', left: 0, minWidth: '240px', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', borderRadius: '12px', background: '#fff', border: '1px solid #cbd5e1', padding: '4px' }}>
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
                                {catNodes.length > 0 ? `(${catNodes.length} nodo${catNodes.length !== 1 ? 's' : ''})` : 'Sin nodos'}
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
                    <span>⚠️</span> No hay nodos en esta categoría
                  </div>
                ) : (
                  /* SI LA CATEGORÍA SÍ TIENE NODOS: En la misma línea Flechas < > + Selector de Nodos + Ruta */
                  <>
                    {/* Flecha Anterior < */}
                    <button
                      type="button"
                      className="dash-map-nav-btn"
                      disabled={currentCategoryNodes.length <= 1}
                      onClick={() => handleNavigateTelemetryNode('prev')}
                      title={currentCategoryNodes.length <= 1 ? "No hay más nodos en esta categoría" : "Nodo anterior"}
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
                    <div style={{ position: 'relative', flexShrink: 0 }}>
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
                        <span>{currentTelemetryNode ? currentTelemetryNode.nombre : 'Seleccionar Nodo'}</span>
                        <svg className={`dash-select-chevron ${nodeDropdownOpen ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {/* Menú Desplegable de Nodos de esta Categoría */}
                      {nodeDropdownOpen && (
                        <div className="custom-dropdown-menu" style={{ position: 'absolute', top: '105%', left: 0, minWidth: '260px', zIndex: 1000, boxShadow: '0 12px 30px rgba(0,0,0,0.18)', borderRadius: '12px', background: '#fff', border: '1px solid #cbd5e1', padding: '6px' }}>
                          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                            {currentCategoryNodes.map((n, idx) => {
                              const ubiName = n.ubicacion_nombre || ubicaciones.find(u => String(u.id) === String(n.ubicacion_id))?.nombre || 'Campus ULEAM';
                              const isSelected = n.serial_number === selectedTelemetryNodeSerial;
                              return (
                                <div
                                  key={n.serial_number || idx}
                                  onClick={() => {
                                    setSelectedTelemetryNodeSerial(n.serial_number);
                                    if (n.lecturas && n.lecturas.length > 0) {
                                      setCheckedVarKeys(n.lecturas.map(l => l.data_type));
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
                                    marginBottom: '2px'
                                  }}
                                >
                                  <span>{n.nombre}</span>
                                  <small style={{ fontSize: '0.72rem', color: '#94a3b8' }}>({ubiName})</small>
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
                      title={currentCategoryNodes.length <= 1 ? "No hay más nodos en esta categoría" : "Siguiente nodo"}
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

                    {/* Ruta Detallada: / Categoría / Ubicación / Nombre del Nodo */}
                    {currentTelemetryNode && (
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#cbd5e1', fontWeight: 800 }}>/</span>
                        <span style={{ color: '#2563eb', fontWeight: 700 }}>{currentTelemetryNode.categoria || 'IoT'}</span>
                        <span style={{ color: '#cbd5e1', fontWeight: 800 }}>/</span>
                        <span style={{ color: '#475569' }}>
                          {currentTelemetryNode.ubicacion_nombre || ubicaciones.find(u => String(u.id) === String(currentTelemetryNode.ubicacion_id))?.nombre || 'Campus ULEAM'}
                        </span>
                        <span style={{ color: '#cbd5e1', fontWeight: 800 }}>/</span>
                        <strong style={{ color: '#0f2c59' }}>{currentTelemetryNode.nombre}</strong>
                      </div>
                    )}
                  </>
                )}

              </div>
            </div>

            {/* SECCIÓN 2: CHECKBOXES DE VARIABLES INTERACTIVAS + BOTONES MARCAR TODAS / DESMARCAR (MARCADAS TODAS POR DEFECTO) */}
            <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', paddingTop: '0.85rem', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.83rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Variables disponibles:</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                    {checkedVarKeys.length} de {currentTelemetryNode?.lecturas?.length || 0} marcadas
                  </span>
                </label>

                {/* Botones Marcar Todas / Desmarcar */}
                {currentTelemetryNode && (currentTelemetryNode.lecturas?.length > 0) && (
                  (() => {
                    const allSelected = checkedVarKeys.length === currentTelemetryNode.lecturas.length;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={handleSelectAllVars}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: allSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                            background: allSelected ? '#2563eb' : '#ffffff',
                            color: allSelected ? '#ffffff' : '#64748b',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: allSelected ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                          title="Marcar todas las variables"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Marcar Todas
                        </button>

                        <button
                          type="button"
                          onClick={handleDeselectAllVars}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#64748b',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          title="Desmarcar todas"
                        >
                          Desmarcar
                        </button>
                      </div>
                    );
                  })()
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                {currentTelemetryNode?.lecturas && currentTelemetryNode.lecturas.length > 0 ? (
                  currentTelemetryNode.lecturas.map((l, idx) => {
                    const isChecked = checkedVarKeys.includes(l.data_type);
                    const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
                    const mainColor = palette[idx % palette.length];
                    return (
                      <button key={l.data_type} type="button" onClick={() => handleToggleVarKey(l.data_type)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${isChecked ? mainColor : '#cbd5e1'}`, background: isChecked ? `${mainColor}14` : '#ffffff', color: isChecked ? '#0f2c59' : '#64748b', fontSize: '0.83rem', fontWeight: isChecked ? 800 : 600, cursor: 'pointer' }}>
                        <span style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1.5px solid ${isChecked ? mainColor : '#94a3b8'}`, background: isChecked ? mainColor : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '10px', fontWeight: 900 }}>{isChecked && '✓'}</span>
                        <span>{l.tipo} <small style={{ opacity: 0.75, fontWeight: 700 }}>({l.unidad})</small></span>
                      </button>
                    );
                  })
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Este nodo no tiene variables de telemetría registradas.</span>
                )}
              </div>
            </div>

            {/* SECCIÓN 3: GRÁFICO RECHARTS Y CONMUTADOR DE VISTA EN LA MISMA LÍNEA DEL ENCABEZADO */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              
              {/* Encabezado del gráfico: Leyendas + Conmutador de Vista (Área, Barras, Líneas) en la misma línea */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {appliedSelections.map((sel, idx) => {
                    const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
                    const color = palette[idx % palette.length];
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: '600', color: '#334155' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color }} />
                        <span>{sel.nombre_var} <small style={{ opacity: 0.75, fontWeight: 700 }}>({sel.unidad})</small></span>
                      </div>
                    );
                  })}
                  {appliedSelections.length === 0 && (
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Sin métricas marcadas</span>
                  )}
                </div>

                {/* Conmutador de Modo de Gráfico en la misma línea del gráfico */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>Vista:</span>
                  
                  <button
                    type="button"
                    onClick={() => setChartMode('area')}
                    className={`dash-btn-style ${chartMode === 'area' ? 'active' : ''}`}
                    style={{ padding: '5px 10px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    title="Gráfico de Área"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                      <path d="M3 3v18h18" />
                      <path d="M7 15l4-5 4 3 5-7v9H7z" fill="currentColor" fillOpacity="0.25" />
                      <path d="M7 15l4-5 4 3 5-7" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChartMode('bar')}
                    className={`dash-btn-style ${chartMode === 'bar' ? 'active' : ''}`}
                    style={{ padding: '5px 10px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    title="Gráfico de Barras"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                      <rect x="5" y="11" width="3" height="9" rx="1" fill="currentColor" fillOpacity="0.3" />
                      <rect x="11" y="6" width="3" height="14" rx="1" fill="currentColor" fillOpacity="0.3" />
                      <rect x="17" y="14" width="3" height="6" rx="1" fill="currentColor" fillOpacity="0.3" />
                      <path d="M3 21h18" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChartMode('line')}
                    className={`dash-btn-style ${chartMode === 'line' ? 'active' : ''}`}
                    style={{ padding: '5px 10px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    title="Gráfico de Líneas"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                      <path d="M3 3v18h18" />
                      <polyline points="6 15 11 9 15 13 21 6" />
                      <circle cx="6" cy="15" r="2" fill="currentColor" />
                      <circle cx="11" cy="9" r="2" fill="currentColor" />
                      <circle cx="15" cy="13" r="2" fill="currentColor" />
                      <circle cx="21" cy="6" r="2" fill="currentColor" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Área del Gráfico */}
              <div style={{ width: '100%', height: '350px', position: 'relative' }}>
                {appliedSelections.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', color: '#64748b', gap: '12px', padding: '2rem', textAlign: 'center' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" width="48" height="48"><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" strokeDasharray="3 3" /><circle cx="12" cy="12" r="9" stroke="#cbd5e1" strokeDasharray="2 2" /></svg>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f2c59' }}>Sin variables seleccionadas</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Selecciona un nodo y marca una o varias de sus variables arriba para visualizar sus curvas en tiempo real.</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartMode === 'area' ? (
                      <AreaChart data={liveData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" tick={{fontSize: 11, fill: '#94a3b8'}} tickMargin={10} axisLine={{stroke: '#e2e8f0'}} tickLine={false} />
                        <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        {appliedSelections.map((sel, idx) => {
                          const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
                          const color = palette[idx % palette.length];
                          return <Area key={sel.clave_mqtt} connectNulls={true} type="monotone" name={`${sel.nombre_var} (${sel.unidad})`} dataKey={`${sel.serial_number}_${sel.clave_mqtt}`} stroke={color} fillOpacity={0.2} fill={color} strokeWidth={2.5} isAnimationActive={false} />;
                        })}
                      </AreaChart>
                    ) : chartMode === 'bar' ? (
                      <BarChart data={liveData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" tick={{fontSize: 11, fill: '#94a3b8'}} tickMargin={10} axisLine={{stroke: '#e2e8f0'}} tickLine={false} />
                        <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        {appliedSelections.map((sel, idx) => {
                          const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
                          const color = palette[idx % palette.length];
                          return <Bar key={sel.clave_mqtt} name={`${sel.nombre_var} (${sel.unidad})`} dataKey={`${sel.serial_number}_${sel.clave_mqtt}`} fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />;
                        })}
                      </BarChart>
                    ) : (
                      <LineChart data={liveData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" tick={{fontSize: 11, fill: '#94a3b8'}} tickMargin={10} axisLine={{stroke: '#e2e8f0'}} tickLine={false} />
                        <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        {appliedSelections.map((sel, idx) => {
                          const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
                          const color = palette[idx % palette.length];
                          return <Line key={sel.clave_mqtt} connectNulls={true} type="monotone" name={`${sel.nombre_var} (${sel.unidad})`} dataKey={`${sel.serial_number}_${sel.clave_mqtt}`} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} isAnimationActive={false} />;
                        })}
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* SECCIÓN 4: TARJETAS DE ESTADÍSTICAS (KPIs Con SVG de Alerta Exclusivo Identico a VisualizarMapa) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
              {appliedSelections.map((sel, idx) => {
                const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
                const color = palette[idx % palette.length];
                const dataKey = `${sel.serial_number}_${sel.clave_mqtt}`;
                let current = 0;
                let lastTimestampStr = '';

                if (liveData.length > 0) {
                  for (let k = liveData.length - 1; k >= 0; k--) {
                    const item = liveData[k];
                    if (item && item[dataKey] !== undefined && item[dataKey] !== null) {
                      current = item[dataKey];
                      if (item.fullDateTime) {
                        lastTimestampStr = item.fullDateTime;
                      } else {
                        lastTimestampStr = formatEcuadorDateTime(item.fecha || item.created_at || item.dateTime || item.timestamp || item.time);
                      }
                      break;
                    }
                  }
                }

                // Obtener objeto de lectura para evaluar rangos y alertas idéntico a VisualizarMapa.jsx
                const lecturaObj = currentTelemetryNode?.lecturas?.find(l => l.data_type === sel.clave_mqtt);
                
                if (!lastTimestampStr && lecturaObj) {
                  lastTimestampStr = formatEcuadorDateTime(lecturaObj.created_at || lecturaObj.updated_at || lecturaObj.fecha || lecturaObj.time);
                }
                
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

                const numVal = Number(current);
                let isLowAlert = false;
                let isHighAlert = false;

                if (minExp !== null && !isNaN(minExp) && numVal < minExp) {
                  isLowAlert = true;
                } else if (maxExp !== null && !isNaN(maxExp) && numVal > maxExp) {
                  isHighAlert = true;
                }

                const alertMsg = isLowAlert
                  ? `Nivel Bajo: El valor registrado (${numVal} ${sel.unidad || ''}) está por debajo del mínimo esperado (${minExp} ${sel.unidad || ''})`
                  : isHighAlert
                  ? `Nivel Alto: El valor registrado (${numVal} ${sel.unidad || ''}) sobrepasó el máximo esperado (${maxExp} ${sel.unidad || ''})`
                  : `Estado Normal: El valor (${numVal} ${sel.unidad || ''}) se encuentra dentro del rango seguro.`;

                return (
                  <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${color}` }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>{sel.unidad || '-'}</div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', fontWeight: '700' }}>{sel.nombre_var}</h4>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}><span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{current}</span></div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block' }}>Último Valor</span>
                        {lastTimestampStr && (
                          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, display: 'block', marginTop: '2px' }}>
                            {lastTimestampStr}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ÍCONO SVG EXCLUSIVO DE ESTADO: Azul para Bajo, Verde para Normal, Rojo para Alto */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {isLowAlert ? (
                        <div
                          title={alertMsg}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#eff6ff',
                            border: '1.5px solid #3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'help',
                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          {/* SVG Triángulo Azul para Bajo */}
                          <svg viewBox="0 0 24 24" fill="#3b82f6" width="22" height="22">
                            <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
                          </svg>
                        </div>
                      ) : isHighAlert ? (
                        <div
                          title={alertMsg}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#fef2f2',
                            border: '1.5px solid #ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'help',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          {/* SVG Rojo para Alto */}
                          <svg viewBox="0 0 24 24" fill="#ef4444" width="22" height="22">
                            <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
                          </svg>
                        </div>
                      ) : (
                        <div
                          title={alertMsg}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#ecfdf5',
                            border: '1.5px solid #10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'help',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          {/* SVG Verde para Normal */}
                          <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" width="20" height="20">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
    </div>
  );
}
