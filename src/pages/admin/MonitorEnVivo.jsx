import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../styles/pages/admin/MonitorEnVivo.css';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

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

const formatTimeSeconds = () => {
  const d = new Date();
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).toLowerCase().replace(/\s/g, '').replace('am', 'a.m.').replace('pm', 'p.m.');
};

export default function MonitorEnVivo() {
  const [nodos, setNodos] = useState([]);
  const [nodoActivo, setNodoActivo] = useState(null);
  const [isLoadingNodos, setIsLoadingNodos] = useState(true);

  const [sensorData, setSensorData] = useState({});
  const [previousData, setPreviousData] = useState({});
  const [history, setHistory] = useState([]); 
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const [chartWindow, setChartWindow] = useState('15'); // minutes
  const [visibleRows, setVisibleRows] = useState(5);

  const [updateFrequency, setUpdateFrequency] = useState(5);
  const updateFrequencyRef = useRef(5);
  const lastProcessedTimeRef = useRef(0);
  const sensorDataRef = useRef({});

  useEffect(() => {
    sensorDataRef.current = sensorData;
  }, [sensorData]);

  useEffect(() => {
    updateFrequencyRef.current = updateFrequency;
  }, [updateFrequency]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => {
      const newLogs = [{ time: new Date().toLocaleTimeString(), msg: message, type }, ...prev];
      return newLogs.slice(0, 50); 
    });
  };

  const chartData = useMemo(() => {
    // Si asuminos 1 lectura cada 5 segundos: 60 seg / 5 = 12 lecturas por min.
    const maxPoints = parseInt(chartWindow) * 12;
    return history.slice(-maxPoints);
  }, [history, chartWindow]);

  useEffect(() => {
    fetch('http://localhost:8000/api/nodos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setNodos(data);
          const sharedNodeId = localStorage.getItem('shared_node_id');
          if (sharedNodeId) {
            const found = data.find(n => String(n.id) === String(sharedNodeId));
            if (found) setNodoActivo(found);
            else setNodoActivo(data[0]);
          } else {
            setNodoActivo(data[0]);
          }
        }
      })
      .catch(err => console.error("Error fetching nodos:", err))
      .finally(() => setIsLoadingNodos(false));
  }, []);

  useEffect(() => {
    if (nodoActivo) {
       localStorage.setItem('shared_node_id', nodoActivo.id);
    }
  }, [nodoActivo]);

  useEffect(() => {
    if (!nodoActivo) return;
    setIsLoadingHistory(true);
    const fetchRecentHistory = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/lecturas/recientes?serial_number=${nodoActivo.serial_number}`);
        const data = await res.json();
        if (data && data.length > 0) {
            setHistory(data);
            const last = data[data.length - 1];
            const prev = data.length > 1 ? data[data.length - 2] : {};
            setSensorData({ ...last, dateTime: last.dateTime || new Date().toLocaleString() });
            setPreviousData(prev);
            addLog(`Historial reciente cargado (${data.length} registros).`, 'info');
        } else {
            setHistory([]);
            setSensorData({ dateTime: new Date().toLocaleString() });
            setPreviousData({});
        }
      } catch (err) {
        console.error("Error fetching recent history", err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchRecentHistory();
  }, [nodoActivo]);

  useEffect(() => {
    if (!nodoActivo) return;
    addLog(`Conectando a telemetría MQTT [${nodoActivo.serial_number}]...`, 'info');
    
    const channelName = `telemetry.${nodoActivo.serial_number}`;
    const channel = echo.channel(channelName);
    
    channel.subscribed(() => {
        setIsConnected(true);
        addLog(`Conexión establecida con broker.`, 'success');
        lastProcessedTimeRef.current = 0; // Reset timer
    });

    channel.listen('.LecturaRecibida', (e) => {
      const now = Date.now();
      const delay = (updateFrequencyRef.current * 1000) / 2;
      
      if (now - lastProcessedTimeRef.current < delay) {
        return; 
      }
      
      lastProcessedTimeRef.current = now;

      const newData = e.data || e;
      if (!newData) return;
      
      const parsedData = {
        ...newData,
        dateTime: new Date().toLocaleString(),
        shortTime: formatTimeSeconds()
      };
      
      setPreviousData(sensorDataRef.current);
      setSensorData(parsedData);

      setHistory(prev => {
        const newHistory = [...prev, parsedData];
        if (newHistory.length > 400) newHistory.shift(); 
        return newHistory;
      });
      
      const metricsLog = Object.keys(newData)
        .filter(k => !['Sensor', 'timestamp', 'dateTime'].includes(k))
        .map(k => `${k}=${newData[k]}`)
        .join('  ');
      addLog(`Datos recibidos: ${metricsLog}`, 'data');
    });

    return () => {
      channel.stopListening('.LecturaRecibida');
      echo.leaveChannel(channelName);
      setIsConnected(false);
    };
  }, [nodoActivo]);

  // Statistics calculation
  const stats = useMemo(() => {
    if (!history.length || !nodoActivo?.lecturas) return null;
    let computed = {};
    nodoActivo.lecturas.forEach(l => {
      const values = history.map(h => h[l.data_type]).filter(v => v !== undefined && v !== null);
      if (values.length > 0) {
        const avg = values.reduce((a,b)=>a+b,0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        let estabilidad = 'Alta';
        if (l.minExpected !== undefined && l.minExpected !== null && l.maxExpected !== undefined && l.maxExpected !== null) {
          const outOfBounds = values.some(v => v < l.minExpected || v > l.maxExpected);
          if (outOfBounds) estabilidad = 'Baja';
        } else {
          const variance = values.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / values.length;
          const stdDev = Math.sqrt(variance);
          if (stdDev > (avg * 0.1)) estabilidad = 'Baja';
        }

        computed[l.data_type] = {
          promedio: avg.toFixed(2),
          max: max.toFixed(2),
          min: min.toFixed(2),
          estabilidad
        };
      }
    });
    return computed;
  }, [history, nodoActivo]);

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

  const groupedNodos = useMemo(() => {
    const groups = {};
    nodos.forEach(n => {
      const cat = n.categoria || 'Sin categoría';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(n);
    });
    return groups;
  }, [nodos]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      setSearchQuery('');
      setExpandedCategories({});
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.node-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="monitor-vivo-container">
      
      {/* 1. HEADER */}
      <div className="monitor-header-bar">
        <div className="monitor-title-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
            <path d="M12 12v9"></path>
            <path d="m8 17 4 4 4-4"></path>
          </svg>
          <div className="monitor-live-badge">
            <span className="dot"></span> En Vivo
          </div>
        </div>
      </div>

      {/* 2. TOP INFO BAR */}
      <div className="monitor-node-info-card">
        <div className="node-info-section" style={{ flex: '2 1 auto' }}>
          <div className="node-info-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
          </div>
          <div className="node-info-text node-dropdown-container" style={{ position: 'relative' }}>
            <span className="node-info-label">Nodo</span>
            {isLoadingNodos ? (
              <div className="skeleton skeleton-text" style={{width: '200px', marginTop: '6px'}}></div>
            ) : (
            <div className="node-select-wrapper" onClick={toggleDropdown}>
              <div className="node-select-custom">
                {nodoActivo ? `${nodoActivo.categoria || 'Estación meteorológica'} (${nodoActivo.serial_number})` : 'Seleccionar Nodo'}
              </div>
              <svg className="node-select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            )}
            
            {isDropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', zIndex: 50, display: 'flex' }}>
                <div className="custom-dropdown-menu" style={{ position: 'relative', top: 0, marginTop: 0, minWidth: '320px' }}>
                  <div className="dropdown-search-wrapper" onClick={e => e.stopPropagation()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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
                      nodos.filter(n => n.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) || (n.nombre && n.nombre.toLowerCase().includes(searchQuery.toLowerCase()))).length > 0 ? (
                        nodos.filter(n => n.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) || (n.nombre && n.nombre.toLowerCase().includes(searchQuery.toLowerCase()))).map(n => (
                          <div 
                            key={n.id} 
                            className={`custom-dropdown-item ${nodoActivo?.id === n.id ? 'active' : ''}`}
                            onClick={() => {
                              setNodoActivo(n);
                              setHistory([]);
                              setSensorData({});
                              setPreviousData({});
                              setIsDropdownOpen(false);
                              setExpandedCategories({});
                            }}
                          >
                            {n.categoria || 'Estación meteorológica'} ({n.serial_number})
                          </div>
                        ))
                      ) : (
                        <div className="dropdown-no-results">No se encontraron nodos</div>
                      )
                    ) : (
                      Object.entries(groupedNodos).map(([cat, catNodos]) => (
                        <div key={cat} className="dropdown-category-group">
                          <div 
                            className="dropdown-category-header"
                            onClick={(e) => {
                               e.stopPropagation();
                               setExpandedCategories(prev => {
                                 if (prev[cat]) return {}; // Collapse if already expanded
                                 return { [cat]: true };   // Expand only this one
                               });
                            }}
                            style={{ background: expandedCategories[cat] ? '#f1f5f9' : '' }}
                          >
                            <span className="dropdown-category-title">{cat}</span>
                            <span className="dropdown-category-count">{catNodos.length}</span>
                            <svg className="dropdown-category-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ transform: 'rotate(-90deg)', transition: 'none' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Sub Menu / Flyout */}
                {searchQuery.trim() === '' && Object.keys(expandedCategories).some(k => expandedCategories[k]) && (
                  <div className="custom-dropdown-menu" style={{ position: 'relative', top: 0, marginTop: 0, marginLeft: '4px', minWidth: '220px' }}>
                    <div className="dropdown-category-header" style={{ cursor: 'default', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <span className="dropdown-category-title" style={{ color: '#0f2c59' }}>
                        {Object.keys(expandedCategories).find(k => expandedCategories[k])}
                      </span>
                    </div>
                    <div className="dropdown-list-wrapper">
                      {groupedNodos[Object.keys(expandedCategories).find(k => expandedCategories[k])].map(n => (
                        <div 
                          key={n.id} 
                          className={`custom-dropdown-item ${nodoActivo?.id === n.id ? 'active' : ''}`}
                          onClick={() => {
                            setNodoActivo(n);
                            setHistory([]);
                            setSensorData({});
                            setPreviousData({});
                            setIsDropdownOpen(false);
                            setExpandedCategories({});
                          }}
                        >
                          {n.serial_number}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="node-info-section">
          <div className="node-info-icon" style={{ color: isConnected ? '#10b981' : '#ef4444' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="node-info-text">
            <span className="node-info-label">Estado</span>
            {isLoadingNodos ? (
              <div className="skeleton skeleton-text" style={{width: '80px', marginTop: '4px'}}></div>
            ) : (
              <span className="node-info-value" style={{ color: isConnected ? '#10b981' : '#ef4444' }}>{isConnected ? 'Conectado' : 'Desconectado'}</span>
            )}
          </div>
        </div>

        <div className="node-info-section">
          <div className="node-info-icon" style={{ color: '#ea580c' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </div>
          <div className="node-info-text">
            <span className="node-info-label">Protocolo</span>
            {isLoadingNodos ? (
              <div className="skeleton skeleton-text" style={{width: '60px', marginTop: '4px'}}></div>
            ) : (
              <span className="node-info-value">MQTT</span>
            )}
          </div>
        </div>

        <div className="node-info-section">
          <div className="node-info-icon" style={{ color: '#3b82f6' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <div className="node-info-text">
            <span className="node-info-label">Frecuencia (UI)</span>
            {isLoadingNodos ? (
              <div className="skeleton skeleton-text" style={{width: '100px', marginTop: '4px'}}></div>
            ) : (
              <select 
                className="node-info-value" 
                style={{ border: 'none', background: 'transparent', outline: 'none', color: '#0f172a', fontWeight: '600', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
                value={updateFrequency}
                onChange={(e) => setUpdateFrequency(Number(e.target.value))}
              >
                <option value={5}>1 msg / 5s</option>
                <option value={10}>1 msg / 10s</option>
                <option value={15}>1 msg / 15s</option>
                <option value={20}>1 msg / 20s</option>
                <option value={30}>1 msg / 30s</option>
                <option value={60}>1 msg / 1m</option>
              </select>
            )}
          </div>
        </div>

        <div className="node-info-section" style={{ borderRight: 'none', paddingRight: 0 }}>
          <div className="node-info-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div className="node-info-text">
            <span className="node-info-label">Último dato</span>
            {isLoadingNodos || isLoadingHistory ? (
              <div className="skeleton skeleton-text" style={{width: '120px', marginTop: '4px'}}></div>
            ) : (
              <span className="node-info-value">{sensorData.shortTime ? `Reciente (${sensorData.shortTime})` : 'Aguardando...'}</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. LIVE KPI CARDS */}
      <div className="monitor-kpi-grid">
        {isLoadingNodos ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="monitor-kpi-card" style={{ borderTop: '4px solid #e2e8f0' }}>
                <div className="kpi-card-header">
                  <div className="kpi-title-area">
                    <div className="skeleton skeleton-avatar"></div>
                    <div className="kpi-title-text" style={{ gap: '4px', width: '80px' }}>
                      <div className="skeleton skeleton-title"></div>
                      <div className="skeleton skeleton-text"></div>
                    </div>
                  </div>
                  <div className="skeleton skeleton-title" style={{ width: '60px' }}></div>
                </div>
                <div className="kpi-main-value">
                  <div className="skeleton skeleton-kpi-value"></div>
                  <div className="skeleton skeleton-title" style={{ width: '80px', margin: '8px auto 0' }}></div>
                </div>
                <div className="kpi-card-footer">
                  <div className="skeleton skeleton-text" style={{ width: '100px' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '60px' }}></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          nodoActivo?.lecturas?.map((l, idx) => {
            const theme = getTheme(l.data_type, l.icono);
            const currentVal = sensorData[l.data_type];
            const prevVal = previousData[l.data_type];
            
            let diff = 0;
            let trendClass = 'trend-flat';
            let trendIcon = '';
            if (currentVal !== undefined && prevVal !== undefined) {
              diff = (currentVal - prevVal).toFixed(2);
              if (diff > 0) { trendClass = 'trend-up'; trendIcon = '▲'; diff = `+${diff}`; }
              else if (diff < 0) { trendClass = 'trend-down'; trendIcon = '▼'; }
            }

            return (
              <div key={idx} className={`monitor-kpi-card ${theme.class}`}>
                <div className="kpi-card-header">
                  <div className="kpi-title-area">
                    <div className="kpi-icon-wrapper">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        {theme.icon}
                      </svg>
                    </div>
                    <div className="kpi-title-text">
                      <strong>{l.tipo}</strong>
                      <span>Actual</span>
                    </div>
                  </div>
                  {isLoadingHistory ? (
                    <div className="skeleton skeleton-text" style={{ width: '60px' }}></div>
                  ) : (
                    <div className="kpi-trend">
                      <span className={`kpi-trend-val ${trendClass}`}>
                        {trendIcon} {diff !== 0 ? diff : '0.00'} {l.unidad}
                      </span>
                      <span className="kpi-trend-label">vs. lectura anterior</span>
                    </div>
                  )}
                </div>

                <div className="kpi-main-value">
                  {isLoadingHistory ? (
                    <>
                      <div className="skeleton skeleton-kpi-value"></div>
                      <div className="skeleton skeleton-title" style={{ width: '80px', margin: '16px auto 0' }}></div>
                    </>
                  ) : (
                    <>
                      <h2>{currentVal !== undefined ? currentVal : '--'} <span className="kpi-unit">{l.unidad}</span></h2>
                      <span className={`kpi-status-badge ${stats?.[l.data_type]?.estabilidad === 'Baja' ? 'status-baja' : 'status-alta'}`}>
                        {stats?.[l.data_type]?.estabilidad ? `Estabilidad: ${stats[l.data_type].estabilidad}` : 'Calculando...'}
                      </span>
                    </>
                  )}
                </div>

                <div className="kpi-card-footer">
                  <span>Última actualización:</span>
                  {isLoadingHistory ? (
                    <div className="skeleton skeleton-text" style={{ width: '60px' }}></div>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a', fontWeight: 600 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      {sensorData.shortTime || '--:--'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. LIVE CHART */}
      <div className="monitor-chart-card">
        <div className="chart-card-header">
          <div className="chart-card-title" style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            Tendencia en Vivo <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>(Últimos {chartWindow} minutos)</span>
          </div>
          <div className="chart-controls">
            <div className="monitor-live-badge" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>
              <span className="dot" style={{width: '4px', height: '4px'}}></span> En Vivo
            </div>
            <select value={chartWindow} onChange={e => setChartWindow(e.target.value)}>
              <option value="5">5 min</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
            </select>
          </div>
        </div>

        <div className="chart-legend">
           {nodoActivo?.lecturas?.map((l, i) => {
             const t = getTheme(l.data_type, l.icono);
             return (
               <div key={i} className="legend-item" style={{ color: t.hex }}>
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12"><circle cx="12" cy="12" r="10"></circle></svg>
                 {l.tipo} ({l.unidad})
               </div>
             );
           })}
        </div>

        <div style={{ width: '100%', height: '300px' }}>
          {isLoadingNodos || isLoadingHistory ? (
            <div className="skeleton skeleton-chart-box"></div>
          ) : chartData.length === 0 ? (
            <div className="loader-container">Esperando puntos de datos...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  {nodoActivo?.lecturas?.map((l, idx) => {
                    const theme = getTheme(l.data_type, l.icono);
                    return (
                      <linearGradient key={idx} id={`colorVivo${l.data_type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.hex} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={theme.hex} stopOpacity={0}/>
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="shortTime" tick={{fontSize: 10, fill: '#94a3b8'}} tickMargin={10} axisLine={{stroke: '#e2e8f0'}} tickLine={false} />
                
                {/* Dynamically render YAxis based on available readings */}
                {nodoActivo?.lecturas?.[0] && <YAxis yAxisId="left" tick={{fontSize: 10, fill: getTheme(nodoActivo.lecturas[0].data_type, nodoActivo.lecturas[0].icono).hex}} axisLine={false} tickLine={false} dx={-10} />}
                {nodoActivo?.lecturas?.[1] && <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: getTheme(nodoActivo.lecturas[1].data_type, nodoActivo.lecturas[1].icono).hex}} axisLine={false} tickLine={false} dx={10} />}
                
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />
                
                {nodoActivo?.lecturas?.map((l, idx) => {
                   const theme = getTheme(l.data_type, l.icono);
                   return (
                     <Area 
                       key={idx} 
                       yAxisId={idx % 2 === 0 ? "left" : "right"}
                       type="monotone" 
                       dataKey={l.data_type} 
                       name={`${l.tipo} (${l.unidad})`} 
                       stroke={theme.hex} 
                       strokeWidth={2.5} 
                       fillOpacity={1} 
                       fill={`url(#colorVivo${l.data_type})`} 
                       dot={{r: 4, strokeWidth: 2, fill: '#fff', stroke: theme.hex}} 
                       activeDot={{r: 6, strokeWidth: 0, fill: theme.hex}} 
                       isAnimationActive={false}
                     />
                   );
                })}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 5. TABLES GRID */}
      <div className="monitor-tables-grid">
        
        {/* Resumen Estadístico */}
        <div className="monitor-table-card">
          <h3>Resumen Estadístico (Hoy)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Métrica</th>
                  <th>Promedio</th>
                  <th>Máximo</th>
                  <th>Mínimo</th>
                  <th>Estabilidad</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingNodos || isLoadingHistory ? (
                  [1, 2].map(i => (
                    <tr key={i}>
                      <td><div className="skeleton skeleton-text" style={{ width: '120px' }}></div></td>
                      <td><div className="skeleton skeleton-text" style={{ width: '40px', margin: '0 auto' }}></div></td>
                      <td><div className="skeleton skeleton-text" style={{ width: '40px', margin: '0 auto' }}></div></td>
                      <td><div className="skeleton skeleton-text" style={{ width: '40px', margin: '0 auto' }}></div></td>
                      <td><div className="skeleton skeleton-button" style={{ margin: '0 auto' }}></div></td>
                    </tr>
                  ))
                ) : (
                  nodoActivo?.lecturas?.map((l, i) => {
                    const theme = getTheme(l.data_type);
                    const st = stats?.[l.data_type];
                    return (
                      <tr key={i}>
                        <td>
                          <div className="kpi-icon-wrapper" style={{ width: '32px', height: '32px', background: theme.bg, color: theme.hex, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d={theme.icon} /></svg>
                          </div>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{l.tipo} ({l.unidad})</span>
                        </td>
                        <td style={{ color: theme.hex }}>{st?.promedio || '--'}</td>
                        <td style={{ color: theme.hex }}>{st?.max || '--'}</td>
                        <td style={{ color: theme.hex }}>{st?.min || '--'}</td>
                        <td>
                          <span className={`badge-${st?.estabilidad?.toLowerCase() || 'alta'}`}>{st?.estabilidad || '--'}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
                {(!isLoadingNodos && !isLoadingHistory && !nodoActivo?.lecturas?.length) && (
                  <tr><td colSpan="5">No hay métricas configuradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Últimas Lecturas */}
        <div className="monitor-table-card">
          <h3>Últimas Lecturas</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  {isLoadingNodos ? (
                    <>
                       <th><div className="skeleton skeleton-text" style={{ width: '80px', margin: '0 auto' }}></div></th>
                       <th><div className="skeleton skeleton-text" style={{ width: '80px', margin: '0 auto' }}></div></th>
                    </>
                  ) : (
                    nodoActivo?.lecturas?.map((l, i) => <th key={i}>{l.tipo} ({l.unidad})</th>)
                  )}
                </tr>
              </thead>
              <tbody>
                {isLoadingNodos || isLoadingHistory ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i}>
                      <td><div className="skeleton skeleton-text" style={{ width: '60px' }}></div></td>
                      <td><div className="skeleton skeleton-text" style={{ width: '40px', margin: '0 auto' }}></div></td>
                      <td><div className="skeleton skeleton-text" style={{ width: '40px', margin: '0 auto' }}></div></td>
                    </tr>
                  ))
                ) : (
                  [...history].reverse().slice(0, visibleRows).map((row, r_idx) => (
                    <tr key={r_idx}>
                      <td style={{ color: '#64748b' }}>{row.shortTime || row.time}</td>
                      {nodoActivo?.lecturas?.map((l, c_idx) => {
                        const theme = getTheme(l.data_type);
                        return (
                          <td key={c_idx} style={{ color: theme.hex }}>{row[l.data_type] !== undefined ? row[l.data_type] : '--'}</td>
                        );
                      })}
                    </tr>
                  ))
                )}
                {(!isLoadingNodos && !isLoadingHistory && history.length === 0) && <tr><td colSpan={(nodoActivo?.lecturas?.length || 0) + 1}>Esperando registros...</td></tr>}
              </tbody>
            </table>
          </div>
          <button 
             className="table-footer-btn"
             onClick={() => setVisibleRows(prev => prev === 5 ? 20 : 5)}
             disabled={isLoadingNodos || isLoadingHistory}
          >
             {visibleRows === 5 ? 'Ver más lecturas ▾' : 'Ver menos lecturas ▴'}
          </button>
        </div>

      </div>

      {/* 6. TERMINAL LOGS */}
      <div className="monitor-terminal">
        <div className="terminal-header-bar">
          <span className="terminal-title">Logs MQTT</span>
          <div className="terminal-actions">
            <svg onClick={() => {
              const text = logs.map(l => `[${l.time}] ${l.msg}`).join('\n');
              navigator.clipboard.writeText(text);
              addLog('Logs copiados al portapapeles', 'success');
            }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{cursor: 'pointer'}}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <svg onClick={() => setLogs([])} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{cursor: 'pointer'}}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </div>
        </div>
        <div className="terminal-logs-content">
          {logs.map((log, idx) => (
            <div key={idx} className="log-line">
              <span className="log-time">{log.time}</span>
              {log.type === 'success' && <span className="log-icon-green">☑</span>}
              {log.type === 'data' && <span className="log-icon-blue">⬇</span>}
              {log.type === 'info' && <span className="log-icon-blue">ℹ</span>}
              <span className={log.type === 'data' ? 'log-text' : ''}>{log.msg}</span>
            </div>
          ))}
          {logs.length === 0 && <div>Esperando inicialización del socket...</div>}
        </div>
      </div>

    </div>
  );
}
