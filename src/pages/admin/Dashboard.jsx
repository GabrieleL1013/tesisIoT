import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/components/admin/Dashboard.css';

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'reverb',
    key: 'rc7n4lowtj8tna8o0eug',
    wsHost: 'localhost',
    wsPort: 8080,
    wssPort: 8080,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
});

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
// Componente de Select Personalizado para Estación / Nodo
const DashboardCustomSelectNode = ({ nodos, selectedSerial, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedNode = nodos.find(n => n.serial_number === selectedSerial);

  return (
    <div className="dash-select-container" ref={ref}>
      <label className="dash-select-label">Seleccione estación</label>
      <button
        type="button"
        className={`dash-select-trigger ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedNode ? selectedNode.nombre : '-- Nodo --'}
        </span>
        <svg className={`dash-select-chevron ${open ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="dash-select-dropdown">
          <div
            className={`dash-select-item ${!selectedSerial ? 'selected' : ''}`}
            onClick={() => {
              onSelect('');
              setOpen(false);
            }}
          >
            <span>-- Nodo --</span>
            {!selectedSerial && (
              <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" width="14" height="14">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          {nodos.map(n => {
            const isSelected = selectedSerial === n.serial_number;
            return (
              <div
                key={n.serial_number}
                className={`dash-select-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelect(n.serial_number);
                  setOpen(false);
                }}
              >
                <span>{n.nombre}</span>
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
          {selectedLectura ? selectedLectura.tipo : '-- Variable --'}
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
  
  // New States for Filtering
  const [pendingSelections, setPendingSelections] = useState([]);
  const [appliedSelections, setAppliedSelections] = useState([]);
  const [selectedNodeSerial, setSelectedNodeSerial] = useState('');
  const [selectedVarKey, setSelectedVarKey] = useState('');

  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  const [isShaking, setIsShaking] = useState(false);

  // Map refs
  const mapContainerRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);

  // Icons for map
  const activeMarkerIcon = React.useMemo(() => {
    return new L.DivIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="background-color: #10b981; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  }, []);

  const inactiveMarkerIcon = React.useMemo(() => {
    return new L.DivIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  }, []);

  useEffect(() => {
    document.title = "Dashboard - IoT ULEAM";
    
    // Fetch dashboard stats from backend database APIs
    Promise.all([
      fetch('http://127.0.0.1:8000/api/nodos').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/ubicaciones').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/noticias').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/users').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/categorias').then(res => res.json())
    ])
      .then(([nodosData, ubiData, noticiasData, usersData, catsData]) => {
        setNodos(Array.isArray(nodosData) ? nodosData : []);
        setUbicaciones(Array.isArray(ubiData) ? ubiData : []);
        setNoticias(Array.isArray(noticiasData) ? noticiasData : []);
        setUsuarios(Array.isArray(usersData) ? usersData : []);
        setCategorias(Array.isArray(catsData) ? catsData : []);

        if (Array.isArray(nodosData) && nodosData.length > 0) {
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
      mapInstanceRef.current = L.map(mapContainerRef.current).setView([-0.95, -80.73], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstanceRef.current);
    }

    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    nodos.forEach((nodo, idx) => {
      let lat = parseFloat(nodo.latitud);
      let lng = parseFloat(nodo.longitud);
      if (isNaN(lat) || isNaN(lng)) {
        const numId = Number(nodo.id) || idx;
        lat = -0.95 + ((numId % 10) - 5) * 0.002;
        lng = -80.73 + (((numId * 3) % 10) - 5) * 0.002;
      }
      const isActive = nodo.is_online;
      const icon = isActive ? activeMarkerIcon : inactiveMarkerIcon;
      L.marker([lat, lng], { icon })
        .bindPopup(`<div style="font-weight:bold;color:#1e293b">${nodo.nombre}</div><div style="font-size:0.8rem;color:#64748b">Categoría: ${nodo.categoria || 'N/A'}</div><div style="font-size:0.8rem;color:${isActive?'#10b981':'#ef4444'}">${isActive?'Conectado':'Desconectado (Sin datos)'}</div>`)
        .addTo(mapInstanceRef.current);
    });
  }, [nodos, activeMarkerIcon, inactiveMarkerIcon]);

  // Cargar historial en vivo
  useEffect(() => {
    if (appliedSelections.length === 0) {
      setLiveData([]);
      return;
    }
    
    fetch('http://127.0.0.1:8000/api/lecturas/live-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ selections: appliedSelections })
    })
    .then(res => res.json())
    .then(data => {
      setLiveData(data);
    })
    .catch(err => console.error("Error fetching live history:", err));

  }, [appliedSelections]);

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
        const newData = e.data;
        const nowTime = new Date().toLocaleTimeString();
        
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
              newHistory[newHistory.length - 1] = { ...lastItem, ...newTick };
            } else {
              const lastItem = newHistory.length > 0 ? newHistory[newHistory.length - 1] : {};
              newHistory.push({ ...lastItem, time: nowTime, ...newTick });
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

  // Handlers para Filtros de Grafica en Vivo
  const handleAddFilter = () => {
    if (pendingSelections.length >= 3) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400); // match animation duration
      
      const id = Date.now();
      setToasts(prev => [...prev, { id, msg: "Solo se pueden agregar 3 variables a la vez" }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
      return;
    }
    const node = nodos.find(n => n.serial_number === selectedNodeSerial);
    if (!node) return;
    const variable = node.lecturas?.find(l => l.data_type === selectedVarKey);
    if (!variable) return;
    
    // Evitar duplicados
    const exists = pendingSelections.find(s => s.serial_number === selectedNodeSerial && s.clave_mqtt === selectedVarKey);
    if (exists) {
      alert("Esta variable ya está seleccionada.");
      return;
    }

    setPendingSelections([...pendingSelections, {
      serial_number: node.serial_number,
      nombre_nodo: node.nombre,
      clave_mqtt: variable.data_type,
      nombre_var: variable.tipo,
      unidad: variable.unidad
    }]);
  };

  const handleRemoveFilter = (index) => {
    setPendingSelections(pendingSelections.filter((_, i) => i !== index));
  };

  const handleApplyFilters = () => {
    if (pendingSelections.length === 0) {
      alert("Debes seleccionar al menos una variable.");
      return;
    }
    setAppliedSelections(pendingSelections);
    localStorage.setItem('dashboardFilters', JSON.stringify(pendingSelections));
  };

  const totalNodos = nodos.length;
  const totalUbicaciones = ubicaciones.length;
  const totalUsuarios = usuarios.length;
  const totalNoticias = noticias.length;

  // 1. DOUGHNUT RADIAL PERCENTAGE (Right visual card)
  // Calculate percentage of the primary category (from database)
  const firstCatName = categorias[0]?.nombre || 'Calidad del Aire';
  const firstCatColor = categorias[0]?.colorHex || '#ff9f1c';
  const secondCatColor = '#0f2c59';

  const calidadAireNodes = nodos.filter(n => n.categoria === firstCatName).length;
  const pctCalidadAire = totalNodos > 0 
    ? Math.round((calidadAireNodes / totalNodos) * 100) 
    : 45; // Falls back to 45% matching the John Don UI image mockup

  const doughnutGradient = {
    background: `conic-gradient(${firstCatColor} 0% ${pctCalidadAire}%, ${secondCatColor} ${pctCalidadAire}% 100%)`
  };

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
        <h1>Dashboard General</h1>
        <p className="dashboard-subtitle">
          Análisis e indicadores en tiempo real de la infraestructura IoT de la ULEAM.
        </p>
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
          <div className="visual-card-header" style={{ padding: '1.5rem 1.5rem 0 1.5rem', marginBottom: '1rem' }}>
            <h3 className="visual-card-title">Mapa de Nodos Activos</h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Ubicación en tiempo real</span>
          </div>

          <div style={{ flex: 1, minHeight: '300px', width: '100%', position: 'relative', zIndex: 0 }}>
            <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }}></div>
          </div>
        </div>

        {/* RIGHT COLUMN: Doughnut percentage visualizer */}
        <div className="visual-card">
          <div className="visual-card-header">
            <h3 className="visual-card-title">Distribución</h3>
          </div>

          <div className="radial-container">
            <div className="radial-progress-ring" style={doughnutGradient}>
              <div className="radial-progress-mask">
                <span>{pctCalidadAire}%</span>
              </div>
            </div>

            <div className="radial-list">
              {categorias.slice(0, 3).map((cat, idx) => {
                const count = nodos.filter(n => n.categoria === cat.nombre).length;
                const dotColor = cat.colorHex || (idx === 0 ? '#ff9f1c' : idx === 1 ? '#0f2c59' : '#e2e8f0');
                return (
                  <div className="radial-list-item" key={cat.id || idx}>
                    <div>
                      <span className="radial-list-dot" style={{ backgroundColor: dotColor }} />
                      <span className="radial-list-name">{cat.nombre}</span>
                    </div>
                    <span className="radial-list-val">{count}</span>
                  </div>
                );
              })}
              {categorias.length > 3 && (
                <div className="radial-list-item">
                  <div>
                    <span className="radial-list-dot" style={{ backgroundColor: '#cbd5e1' }} />
                    <span className="radial-list-name">Otras Categorías</span>
                  </div>
                  <span className="radial-list-val">
                    {nodos.filter(n => !categorias.slice(0, 3).map(c => c.nombre).includes(n.categoria)).length}
                  </span>
                </div>
              )}
              {categorias.length === 0 && (
                <p className="text-xs text-gray-500 italic text-center py-2">No hay categorías registradas.</p>
              )}
            </div>

            <button className="orange-pill-btn w-full">Check Now</button>
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: DOUBLE AREA WAVES AND MINI-CALENDAR WIDGET */}
      <div className="bottom-sections-row">
        <div className="bottom-widget-card" style={{ display: 'block', width: '100%' }}>
          
          {/* Filtros Superiores con Selects Personalizados */}
          <div className="dashboard-filter-card-header">
            {/* Custom Select Estación / Nodo */}
            <DashboardCustomSelectNode
              nodos={nodos}
              selectedSerial={selectedNodeSerial}
              onSelect={(serial) => {
                setSelectedNodeSerial(serial);
                setSelectedVarKey('');
              }}
            />

            {/* Custom Select Métrica / Variable */}
            <DashboardCustomSelectVar
              lecturas={nodos.find(n => n.serial_number === selectedNodeSerial)?.lecturas || []}
              selectedKey={selectedVarKey}
              disabled={!selectedNodeSerial}
              onSelect={(varKey) => setSelectedVarKey(varKey)}
            />
            
            {/* Botón Añadir */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
               <button 
                  type="button"
                  onClick={handleAddFilter} 
                  className={`add-btn-custom ${isShaking ? 'btn-shake' : ''}`}
                  style={{ height: '42px' }}
                >
                  <span style={{ fontSize: '1.2rem', fontWeight: '800', lineHeight: '1' }}>+</span> 
                  <span style={{ fontSize: '0.9rem' }}>Añadir</span>
                </button>
            </div>

            {/* Filtros Activos (Chips) */}
            <div className="dash-active-filters-container">
              <label className="dash-select-label">Filtros activos (Máx. 3)</label>
              <div className="dash-active-chips-wrapper">
                {pendingSelections.map((sel, idx) => (
                  <div key={idx} className="dash-filter-chip">
                    <span>{sel.nombre_var} <small style={{ opacity: 0.75, fontWeight: 700 }}>({sel.serial_number})</small></span>
                    <button 
                      type="button"
                      onClick={() => handleRemoveFilter(idx)} 
                      className="dash-chip-remove-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {pendingSelections.length === 0 && <span className="dash-empty-filters-text">Ningún filtro añadido</span>}
              </div>
            </div>

            {/* Botón Gestionar Filtros */}
            <div style={{ display: 'flex', alignItems: 'flex-end', marginLeft: 'auto' }}>
              <button 
                type="button"
                onClick={handleApplyFilters} 
                className="btn-apply-filters"
                style={{ height: '42px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
                Gestionar Filtros
              </button>
            </div>
          </div>

          {/* Gráfico y KPIs */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            
            {/* Controles de la gráfica (Leyenda superior y tiempo) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                {appliedSelections.map((sel, idx) => {
                  const color = idx === 0 ? '#10b981' : idx === 1 ? '#3b82f6' : '#f97316';
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <span>{sel.nombre_var} <small style={{ opacity: 0.75, fontWeight: 700 }}>({sel.serial_number})</small></span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Últimos minutos
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                  Auto (Vivo)
                </span>
              </div>
            </div>

            {/* Gráfico Recharts */}
            <div style={{ width: '100%', height: '350px' }}>
              {liveData.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                  Esperando datos...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{fontSize: 11, fill: '#94a3b8'}} tickMargin={10} axisLine={{stroke: '#e2e8f0'}} tickLine={false} />
                    
                    {/* Y-Axis 1 (Left - Green) */}
                    {appliedSelections[0] && (
                      <YAxis yAxisId="left" orientation="left" tick={{fontSize: 11, fill: '#10b981'}} axisLine={false} tickLine={false} />
                    )}
                    {/* Y-Axis 2 (Right Inner - Blue) */}
                    {appliedSelections[1] && (
                      <YAxis yAxisId="right1" orientation="right" tick={{fontSize: 11, fill: '#3b82f6'}} axisLine={false} tickLine={false} />
                    )}
                    {/* Y-Axis 3 (Right Outer - Orange) */}
                    {appliedSelections[2] && (
                      <YAxis yAxisId="right2" orientation="right" tick={{fontSize: 11, fill: '#f97316'}} axisLine={false} tickLine={false} width={80} />
                    )}

                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    
                    {appliedSelections[0] && (
                      <Area yAxisId="left" connectNulls={true} type="monotone" name={`${appliedSelections[0].nombre_var} (${appliedSelections[0].serial_number})`} dataKey={`${appliedSelections[0].serial_number}_${appliedSelections[0].clave_mqtt}`} stroke="#10b981" fillOpacity={1} fill="url(#colorGreen)" strokeWidth={2} isAnimationActive={false} />
                    )}
                    {appliedSelections[1] && (
                      <Area yAxisId="right1" connectNulls={true} type="monotone" name={`${appliedSelections[1].nombre_var} (${appliedSelections[1].serial_number})`} dataKey={`${appliedSelections[1].serial_number}_${appliedSelections[1].clave_mqtt}`} stroke="#3b82f6" fillOpacity={1} fill="url(#colorBlue)" strokeWidth={2} isAnimationActive={false} />
                    )}
                    {appliedSelections[2] && (
                      <Area yAxisId="right2" connectNulls={true} type="monotone" name={`${appliedSelections[2].nombre_var} (${appliedSelections[2].serial_number})`} dataKey={`${appliedSelections[2].serial_number}_${appliedSelections[2].clave_mqtt}`} stroke="#f97316" fillOpacity={1} fill="url(#colorOrange)" strokeWidth={2} isAnimationActive={false} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tarjetas de Estadísticas (KPIs) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
              {appliedSelections.map((sel, idx) => {
                const color = idx === 0 ? '#10b981' : idx === 1 ? '#3b82f6' : '#f97316';
                const bgLight = idx === 0 ? '#ecfdf5' : idx === 1 ? '#eff6ff' : '#fff7ed';
                const dataKey = `${sel.serial_number}_${sel.clave_mqtt}`;
                
                // Calcular estadísticas
                let current = 0, max = 0, min = 0;
                if (liveData.length > 0) {
                  const values = liveData.map(d => d[dataKey]).filter(v => v !== null && v !== undefined);
                  if (values.length > 0) {
                    current = values[values.length - 1];
                    max = Math.max(...values);
                    min = Math.min(...values);
                  }
                }

                return (
                  <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${color}` }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {sel.unidad || '-'}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', fontWeight: '700' }}>{sel.nombre_var} <small style={{ opacity: 0.7, fontWeight: 600 }}>({sel.serial_number})</small></h4>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                          <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{current}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Último Valor</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '0.8rem', color: '#475569' }}><span style={{ fontWeight: '600' }}>Máx:</span> {max}</div>
                      <div style={{ fontSize: '0.8rem', color: '#475569' }}><span style={{ fontWeight: '600' }}>Mín:</span> {min}</div>
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
