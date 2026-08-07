import { API_BASE_URL, fetchWithAuth, fetchDeduplicated } from '../../config/api';
import { echo } from '../../config/echo';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import '../../styles/pages/admin/MonitorEnVivo.css';
import ModalExportarCSV from '../../components/ModalExportarCSV';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush
} from 'recharts';

const parseDateVal = (val) => {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (typeof val === 'number') return new Date(val > 1e11 ? val : val * 1000);
  if (typeof val === 'string') {
    let str = val.trim().replace(/\s*([ap]\.?m\.?|AM|PM)/gi, '').trim();
    const matchYMD = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T\s,]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    const matchDMY = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})[T\s,]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (matchYMD) {
      return new Date(parseInt(matchYMD[1], 10), parseInt(matchYMD[2], 10) - 1, parseInt(matchYMD[3], 10), parseInt(matchYMD[4], 10), parseInt(matchYMD[5], 10), matchYMD[6] ? parseInt(matchYMD[6], 10) : 0);
    } else if (matchDMY) {
      return new Date(parseInt(matchDMY[3], 10), parseInt(matchDMY[2], 10) - 1, parseInt(matchDMY[1], 10), parseInt(matchDMY[4], 10), parseInt(matchDMY[5], 10), matchDMY[6] ? parseInt(matchDMY[6], 10) : 0);
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
};

const formatTimeSeconds = (val) => {
  const d = parseDateVal(val);
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const formatDateTimeFull = (val) => {
  const d = parseDateVal(val);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const timeStr = d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return `${day}/${month}/${year} ${timeStr}`;
};

const getTimeAndDate = (item) => {
  if (!item) return { time: '--:--', date: '' };
  let full = item.fullDateTime || item.dateTime || '';
  if (full.includes(' ')) {
    const parts = full.trim().split(/\s+/);
    const datePart = parts[0];
    let timePart = parts.slice(1).join(' ').replace(/\s*([ap]\.?m\.?|AM|PM)/gi, '').trim();
    if (datePart && timePart) {
      const d = parseDateVal(`${datePart} ${timePart}`);
      timePart = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }
    return { time: timePart, date: datePart };
  }
  const formatted = formatDateTimeFull(item.shortTime || item.created_at || item.timestamp);
  const parts = formatted.split(' ');
  return { time: parts[1] || '--:--', date: parts[0] || '' };
};

export default function MonitorEnVivo() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  usePageTitle({ es: 'Monitor en Vivo', en: 'Live Monitor' }, 'Admin · IoT ULEAM');
  const [nodos, setNodos] = useState([]);
  const [nodoActivo, setNodoActivo] = useState(null);
  const [isLoadingNodos, setIsLoadingNodos] = useState(true);

  const [sensorData, setSensorData] = useState({});
  const [previousData, setPreviousData] = useState({});
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [logs, setLogs] = useState([]);
  const [chartWindow, setChartWindow] = useState('15'); // minutes
  const [showWindowDropdown, setShowWindowDropdown] = useState(false);
  const windowDropdownRef = useRef(null);
  const chipsContainerRef = useRef(null);
  const chartScrollContainerRef = useRef(null);
  const [visibleRows, setVisibleRows] = useState(5);
  const [activeVariables, setActiveVariables] = useState({});
  const [showLastReadingOffline, setShowLastReadingOffline] = useState(false);
  const [chartVisualType, setChartVisualType] = useState('area'); // 'area' | 'bar' | 'line'
  const [isByUnitMode, setIsByUnitMode] = useState(false);
  const [focusedVarIndex, setFocusedVarIndex] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [liveMode, setLiveMode] = useState(true); // true = En Vivo (WebSockets/Buffer), false = BD
  const [maxReadingsToShow, setMaxReadingsToShow] = useState(15);
  const [chartPage, setChartPage] = useState(0);

  // Estados para el Selector de Métricas Flotante Móvil (FAB)
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showFullNames, setShowFullNames] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const [fabPos, setFabPos] = useState(null);

  const isDraggingFabRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialFabX: 0, initialFabY: 0 });
  const fabPosRef = useRef(fabPos);
  fabPosRef.current = fabPos;

  // Visibilidad del FAB basada en scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      if (scrollY > 220) {
        setShowFab(true);
      } else {
        setShowFab(false);
        setIsFabOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isTopHalf = useMemo(() => {
    if (!fabPos) return false;
    return fabPos.y < (typeof window !== 'undefined' ? window.innerHeight / 2 : 400);
  }, [fabPos]);

  const isLeftHalf = useMemo(() => {
    if (!fabPos) return false;
    return fabPos.x < (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
  }, [fabPos]);

  const handleFabPointerDown = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const fabContainer = e.currentTarget.closest('.mobile-fab-container');
    let currentX = fabPosRef.current ? fabPosRef.current.x : 0;
    let currentY = fabPosRef.current ? fabPosRef.current.y : 0;

    if (!fabPosRef.current && fabContainer) {
      const rect = fabContainer.getBoundingClientRect();
      currentX = rect.left;
      currentY = rect.top;
      setFabPos({ x: currentX, y: currentY });
    }

    isDraggingFabRef.current = false;
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialFabX: currentX,
      initialFabY: currentY
    };

    const handlePointerMove = (moveEv) => {
      if (moveEv.cancelable) {
        moveEv.preventDefault();
      }
      const moveX = moveEv.touches ? moveEv.touches[0].clientX : moveEv.clientX;
      const moveY = moveEv.touches ? moveEv.touches[0].clientY : moveEv.clientY;

      const deltaX = moveX - dragStartRef.current.startX;
      const deltaY = moveY - dragStartRef.current.startY;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        isDraggingFabRef.current = true;
      }

      if (isDraggingFabRef.current) {
        let newX = dragStartRef.current.initialFabX + deltaX;
        let newY = dragStartRef.current.initialFabY + deltaY;

        const maxX = window.innerWidth - 64;
        const maxY = window.innerHeight - 64;
        newX = Math.max(12, Math.min(newX, maxX));
        newY = Math.max(12, Math.min(newY, maxY));

        setFabPos({ x: newX, y: newY });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  };

  const handleFabClick = (e) => {
    if (isDraggingFabRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsFabOpen(prev => !prev);
  };

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const PALETTE = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];

  const getVarColor = (dataType) => {
    if (!nodoActivo?.lecturas) return '#3b82f6';
    const origIdx = nodoActivo.lecturas.findIndex(l => l.data_type === dataType);
    return origIdx >= 0 ? PALETTE[origIdx % PALETTE.length] : '#3b82f6';
  };

  const sensorDataRef = useRef({});

  useEffect(() => {
    setShowLastReadingOffline(false);
  }, [nodoActivo?.id]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (windowDropdownRef.current && !windowDropdownRef.current.contains(e.target)) {
        setShowWindowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    sensorDataRef.current = sensorData;
  }, [sensorData]);

  useEffect(() => {
    if (nodoActivo?.lecturas?.length) {
      const initialMap = {};
      nodoActivo.lecturas.forEach((l, idx) => {
        initialMap[l.data_type] = idx === 0; // Por defecto solo la primera variable está marcada
      });
      setActiveVariables(initialMap);
      setFocusedVarIndex(0);
      setIsByUnitMode(false);
    }
  }, [nodoActivo]);

  // Auto-scroll al chip de variable enfocada al rotar o seleccionar
  useEffect(() => {
    if (chipsContainerRef.current) {
      const activeChip = chipsContainerRef.current.querySelector(`[data-index="${focusedVarIndex}"]`);
      if (activeChip) {
        activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [focusedVarIndex]);

  const getItemTimestampMs = (item) => {
    if (!item) return 0;
    if (item.timestamp) {
      return item.timestamp > 1e11 ? item.timestamp : item.timestamp * 1000;
    }
    if (item.dateTime) {
      const parsed = new Date(item.dateTime).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    if (item.created_at) {
      const parsed = new Date(item.created_at).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  };

  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const isConnected = useMemo(() => {
    const lastTs = getItemTimestampMs(sensorData);
    if (lastTs > 0 && (nowTick - lastTs <= 65000)) return true;
    return Boolean(nodoActivo?.is_online);
  }, [sensorData, nodoActivo?.is_online, nowTick]);

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    const windowMinutes = parseInt(chartWindow, 10) || 15;
    const windowMs = windowMinutes * 60 * 1000;

    let baseMs = nowTick;
    if (!isConnected && showLastReadingOffline) {
      // En Modo Consulta de última lectura, la referencia base es la marca de tiempo de la última lectura registrada
      const lastItem = history[history.length - 1];
      const lastItemMs = (lastItem && getItemTimestampMs(lastItem)) || 0;
      if (lastItemMs > 0) {
        baseMs = lastItemMs;
      }
    }

    const cutoffMs = baseMs - windowMs;

    return history.filter(item => {
      const itemMs = getItemTimestampMs(item);
      return itemMs > 0 && itemMs >= cutoffMs && itemMs <= baseMs;
    });
  }, [history, chartWindow, nowTick, isConnected, showLastReadingOffline]);

  const userHasScrolledRef = useRef(false);

  const handleChartScroll = (e) => {
    const el = e.target;
    if (!el) return;
    const isAtRightEdge = Math.abs(el.scrollWidth - el.scrollLeft - el.clientWidth) < 35;
    userHasScrolledRef.current = !isAtRightEdge;
  };

  // Reset al extremo derecho por defecto al cambiar de nodo o ventana de tiempo
  useEffect(() => {
    userHasScrolledRef.current = false;
    const scrollToRight = () => {
      if (chartScrollContainerRef.current) {
        chartScrollContainerRef.current.scrollLeft = chartScrollContainerRef.current.scrollWidth;
      }
    };

    scrollToRight();
    const timer1 = setTimeout(scrollToRight, 60);
    const timer2 = setTimeout(scrollToRight, 200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [nodoActivo?.id, chartWindow, showLastReadingOffline]);

  // Mantener scroll a la derecha solo cuando llegan datos en vivo y el usuario NO se ha desplazado hacia atrás
  useEffect(() => {
    if (isConnected && !userHasScrolledRef.current && chartScrollContainerRef.current) {
      chartScrollContainerRef.current.scrollLeft = chartScrollContainerRef.current.scrollWidth;
    }
  }, [chartData?.length, isConnected]);

  // Configuración de escala Y (dominio y marcas uniformes redondeadas) para sincronización matemática 100% precisa
  const computedYConfig = useMemo(() => {
    if (!chartData || chartData.length === 0 || !nodoActivo?.lecturas) {
      return { domain: [0, 10], ticks: [0, 2.5, 5, 7.5, 10] };
    }
    const activeTypes = nodoActivo.lecturas.filter(l => activeVariables[l.data_type] !== false).map(l => l.data_type);
    if (activeTypes.length === 0) {
      return { domain: [0, 10], ticks: [0, 2.5, 5, 7.5, 10] };
    }

    let maxVal = -Infinity;
    chartData.forEach(item => {
      activeTypes.forEach(type => {
        const val = parseFloat(item[type]);
        if (!isNaN(val) && val > maxVal) maxVal = val;
      });
    });

    if (maxVal === -Infinity || maxVal <= 0) {
      return { domain: [0, 10], ticks: [0, 2.5, 5, 7.5, 10] };
    }

    let roundMax = 10;
    if (maxVal <= 14) {
      roundMax = 12;
    } else if (maxVal <= 35) {
      roundMax = 32;
    } else if (maxVal <= 100) {
      roundMax = 100;
    } else if (maxVal <= 500) {
      roundMax = 500;
    } else if (maxVal <= 1000) {
      roundMax = 1000;
    } else {
      roundMax = Math.ceil(maxVal / 2000) * 2000;
      if (roundMax < 8000) roundMax = 8000;
    }

    const step = roundMax / 4;
    const ticks = [0, step, step * 2, step * 3, roundMax];
    return { domain: [0, roundMax], ticks };
  }, [chartData, nodoActivo, activeVariables]);

  // Unidad activa derivada del enfoque actual
  const activeSelectedUnit = useMemo(() => {
    if (!nodoActivo?.lecturas?.length) return null;
    const focused = nodoActivo.lecturas[focusedVarIndex] || nodoActivo.lecturas.find(l => activeVariables[l.data_type] !== false) || nodoActivo.lecturas[0];
    return focused ? focused.unidad : null;
  }, [nodoActivo, focusedVarIndex, activeVariables]);

  // Helper para obtener el nombre localizado de la métrica según la BD (nombre_en / tipo_en)
  const getMetricName = useCallback((l) => {
    if (!l) return '';
    if (isEn) {
      return l.tipo_en || l.nombre_en || l.tipo || '';
    }
    return l.tipo_es || l.nombre_es || l.tipo || '';
  }, [isEn]);

  // Selección activa aplicada para las métricas marcadas en el gráfico
  const appliedSelections = useMemo(() => {
    if (!nodoActivo?.lecturas) return [];
    return nodoActivo.lecturas
      .filter(l => activeVariables[l.data_type] !== false)
      .map(l => ({
        serial_number: nodoActivo.serial_number,
        nombre_nodo: nodoActivo.nombre,
        clave_mqtt: l.data_type,
        nombre_var: getMetricName(l),
        unidad: l.unidad
      }));
  }, [nodoActivo, activeVariables, getMetricName]);

  const getAxisForSelection = useCallback((sel) => {
    if (appliedSelections.length <= 1) return 'left';
    const dataKey = sel.clave_mqtt || `${sel.serial_number}_${sel.clave_mqtt}`;
    let maxVal = 0;
    (history || []).forEach(item => {
      if (item && item[dataKey] !== undefined && item[dataKey] !== null) {
        const val = Math.abs(parseFloat(item[dataKey]));
        if (!isNaN(val) && val > maxVal) maxVal = val;
      } else if (item && item[sel.clave_mqtt] !== undefined && item[sel.clave_mqtt] !== null) {
        const val = Math.abs(parseFloat(item[sel.clave_mqtt]));
        if (!isNaN(val) && val > maxVal) maxVal = val;
      }
    });
    return maxVal > 100 ? 'right' : 'left';
  }, [history, appliedSelections]);

  const hasRightAxisVariables = useMemo(() => {
    return appliedSelections.some(sel => getAxisForSelection(sel) === 'right');
  }, [appliedSelections, getAxisForSelection]);

  // Historial formateado con marcas de tiempo únicas
  const formattedChartHistory = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.map(item => {
      let timeStr = item.shortTime || item.time;
      let fullDt = item.fullDateTime || item.dateTime;

      if (!timeStr && fullDt && typeof fullDt === 'string') {
        if (fullDt.includes(' ')) timeStr = fullDt.trim().split(' ').pop();
        else if (fullDt.includes('T')) timeStr = fullDt.split('T')[1].split('.')[0];
      }

      if (!timeStr && item.created_at) {
        const d = new Date(item.created_at);
        if (!isNaN(d.getTime())) {
          const pad = (n) => String(n).padStart(2, '0');
          timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }
      }

      if (timeStr) timeStr = timeStr.replace(/\s*([ap]\.?m\.?|AM|PM)/gi, '').trim();

      const pt = {
        ...item,
        time: timeStr || '--:--',
        fullDateTime: fullDt || timeStr
      };

      if (nodoActivo?.serial_number) {
        appliedSelections.forEach(sel => {
          const keyWithSerial = `${sel.serial_number}_${sel.clave_mqtt}`;
          if (item[sel.clave_mqtt] !== undefined && pt[keyWithSerial] === undefined) {
            pt[keyWithSerial] = item[sel.clave_mqtt];
          }
        });
      }
      return pt;
    });
  }, [history, nodoActivo, appliedSelections]);

  const totalReadingsCount = formattedChartHistory.length;
  const showPagination = totalReadingsCount > maxReadingsToShow;
  const maxPage = showPagination ? Math.ceil(totalReadingsCount / maxReadingsToShow) - 1 : 0;
  const currentPage = Math.min(chartPage, maxPage);

  const visibleChartData = useMemo(() => {
    if (!formattedChartHistory || formattedChartHistory.length === 0) return [];
    if (!showPagination) return formattedChartHistory;
    const start = currentPage * maxReadingsToShow;
    return formattedChartHistory.slice(start, start + maxReadingsToShow);
  }, [formattedChartHistory, showPagination, currentPage, maxReadingsToShow]);

  const handleToggleByUnitMode = () => {
    if (!nodoActivo?.lecturas?.length) return;
    const newMode = !isByUnitMode;
    setIsByUnitMode(newMode);

    if (!newMode) {
      // Al desactivar el modo por unidad: si hay 2+ marcadas, dejar solo la primera
      const checkedKeys = nodoActivo.lecturas.filter(l => activeVariables[l.data_type] !== false).map(l => l.data_type);
      const keyToKeep = checkedKeys.length >= 1 ? checkedKeys[0] : nodoActivo.lecturas[0]?.data_type;
      const updatedMap = {};
      nodoActivo.lecturas.forEach(l => {
        updatedMap[l.data_type] = l.data_type === keyToKeep;
      });
      setActiveVariables(updatedMap);
    }
  };

  const handleToggleVarKey = (dataType) => {
    if (!nodoActivo?.lecturas?.length) return;
    const targetLectura = nodoActivo.lecturas.find(l => l.data_type === dataType);
    if (!targetLectura) return;

    if (isByUnitMode) {
      // Modo Multiselección por Unidad:
      if (activeSelectedUnit && targetLectura.unidad !== activeSelectedUnit) return;

      const isTargetChecked = activeVariables[dataType] !== false;
      const currentlyCheckedCount = nodoActivo.lecturas.filter(l => activeVariables[l.data_type] !== false).length;

      if (isTargetChecked && currentlyCheckedCount <= 1) return;

      setActiveVariables(prev => ({
        ...prev,
        [dataType]: !isTargetChecked
      }));

      const idx = nodoActivo.lecturas.findIndex(l => l.data_type === dataType);
      if (idx >= 0) setFocusedVarIndex(idx);
    } else {
      // Modo Navegación Individual (Default):
      const updatedMap = {};
      nodoActivo.lecturas.forEach(l => {
        updatedMap[l.data_type] = l.data_type === dataType;
      });
      setActiveVariables(updatedMap);

      const idx = nodoActivo.lecturas.findIndex(l => l.data_type === dataType);
      if (idx >= 0) setFocusedVarIndex(idx);
    }
  };

  const handleRotatePrevVar = () => {
    if (!nodoActivo?.lecturas?.length) return;
    const total = nodoActivo.lecturas.length;
    const prevIdx = (focusedVarIndex - 1 + total) % total;
    setFocusedVarIndex(prevIdx);
    const targetLectura = nodoActivo.lecturas[prevIdx];

    // Marcar únicamente la variable del elemento rotado (desmarcando las demás)
    const updatedMap = {};
    nodoActivo.lecturas.forEach(l => {
      updatedMap[l.data_type] = l.data_type === targetLectura.data_type;
    });
    setActiveVariables(updatedMap);
  };

  const handleRotateNextVar = () => {
    if (!nodoActivo?.lecturas?.length) return;
    const total = nodoActivo.lecturas.length;
    const nextIdx = (focusedVarIndex + 1) % total;
    setFocusedVarIndex(nextIdx);
    const targetLectura = nodoActivo.lecturas[nextIdx];

    // Marcar únicamente la variable del elemento rotado (desmarcando las demás)
    const updatedMap = {};
    nodoActivo.lecturas.forEach(l => {
      updatedMap[l.data_type] = l.data_type === targetLectura.data_type;
    });
    setActiveVariables(updatedMap);
  };

  const addLog = (message, type = 'info') => {
    setLogs(prev => {
      const newLogs = [{ time: new Date().toLocaleTimeString(), msg: message, type }, ...prev];
      return newLogs.slice(0, 50);
    });
  };

  useEffect(() => {
    fetchDeduplicated(`${API_BASE_URL}/nodos?lang=${language}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setNodos(data);

          // 1. Verificar parámetro de la URL ?nodo=nombre-id
          const searchParams = new URLSearchParams(window.location.search);
          const nodoUrlParam = searchParams.get('nodo');
          let foundFromUrl = null;
          if (nodoUrlParam) {
            const parts = nodoUrlParam.split('-');
            const possibleId = parts[parts.length - 1];
            if (possibleId && !isNaN(possibleId)) {
              foundFromUrl = data.find(n => String(n.id) === String(possibleId));
            }
          }

          // 2. Verificar localStorage
          const sharedNodeId = localStorage.getItem('shared_node_id');
          const sharedNodeSerial = localStorage.getItem('shared_node_serial');
          const foundFromStorage = data.find(n => String(n.id) === String(sharedNodeId) || n.serial_number === sharedNodeSerial);

          const initialNode = foundFromUrl || foundFromStorage || data[0];
          setNodoActivo(initialNode);
        }
      })
      .catch(err => console.error("Error fetching nodos:", err))
      .finally(() => setIsLoadingNodos(false));
  }, [language]);

  useEffect(() => {
    if (nodoActivo) {
      localStorage.setItem('shared_node_id', String(nodoActivo.id));
      localStorage.setItem('shared_node_serial', String(nodoActivo.serial_number));

      // Formatear slug para la URL: ?nodo=uleam-water-16
      const slugName = (nodoActivo.nombre || 'nodo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const newParam = `${slugName}-${nodoActivo.id}`;
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('nodo') !== newParam) {
        searchParams.set('nodo', newParam);
        const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
        window.history.replaceState(null, '', newUrl);
      }
    }
  }, [nodoActivo]);

  useEffect(() => {
    if (!nodoActivo) return;
    setIsLoadingHistory(true);
    const fetchRecentHistory = async () => {
      try {
        const res = await fetchDeduplicated(`${API_BASE_URL}/lecturas/recientes?serial_number=${nodoActivo.serial_number}`);
        const data = await res.json();
        if (data && data.length > 0) {
          const parsedData = data.map(item => {
            const tsMs = getItemTimestampMs(item);
            const fullDt = tsMs ? formatDateTimeFull(tsMs) : formatDateTimeFull(item.created_at || item.dateTime);
            return {
              ...item,
              fullDateTime: fullDt,
              shortTime: item.shortTime || (item.dateTime ? item.dateTime.split(' ')[1] : formatTimeSeconds())
            };
          });
          setHistory(parsedData);
          const last = parsedData[parsedData.length - 1];
          const prev = parsedData.length > 1 ? parsedData[parsedData.length - 2] : {};
          setSensorData(last);
          setPreviousData(prev);

          // Verificar si el nodo ha transmitido recientemente o está marcado como activo
          const lastTs = getItemTimestampMs(last);
          const isRecentlyActive = (lastTs > 0 && (Date.now() - lastTs < 300000)) || Boolean(nodoActivo.is_online);

          addLog(`Historial reciente cargado (${data.length} registros).`, 'info');
        } else {
          setHistory([]);
          setSensorData({ fullDateTime: formatDateTimeFull(), shortTime: formatTimeSeconds() });
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
    addLog(`Conexión establecida con broker.`, 'success');

    channel.listen('.LecturaRecibida', (e) => {
      const newData = e.data || e;
      if (!newData) return;

      const fullDt = formatDateTimeFull();
      const parsedData = {
        ...newData,
        dateTime: fullDt,
        fullDateTime: fullDt,
        shortTime: formatTimeSeconds()
      };

      setPreviousData(sensorDataRef.current);
      setSensorData(prev => ({
        ...prev,
        ...parsedData
      }));

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
    };
  }, [nodoActivo]);

  // Filtrar lecturas recibidas según el contexto (Hoy en vivo vs Día de la última lectura si el nodo está desconectado y se activa showLastReadingOffline)
  const { targetHistory, targetDateLabel } = useMemo(() => {
    if (!history || history.length === 0) {
      return { targetHistory: [], targetDateLabel: 'Hoy' };
    }

    if (!isConnected && showLastReadingOffline) {
      const lastItem = history[history.length - 1];
      const lastMs = getItemTimestampMs(lastItem);
      if (lastMs > 0) {
        const lastDate = new Date(lastMs);
        const y = lastDate.getFullYear();
        const m = lastDate.getMonth();
        const d = lastDate.getDate();

        const formattedDate = `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${y}`;
        const filtered = history.filter(item => {
          const tsMs = getItemTimestampMs(item);
          if (!tsMs) return false;
          const dt = new Date(tsMs);
          return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
        });

        return {
          targetHistory: filtered,
          targetDateLabel: `Día ${formattedDate}`
        };
      }
    }

    // Default: Día de Hoy (En vivo)
    const now = new Date();
    const filteredToday = history.filter(item => {
      const tsMs = getItemTimestampMs(item);
      if (!tsMs) return false;
      const dt = new Date(tsMs);
      return dt.getFullYear() === now.getFullYear() &&
        dt.getMonth() === now.getMonth() &&
        dt.getDate() === now.getDate();
    });

    return {
      targetHistory: filteredToday,
      targetDateLabel: 'Hoy'
    };
  }, [history, isConnected, showLastReadingOffline]);

  // Statistics calculation aligned strictly with targetHistory (Hoy o Día de la última lectura)
  const stats = useMemo(() => {
    if (!targetHistory.length || !nodoActivo?.lecturas) return null;
    let computed = {};
    nodoActivo.lecturas.forEach(l => {
      const values = targetHistory.map(h => h[l.data_type]).filter(v => v !== undefined && v !== null);
      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);

        const minExp = (l?.minExpected !== undefined && l?.minExpected !== null && l?.minExpected !== '')
          ? parseFloat(l.minExpected)
          : (l?.min_expected !== undefined && l?.min_expected !== null && l?.min_expected !== '')
            ? parseFloat(l.min_expected)
            : (l?.min_alerta !== undefined && l?.min_alerta !== null && l?.min_alerta !== '')
              ? parseFloat(l.min_alerta)
              : (l?.valor_minimo !== undefined && l?.valor_minimo !== null && l?.valor_minimo !== '')
                ? parseFloat(l.valor_minimo)
                : (l?.min !== undefined && l?.min !== null && l?.min !== '')
                  ? parseFloat(l.min)
                  : null;

        const maxExp = (l?.maxExpected !== undefined && l?.maxExpected !== null && l?.maxExpected !== '')
          ? parseFloat(l.maxExpected)
          : (l?.max_expected !== undefined && l?.max_expected !== null && l?.max_expected !== '')
            ? parseFloat(l.max_expected)
            : (l?.max_alerta !== undefined && l?.max_alerta !== null && l?.max_alerta !== '')
              ? parseFloat(l.max_alerta)
              : (l?.valor_maximo !== undefined && l?.valor_maximo !== null && l?.valor_maximo !== '')
                ? parseFloat(l.valor_maximo)
                : (l?.max !== undefined && l?.max !== null && l?.max !== '')
                  ? parseFloat(l.max)
                  : null;

        let estabilidad = 'Normal';
        if (minExp !== null && !isNaN(minExp) && avg < minExp) {
          estabilidad = 'Baja';
        } else if (maxExp !== null && !isNaN(maxExp) && avg > maxExp) {
          estabilidad = 'Alta';
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
  }, [targetHistory, nodoActivo]);

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

  const getNodeCategory = (n) => {
    if (!n) return 'Sin categoría';
    if (typeof n.categoria === 'string' && n.categoria.trim() !== '') return n.categoria;
    if (n.categoria && typeof n.categoria === 'object' && n.categoria.nombre) return n.categoria.nombre;
    if (n.categoria_nombre) return n.categoria_nombre;
    return 'Sin categoría';
  };

  const groupedNodos = useMemo(() => {
    const groups = {};
    nodos.forEach(n => {
      const cat = getNodeCategory(n);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(n);
    });
    return groups;
  }, [nodos]);

  const handleSelectNode = (n, e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (!n) return;
    if (nodoActivo && String(n.id) === String(nodoActivo.id)) {
      setIsDropdownOpen(false);
      setExpandedCategories({});
      return;
    }
    setNodoActivo(n);
    setHistory([]);
    setSensorData({});
    setPreviousData({});
    setIsDropdownOpen(false);
    setExpandedCategories({});
  };

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
      const target = event?.target;
      if (target && typeof target.closest === 'function') {
        if (!target.closest('.node-select-wrapper') && !target.closest('.node-dropdown-wrapper')) {
          setIsDropdownOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('admin-navbar-portal-target'));
  }, []);

  return (
    <div className="monitor-vivo-container">
      {portalTarget && createPortal(
        <div className="monitor-live-badge">
          <span className="dot"></span> {isEn ? 'Live' : 'En Vivo'}
        </div>,
        portalTarget
      )}

      {/* 2. TOP INFO BAR */}
      <div className="monitor-node-info-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', padding: '20px 24px' }}>

        {/* LADO IZQUIERDO: SECCIÓN DEL NODO Y RUTA */}
        <div className="node-info-section" style={{ flex: '1 1 300px', borderRight: 'none', padding: 0 }}>
          <div className="node-info-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
          </div>
          <div className="node-info-text" style={{ position: 'relative' }}>
            <span className="node-info-label">{isEn ? 'Node' : 'Nodo'}</span>
            {isLoadingNodos ? (
              <div className="skeleton skeleton-text" style={{ width: '200px', marginTop: '6px' }}></div>
            ) : (
              <div className="node-select-wrapper" onClick={toggleDropdown}>
                <div
                  key={nodoActivo ? `active-node-${nodoActivo.id}` : 'loading-node'}
                  className="node-select-custom"
                >
                  {nodoActivo ? nodoActivo.nombre || nodoActivo.serial_number : (isEn ? 'Loading node...' : 'Cargando nodo...')}
                </div>
                <svg className="node-select-icon" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            )}

            {/* Ruta Informativa: / Categoría / Ubicación / Nombre del Nodo */}
            {nodoActivo && (
              <div
                className="node-breadcrumb-path"
                onClick={() => setIsDropdownOpen(false)}
              >
                <span style={{ color: '#cbd5e1', fontWeight: 800 }}>/</span>
                <span style={{ color: '#2563eb', fontWeight: 700 }}>{getNodeCategory(nodoActivo)}</span>
                <span style={{ color: '#cbd5e1', fontWeight: 800 }}>/</span>
                <span style={{ color: '#475569' }}>
                  {nodoActivo.ubicacion_nombre || 'Campus ULEAM'}
                </span>
                <span style={{ color: '#cbd5e1', fontWeight: 800 }}>/</span>
                <strong style={{ color: '#0f2c59' }}>{nodoActivo.nombre}</strong>
              </div>
            )}

            {isDropdownOpen && (
              <div className="node-dropdown-wrapper">
                <div className="custom-dropdown-menu" style={{ position: 'relative', top: 0, marginTop: 0, minWidth: isMobile ? '100%' : '320px' }}>
                  {!isMobile && (
                    <div className="dropdown-search-wrapper" onClick={e => e.stopPropagation()}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      <input
                        type="text"
                        placeholder={isEn ? 'Search node by name or serial...' : 'Buscar nodo por nombre o serial...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                  )}

                  <div className="dropdown-list-wrapper">
                    {isMobile || searchQuery.trim() !== '' ? (
                      nodos.filter(n => searchQuery.trim() === '' || n.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) || (n.nombre && n.nombre.toLowerCase().includes(searchQuery.toLowerCase()))).length > 0 ? (
                        nodos.filter(n => searchQuery.trim() === '' || n.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) || (n.nombre && n.nombre.toLowerCase().includes(searchQuery.toLowerCase()))).map(n => (
                          <div
                            key={n.id}
                            className={`custom-dropdown-item ${nodoActivo?.id === n.id ? 'active' : ''}`}
                            onClick={(e) => handleSelectNode(n, e)}
                            onMouseDown={(e) => handleSelectNode(n, e)}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontWeight: 700, color: '#0f2c59', fontSize: '0.88rem' }}>{n.nombre || n.serial_number}</span>
                              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: 1.35 }}>
                                {getNodeCategory(n)}{n.ubicacion_nombre ? ` • ${n.ubicacion_nombre}` : ''} • {n.serial_number}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="dropdown-no-results">{isEn ? 'No nodes found' : 'No se encontraron nodos'}</div>
                      )
                    ) : (
                      Object.entries(groupedNodos).map(([cat, catNodos]) => (
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
                            <svg className="dropdown-category-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ transform: 'rotate(-90deg)', transition: 'none' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Sub Menu / Flyout en escritorio */}
                {!isMobile && searchQuery.trim() === '' && Object.keys(expandedCategories).some(k => expandedCategories[k]) && (
                  <div className="custom-dropdown-menu" style={{ position: 'relative', top: 0, marginTop: 0, marginLeft: '4px', minWidth: '240px' }}>
                    <div className="dropdown-category-header" style={{ cursor: 'default', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <span className="dropdown-category-title" style={{ color: '#0f2c59' }}>
                        {Object.keys(expandedCategories).find(k => expandedCategories[k])}
                      </span>
                    </div>
                    <div className="dropdown-list-wrapper">
                      {(groupedNodos[Object.keys(expandedCategories).find(k => expandedCategories[k])] || []).map(n => (
                        <div
                          key={n.id}
                          className={`custom-dropdown-item ${nodoActivo?.id === n.id ? 'active' : ''}`}
                          onClick={(e) => handleSelectNode(n, e)}
                          onMouseDown={(e) => handleSelectNode(n, e)}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 600, color: '#0f2c59' }}>{n.nombre || n.serial_number}</span>
                            {n.nombre && <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{n.serial_number}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* LADO DERECHO FIJO: ESTADO, PROTOCOLO Y ÚLTIMO DATO (Frecuencia eliminada) */}
        <div className="node-info-right-panel">

          {/* FILA SUPERIOR DERECHA: Estado y Protocolo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

            {/* Estado */}
            <div className="node-info-section" style={{ borderRight: 'none', padding: 0 }}>
              <div className="node-info-icon" style={{ color: isConnected ? '#10b981' : '#ef4444' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div className="node-info-text">
                <span className="node-info-label">{isEn ? 'Status' : 'Estado'}</span>
                {isLoadingNodos ? (
                  <div className="skeleton skeleton-text" style={{ width: '80px', marginTop: '4px' }}></div>
                ) : (
                  <span className="node-info-value" style={{ color: isConnected ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                    {isConnected ? (isEn ? 'Connected' : 'Conectado') : (isEn ? 'Disconnected' : 'Desconectado')}
                  </span>
                )}
              </div>
            </div>

            {/* Protocolo */}
            <div className="node-info-section" style={{ borderRight: 'none', padding: 0 }}>
              <div className="node-info-icon" style={{ color: '#ea580c' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </div>
              <div className="node-info-text">
                <span className="node-info-label">{isEn ? 'Protocol' : 'Protocolo'}</span>
                {isLoadingNodos ? (
                  <div className="skeleton skeleton-text" style={{ width: '60px', marginTop: '4px' }}></div>
                ) : (
                  <span className="node-info-value" style={{ fontWeight: 800 }}>MQTT</span>
                )}
              </div>
            </div>

          </div>

          {/* FILA INFERIOR DERECHA: Último dato (Interactivo cuando el nodo está Desconectado) */}
          <div
            className={`node-info-section ${!isConnected ? 'offline-clock-btn' : ''}`}
            onClick={() => {
              if (!isConnected) {
                setShowLastReadingOffline(prev => !prev);
              }
            }}
            style={{
              borderRight: 'none',
              padding: !isConnected ? '6px 12px' : 0,
              borderRadius: !isConnected ? '12px' : 0,
              background: !isConnected ? (showLastReadingOffline ? '#eff6ff' : '#f8fafc') : 'transparent',
              border: !isConnected ? (showLastReadingOffline ? '1.5px solid #2563eb' : '1px dashed #cbd5e1') : 'none',
              cursor: !isConnected ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              boxShadow: !isConnected && showLastReadingOffline ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none'
            }}
            title={!isConnected
              ? (showLastReadingOffline
                ? (isEn ? "Click to hide last recorded reading" : "Haz clic para ocultar la última lectura registrada")
                : (isEn ? "Click to view last recorded reading data" : "Haz clic para visualizar en la interfaz los datos de la última lectura registrada"))
              : (isEn ? "Last data transmitted in real time" : "Último dato transmitido en tiempo real")
            }
          >
            <div className="node-info-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="node-info-icon" style={{ color: !isConnected && showLastReadingOffline ? '#2563eb' : (isConnected ? '#10b981' : '#64748b'), minWidth: 'auto', padding: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <span className="node-info-label" style={{ fontWeight: 800, color: !isConnected && showLastReadingOffline ? '#2563eb' : '#475569' }}>
                  {isEn ? 'Last reading' : 'Último dato'}
                </span>
              </div>
              {isLoadingNodos || isLoadingHistory ? (
                <div className="skeleton skeleton-text" style={{ width: '120px', marginTop: '4px' }}></div>
              ) : (
                (() => {
                  if (!sensorData || (!sensorData.fullDateTime && !sensorData.shortTime)) {
                    return <span className="node-info-value">{isEn ? 'Awaiting...' : 'Aguardando...'}</span>;
                  }
                  const { time, date } = getTimeAndDate(sensorData);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f2c59', lineHeight: 1.2 }}>
                        {time}
                      </span>
                      {date && (
                        <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748b', lineHeight: 1.2 }}>
                          {date}
                        </span>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 3. LIVE KPI CARDS */}
      <div className="monitor-kpi-grid">
        {isLoadingNodos ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="monitor-kpi-card">
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
            const isDisplayingData = isConnected || showLastReadingOffline;
            const currentVal = isDisplayingData ? sensorData[l.data_type] : undefined;
            const prevVal = isDisplayingData ? previousData[l.data_type] : undefined;

            // Evaluar umbrales esperados idéntico a VisualizarMapa
            const minExp = (l?.minExpected !== undefined && l?.minExpected !== null && l?.minExpected !== '')
              ? parseFloat(l.minExpected)
              : (l?.min_expected !== undefined && l?.min_expected !== null && l?.min_expected !== '')
                ? parseFloat(l.min_expected)
                : (l?.min_alerta !== undefined && l?.min_alerta !== null && l?.min_alerta !== '')
                  ? parseFloat(l.min_alerta)
                  : (l?.valor_minimo !== undefined && l?.valor_minimo !== null && l?.valor_minimo !== '')
                    ? parseFloat(l.valor_minimo)
                    : (l?.min !== undefined && l?.min !== null && l?.min !== '')
                      ? parseFloat(l.min)
                      : null;

            const maxExp = (l?.maxExpected !== undefined && l?.maxExpected !== null && l?.maxExpected !== '')
              ? parseFloat(l.maxExpected)
              : (l?.max_expected !== undefined && l?.max_expected !== null && l?.max_expected !== '')
                ? parseFloat(l.max_expected)
                : (l?.max_alerta !== undefined && l?.max_alerta !== null && l?.max_alerta !== '')
                  ? parseFloat(l.max_alerta)
                  : (l?.valor_maximo !== undefined && l?.valor_maximo !== null && l?.valor_maximo !== '')
                    ? parseFloat(l.valor_maximo)
                    : (l?.max !== undefined && l?.max !== null && l?.max !== '')
                      ? parseFloat(l.max)
                      : null;

            const numVal = Number(currentVal);
            let isLow = false;
            let isHigh = false;
            if (currentVal !== undefined && currentVal !== null && currentVal !== '--') {
              if (minExp !== null && !isNaN(minExp) && numVal < minExp) isLow = true;
              else if (maxExp !== null && !isNaN(maxExp) && numVal > maxExp) isHigh = true;
            }

            const alertMsg = isLow
              ? `Nivel Bajo: El valor registrado (${numVal} ${l.unidad || ''}) está por debajo del mínimo esperado (${minExp} ${l.unidad || ''})`
              : isHigh
                ? `Nivel Alto: El valor registrado (${numVal} ${l.unidad || ''}) sobrepasó el máximo esperado (${maxExp} ${l.unidad || ''})`
                : `Estado Normal: El valor (${numVal !== undefined && !isNaN(numVal) ? numVal : '--'} ${l.unidad || ''}) se encuentra dentro del rango seguro.`;

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
                      <strong>{getMetricName(l)}</strong>
                      <span>{isDisplayingData ? (isConnected ? (isEn ? 'Current' : 'Actual') : (isEn ? 'Last Reading' : 'Última Lectura')) : (isEn ? 'Live Inactive' : 'En Vivo Inactivo')}</span>
                    </div>
                  </div>
                  {isLoadingHistory ? (
                    <div className="skeleton skeleton-text" style={{ width: '60px' }}></div>
                  ) : (
                    <div className="kpi-trend">
                      <span className={`kpi-trend-val ${isDisplayingData ? trendClass : 'trend-flat'}`}>
                        {isDisplayingData ? `${trendIcon} ${diff !== 0 ? diff : '0.00'} ${l.unidad}` : `-- ${l.unidad}`}
                      </span>
                      <span className="kpi-trend-label">{isDisplayingData ? (isEn ? 'vs. previous reading' : 'vs. lectura anterior') : (isEn ? 'inactive broadcast' : 'emisión inactiva')}</span>
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

                      {/* Texto de Estabilidad o Indicador Offline */}
                      <div style={{ marginTop: '8px' }}>
                        {!isDisplayingData ? (
                          <span
                            onClick={() => setShowLastReadingOffline(true)}
                            title={isEn ? "Click to view last recorded historical reading" : "Haz clic para ver la última lectura histórica registrada"}
                            className="kpi-status-badge"
                            style={{ background: '#fffbe6', color: '#d97706', border: '1px solid #fde68a', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            {isEn ? 'Node Disconnected' : 'Nodo Desconectado'}
                          </span>
                        ) : isLow ? (
                          <span title={alertMsg} className="kpi-status-badge" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #93c5fd', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'help', display: 'inline-block' }}>
                            {isEn ? 'Stability: Low' : 'Estabilidad: Baja'}
                          </span>
                        ) : isHigh ? (
                          <span title={alertMsg} className="kpi-status-badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'help', display: 'inline-block' }}>
                            {isEn ? 'Stability: High' : 'Estabilidad: Alta'}
                          </span>
                        ) : (
                          <span title={alertMsg} className="kpi-status-badge" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'help', display: 'inline-block' }}>
                            {isEn ? 'Stability: Normal' : 'Estabilidad: Normal'}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="kpi-card-footer">
                  <span>{isEn ? 'Last update:' : 'Última actualización:'}</span>
                  {isLoadingHistory ? (
                    <div className="skeleton skeleton-text" style={{ width: '60px' }}></div>
                  ) : (
                    <span
                      onClick={() => !isConnected && setShowLastReadingOffline(prev => !prev)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isDisplayingData ? '#0f172a' : '#64748b', fontWeight: 600, fontSize: '0.78rem', cursor: !isConnected ? 'pointer' : 'default' }}
                      title={!isConnected ? (showLastReadingOffline ? (isEn ? "Click to hide historical reading" : "Haz clic para ocultar lectura histórica") : (isEn ? "Click to view last historical reading" : "Haz clic para ver última lectura histórica")) : ""}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      {isDisplayingData ? (sensorData.fullDateTime || sensorData.shortTime || '--:--') : (isEn ? 'No broadcast' : 'Sin emisión')}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. SECCIÓN DE GRÁFICO RECHARTS DUAL-AXIS IGUAL AL DASHBOARD */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>

        {/* Controles superiores del gráfico: Selección por unidad + chips de variables */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", fontSize: '1.15rem', fontWeight: 800, color: '#0f2c59' }}>
                {isEn ? 'Real-Time Telemetry Graph' : 'Gráfico de Telemetría en Tiempo Real'}
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '3px 10px', borderRadius: '10px' }}>
                {nodoActivo ? nodoActivo.nombre : (isEn ? 'Active Node' : 'Nodo Activo')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Botón Marcar por Unidad */}
              {nodoActivo?.lecturas?.length > 0 && (
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
                  title={isByUnitMode ? (isEn ? "Disable unit multi-selection" : "Desactivar multiselección por unidad") : (isEn ? "Enable unit multi-selection" : "Marcar variables por misma unidad de medida")}
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
                    ? (isEn ? 'Mark by Unit (Active)' : 'Marcar por unidad (Activo)')
                    : (isEn ? 'Mark by Unit' : 'Marcar por unidad')}
                </button>
              )}

              {isByUnitMode && activeSelectedUnit && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '8px' }}>
                  {isEn ? `Active Unit: ${activeSelectedUnit}` : `Unidad activa: ${activeSelectedUnit}`}
                </span>
              )}
            </div>
          </div>

          {/* Lista de Variables / Chips */}
          <div className="custom-horizontal-scrollbar" style={{
            display: 'flex',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            gap: '8px',
            alignItems: 'center',
            paddingBottom: '8px',
            width: '100%',
            maxWidth: '100%'
          }}>
            {nodoActivo?.lecturas?.length > 0 ? (
              nodoActivo.lecturas.map((l, idx) => {
                const isChecked = activeVariables[l.data_type] !== false;
                const isSameUnit = !activeSelectedUnit || l.unidad === activeSelectedUnit;
                const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
                const color = palette[idx % palette.length];

                return (
                  <button
                    key={l.data_type || idx}
                    type="button"
                    onClick={() => handleToggleVarKey(l.data_type)}
                    style={{
                      flexShrink: 0,
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: isChecked ? `2px solid ${color}` : '1.5px solid #cbd5e1',
                      background: isChecked ? `${color}15` : '#ffffff',
                      color: isChecked ? color : '#64748b',
                      fontWeight: isChecked ? 800 : 600,
                      fontSize: '0.82rem',
                      cursor: (isByUnitMode && !isSameUnit && !isChecked) ? 'not-allowed' : 'pointer',
                      opacity: (isByUnitMode && !isSameUnit && !isChecked) ? 0.45 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                    <span>{getMetricName(l)} ({l.unidad})</span>
                  </button>
                );
              })
            ) : (
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                {isEn ? 'This node has no registered telemetry variables.' : 'Este nodo no tiene variables de telemetría registradas.'}
              </span>
            )}
          </div>
        </div>

        {/* Toolbar del Gráfico: Lecturas a Mostrar + Paginación + Conmutadores Reloj y Vista */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '10px' }}>

          {/* Leyendas de variables activas */}
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {appliedSelections.map((sel, idx) => {
              const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
              const origIdx = nodoActivo?.lecturas?.findIndex(l => l.data_type === sel.clave_mqtt) ?? -1;
              const color = origIdx >= 0 ? palette[origIdx % palette.length] : palette[idx % palette.length];
              const axisId = getAxisForSelection(sel);
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color }} />
                  <span>{sel.nombre_var} <small style={{ opacity: 0.75, fontWeight: 700 }}>({sel.unidad})</small></span>
                  {hasRightAxisVariables && (
                    <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '6px', background: axisId === 'right' ? '#ffedd5' : '#d1fae5', color: axisId === 'right' ? '#c2410c' : '#047857', fontWeight: 800 }}>
                      {axisId === 'right' ? (isEn ? 'Right Axis' : 'Eje Der.') : (isEn ? 'Left Axis' : 'Eje Izq.')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Controles del Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

            {/* Conmutador de Vista de Gráfico */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '10px' }}>

              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', margin: '0 2px 0 4px' }}>{isEn ? 'View:' : 'Vista:'}</span>
              <button type="button" onClick={() => setChartVisualType('area')} className={`dash-btn-style ${chartVisualType === 'area' ? 'active' : ''}`} style={{ padding: '5px 10px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title={isEn ? "Area Chart" : "Gráfico de Área"}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16"><path d="M3 3v18h18" /><path d="M7 15l4-5 4 3 5-7v9H7z" fill="currentColor" fillOpacity="0.25" /><path d="M7 15l4-5 4 3 5-7" /></svg>
              </button>
              <button type="button" onClick={() => setChartVisualType('bar')} className={`dash-btn-style ${chartVisualType === 'bar' ? 'active' : ''}`} style={{ padding: '5px 10px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title={isEn ? "Bar Chart" : "Gráfico de Barras"}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16"><rect x="5" y="11" width="3" height="9" rx="1" fill="currentColor" fillOpacity="0.3" /><rect x="11" y="6" width="3" height="14" rx="1" fill="currentColor" fillOpacity="0.3" /><rect x="17" y="14" width="3" height="6" rx="1" fill="currentColor" fillOpacity="0.3" /><path d="M3 21h18" /></svg>
              </button>
              <button type="button" onClick={() => setChartVisualType('line')} className={`dash-btn-style ${chartVisualType === 'line' ? 'active' : ''}`} style={{ padding: '5px 10px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title={isEn ? "Line Chart" : "Gráfico de Líneas"}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M3 3v18h18" /><polyline points="6 15 11 9 15 13 21 6" /><circle cx="6" cy="15" r="2" fill="currentColor" /><circle cx="11" cy="9" r="2" fill="currentColor" /><circle cx="15" cy="13" r="2" fill="currentColor" /><circle cx="21" cy="6" r="2" fill="currentColor" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Contenedor del Gráfico Recharts */}
        <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, height: '360px', position: 'relative', overflow: 'hidden' }}>
          {appliedSelections.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', color: '#64748b', gap: '12px', padding: '2rem', textAlign: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" width="48" height="48"><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" strokeDasharray="3 3" /><circle cx="12" cy="12" r="9" stroke="#cbd5e1" strokeDasharray="2 2" /></svg>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f2c59' }}>{isEn ? 'No variables selected' : 'Sin variables seleccionadas'}</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>{isEn ? 'Check one or more variables above with the same measurement unit to visualize.' : 'Marca una o varias variables arriba con la misma unidad de medida para visualizar.'}</p>
              </div>
            </div>
          ) : visibleChartData.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', gap: '10px', padding: '2rem', textAlign: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" width="44" height="44">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f2c59' }}>
                  {isEn ? 'Awaiting real-time telemetry readings...' : 'Aguardando lecturas de telemetría en tiempo real...'}
                </h4>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              {(() => {
                const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
                const firstSel = appliedSelections[0];
                const firstOrigIdx = firstSel ? (nodoActivo?.lecturas?.findIndex(l => l.data_type === firstSel.clave_mqtt) ?? 0) : 0;
                const leftAxisColor = palette[(firstOrigIdx >= 0 ? firstOrigIdx : 0) % palette.length];

                return chartVisualType === 'area' ? (
                  <AreaChart data={visibleChartData} margin={{ top: 10, right: hasRightAxisVariables ? 15 : 10, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} angle={-35} textAnchor="end" height={55} tickMargin={10} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} padding={{ left: 0, right: 0 }} />
                    <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11, fill: leftAxisColor, fontWeight: 700 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} width={45} />
                    {hasRightAxisVariables && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#f97316', fontWeight: 700 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} width={50} />}
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', background: '#ffffff', fontWeight: 700 }} labelStyle={{ fontWeight: 800, color: '#0f2c59', marginBottom: '4px' }} cursor={{ stroke: '#2563eb', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.82rem', fontWeight: 700 }} />
                    {appliedSelections.map((sel, idx) => {
                      const origIdx = nodoActivo?.lecturas?.findIndex(l => l.data_type === sel.clave_mqtt) ?? -1;
                      const color = origIdx >= 0 ? palette[origIdx % palette.length] : palette[idx % palette.length];
                      const axisId = getAxisForSelection(sel);
                      const dataKeyWithSerial = `${sel.serial_number}_${sel.clave_mqtt}`;
                      const dataKeyToUse = visibleChartData.some(d => d[dataKeyWithSerial] !== undefined) ? dataKeyWithSerial : sel.clave_mqtt;

                      return (
                        <Area
                          key={sel.clave_mqtt}
                          yAxisId={axisId}
                          connectNulls={true}
                          type="monotone"
                          name={`${sel.nombre_var} (${sel.unidad})`}
                          dataKey={dataKeyToUse}
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
                ) : chartVisualType === 'bar' ? (
                  <BarChart data={visibleChartData} margin={{ top: 10, right: hasRightAxisVariables ? 15 : 10, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} angle={-35} textAnchor="end" height={55} tickMargin={10} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} padding={{ left: 0, right: 0 }} />
                    <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11, fill: leftAxisColor, fontWeight: 700 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} width={45} />
                    {hasRightAxisVariables && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#f97316', fontWeight: 700 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} width={50} />}
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', background: '#ffffff', fontWeight: 700 }} labelStyle={{ fontWeight: 800, color: '#0f2c59', marginBottom: '4px' }} cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.82rem', fontWeight: 700 }} />
                    {appliedSelections.map((sel, idx) => {
                      const origIdx = nodoActivo?.lecturas?.findIndex(l => l.data_type === sel.clave_mqtt) ?? -1;
                      const color = origIdx >= 0 ? palette[origIdx % palette.length] : palette[idx % palette.length];
                      const axisId = getAxisForSelection(sel);
                      const dataKeyWithSerial = `${sel.serial_number}_${sel.clave_mqtt}`;
                      const dataKeyToUse = visibleChartData.some(d => d[dataKeyWithSerial] !== undefined) ? dataKeyWithSerial : sel.clave_mqtt;

                      return (
                        <Bar
                          key={sel.clave_mqtt}
                          yAxisId={axisId}
                          name={`${sel.nombre_var} (${sel.unidad})`}
                          dataKey={dataKeyToUse}
                          fill={color}
                          radius={[4, 4, 0, 0]}
                          activeBar={{ stroke: '#0f2c59', strokeWidth: 2, fillOpacity: 0.95 }}
                          isAnimationActive={false}
                        />
                      );
                    })}
                  </BarChart>
                ) : (
                  <LineChart data={visibleChartData} margin={{ top: 10, right: hasRightAxisVariables ? 15 : 10, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} angle={-35} textAnchor="end" height={55} tickMargin={10} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} padding={{ left: 0, right: 0 }} />
                    <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11, fill: leftAxisColor, fontWeight: 700 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} width={45} />
                    {hasRightAxisVariables && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#f97316', fontWeight: 700 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.8 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} width={50} />}
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', background: '#ffffff', fontWeight: 700 }} labelStyle={{ fontWeight: 800, color: '#0f2c59', marginBottom: '4px' }} cursor={{ stroke: '#2563eb', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.82rem', fontWeight: 700 }} />
                    {appliedSelections.map((sel, idx) => {
                      const origIdx = nodoActivo?.lecturas?.findIndex(l => l.data_type === sel.clave_mqtt) ?? -1;
                      const color = origIdx >= 0 ? palette[origIdx % palette.length] : palette[idx % palette.length];
                      const axisId = getAxisForSelection(sel);
                      const dataKeyWithSerial = `${sel.serial_number}_${sel.clave_mqtt}`;
                      const dataKeyToUse = visibleChartData.some(d => d[dataKeyWithSerial] !== undefined) ? dataKeyWithSerial : sel.clave_mqtt;

                      return (
                        <Line
                          key={sel.clave_mqtt}
                          yAxisId={axisId}
                          connectNulls={true}
                          type="monotone"
                          name={`${sel.nombre_var} (${sel.unidad})`}
                          dataKey={dataKeyToUse}
                          stroke={color}
                          strokeWidth={2.8}
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

      {/* 5. TABLES GRID */}
      <div className="monitor-tables-grid">

        {/* Resumen Estadístico */}
        <div className="monitor-table-card">
          <h3 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>{isEn ? `Statistical Summary (${targetDateLabel})` : `Resumen Estadístico (${targetDateLabel})`}</span>
            {!isLoadingNodos && !isLoadingHistory && targetHistory.length === 0 && (
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', padding: '3px 10px', borderRadius: '8px', display: 'inline-block' }}>
                {isEn ? 'No data received for this period.' : 'No se ha recibido ninguna data para este periodo.'}
              </span>
            )}
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>{isEn ? 'Metric' : 'Métrica'}</th>
                  <th>{isEn ? 'Average' : 'Promedio'}</th>
                  <th>{isEn ? 'Maximum' : 'Máximo'}</th>
                  <th>{isEn ? 'Minimum' : 'Mínimo'}</th>
                  <th>{isEn ? 'Stability' : 'Estabilidad'}</th>
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
                ) : nodoActivo?.lecturas?.length > 0 ? (
                  nodoActivo.lecturas.map((l, i) => {
                    const theme = getTheme(l.data_type, l.icono);
                    const st = stats?.[l.data_type];
                    const hasDataTarget = targetHistory.length > 0;
                    return (
                      <tr key={i}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="kpi-icon-wrapper" style={{ width: '32px', height: '32px', background: theme.bg, color: theme.hex, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              {theme.icon}
                            </svg>
                          </div>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{getMetricName(l)} ({l.unidad})</span>
                        </td>
                        <td style={{ color: theme.hex }}>{hasDataTarget && st?.promedio !== undefined ? st.promedio : '--'}</td>
                        <td style={{ color: theme.hex }}>{hasDataTarget && st?.max !== undefined ? st.max : '--'}</td>
                        <td style={{ color: theme.hex }}>{hasDataTarget && st?.min !== undefined ? st.min : '--'}</td>
                        <td>
                          {(() => {
                            const rawEst = hasDataTarget ? (st?.estabilidad || 'Normal') : 'Sin datos';
                            const est = isEn
                              ? (rawEst === 'Baja' ? 'Low' : rawEst === 'Alta' ? 'High' : rawEst === 'Normal' ? 'Normal' : 'No data')
                              : rawEst;
                            let badgeBg = '#f1f5f9';
                            let badgeColor = '#64748b';
                            let badgeBorder = '#cbd5e1';
                            if (hasDataTarget) {
                              if (rawEst === 'Baja') {
                                badgeBg = '#eff6ff';
                                badgeColor = '#2563eb';
                                badgeBorder = '#93c5fd';
                              } else if (rawEst === 'Alta') {
                                badgeBg = '#fef2f2';
                                badgeColor = '#dc2626';
                                badgeBorder = '#fca5a5';
                              } else {
                                badgeBg = '#ecfdf5';
                                badgeColor = '#059669';
                                badgeBorder = '#6ee7b7';
                              }
                            }
                            return (
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                background: badgeBg,
                                color: badgeColor,
                                border: `1px solid ${badgeBorder}`,
                                display: 'inline-block'
                              }}>
                                {est}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="5">{isEn ? 'No metrics configured.' : 'No hay métricas configuradas.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Últimas Lecturas */}
        <div className="monitor-table-card">
          <h3 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '0.75rem' }}>
            <span>{isEn ? `Recent Readings (${targetDateLabel})` : `Últimas Lecturas (${targetDateLabel})`}</span>
            {targetHistory.length > 0 && (
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', border: '1px solid #93c5fd', padding: '3px 10px', borderRadius: '8px' }}>
                {targetHistory.length > 50
                  ? (isEn ? `50 most recent (of ${targetHistory.length})` : `50 más recientes (de ${targetHistory.length})`)
                  : `${targetHistory.length} ${isEn ? (targetHistory.length !== 1 ? 'records' : 'record') : (targetHistory.length !== 1 ? 'registros' : 'registro')}`}
              </span>
            )}
            {!isLoadingNodos && !isLoadingHistory && targetHistory.length === 0 && (
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', padding: '3px 10px', borderRadius: '8px', display: 'inline-block' }}>
                {isEn ? 'No data received for this period.' : 'No se ha recibido ninguna data para este periodo.'}
              </span>
            )}
          </h3>
          <div
            className="custom-scrollbar"
            style={{
              maxHeight: '420px',
              overflowY: 'auto',
              overflowX: 'auto',
              borderRadius: '8px',
              border: '1px solid #f1f5f9'
            }}
          >
            <table className="styled-table" style={{ width: '100%', margin: 0 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                <tr>
                  <th>{isEn ? 'Date & Time' : 'Fecha y Hora'}</th>
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
                ) : targetHistory.length === 0 ? (
                  <tr>
                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>--:--:--</td>
                    {nodoActivo?.lecturas?.map((l, c_idx) => (
                      <td key={c_idx} style={{ color: '#94a3b8' }}>--</td>
                    ))}
                  </tr>
                ) : (
                  [...targetHistory].reverse().slice(0, 50).map((row, r_idx) => (
                    <tr key={r_idx}>
                      <td style={{ color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{row.fullDateTime || row.shortTime || row.time}</td>
                      {nodoActivo?.lecturas?.map((l, c_idx) => {
                        const theme = getTheme(l.data_type);
                        return (
                          <td key={c_idx} style={{ color: theme.hex }}>{row[l.data_type] !== undefined ? row[l.data_type] : '--'}</td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 6. TERMINAL LOGS */}
      <div className="monitor-terminal">
        <div className="terminal-header-bar">
          <span className="terminal-title">{isEn ? 'MQTT Logs' : 'Logs MQTT'}</span>
          <div className="terminal-actions">
            <svg onClick={() => {
              const text = logs.map(l => `[${l.time}] ${l.msg}`).join('\n');
              navigator.clipboard.writeText(text);
              addLog(isEn ? 'Logs copied to clipboard' : 'Logs copiados al portapapeles', 'success');
            }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ cursor: 'pointer' }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <svg onClick={() => setLogs([])} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ cursor: 'pointer' }}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
          {logs.length === 0 && <div>{isEn ? 'Awaiting socket initialization...' : 'Esperando inicialización del socket...'}</div>}
        </div>
      </div>

      {/* Modal de Exportación CSV */}
      <ModalExportarCSV
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        nodo={nodoActivo}
      />

      {/* ── FLOATING SPEED-DIAL METRIC SELECTOR DRAGGABLE (CELULARES / PANTALLAS PEQUEÑAS) ── */}
      <div
        className={`mobile-fab-container ${showFab ? 'visible' : ''} ${isTopHalf ? 'pos-top' : 'pos-bottom'} ${isLeftHalf ? 'pos-left' : 'pos-right'}`}
        style={(fabPos && typeof fabPos.x === 'number' && typeof fabPos.y === 'number') ? {
          left: `${fabPos.x}px`,
          top: `${fabPos.y}px`,
          right: 'auto',
          bottom: 'auto'
        } : {}}
      >
        {/* Desplazamiento Vertical u Horizontal de las Métricas */}
        <div className={`mobile-fab-metrics-stack ${isFabOpen ? 'open' : ''}`}>
          {/* Botón de información para expandir/contraer los nombres completos */}
          <button
            type="button"
            className="mobile-fab-info-btn"
            onClick={() => setShowFullNames(!showFullNames)}
            title={showFullNames ? (isEn ? "Hide full names" : "Ocultar nombres completos") : (isEn ? "Show full names" : "Ver nombres completos")}
          >
            <span>
              {showFullNames
                ? (isLeftHalf ? "‹" : "›")
                : (isLeftHalf ? "i ›" : "‹ i")}
            </span>
          </button>

          {/* Botones de cada métrica del nodo activo (Circulares perfectos por defecto) */}
          {nodoActivo?.lecturas && nodoActivo.lecturas.map((l, idx) => {
            const isChecked = activeVariables[l.data_type] !== false;
            const isSameUnit = !activeSelectedUnit || l.unidad === activeSelectedUnit;
            const isBlocked = isByUnitMode && !isChecked && !isSameUnit;
            const mainColor = PALETTE[idx % PALETTE.length];
            const unitText = l.unidad || l.tipo || '';
            const unitFontSize = !showFullNames && unitText.length > 4 ? '0.6rem' : !showFullNames && unitText.length > 2 ? '0.7rem' : '0.78rem';

            return (
              <button
                key={`fab-metric-${l.data_type}`}
                type="button"
                disabled={isBlocked}
                onClick={() => !isBlocked && handleToggleVarKey(l.data_type)}
                className={`mobile-fab-metric-chip ${isChecked ? 'active' : ''} ${isBlocked ? 'disabled' : ''} ${showFullNames ? 'expanded' : ''}`}
                style={{
                  borderColor: isBlocked ? '#cbd5e1' : isChecked ? mainColor : '#cbd5e1',
                  backgroundColor: isBlocked ? '#f8fafc' : isChecked ? mainColor : '#ffffff',
                  color: isBlocked ? '#94a3b8' : isChecked ? '#ffffff' : '#334155',
                  fontSize: unitFontSize
                }}
              >
                {isChecked && <span style={{ marginRight: showFullNames ? '4px' : '2px', fontWeight: 900, fontSize: '0.7rem' }}>✓</span>}
                {showFullNames ? (
                  <span>{getMetricName(l)} <small style={{ opacity: 0.85 }}>({l.unidad})</small></span>
                ) : (
                  <span style={{ lineHeight: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '36px' }}>{unitText}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Botón "U" que se desplaza horizontalmente al lado del botón principal */}
        {nodoActivo?.lecturas && nodoActivo.lecturas.length > 0 && (
          <button
            type="button"
            className={`mobile-fab-unit-toggle-btn ${isFabOpen ? 'open' : ''} ${isByUnitMode ? 'active' : ''}`}
            onClick={handleToggleByUnitMode}
            title={isByUnitMode ? (isEn ? "Disable unit selection" : "Desactivar selección por unidad") : (isEn ? "Enable unit selection" : "Habilitar selección por unidad")}
          >
            <span>U</span>
          </button>
        )}

        {/* Botón Circular Principal (FAB) Arrastrable */}
        <button
          type="button"
          className="mobile-fab-main-btn"
          onMouseDown={handleFabPointerDown}
          onTouchStart={handleFabPointerDown}
          onClick={handleFabClick}
          title={isEn ? "Drag or click to select metrics" : "Arrastra a cualquier lado o haz clic para métricas"}
        >
          {/* Indicador de flecha en la parte superior/inferior sin fondo circular */}
          <div className="mobile-fab-arrow-indicator">
            {isFabOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3.5" width="13" height="13">
                <polyline points={isTopHalf ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="#62ffb1" strokeWidth="3.5" width="13" height="13">
                <polyline points={isTopHalf ? "6 9 12 15 18 9" : "18 15 12 9 6 15"} />
              </svg>
            )}
          </div>
          <span className="mobile-fab-main-unit">
            {nodoActivo?.lecturas
              ? (nodoActivo.lecturas.find(l => activeVariables[l.data_type] !== false)?.unidad || '📊')
              : '📊'}
          </span>
        </button>
      </div>
    </div>
  );
}