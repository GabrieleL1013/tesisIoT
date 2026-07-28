import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import '../../styles/components/admin/HistoricoAgregado.css';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import CustomDatePicker from '../../components/admin/CustomDatePicker';

const agrupacionOptionsDay = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '120', label: '2 horas' },
  { value: '180', label: '3 horas' },
  { value: '240', label: '4 horas' }
];
const agrupacionOptionsRange = [
  ...agrupacionOptionsDay,
  { value: '1440', label: '1 día' }
];
const agrupacionOptionsHour = [
  { value: '1', label: '1 min' },
  { value: '2', label: '2 min' },
  { value: '3', label: '3 min' },
  { value: '4', label: '4 min' },
  { value: '5', label: '5 min' },
  { value: '6', label: '6 min' },
  { value: '10', label: '10 min' }
];

export default function HistoricoAgregado() {
  const location = useLocation();
  const [nodos, setNodos] = useState([]);
  const [nodoActivo, setNodoActivo] = useState(null);
  
  const chartRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (chartRef.current && chartRef.current.requestFullscreen) {
        chartRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const getGuayaquilDate = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  };

  const today = getGuayaquilDate(0);
  const lastWeek = getGuayaquilDate(-7);

  const savedFiltersStr = localStorage.getItem('historico_filters');
  const savedFilters = savedFiltersStr ? JSON.parse(savedFiltersStr) : {};
  
  const inspectState = location.state?.inspectInstability ? location.state : null;

  const [filterMode, setFilterMode] = useState(inspectState ? 'hour' : (savedFilters.filterMode || 'day')); 
  const [startDate, setStartDate] = useState(inspectState ? inspectState.date : (savedFilters.startDate || today));
  const [endDate, setEndDate] = useState(inspectState ? inspectState.date : (savedFilters.endDate || today));
  const [selectedHour, setSelectedHour] = useState(
    inspectState 
      ? inspectState.hour 
      : (savedFilters.selectedHour !== undefined 
          ? savedFilters.selectedHour 
          : parseInt(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil', hour: '2-digit', hour12: false })))
  );
  
  const [groupingIntervalDay, setGroupingIntervalDay] = useState(savedFilters.groupingIntervalDay || '60');
  const [groupingIntervalRange, setGroupingIntervalRange] = useState(savedFilters.groupingIntervalRange || '1440');
  const [groupingIntervalHour, setGroupingIntervalHour] = useState(inspectState ? '1' : (savedFilters.groupingIntervalHour || '5'));

  useEffect(() => {
    localStorage.setItem('historico_filters', JSON.stringify({
      filterMode,
      startDate,
      endDate,
      selectedHour,
      groupingIntervalDay,
      groupingIntervalRange,
      groupingIntervalHour
    }));
  }, [filterMode, startDate, endDate, selectedHour, groupingIntervalDay, groupingIntervalRange, groupingIntervalHour]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHourDropdownOpen, setIsHourDropdownOpen] = useState(false);
  const [isAgrupacionDropdownOpen, setIsAgrupacionDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar si estamos escribiendo en un input o textbox
      if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;

      // Ctrl + Alt + Flechas
      if (e.ctrlKey && e.altKey) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          setFilterMode('hour');
          setSelectedHour(prev => {
            if (e.key === 'ArrowUp') return prev <= 0 ? 23 : prev - 1;
            return prev >= 23 ? 0 : prev + 1;
          });
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          const offset = e.key === 'ArrowRight' ? 1 : -1;
          const shiftDate = (dateStr) => {
            if (!dateStr) return dateStr;
            const d = new Date(dateStr + 'T12:00:00');
            d.setDate(d.getDate() + offset);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          };
          setEndDate(prev => shiftDate(prev));
          return;
        }
      }

      // Ctrl + Flechas: Modos y Agrupación
      if (e.ctrlKey && !e.altKey && !e.shiftKey) {
        // Izquierda / Derecha -> Modos
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          setFilterMode(prev => {
            if (e.key === 'ArrowRight') {
              if (prev === 'day') return 'range';
              if (prev === 'range') return 'hour';
              if (prev === 'hour') return 'day';
            } else {
              if (prev === 'day') return 'hour';
              if (prev === 'hour') return 'range';
              if (prev === 'range') return 'day';
            }
            return prev;
          });
          return;
        }
        
        // Arriba / Abajo -> Agrupación
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const options = filterMode === 'day' ? agrupacionOptionsDay :
                          filterMode === 'range' ? agrupacionOptionsRange :
                          agrupacionOptionsHour;
          const values = options.map(o => o.value);
          
          const changeInterval = (prev) => {
            const idx = values.indexOf(prev);
            let nextIdx = e.key === 'ArrowUp' ? idx - 1 : idx + 1;
            if (nextIdx < 0) nextIdx = values.length - 1;
            if (nextIdx >= values.length) nextIdx = 0;
            return values[nextIdx];
          };

          if (filterMode === 'day') setGroupingIntervalDay(changeInterval);
          else if (filterMode === 'range') setGroupingIntervalRange(changeInterval);
          else if (filterMode === 'hour') setGroupingIntervalHour(changeInterval);
          
          return;
        }
      }

      // Solo flechas -> Días
      if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          const offset = e.key === 'ArrowRight' ? 1 : -1;
          const shiftDate = (dateStr) => {
            if (!dateStr) return dateStr;
            const d = new Date(dateStr + 'T12:00:00');
            d.setDate(d.getDate() + offset);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          };
          setStartDate(prev => shiftDate(prev));
          if (filterMode !== 'range') {
            setEndDate(prev => shiftDate(prev));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filterMode]);

  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      setSearchQuery('');
      setExpandedCategories({});
    }
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.node-info-text')) {
        setIsDropdownOpen(false);
      }
      if (!event.target.closest('.hour-dropdown-container')) {
        setIsHourDropdownOpen(false);
      }
      if (!event.target.closest('.agrupacion-dropdown-container')) {
        setIsAgrupacionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const [historicalData, setHistoricalData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/nodos`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setNodos(data);
          let foundNode = null;
          if (location.state && location.state.inspectInstability) {
             foundNode = data.find(n => String(n.id) === String(location.state.node_id));
          }
          if (!foundNode) {
            const sharedNodeId = localStorage.getItem('shared_node_id');
            if (sharedNodeId) {
              foundNode = data.find(n => String(n.id) === String(sharedNodeId));
            }
          }
          setNodoActivo(foundNode || data[0]);
        }
      })
      .catch(err => console.error("Error fetching nodos:", err));
  }, []);

  useEffect(() => {
    if (nodoActivo) {
       localStorage.setItem('shared_node_id', nodoActivo.id);
    }
  }, [nodoActivo]);

  const groupedNodos = useMemo(() => {
    const groups = {};
    nodos.forEach(n => {
      const cat = n.categoria || 'Sin categoría';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(n);
    });
    return groups;
  }, [nodos]);

  const fetchHistory = async () => {
    if (!nodoActivo || !nodoActivo.lecturas) return;
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams({
        serial_number: nodoActivo.serial_number,
        filter_mode: filterMode,
        start_date: startDate,
      });

      let currentInterval = groupingIntervalDay;
      if (filterMode === 'range') currentInterval = groupingIntervalRange;
      if (filterMode === 'hour') currentInterval = groupingIntervalHour;
      params.append('interval', currentInterval);

      if (filterMode === 'range') params.append('end_date', endDate);
      if (filterMode === 'hour') params.append('hour', selectedHour);

      const mergedMap = new Map();
      
      for (const lectura of nodoActivo.lecturas) {
        const res = await fetch(`${API_BASE_URL}/lecturas?${params.toString()}&clave_mqtt=${lectura.data_type}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (!mergedMap.has(item.fecha)) {
              mergedMap.set(item.fecha, { fecha: item.fecha, label: item.label });
            }
            mergedMap.get(item.fecha)[lectura.data_type] = item.valor;
            mergedMap.get(item.fecha)[`${lectura.data_type}_min`] = item.min;
            mergedMap.get(item.fecha)[`${lectura.data_type}_max`] = item.max;
          });
        }
      }
      
      const mergedArray = Array.from(mergedMap.values()).sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
      setHistoricalData(mergedArray);
    } catch (err) {
      console.error("Error fetching history", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filterMode, startDate, endDate, selectedHour, groupingIntervalDay, groupingIntervalRange, groupingIntervalHour, nodoActivo]);

  const DYNAMIC_ICONS = {
    termometro: <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />,
    humedad: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
    presion: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="12" x2="15" y2="9" /></>,
    viento: <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />,
    lluvia: <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25M8 16v4m4-2v4m4-4v4" />,
    luz: <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>,
    energia: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    ph: <path d="M10 2v7.31L4.75 18.25A2 2 0 0 0 6.46 21.2h11.08a2 2 0 0 0 1.71-2.95L14 9.31V2" />,
    sonido: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></>,
    general: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>
  };

  const themeColors = {
    temp: { hex: '#f97316', label: 'Temperatura', theme: 'theme-orange', bg: '#fff7ed', stroke: '#ea580c', icon: DYNAMIC_ICONS.termometro },
    hum: { hex: '#2563eb', label: 'Humedad', theme: 'theme-blue', bg: '#eff6ff', stroke: '#3b82f6', icon: DYNAMIC_ICONS.humedad },
    press: { hex: '#10b981', label: 'Presión', theme: 'theme-green', bg: '#ecfdf5', stroke: '#059669', icon: DYNAMIC_ICONS.presion },
    wind: { hex: '#06b6d4', label: 'Viento', theme: 'theme-cyan', bg: '#ecfeff', stroke: '#0891b2', icon: DYNAMIC_ICONS.viento },
    rain: { hex: '#8b5cf6', label: 'Lluvia', theme: 'theme-purple', bg: '#f5f3ff', stroke: '#7c3aed', icon: DYNAMIC_ICONS.lluvia },
    aqi: { hex: '#16a34a', label: 'Calidad de Aire', theme: 'theme-green', bg: '#f0fdf4', stroke: '#10b981', icon: DYNAMIC_ICONS.viento },
    co2: { hex: '#4f46e5', label: 'CO2', theme: 'theme-indigo', bg: '#eef2ff', stroke: '#4f46e5', icon: <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" /> },
    default: { hex: '#64748b', label: 'Variable', theme: 'theme-green', bg: '#f0fdf4', stroke: '#10b981', icon: DYNAMIC_ICONS.general }
  };

  const getTheme = (clave, icono) => {
    let baseTheme = themeColors.default;
    const lower = (clave || '').toLowerCase();
    if (lower.includes('temp')) baseTheme = themeColors.temp;
    else if (lower.includes('hum')) baseTheme = themeColors.hum;
    else if (lower.includes('press') || lower.includes('presion')) baseTheme = themeColors.press;
    else if (lower.includes('wind') || lower.includes('viento')) baseTheme = themeColors.wind;
    else if (lower.includes('rain') || lower.includes('lluvia')) baseTheme = themeColors.rain;
    else if (lower.includes('aqi') || lower.includes('aire')) baseTheme = themeColors.aqi;
    else if (lower.includes('co2') || lower.includes('carbono')) baseTheme = themeColors.co2;

    if (icono && DYNAMIC_ICONS[icono]) {
      return { ...baseTheme, icon: DYNAMIC_ICONS[icono] };
    }
    return baseTheme;
  };

  const kpis = useMemo(() => {
    if (!historicalData.length || !nodoActivo?.lecturas) return null;
    
    let stats = { count: historicalData.length, variables: {} };

    nodoActivo.lecturas.forEach(l => {
      let values = historicalData.map(d => d[l.data_type]).filter(v => v !== undefined && v !== null);
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);

        // Buscar a qué hora ocurrió el max y min
        const maxItem = historicalData.find(d => d[l.data_type] === max);
        const minItem = historicalData.find(d => d[l.data_type] === min);

        stats.variables[l.data_type] = {
          promedio: avg.toFixed(1),
          max: max.toFixed(1),
          min: min.toFixed(1),
          maxTime: maxItem ? maxItem.label : '',
          minTime: minItem ? minItem.label : '',
          info: {
            tipo: l.label || l.tipo || 'Variable',
            unidad: l.unit || l.unidad || ''
          },
          theme: getTheme(l.data_type, l.icono)
        };
      }
    });
    return stats;
  }, [historicalData, nodoActivo]);

  const chartAxisConfig = useMemo(() => {
    if (!kpis || !kpis.variables) return { split: false, rightKeys: [] };
    const maxVals = Object.entries(kpis.variables).map(([k, v]) => ({ key: k, max: parseFloat(v.max) }));
    
    // Casos exagerados (valores < 100 mezclados con > 1000)
    const hasSmall = maxVals.some(v => v.max < 100);
    const hasLarge = maxVals.some(v => v.max > 1000);
    
    if (hasSmall && hasLarge) {
       return {
         split: true,
         rightKeys: maxVals.filter(v => v.max >= 1000).map(v => v.key)
       };
    }
    return { split: false, rightKeys: [] };
  }, [kpis]);

  const currentAgrupacionOptions = filterMode === 'day' ? agrupacionOptionsDay : filterMode === 'range' ? agrupacionOptionsRange : agrupacionOptionsHour;
  const currentAgrupacionValue = filterMode === 'day' ? groupingIntervalDay : filterMode === 'range' ? groupingIntervalRange : groupingIntervalHour;
  const currentAgrupacionLabel = currentAgrupacionOptions.find(o => o.value == currentAgrupacionValue)?.label || '';

  const handleExportImage = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff' });
      const image = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = image;
      const safeLabel = currentAgrupacionLabel.replace(/\s+/g, '');
      const fileName = `historico_${filterMode}_${startDate}_${safeLabel}.png`;
      a.download = fileName;
      a.click();
    } catch (error) {
      console.error("Error exporting image", error);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: 'white', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="custom-tooltip-label" style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>{label}</div>
          {payload.map((entry, index) => {
            const minVal = entry.payload[`${entry.dataKey}_min`];
            const maxVal = entry.payload[`${entry.dataKey}_max`];
            
            const lecturaConfig = nodoActivo?.lecturas?.find(l => l.data_type === entry.dataKey);
            let outOfBounds = false;
            let hasLimits = false;
            
            if (lecturaConfig && lecturaConfig.minExpected !== undefined && lecturaConfig.maxExpected !== undefined && lecturaConfig.minExpected !== null && lecturaConfig.maxExpected !== null) {
                hasLimits = true;
                // Verificamos si el promedio, mínimo o máximo del período rompieron los límites
                outOfBounds = entry.value < lecturaConfig.minExpected || entry.value > lecturaConfig.maxExpected 
                              || minVal < lecturaConfig.minExpected || maxVal > lecturaConfig.maxExpected;
            }

            return (
              <div key={index} className="custom-tooltip-item" style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="tooltip-dot" style={{ backgroundColor: entry.color, width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' }}></span>
                  <span style={{ color: entry.color, fontWeight: 600 }}>{entry.name}:</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{entry.value}</span>
                </div>
                {(minVal !== undefined && maxVal !== undefined) && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '16px', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span title={`Mínimo del período seleccionado`}>↓ Min: {minVal}</span>
                    <span title={`Máximo del período seleccionado`}>↑ Max: {maxVal}</span>
                    {hasLimits && (
                      <span title={`Estabilidad evaluada contra los límites`} style={{ color: outOfBounds ? '#dc2626' : '#10b981', fontWeight: 600 }}>
                        • Estabilidad: {outOfBounds ? 'Baja' : 'Alta'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const isValueOutOfRange = (dataKey, payload) => {
    if (!payload) return false;
    const lecturaInfo = nodoActivo?.lecturas?.find(l => l.data_type === dataKey);
    if (!lecturaInfo) return false;

    const val = payload[dataKey];
    const minVal = payload[`${dataKey}_min`];
    const maxVal = payload[`${dataKey}_max`];

    const minExp = (lecturaInfo.minExpected !== null && lecturaInfo.minExpected !== undefined) ? parseFloat(lecturaInfo.minExpected) : null;
    const maxExp = (lecturaInfo.maxExpected !== null && lecturaInfo.maxExpected !== undefined) ? parseFloat(lecturaInfo.maxExpected) : null;

    if (minExp === null || maxExp === null || isNaN(minExp) || isNaN(maxExp)) return false;

    if (val !== undefined && val !== null && !isNaN(parseFloat(val))) {
      const v = parseFloat(val);
      if (v < minExp || v > maxExp) return true;
    }
    if (minVal !== undefined && minVal !== null && !isNaN(parseFloat(minVal))) {
      if (parseFloat(minVal) < minExp) return true;
    }
    if (maxVal !== undefined && maxVal !== null && !isNaN(parseFloat(maxVal))) {
      if (parseFloat(maxVal) > maxExp) return true;
    }
    return false;
  };

  const CustomDot = (props) => {
    const { cx, cy, stroke, payload, dataKey } = props;
    if (cx === undefined || cy === undefined || !payload) return null;

    const outOfRange = isValueOutOfRange(dataKey, payload);
    const fillColor = outOfRange ? '#ef4444' : '#ffffff';
    const radius = outOfRange ? 5.5 : 4;
    const strokeW = outOfRange ? 2.5 : 2;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fillColor}
        stroke={stroke}
        strokeWidth={strokeW}
        style={{ transition: 'all 0.15s ease' }}
      />
    );
  };

  const CustomActiveDot = (props) => {
    const { cx, cy, stroke, payload, dataKey } = props;
    if (cx === undefined || cy === undefined || !payload) return null;

    const outOfRange = isValueOutOfRange(dataKey, payload);
    // Si da baja estabilidad (fuera de rango), el relleno se MANTIENE ROJO (#ef4444) al pasar el mouse
    const fillColor = outOfRange ? '#ef4444' : stroke;
    const radius = outOfRange ? 7.5 : 6;
    const strokeW = outOfRange ? 3 : 0;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fillColor}
        stroke={outOfRange ? stroke : '#ffffff'}
        strokeWidth={strokeW}
        style={{ transition: 'all 0.15s ease' }}
      />
    );
  };

  return (
    <div className="historico-container">
      {/* 1. HEADER */}
      <div className="historico-header-bar">
        <div className="historico-header-left">
          <div className="historico-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="historico-header-titles">
            <p style={{ margin: 0 }}>Consulta y analiza los datos históricos almacenados en el Data Warehouse mediante diferentes niveles de agregación temporal.</p>
          </div>
        </div>
        <div className="historico-header-right">
          <span>Última actualización: {new Date().toLocaleString()}</span>
          <button onClick={fetchHistory} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* 2. NODE INFO CARD */}
      <div className="historico-node-card">
        <div className="node-card-left">
          <div className="node-icon-circle theme-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" width="28" height="28">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
          </div>
          <div className="node-info-text" style={{ position: 'relative' }}>
            <span className="node-label">Nodo seleccionado</span>
            <div className="node-select-wrapper" onClick={toggleDropdown}>
              <div className="node-select-custom">
                {nodoActivo ? nodoActivo.serial_number : 'Seleccionar Nodo'}
              </div>
              <svg className="node-select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            
            {isDropdownOpen && (
              <div style={{ position: 'absolute', top: '60px', left: 0, zIndex: 50, display: 'flex' }}>
                <div className="custom-dropdown-menu" style={{ position: 'relative', top: 0, minWidth: '260px' }}>
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
                      // Resultados de búsqueda plana
                      nodos.filter(n => n.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) || (n.nombre && n.nombre.toLowerCase().includes(searchQuery.toLowerCase()))).length > 0 ? (
                        nodos.filter(n => n.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) || (n.nombre && n.nombre.toLowerCase().includes(searchQuery.toLowerCase()))).map(n => (
                          <div 
                            key={n.id} 
                            className={`custom-dropdown-item ${nodoActivo?.id === n.id ? 'active' : ''}`}
                            onClick={() => {
                              setNodoActivo(n);
                              setIsDropdownOpen(false);
                              setExpandedCategories({});
                            }}
                          >
                            {n.serial_number} <span style={{fontSize: '0.75rem', color: '#64748b'}}>({n.categoria || 'Sin categoría'})</span>
                          </div>
                        ))
                      ) : (
                        <div className="dropdown-no-results">No se encontraron nodos</div>
                      )
                    ) : (
                      // Vista agrupada por categorías
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
                  <div className="custom-dropdown-menu" style={{ position: 'relative', top: 0, marginLeft: '4px', minWidth: '220px' }}>
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
            <span className="node-subtitle">{nodoActivo?.categoria || 'Estación meteorológica'}</span>
          </div>
        </div>

        <div className="node-card-middle">
          <span className="node-label" style={{ fontSize: '0.7rem' }}>Variables disponibles</span>
          <div className="variables-list">
            {nodoActivo?.lecturas?.map((l, idx) => {
              const theme = getTheme(l.data_type, l.icono);
              return (
                <span key={idx} className={`variable-tag tag-${theme.theme.split('-')[1]}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    {theme.icon}
                  </svg>
                  {l.nombre || l.tipo} ({l.unidad})
                </span>
              );
            })}
          </div>
        </div>

        <div className="node-card-right">
          <div className="node-info-text">
            <span className="node-label" style={{ fontSize: '0.7rem' }}>Estado del nodo</span>
            <div className={`status-badge ${nodoActivo?.estado ? '' : 'inactive'}`}>
              <span className="dot"></span>
              {nodoActivo?.estado ? 'Activo' : 'Inactivo'}
            </div>
            <span className="node-label" style={{ fontSize: '0.7rem' }}>Última lectura</span>
            <span className="last-read-time">{new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 3. FILTER ROW */}
      <div className="historico-filter-row">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="filter-tabs-container">
            <button className={`filter-tab ${filterMode === 'day' ? 'active' : ''}`} onClick={() => setFilterMode('day')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Día específico
            </button>
            <button className={`filter-tab ${filterMode === 'range' ? 'active' : ''}`} onClick={() => setFilterMode('range')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Rango de fechas
            </button>
            <button className={`filter-tab ${filterMode === 'hour' ? 'active' : ''}`} onClick={() => setFilterMode('hour')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Hora específica
            </button>
          </div>
          <div style={{ marginTop: '8px', marginBottom: '16px', fontSize: '0.75rem', color: '#94a3b8' }}>
            Atajo: <strong>Ctrl + ← / →</strong> para cambiar entre modos
          </div>
        </div>

        <div className="filter-controls-card">
          <div className="controls-group-wrapper">
            {(filterMode === 'day' || filterMode === 'hour') && (
              <CustomDatePicker label="Fecha" value={startDate} onChange={setStartDate} shortcutHint="<strong>← / →</strong> para cambiar día" />
            )}
            
            {filterMode === 'range' && (
              <>
                <CustomDatePicker label="Fecha Inicio" value={startDate} onChange={setStartDate} shortcutHint="<strong>← / →</strong> para cambiar día" />
                <CustomDatePicker label="Fecha Fin" value={endDate} onChange={setEndDate} shortcutHint="<strong>Ctrl + Alt + ← / →</strong> para cambiar día" />
              </>
            )}

            {filterMode === 'hour' && (
              <div className="control-item hour-dropdown-container" style={{ position: 'relative' }}>
                <div 
                  className={`control-input ${isHourDropdownOpen ? 'active' : ''}`} 
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
                  onClick={() => setIsHourDropdownOpen(!isHourDropdownOpen)}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', marginRight: '6px', fontWeight: '600' }}>Hora:</span>
                    {String(selectedHour).padStart(2, '0')}:00
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ transform: isHourDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                {isHourDropdownOpen && (
                  <div className="custom-hour-dropdown">
                    <div className="hour-grid">
                      {[...Array(24)].map((_, i) => (
                        <button 
                          key={i} 
                          className={`hour-btn ${selectedHour == i ? 'selected' : ''}`}
                          onClick={() => { setSelectedHour(i); setIsHourDropdownOpen(false); }}
                        >
                          {String(i).padStart(2, '0')}:00
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                      Atajo: <strong>Ctrl + Alt + ↑ / ↓</strong> para navegar
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="control-item agrupacion-dropdown-container" style={{ position: 'relative' }}>
              <div 
                className={`control-input ${isAgrupacionDropdownOpen ? 'active' : ''}`}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
                onClick={() => setIsAgrupacionDropdownOpen(!isAgrupacionDropdownOpen)}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', marginRight: '6px', fontWeight: '600' }}>Agrupación:</span>
                  {currentAgrupacionLabel}
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ transform: isAgrupacionDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              
              {isAgrupacionDropdownOpen && (
                <div className="custom-hour-dropdown" style={{ minWidth: '320px' }}>
                  <div className="hour-grid">
                     {currentAgrupacionOptions.map(opt => (
                       <button 
                         key={opt.value} 
                         className={`hour-btn ${currentAgrupacionValue == opt.value ? 'selected' : ''}`}
                         onClick={() => {
                           if (filterMode === 'day') setGroupingIntervalDay(opt.value);
                           if (filterMode === 'range') setGroupingIntervalRange(opt.value);
                           if (filterMode === 'hour') setGroupingIntervalHour(opt.value);
                           setIsAgrupacionDropdownOpen(false);
                         }}
                       >
                         {opt.label}
                       </button>
                     ))}
                  </div>
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                    Atajo: <strong>Ctrl + ↑ / ↓</strong> para navegar
                  </div>
                </div>
              )}
            </div>

            <div className="info-alert-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" style={{ color: '#2563eb' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p>
                Mostrando promedios para el período <br />
                <strong>{startDate} {filterMode === 'range' ? ` al ${endDate}` : ''} ({historicalData.length} registros)</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. KPI CARDS */}
      {(kpis || isLoadingHistory) && (
        <div className="kpi-grid">
          {isLoadingHistory ? (
            [...Array((nodoActivo?.lecturas?.length || 2) + 1)].map((_, i) => (
              <div key={`loading-kpi-${i}`} className="kpi-card-unified" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '140px' }}>
                <div className="custom-spinner"></div>
              </div>
            ))
          ) : (
            <>
              {Object.entries(kpis.variables).map(([key, stat]) => (
            <div key={key} className="kpi-card-unified">
              <div className="kpi-unified-header">
                <div className={`kpi-icon-box ${stat.theme.theme}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                    {stat.theme.icon}
                  </svg>
                </div>
                <div className="kpi-content">
                  <span className="kpi-label">Promedio {stat.info.tipo}</span>
                  <div className="kpi-value">{stat.promedio} <span className="kpi-unit">{stat.info.unidad}</span></div>
                </div>
              </div>
              <div className="kpi-unified-footer">
                <div className="kpi-sub-stat">
                  <span className="kpi-sub-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" width="12" height="12"><polyline points="17 8 20 5 23 8" /><line x1="20" y1="5" x2="20" y2="12" /></svg>
                    Máxima
                  </span>
                  <span className="kpi-sub-value">{stat.max} {stat.info.unidad} <small>({stat.maxTime})</small></span>
                </div>
                <div className="kpi-sub-stat">
                  <span className="kpi-sub-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" width="12" height="12"><polyline points="17 12 20 15 23 12" /><line x1="20" y1="15" x2="20" y2="8" /></svg>
                    Mínima
                  </span>
                  <span className="kpi-sub-value">{stat.min} {stat.info.unidad} <small>({stat.minTime})</small></span>
                </div>
              </div>
            </div>
          ))}

          <div className="kpi-card-unified" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-unified-header" style={{ borderBottom: 'none', height: '100%' }}>
              <div className="kpi-icon-box theme-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Cantidad de lecturas</span>
                <div className="kpi-value">{kpis.count}</div>
                <span className="kpi-subtext">Registros procesados</span>
              </div>
              </div>
            </div>
            </>
          )}
        </div>
      )}

      {/* 5. CHART AREA */}
      <div className={`historico-chart-card ${isFullscreen ? 'fullscreen-mode' : ''}`} ref={chartRef} style={{ background: '#ffffff', padding: '24px' }}>
        <div className="chart-header">
          <h2 className="chart-title">
            {filterMode === 'day' && `Promedio horario - ${startDate}`}
            {filterMode === 'range' && `Histórico diario - ${startDate} al ${endDate}`}
            {filterMode === 'hour' && `Detalle ${groupingIntervalHour} min - ${startDate} ${selectedHour}:00`}
          </h2>
          <div className="chart-actions">
            <button className="chart-action-btn" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                  Salir pantalla completa
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                  Pantalla completa
                </>
              )}
            </button>
            <button className="chart-action-btn" onClick={handleExportImage}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              Exportar imagen
            </button>
            <button className="chart-action-btn" onClick={() => {
              if(!historicalData.length) return;
              const csv = ["Fecha," + nodoActivo.lecturas.map(l=>l.tipo).join(",")];
              historicalData.forEach(d => {
                csv.push(`${d.label},` + nodoActivo.lecturas.map(l=>d[l.data_type] || '').join(","));
              });
              const blob = new Blob([csv.join("\n")], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `historico_${nodoActivo.serial_number}.csv`;
              a.click();
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Exportar CSV
            </button>
          </div>
        </div>

        {isLoadingHistory ? (
          <div className="chart-container-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '16px' }}>
            <div className="custom-spinner"></div>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Analizando Data Warehouse...</span>
          </div>
        ) : historicalData.length === 0 ? (
          <div className="loader-container" style={{ border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
            No hay registros almacenados para los parámetros seleccionados.
          </div>
        ) : (
          <div className="chart-container-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {nodoActivo?.lecturas?.map((l, idx) => {
                    const theme = getTheme(l.data_type);
                    return (
                      <linearGradient key={idx} id={`color${l.data_type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.hex} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={theme.hex} stopOpacity={0}/>
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{fontSize: 12, fill: '#94a3b8'}} tickMargin={12} axisLine={{stroke: '#e2e8f0'}} tickLine={false} />
                <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} dx={-10} />
                {chartAxisConfig.split && (
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} dx={10} />
                )}
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                {nodoActivo?.lecturas?.map((l, idx) => {
                   const theme = getTheme(l.data_type);
                   return (
                     <Area 
                       key={idx} 
                       type="monotone" 
                       yAxisId={chartAxisConfig.rightKeys.includes(l.data_type) ? 'right' : 'left'}
                       dataKey={l.data_type} 
                       name={`${l.tipo} (${l.unidad})`} 
                       stroke={theme.hex} 
                       strokeWidth={3} 
                       fillOpacity={1} 
                       fill={`url(#color${l.data_type})`} 
                       dot={<CustomDot dataKey={l.data_type} />} 
                       activeDot={<CustomActiveDot dataKey={l.data_type} />} 
                     />
                   );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 6. DATA TABLE */}
      <div className="historico-data-table-card">
        <div className="table-header">
          <h2 className="table-title">Detalle de Registros</h2>
          <span className="table-badge">{historicalData.length} registros</span>
        </div>
        <div className="table-responsive-container">
          <table className="data-table">
            <thead>
              <tr>
                <th rowSpan="2" className="sticky-col">Fecha / Hora</th>
                {nodoActivo?.lecturas?.map(l => (
                  <th key={l.data_type} colSpan="3" style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>{l.nombre || l.data_type}</th>
                ))}
              </tr>
              <tr>
                {nodoActivo?.lecturas?.map(l => (
                  <React.Fragment key={l.data_type + '-cols'}>
                    <th style={{ textAlign: 'center', backgroundColor: '#f8fafc', borderLeft: '1px solid #e2e8f0' }}>Mínimo</th>
                    <th style={{ textAlign: 'center', backgroundColor: '#f8fafc' }}>Promedio</th>
                    <th style={{ textAlign: 'center', backgroundColor: '#f8fafc' }}>Máximo</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {historicalData.length > 0 ? (
                historicalData.map((row, i) => (
                  <tr key={i}>
                    <td className="sticky-col"><strong>{row.label}</strong></td>
                    {nodoActivo?.lecturas?.map(l => {
                      const outOfRange = isValueOutOfRange(l.data_type, row);
                      return (
                        <React.Fragment key={l.data_type + '-' + i}>
                          <td style={{ textAlign: 'center', borderLeft: '1px solid #f1f5f9', color: outOfRange ? '#ef4444' : '#64748b', fontWeight: outOfRange ? 700 : 400 }}>
                            {row[`${l.data_type}_min`] !== undefined ? row[`${l.data_type}_min`].toFixed(2) : '-'}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: outOfRange ? 800 : 600, color: outOfRange ? '#ef4444' : '#3b82f6', backgroundColor: outOfRange ? 'rgba(239, 68, 68, 0.08)' : 'transparent' }}>
                            {row[l.data_type] !== undefined ? row[l.data_type].toFixed(2) : '-'}
                            {outOfRange && <span style={{ marginLeft: '4px', fontSize: '0.7rem', color: '#ef4444' }} title="Baja estabilidad / Fuera de rango esperado">⚠️</span>}
                          </td>
                          <td style={{ textAlign: 'center', color: outOfRange ? '#ef4444' : '#64748b', fontWeight: outOfRange ? 700 : 400 }}>
                            {row[`${l.data_type}_max`] !== undefined ? row[`${l.data_type}_max`].toFixed(2) : '-'}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={1 + (nodoActivo?.lecturas?.length || 0) * 3} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No hay datos para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
