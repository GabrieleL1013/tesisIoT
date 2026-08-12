import { API_BASE_URL, fetchDeduplicated } from '../../config/api';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/components/admin/HistoricoAgregado.css';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, Brush, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import CustomDatePicker from '../../components/admin/CustomDatePicker';

export default function HistoricoAgregado() {
  const location = useLocation();
  const { language } = useLanguage();
  const isEn = language === 'en';

  usePageTitle({ es: 'Histórico Agregado', en: 'Aggregated History' }, 'Admin · IoT ULEAM');

  const formatImageUrl = (url) => {
    if (!url) return '/symbols/default.webp';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (url.startsWith('/symbols/')) return url;
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${API_BASE_URL.replace(/\/api$/, '')}${cleanPath}`;
  };

  const agrupacionOptionsDay = useMemo(() => [
    { value: '15', label: '15 min' },
    { value: '30', label: '30 min' },
    { value: '45', label: '45 min' },
    { value: '60', label: isEn ? '1 hour' : '1 hora' },
    { value: '120', label: isEn ? '2 hours' : '2 horas' },
    { value: '180', label: isEn ? '3 hours' : '3 horas' },
    { value: '240', label: isEn ? '4 hours' : '4 horas' }
  ], [isEn]);

  const agrupacionOptionsRange = useMemo(() => [
    ...agrupacionOptionsDay,
    { value: '1440', label: isEn ? '1 day' : '1 día' }
  ], [agrupacionOptionsDay, isEn]);

  const agrupacionOptionsHour = useMemo(() => [
    { value: '1', label: '1 min' },
    { value: '2', label: '2 min' },
    { value: '3', label: '3 min' },
    { value: '4', label: '4 min' },
    { value: '5', label: '5 min' },
    { value: '6', label: '6 min' },
    { value: '10', label: '10 min' }
  ], []);

  const [nodos, setNodos] = useState([]);
  const [nodoActivo, setNodoActivo] = useState(null);

  const [checkedVarKeys, setCheckedVarKeys] = useState([]);
  const [isByUnitMode, setIsByUnitMode] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showFullNames, setShowFullNames] = useState(false);
  const [showFab, setShowFab] = useState(false);

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

  // Posición dinámica y arrastrabilidad del FAB para celulares (reinicio en esquina inferior derecha por defecto)
  const [fabPos, setFabPos] = useState(null);

  const isDraggingFabRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialFabX: 0, initialFabY: 0 });
  const fabPosRef = useRef(fabPos);
  fabPosRef.current = fabPos;

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

  const currentYearStr = new Date().getFullYear().toString();
  const validSavedStart = (savedFilters.startDate && savedFilters.startDate.startsWith(currentYearStr)) ? savedFilters.startDate : today;
  const validSavedEnd = (savedFilters.endDate && savedFilters.endDate.startsWith(currentYearStr)) ? savedFilters.endDate : today;

  const inspectState = location.state?.inspectInstability ? location.state : null;

  const [filterMode, setFilterMode] = useState(inspectState ? 'hour' : (savedFilters.filterMode || 'day'));
  const [startDate, setStartDate] = useState(inspectState ? inspectState.date : validSavedStart);
  const [endDate, setEndDate] = useState(inspectState ? inspectState.date : validSavedEnd);
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
  const [chartViewType, setChartViewType] = useState('area'); // 'area' | 'line' | 'bar'

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

  const getNextDayStr = (dateStr) => {
    if (!dateStr) return dateStr;
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getPrevDayStr = (dateStr) => {
    if (!dateStr) return dateStr;
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (filterMode === 'range') {
      const maxStart = getPrevDayStr(today);
      if (startDate > maxStart) {
        setStartDate(maxStart);
      }
      const minEnd = getNextDayStr(startDate);
      if (endDate < minEnd) {
        setEndDate(minEnd);
      } else if (endDate > today) {
        setEndDate(today);
      }
    } else {
      if (startDate > today) {
        setStartDate(today);
      }
    }
  }, [startDate, endDate, filterMode, today]);

  const handleStartDateChange = (newStart) => {
    let validStart = newStart;
    if (filterMode === 'range') {
      const maxStart = getPrevDayStr(today);
      if (validStart > maxStart) validStart = maxStart;
      setStartDate(validStart);
      const minEnd = getNextDayStr(validStart);
      if (!endDate || endDate < minEnd) {
        setEndDate(minEnd);
      }
    } else {
      if (validStart > today) validStart = today;
      setStartDate(validStart);
    }
  };

  const handleEndDateChange = (newEnd) => {
    let validEnd = newEnd;
    const minEnd = getNextDayStr(startDate);
    if (validEnd < minEnd) validEnd = minEnd;
    if (validEnd > today) validEnd = today;
    setEndDate(validEnd);
  };

  const formatFullDateTime = (row, intervalMinutesStr) => {
    if (!row) return '';
    const intervalMins = parseInt(intervalMinutesStr || currentAgrupacionValue || '15', 10) || 15;
    const rawStr = String(row.fecha || row.label || '');

    let startDateObj = null;

    if (rawStr.includes('-')) {
      const parts = rawStr.split(/[\sT]+/);
      const dateParts = parts[0].split('-');
      if (dateParts.length === 3) {
        const yyyy = parseInt(dateParts[0], 10);
        const mm = parseInt(dateParts[1], 10) - 1;
        const dd = parseInt(dateParts[2], 10);

        let timePart = parts[1] ? parts[1].split('.')[0] : '';
        if (!timePart && row.label && String(row.label).includes(':')) {
          const labelTime = String(row.label).split(/\s+/).pop();
          if (labelTime && labelTime.includes(':')) timePart = labelTime;
        }
        if (!timePart) timePart = '00:00:00';
        const tSplit = timePart.split(':');
        const hh = parseInt(tSplit[0] || '0', 10);
        const min = parseInt(tSplit[1] || '0', 10);
        const sec = parseInt(tSplit[2] || '0', 10);

        startDateObj = new Date(yyyy, mm, dd, hh, min, sec);
      }
    }

    if (!startDateObj && row.label && typeof row.label === 'string') {
      const spaceParts = row.label.trim().split(/\s+/);
      if (spaceParts[0].includes('/')) {
        const dateSubParts = spaceParts[0].split('/');
        const dd = parseInt(dateSubParts[0], 10);
        const mm = parseInt(dateSubParts[1], 10) - 1;
        const yyyy = parseInt(dateSubParts[2] || (startDate ? startDate.split('-')[0] : new Date().getFullYear()), 10);

        let tStr = spaceParts[1] || '00:00:00';
        const tSplit = tStr.split(':');
        const hh = parseInt(tSplit[0] || '0', 10);
        const min = parseInt(tSplit[1] || '0', 10);
        const sec = parseInt(tSplit[2] || '0', 10);

        startDateObj = new Date(yyyy, mm, dd, hh, min, sec);
      }
    }

    if (!startDateObj || isNaN(startDateObj.getTime())) {
      return row.label || row.fecha || '';
    }

    const endDateObj = new Date(startDateObj.getTime() + intervalMins * 60 * 1000 - 1000);

    const pad = (n) => String(n).padStart(2, '0');

    const dStart = `${pad(startDateObj.getDate())}/${pad(startDateObj.getMonth() + 1)}/${startDateObj.getFullYear()}`;
    const tStart = `${pad(startDateObj.getHours())}:${pad(startDateObj.getMinutes())}:${pad(startDateObj.getSeconds())}`;

    const dEnd = `${pad(endDateObj.getDate())}/${pad(endDateObj.getMonth() + 1)}/${endDateObj.getFullYear()}`;
    const tEnd = `${pad(endDateObj.getHours())}:${pad(endDateObj.getMinutes())}:${pad(endDateObj.getSeconds())}`;

    if (dStart === dEnd) {
      return `${dStart} ${tStart} a ${tEnd}`;
    } else {
      return `${dStart} ${tStart} a ${dEnd} ${tEnd}`;
    }
  };

  const formatAtTime = (atVal) => {
    if (!atVal || typeof atVal !== 'string' || !atVal.trim()) return null;
    let clean = atVal.trim();
    if (clean.includes(' ')) {
      clean = clean.split(/\s+/).pop();
    }
    if (clean.includes(':')) {
      const parts = clean.split(':');
      if (parts.length === 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
      if (parts.length === 3) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
    }
    return clean;
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHourDropdownOpen, setIsHourDropdownOpen] = useState(false);
  const [isAgrupacionDropdownOpen, setIsAgrupacionDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      const target = event.target;
      const getClosest = (selector) => {
        if (target && typeof target.closest === 'function') return target.closest(selector);
        if (target && target.parentElement && typeof target.parentElement.closest === 'function') return target.parentElement.closest(selector);
        return null;
      };

      if (!getClosest('.node-select-wrapper') && !getClosest('.node-dropdown-wrapper')) {
        setIsDropdownOpen(false);
      }
      if (!getClosest('.hour-dropdown-container')) {
        setIsHourDropdownOpen(false);
      }
      if (!getClosest('.agrupacion-dropdown-container')) {
        setIsAgrupacionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const [historicalData, setHistoricalData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetchDeduplicated(`${API_BASE_URL}/nodos?lang=${language}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setNodos(data);
          let foundNode = null;
          if (location.state && location.state.inspectInstability) {
            foundNode = data.find(n => String(n.id) === String(location.state.node_id) || n.serial_number === String(location.state.node_id));
          }
          if (!foundNode) {
            const searchParams = new URLSearchParams(window.location.search);
            const nodoUrlParam = searchParams.get('nodo');
            if (nodoUrlParam) {
              const parts = nodoUrlParam.split('-');
              const possibleId = parts[parts.length - 1];
              if (possibleId && !isNaN(possibleId)) {
                foundNode = data.find(n => String(n.id) === String(possibleId));
              }
            }
          }
          if (!foundNode) {
            const sharedNodeId = localStorage.getItem('shared_node_id');
            const sharedNodeSerial = localStorage.getItem('shared_node_serial');
            if (sharedNodeId || sharedNodeSerial) {
              foundNode = data.find(n => String(n.id) === String(sharedNodeId) || n.serial_number === sharedNodeSerial);
            }
          }
          setNodoActivo(foundNode || data[0]);
        }
      })
      .catch(err => console.error("Error fetching nodos:", err));
  }, [language]);

  useEffect(() => {
    if (location.state && location.state.inspectInstability) {
      const { node_id, date, hour } = location.state;
      setFilterMode('hour');
      if (date) {
        setStartDate(date);
        setEndDate(date);
      }
      if (hour !== undefined && hour !== null) {
        setSelectedHour(hour);
      }
      setGroupingIntervalHour('1');

      if (nodos.length > 0) {
        const found = nodos.find(n => String(n.id) === String(node_id) || n.serial_number === String(node_id));
        if (found) {
          setNodoActivo(found);
        }
      }
    }
  }, [location.state, nodos]);

  useEffect(() => {
    if (nodoActivo) {
      localStorage.setItem('shared_node_id', String(nodoActivo.id));
      localStorage.setItem('shared_node_serial', String(nodoActivo.serial_number));

      if (nodoActivo.lecturas && nodoActivo.lecturas.length > 0) {
        setCheckedVarKeys([nodoActivo.lecturas[0].data_type]);
      } else {
        setCheckedVarKeys([]);
      }

      // Sincronizar URL dinámicamente: ?nodo=uleam-water-16
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

  const [latestNodeReadingDate, setLatestNodeReadingDate] = useState(null);

  useEffect(() => {
    if (!nodoActivo?.serial_number) {
      setLatestNodeReadingDate(null);
      return;
    }

    const fetchLatest = () => {
      fetchDeduplicated(`${API_BASE_URL}/lecturas/recientes?serial_number=${nodoActivo.serial_number}&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const last = data[0];
            const rawDate = last.fecha || last.created_at || last.timestamp || last.time;
            if (rawDate) {
              setLatestNodeReadingDate(rawDate);
            }
          }
        })
        .catch(() => {});
    };

    fetchLatest();
  }, [nodoActivo]);

  // Helper para parsear marcas de tiempo exactamente en la zona horaria local sin desfasar horas
  const parseTimestampToMs = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val > 1e11 ? val : val * 1000;
    if (typeof val === 'string') {
      let s = val.trim();
      const isoStr = s.includes(' ') && !s.includes('T') ? s.replace(' ', 'T') : s;
      const d = new Date(isoStr);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    return 0;
  };

  // Cálculo de Estado Activo/Inactivo (1 min máximo desde la última lectura)
  const lastReadingTimestampMs = useMemo(() => {
    if (!nodoActivo) return 0;
    let maxMs = 0;

    if (latestNodeReadingDate) {
      const parsedReciente = parseTimestampToMs(latestNodeReadingDate);
      if (parsedReciente > maxMs) maxMs = parsedReciente;
    }

    if (historicalData && historicalData.length > 0) {
      const lastItem = historicalData[historicalData.length - 1];
      if (lastItem && lastItem.fecha) {
        const parsed = parseTimestampToMs(lastItem.fecha);
        if (parsed > maxMs) maxMs = parsed;
      }
    }
    const nodeTime = nodoActivo.last_read || nodoActivo.last_seen || nodoActivo.updated_at || nodoActivo.created_at;
    if (nodeTime) {
      const parsedNode = parseTimestampToMs(nodeTime);
      if (parsedNode > maxMs) maxMs = parsedNode;
    }
    return maxMs;
  }, [nodoActivo, historicalData, latestNodeReadingDate]);

  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  const isNodeActive = useMemo(() => {
    if (!lastReadingTimestampMs) return false;
    const diffMs = nowTick - lastReadingTimestampMs;
    return diffMs <= 60000; // Máximo 1 minuto (60,000 ms) para considerarse Activo
  }, [lastReadingTimestampMs, nowTick]);

  const lastReadingTimeFormatted = useMemo(() => {
    if (!lastReadingTimestampMs) return 'Sin lecturas recientes';
    const d = new Date(lastReadingTimestampMs);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    return `${day}/${month}/${year}, ${timeStr}`;
  }, [lastReadingTimestampMs]);

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

  const activeSelectedUnit = useMemo(() => {
    if (!nodoActivo?.lecturas || checkedVarKeys.length === 0) return null;
    const selectedLectura = nodoActivo.lecturas.find(l => checkedVarKeys.includes(l.data_type));
    return selectedLectura ? selectedLectura.unidad : null;
  }, [nodoActivo, checkedVarKeys]);

  const handleToggleByUnitMode = () => {
    setIsByUnitMode(prev => {
      const nextMode = !prev;
      if (!nextMode) {
        if (checkedVarKeys.length > 1) {
          if (nodoActivo?.lecturas && nodoActivo.lecturas.length > 0) {
            setCheckedVarKeys([nodoActivo.lecturas[0].data_type]);
          }
        }
      }
      return nextMode;
    });
  };

  const handleToggleVarKey = (varKey) => {
    if (!nodoActivo?.lecturas) return;
    const targetVar = nodoActivo.lecturas.find(l => l.data_type === varKey);
    if (!targetVar) return;

    if (!isByUnitMode) {
      setCheckedVarKeys([varKey]);
    } else {
      setCheckedVarKeys(prev => {
        if (prev.includes(varKey)) {
          const next = prev.filter(k => k !== varKey);
          if (next.length === 0) return [varKey];
          return next;
        } else {
          const firstSelected = nodoActivo.lecturas.find(l => prev.includes(l.data_type));
          if (!firstSelected || firstSelected.unidad === targetVar.unidad) {
            return [...prev, varKey];
          }
          return prev;
        }
      });
    }
  };

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

      const requests = nodoActivo.lecturas.map(lectura =>
        fetchDeduplicated(`${API_BASE_URL}/lecturas?${params.toString()}&clave_mqtt=${lectura.data_type}`)
          .then(res => res.json())
          .then(data => ({ lectura, data }))
          .catch(() => ({ lectura, data: [] }))
      );

      const results = await Promise.all(requests);

      results.forEach(({ lectura, data }) => {
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (!mergedMap.has(item.fecha)) {
              mergedMap.set(item.fecha, { fecha: item.fecha, label: item.label });
            }
            mergedMap.get(item.fecha)[lectura.data_type] = item.valor;
            mergedMap.get(item.fecha)[`${lectura.data_type}_min`] = item.min;
            mergedMap.get(item.fecha)[`${lectura.data_type}_min_at`] = item.min_at;
            mergedMap.get(item.fecha)[`${lectura.data_type}_max`] = item.max;
            mergedMap.get(item.fecha)[`${lectura.data_type}_max_at`] = item.max_at;
            mergedMap.get(item.fecha)[`${lectura.data_type}_at`] = item.at || item.created_at || item.min_at || item.max_at;
          });
        }
      });

      const mergedArray = Array.from(mergedMap.values()).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
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

  const DISTINCT_COLORS = [
    { hex: '#10b981', theme: 'theme-green', bg: '#ecfdf5', stroke: '#059669' },  // Emerald (pH)
    { hex: '#0284c7', theme: 'theme-blue', bg: '#f0f9ff', stroke: '#0369a1' },   // Cyan (Oxígeno)
    { hex: '#d97706', theme: 'theme-orange', bg: '#fffbeb', stroke: '#b45309' }, // Amber (Turbidez)
    { hex: '#ea580c', theme: 'theme-red', bg: '#fff7ed', stroke: '#c2410c' },    // Coral (Temperatura)
    { hex: '#8b5cf6', theme: 'theme-purple', bg: '#f5f3ff', stroke: '#7c3aed' }, // Purple (Salinidad)
    { hex: '#4f46e5', theme: 'theme-indigo', bg: '#eef2ff', stroke: '#4338ca' }, // Indigo (Presión)
    { hex: '#ec4899', theme: 'theme-pink', bg: '#fdf2f8', stroke: '#db2777' },   // Pink
    { hex: '#06b6d4', theme: 'theme-cyan', bg: '#ecfeff', stroke: '#0891b2' },   // Cyan
  ];

  const getTheme = (clave, icono, idx = 0) => {
    const lower = (clave || '').toLowerCase();

    let baseTheme = null;
    if (lower.includes('ph')) {
      baseTheme = { hex: '#10b981', label: 'pH', theme: 'theme-green', bg: '#ecfdf5', stroke: '#059669', icon: DYNAMIC_ICONS.ph };
    } else if (lower.includes('oxygen') || lower.includes('oxigeno') || lower.includes('o2') || lower.includes('dissolved')) {
      baseTheme = { hex: '#0284c7', label: 'Oxígeno Disuelto', theme: 'theme-blue', bg: '#f0f9ff', stroke: '#0369a1', icon: DYNAMIC_ICONS.lluvia };
    } else if (lower.includes('turbid') || lower.includes('turbidez') || lower.includes('mv') || lower.includes('voltage')) {
      baseTheme = { hex: '#d97706', label: 'Turbidez', theme: 'theme-orange', bg: '#fffbeb', stroke: '#b45309', icon: DYNAMIC_ICONS.energia };
    } else if (lower.includes('temp')) {
      baseTheme = { hex: '#ea580c', label: 'Temperatura', theme: 'theme-red', bg: '#fff7ed', stroke: '#c2410c', icon: DYNAMIC_ICONS.termometro };
    } else if (lower.includes('hum')) {
      baseTheme = { hex: '#2563eb', label: 'Humedad', theme: 'theme-blue', bg: '#eff6ff', stroke: '#1d4ed8', icon: DYNAMIC_ICONS.humedad };
    } else if (lower.includes('salin') || lower.includes('conductiv')) {
      baseTheme = { hex: '#8b5cf6', label: 'Conductividad', theme: 'theme-purple', bg: '#f5f3ff', stroke: '#7c3aed', icon: DYNAMIC_ICONS.general };
    } else {
      const fallbackColor = DISTINCT_COLORS[idx % DISTINCT_COLORS.length];
      baseTheme = { ...fallbackColor, label: 'Variable', icon: DYNAMIC_ICONS.general };
    }

    if (icono && DYNAMIC_ICONS[icono]) {
      return { ...baseTheme, icon: DYNAMIC_ICONS[icono] };
    }
    return baseTheme;
  };

  const kpis = useMemo(() => {
    if (!historicalData.length || !nodoActivo?.lecturas) return null;

    let stats = { count: historicalData.length, variables: {} };
    nodoActivo.lecturas.forEach((l, index) => {
      if (!checkedVarKeys.includes(l.data_type)) return;

      let avgValues = historicalData.map(d => d[l.data_type]).filter(v => v !== undefined && v !== null);
      let maxValues = historicalData.map(d => d[`${l.data_type}_max`]).filter(v => v !== undefined && v !== null);
      let minValues = historicalData.map(d => d[`${l.data_type}_min`]).filter(v => v !== undefined && v !== null);

      if (maxValues.length === 0) maxValues = avgValues;
      if (minValues.length === 0) minValues = avgValues;

      if (avgValues.length > 0) {
        const sum = avgValues.reduce((a, b) => a + b, 0);
        const avg = sum / avgValues.length;

        const max = Math.max(...maxValues);
        const min = Math.min(...minValues);

        const maxItem = historicalData.find(d => d[`${l.data_type}_max`] === max) || historicalData.find(d => d[l.data_type] === max);
        const minItem = historicalData.find(d => d[`${l.data_type}_min`] === min) || historicalData.find(d => d[l.data_type] === min);

        stats.variables[l.data_type] = {
          promedio: avg.toFixed(1),
          max: max.toFixed(1),
          min: min.toFixed(1),
          maxRange: maxItem ? maxItem.label : '',
          maxExact: maxItem ? (maxItem[`${l.data_type}_max_at`] || maxItem[`${l.data_type}_min_at`]) : '',
          minRange: minItem ? minItem.label : '',
          minExact: minItem ? (minItem[`${l.data_type}_min_at`] || minItem[`${l.data_type}_max_at`]) : '',
          info: {
            tipo: l.label || l.tipo || 'Variable',
            unidad: l.unit || l.unidad || '',
            symbol_image: l.symbol_image,
            icono: l.icono
          },
          theme: getTheme(l.data_type, l.icono, index)
        };
      }
    });
    return stats;
  }, [historicalData, nodoActivo, checkedVarKeys]);

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

  const exportChartRef = useRef(null);

  const handleExportImage = async () => {
    const targetEl = exportChartRef.current || chartRef.current;
    if (!targetEl) return;
    try {
      const prevOverflow = targetEl.style.overflow;
      const prevOverflowX = targetEl.style.overflowX;
      const prevWidth = targetEl.style.width;
      const prevHeight = targetEl.style.height;

      // Expand element to full scrollable size for capture
      targetEl.style.overflow = 'visible';
      targetEl.style.overflowX = 'visible';
      targetEl.style.width = targetEl.scrollWidth + 'px';
      // Ensure right side has extra padding to avoid clipping
      targetEl.style.paddingRight = '24px';


      const canvas = await html2canvas(targetEl, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        width: targetEl.scrollWidth,
        height: targetEl.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedTarget = clonedDoc.querySelector('.chart-container-wrapper');
          if (clonedTarget) {
            clonedTarget.style.overflow = 'visible';
            clonedTarget.style.overflowX = 'visible';
            clonedTarget.style.paddingRight = '24px';
          }
          const svgs = clonedDoc.querySelectorAll('svg');
          svgs.forEach(svg => {
            svg.style.overflow = 'visible';
          });
        }
      });

      // Restore original styles
      targetEl.style.overflow = prevOverflow;
      targetEl.style.overflowX = prevOverflowX;
      targetEl.style.width = prevWidth;
      targetEl.style.height = prevHeight;

      const image = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = image;
      const safeLabel = currentAgrupacionLabel.replace(/\s+/g, '');
      const fileName = `historico_${nodoActivo?.serial_number || 'nodo'}_${filterMode}_${startDate}_${safeLabel}.png`;
      a.download = fileName;
      a.click();
    } catch (error) {
      console.error("Error exporting image", error);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#ffffff', padding: isMobile ? '10px 12px' : '14px 16px', border: '1px solid #cbd5e1', borderRadius: '10px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box', wordBreak: 'break-word' }}>
          <div className="custom-tooltip-label" style={{ fontWeight: '700', fontSize: isMobile ? '0.8rem' : '0.875rem', marginBottom: '8px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            📅 {label}
          </div>
          {payload.map((entry, index) => {
            const minVal = entry.payload[`${entry.dataKey}_min`];
            const maxVal = entry.payload[`${entry.dataKey}_max`];
            const minAt = entry.payload[`${entry.dataKey}_min_at`];
            const maxAt = entry.payload[`${entry.dataKey}_max_at`];
            const { isLow, isHigh, minExp, maxExp } = getThresholdStatus(entry.dataKey, entry.payload);
            const isOutOfRange = isLow || isHigh;

            return (
              <div key={index} className="custom-tooltip-item" style={{ marginBottom: index < payload.length - 1 ? '10px' : '0', paddingBottom: index < payload.length - 1 ? '8px' : '0', borderBottom: index < payload.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="tooltip-dot" style={{ backgroundColor: entry.color, width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }}></span>
                  <span style={{ color: entry.color, fontWeight: 700, fontSize: '0.85rem' }}>{entry.name}:</span>
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: isLow ? '#2563eb' : isHigh ? '#dc2626' : '#0f172a' }}>
                    {entry.value}
                  </span>
                  {isLow && (
                    <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.72rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      {isEn ? `⚠️ Low Level (< ${minExp}) • Low Stability` : `⚠️ Nivel Bajo (< ${minExp}) • Estabilidad Baja`}
                    </span>
                  )}
                  {isHigh && (
                    <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.72rem', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      {isEn ? `⚠️ High Level (> ${maxExp}) • Low Stability` : `⚠️ Nivel Alto (> ${maxExp}) • Estabilidad Baja`}
                    </span>
                  )}
                  {!isOutOfRange && (minExp !== null || maxExp !== null) && (
                    <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.72rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      {isEn ? '✓ Normal • High Stability' : '✓ Normal • Estabilidad Alta'}
                    </span>
                  )}
                </div>
                {(minVal !== undefined && maxVal !== undefined) && (
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginLeft: '18px', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <span>↓ {isEn ? 'Min' : 'Min'}: <strong style={{ color: '#334155' }}>{minVal}</strong> {minAt ? <small style={{ color: '#94a3b8' }}>({minAt} h)</small> : ''}</span>
                    <span>↑ {isEn ? 'Max' : 'Max'}: <strong style={{ color: '#334155' }}>{maxVal}</strong> {maxAt ? <small style={{ color: '#94a3b8' }}>({maxAt} h)</small> : ''}</span>
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

  const getThresholdStatus = (dataKey, payload) => {
    if (!payload || !dataKey) return { isLow: false, isHigh: false, minExp: null, maxExp: null };

    const keyStr = String(dataKey).toLowerCase().trim();

    const lecturaInfo = nodoActivo?.lecturas?.find(l => {
      const dt = String(l.data_type || '').toLowerCase().trim();
      const cm = String(l.clave_mqtt || '').toLowerCase().trim();
      const tp = String(l.tipo || '').toLowerCase().trim();
      const nm = String(l.nombre || '').toLowerCase().trim();
      return dt === keyStr || cm === keyStr || tp === keyStr || nm === keyStr;
    });

    if (!lecturaInfo) return { isLow: false, isHigh: false, minExp: null, maxExp: null };

    const val = payload[dataKey];

    const findVal = (keys) => {
      // 1. Buscar en objeto raíz
      for (const k of keys) {
        if (lecturaInfo[k] !== undefined && lecturaInfo[k] !== null && lecturaInfo[k] !== '') {
          const parsed = parseFloat(lecturaInfo[k]);
          if (!isNaN(parsed)) return parsed;
        }
      }
      // 2. Buscar en subobjetos anidados (subvariable, metrica, template, config)
      for (const subKey of ['metrica', 'subvariable', 'template', 'subvariable_template', 'config']) {
        if (lecturaInfo[subKey] && typeof lecturaInfo[subKey] === 'object') {
          for (const k of keys) {
            if (lecturaInfo[subKey][k] !== undefined && lecturaInfo[subKey][k] !== null && lecturaInfo[subKey][k] !== '') {
              const parsed = parseFloat(lecturaInfo[subKey][k]);
              if (!isNaN(parsed)) return parsed;
            }
          }
        }
      }
      return null;
    };

    const minExp = findVal(['minExpected', 'min_expected', 'min_esperado', 'min_alerta', 'valor_minimo', 'min_val']);
    const maxExp = findVal(['maxExpected', 'max_expected', 'max_esperado', 'max_alerta', 'valor_maximo', 'max_val']);

    if (minExp === null && maxExp === null) {
      return { isLow: false, isHigh: false, minExp, maxExp };
    }

    let isLow = false;
    let isHigh = false;

    if (val !== undefined && val !== null && !isNaN(parseFloat(val))) {
      const v = parseFloat(val);
      if (minExp !== null && v < minExp) isLow = true;
      else if (maxExp !== null && v > maxExp) isHigh = true;
    }

    return { isLow, isHigh, minExp, maxExp };
  };

  const isValueOutOfRange = (dataKey, payload) => {
    const { isLow, isHigh } = getThresholdStatus(dataKey, payload);
    return isLow || isHigh;
  };

  const CustomDot = (props) => {
    const { cx, cy, stroke, payload, dataKey } = props;
    if (cx === undefined || cy === undefined || !payload) return null;

    const { isLow, isHigh } = getThresholdStatus(dataKey, payload);
    const outOfRange = isLow || isHigh;
    const fillColor = isLow ? '#2563eb' : isHigh ? '#dc2626' : '#ffffff';
    const radius = outOfRange ? 5.5 : 4;
    const strokeW = outOfRange ? 2.5 : 2;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fillColor}
        stroke={isLow ? '#2563eb' : isHigh ? '#dc2626' : stroke}
        strokeWidth={strokeW}
        style={{ transition: 'all 0.15s ease' }}
      />
    );
  };

  const CustomActiveDot = (props) => {
    const { cx, cy, stroke, payload, dataKey } = props;
    if (cx === undefined || cy === undefined || !payload) return null;

    const { isLow, isHigh } = getThresholdStatus(dataKey, payload);
    const outOfRange = isLow || isHigh;
    const fillColor = isLow ? '#2563eb' : isHigh ? '#dc2626' : stroke;
    const radius = outOfRange ? 7.5 : 6;
    const strokeW = outOfRange ? 3 : 0;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fillColor}
        stroke={outOfRange ? (isLow ? '#2563eb' : '#dc2626') : '#ffffff'}
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
            <p style={{ margin: 0 }}>
              {isEn
                ? 'Query and analyze historical telemetry data stored in the Data Warehouse using different levels of temporal aggregation.'
                : 'Consulta y analiza los datos históricos almacenados en el Data Warehouse mediante diferentes niveles de agregación temporal.'}
            </p>
          </div>
        </div>
        <div className="historico-header-right">
          <span>{isEn ? 'Last update:' : 'Última actualización:'} {lastReadingTimeFormatted}</span>
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
      <div className="historico-node-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 20px' }}>

        {/* FILA SUPERIOR: Selector + Ruta (Izquierda) | Estado + Última Lectura (Derecha - Misma Línea) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', width: '100%' }}>

          {/* Izquierda: Icono, Selector y Ruta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 320px' }}>
            <div className="node-icon-circle theme-blue" style={{ width: '42px', height: '42px', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" width="22" height="22">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
            </div>

            <div className="node-info-text" style={{ position: 'relative' }}>
              <span className="node-label">{isEn ? 'Selected node' : 'Nodo seleccionado'}</span>
              <div className="node-select-wrapper" onClick={toggleDropdown}>
                <div
                  key={nodoActivo ? `active-node-${nodoActivo.id}` : 'loading-node'}
                  className="node-select-custom"
                >
                  {nodoActivo ? nodoActivo.nombre || nodoActivo.serial_number : (isEn ? 'Loading node...' : 'Cargando nodo...')}
                </div>
                <svg className="node-select-icon" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>

              {/* Ruta Informativa: / Categoría / Ubicación / Nombre del Nodo */}
              {nodoActivo && (
                <div className="node-breadcrumb-path">
                  <span style={{ color: '#cbd5e1', fontWeight: 800 }}>/</span>
                  <span style={{ color: '#2563eb', fontWeight: 700 }}>{getNodeCategory(nodoActivo)}</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 800 }}>/</span>
                  <span style={{ color: '#475569' }}>{nodoActivo.ubicacion_nombre || 'Campus ULEAM'}</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 800 }}>/</span>
                  <strong style={{ color: '#0f2c59' }}>{nodoActivo.nombre}</strong>
                </div>
              )}

              {isDropdownOpen && (
                <>
                  {isMobile && (
                    <div 
                      className="node-dropdown-backdrop" 
                      onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); }}
                    />
                  )}
                  <div className="node-dropdown-wrapper">
                  <div className="custom-dropdown-menu" style={{ position: 'relative', top: 0, minWidth: isMobile ? '100%' : '320px' }}>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setNodoActivo(n);
                                setIsDropdownOpen(false);
                                setExpandedCategories({});
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setNodoActivo(n);
                                setIsDropdownOpen(false);
                                setExpandedCategories({});
                              }}
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
                    <div className="custom-dropdown-menu" style={{ position: 'relative', top: 0, marginLeft: '4px', minWidth: '240px' }}>
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
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (nodoActivo?.id !== n.id) {
                                setNodoActivo(n);
                              }
                              setIsDropdownOpen(false);
                              setExpandedCategories({});
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (nodoActivo?.id !== n.id) {
                                setNodoActivo(n);
                              }
                              setIsDropdownOpen(false);
                              setExpandedCategories({});
                            }}
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
                </>
              )}
            </div>
          </div>

          {/* Derecha (En la MISMA línea superior): Estado del Nodo + Última Lectura */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="node-label" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>{isEn ? 'Node status' : 'Estado del nodo'}</span>
              <div className={`status-badge ${isNodeActive ? '' : 'inactive'}`}>
                <span className="dot"></span>
                {isNodeActive ? (isEn ? 'Active' : 'Activo') : (isEn ? 'Inactive' : 'Inactivo')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
              <span className="node-label" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>{isEn ? 'Last reading' : 'Última lectura'}</span>
              <span className="last-read-time" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                {lastReadingTimeFormatted}
              </span>
            </div>
          </div>

        </div>

        {/* FILA INFERIOR: Variables Disponibles (Abajo de la línea superior) */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '2px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
            <span className="node-label" style={{ fontSize: '0.72rem', display: 'block' }}>
              {isEn ? `Available variables:` : `Variables disponibles:`}
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0f2c59', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px', marginLeft: '6px' }}>
                <strong className="notranslate" translate="no">{checkedVarKeys.length}</strong> {isEn ? 'of' : 'de'} <strong className="notranslate" translate="no">{nodoActivo?.lecturas?.length || 0}</strong> {isEn ? 'selected' : 'marcadas'}
              </span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {nodoActivo && (nodoActivo.lecturas?.length > 0) && (
                <button
                  type="button"
                  onClick={handleToggleByUnitMode}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: isByUnitMode ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    background: isByUnitMode ? '#2563eb' : '#ffffff',
                    color: isByUnitMode ? '#ffffff' : '#475569',
                    fontSize: '0.72rem',
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
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    border: isByUnitMode ? '1.5px solid #ffffff' : '1.5px solid #64748b',
                    background: isByUnitMode ? '#2563eb' : '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '9px',
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
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '8px' }}>
                  {isEn ? `Active Unit: ${activeSelectedUnit}` : `Unidad activa: ${activeSelectedUnit}`}
                </span>
              )}
            </div>
          </div>
          <div className="custom-horizontal-scrollbar" style={{
            display: 'flex',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            gap: '8px',
            alignItems: 'center',
            paddingBottom: '6px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'auto',
            scrollbarColor: '#cbd5e1 #f1f5f9'
          }}>
            {nodoActivo?.lecturas && nodoActivo.lecturas.length > 0 ? (
              nodoActivo.lecturas.map((l, idx) => {
                const isChecked = checkedVarKeys.includes(l.data_type);
                const isSameUnit = !activeSelectedUnit || l.unidad === activeSelectedUnit;
                const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
                const mainColor = palette[idx % palette.length];

                const isBlocked = isByUnitMode && !isChecked && !isSameUnit;
                const tooltipText = isBlocked
                  ? (isEn ? `Different measurement units (${l.unidad} vs ${activeSelectedUnit})` : `Unidades de medidas diferentes (${l.unidad} vs ${activeSelectedUnit})`)
                  : isByUnitMode
                    ? (isChecked
                      ? (isEn ? 'Click to deselect variable' : 'Click para desmarcar variable')
                      : (isEn ? 'Click to select and compare variable' : 'Click para seleccionar y comparar variable'))
                    : (isEn ? `Show ${l.tipo} (${l.unidad})` : `Mostrar ${l.tipo} (${l.unidad})`);

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
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      border: `1.5px solid ${isBlocked ? '#cbd5e1' : isChecked ? mainColor : '#cbd5e1'}`,
                      background: isBlocked ? '#f8fafc' : isChecked ? `${mainColor}14` : '#ffffff',
                      color: isBlocked ? '#94a3b8' : isChecked ? '#0f2c59' : '#475569',
                      fontSize: '0.78rem',
                      fontWeight: isChecked ? 800 : 600,
                      cursor: isBlocked ? 'not-allowed' : 'pointer',
                      opacity: isBlocked ? 0.6 : 1,
                      boxShadow: isChecked ? `0 2px 6px ${mainColor}25` : 'none',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isByUnitMode && (
                      <span style={{ width: '14px', height: '14px', borderRadius: '4px', border: `1.5px solid ${isBlocked ? '#cbd5e1' : isChecked ? mainColor : '#94a3b8'}`, background: isBlocked ? '#f1f5f9' : isChecked ? mainColor : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '9px', fontWeight: 900 }}>
                        {isChecked ? '✓' : isBlocked ? '✕' : ''}
                      </span>
                    )}
                    <span>{l.tipo} <small style={{ opacity: 0.75, fontWeight: 700 }}>({l.unidad})</small></span>
                  </button>
                );
              })
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                {isEn ? 'This node has no registered telemetry variables.' : 'Este nodo no tiene variables de telemetría registradas.'}
              </span>
            )}
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
              {isEn ? 'Specific Day' : 'Día específico'}
            </button>
            <button className={`filter-tab ${filterMode === 'range' ? 'active' : ''}`} onClick={() => setFilterMode('range')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {isEn ? 'Date Range' : 'Rango de fechas'}
            </button>
            <button className={`filter-tab ${filterMode === 'hour' ? 'active' : ''}`} onClick={() => setFilterMode('hour')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {isEn ? 'Specific Hour' : 'Hora específica'}
            </button>
          </div>
          <div style={{ marginTop: '8px', marginBottom: '16px', fontSize: '0.75rem', color: '#94a3b8' }}>
            {isEn ? <>Shortcut: <strong>Ctrl + ← / →</strong> to switch modes</> : <>Atajo: <strong>Ctrl + ← / →</strong> para cambiar entre modos</>}
          </div>
        </div>

        <div className="filter-controls-card">
          <div className="controls-group-wrapper">
            {(filterMode === 'day' || filterMode === 'hour') && (
              <CustomDatePicker
                label={isEn ? 'Date' : 'Fecha'}
                value={startDate}
                onChange={handleStartDateChange}
                maxDate={today}
                shortcutHint={isEn ? '<strong>← / →</strong> to change day' : '<strong>← / →</strong> para cambiar día'}
              />
            )}

            {filterMode === 'range' && (
              <>
                <CustomDatePicker
                  label={isEn ? 'Start Date' : 'Fecha Inicio'}
                  value={startDate}
                  onChange={handleStartDateChange}
                  maxDate={getPrevDayStr(today)}
                  shortcutHint={isEn ? '<strong>← / →</strong> to change day' : '<strong>← / →</strong> para cambiar día'}
                />
                <CustomDatePicker
                  label={isEn ? 'End Date' : 'Fecha Fin'}
                  value={endDate}
                  onChange={handleEndDateChange}
                  minDate={getNextDayStr(startDate)}
                  maxDate={today}
                  shortcutHint={isEn ? '<strong>Ctrl + Alt + ← / →</strong> to change day' : '<strong>Ctrl + Alt + ← / →</strong> para cambiar día'}
                />
              </>
            )}

            {filterMode === 'hour' && (
              <div className="control-item hour-dropdown-container" style={{ position: 'relative' }}>
                <div
                  className={`control-input ${isHourDropdownOpen ? 'active' : ''}`}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
                  onClick={() => setIsHourDropdownOpen(!isHourDropdownOpen)}
                >
                  <span key={`hour-val-${selectedHour}`} className="notranslate" translate="no" style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', marginRight: '6px', fontWeight: '600' }}>{isEn ? 'Hour:' : 'Hora:'}</span>
                    <span>{String(selectedHour).padStart(2, '0')}:00</span>
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
                          onClick={(e) => { e.stopPropagation(); setSelectedHour(i); setIsHourDropdownOpen(false); }}
                        >
                          <span className="notranslate" translate="no">{String(i).padStart(2, '0')}:00</span>
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                      {isEn ? <>Shortcut: <strong>Ctrl + Alt + ↑ / ↓</strong> to navigate</> : <>Atajo: <strong>Ctrl + Alt + ↑ / ↓</strong> para navegar</>}
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
                <span key={`grouping-label-${currentAgrupacionValue}-${filterMode}`} className="notranslate" translate="no" style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', marginRight: '6px', fontWeight: '600' }}>{isEn ? 'Grouping:' : 'Agrupación:'}</span>
                  <span>{currentAgrupacionLabel}</span>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          if (filterMode === 'day') setGroupingIntervalDay(opt.value);
                          if (filterMode === 'range') setGroupingIntervalRange(opt.value);
                          if (filterMode === 'hour') setGroupingIntervalHour(opt.value);
                          setIsAgrupacionDropdownOpen(false);
                        }}
                      >
                        <span className="notranslate" translate="no">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                    {isEn ? <>Shortcut: <strong>Ctrl + ↑ / ↓</strong> to navigate</> : <>Atajo: <strong>Ctrl + ↑ / ↓</strong> para navegar</>}
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
              <p key={`info-box-${filterMode}-${startDate}-${endDate}-${historicalData.length}`}>
                {isEn ? 'Showing averages for period' : 'Mostrando promedios para el período'} <br />
                <strong className="notranslate" translate="no">{startDate} {filterMode === 'range' ? (isEn ? ` to ${endDate}` : ` al ${endDate}`) : ''} ({historicalData.length} {isEn ? 'records' : 'registros'})</strong>
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
                    <div className={`kpi-icon-box ${stat.theme.theme}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
                      <img
                        src={formatImageUrl(stat.info?.symbol_image || stat.info?.icono || '/symbols/default.webp')}
                        alt={stat.info?.tipo || 'Métrica'}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/symbols/default.webp';
                        }}
                        style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                      />
                    </div>
                    <div className="kpi-content">
                      <span className="kpi-label">{isEn ? `Average ${stat.info.tipo}` : `Promedio ${stat.info.tipo}`}</span>
                      <div className="kpi-value">{stat.promedio} <span className="kpi-unit">{stat.info.unidad}</span></div>
                    </div>
                  </div>
                  <div className="kpi-unified-footer">
                    <div className="kpi-sub-stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                      <span className="kpi-sub-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" width="12" height="12"><polyline points="17 8 20 5 23 8" /><line x1="20" y1="5" x2="20" y2="12" /></svg>
                        {isEn ? 'Maximum' : 'Máxima'}
                      </span>
                      <span className="kpi-sub-value" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px' }}>
                        <span style={{ fontWeight: 800 }}>{stat.max} {stat.info.unidad}</span>
                        {stat.maxRange && <small style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>{isEn ? 'Range:' : 'Rango:'} {stat.maxRange}</small>}
                        {stat.maxExact && (
                          <small style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>{isEn ? `at ${stat.maxExact} h` : `a las ${stat.maxExact} h`}</small>
                        )}
                      </span>
                    </div>
                    <div className="kpi-sub-stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                      <span className="kpi-sub-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" width="12" height="12"><polyline points="17 12 20 15 23 12" /><line x1="20" y1="15" x2="20" y2="8" /></svg>
                        {isEn ? 'Minimum' : 'Mínima'}
                      </span>
                      <span className="kpi-sub-value" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px' }}>
                        <span style={{ fontWeight: 800 }}>{stat.min} {stat.info.unidad}</span>
                        {stat.minRange && <small style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>{isEn ? 'Range:' : 'Rango:'} {stat.minRange}</small>}
                        {stat.minExact && (
                          <small style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>{isEn ? `at ${stat.minExact} h` : `a las ${stat.minExact} h`}</small>
                        )}
                      </span>
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
                    <span className="kpi-label">{isEn ? 'Reading Count' : 'Cantidad de lecturas'}</span>
                    <div className="kpi-value">{kpis.count}</div>
                    <span className="kpi-subtext">{isEn ? 'Processed records' : 'Registros procesados'}</span>
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
          <h3 key={`chart-title-${filterMode}-${startDate}-${endDate}-${groupingIntervalHour}-${currentAgrupacionValue}-${selectedHour}`} style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
            {filterMode === 'day' && <span className="notranslate" translate="no">{isEn ? `Hourly Average - ${startDate}` : `Promedio horario - ${startDate}`}</span>}
            {filterMode === 'range' && <span className="notranslate" translate="no">{isEn ? `Daily History - ${startDate} to ${endDate}` : `Histórico diario - ${startDate} al ${endDate}`}</span>}
            {filterMode === 'hour' && <span className="notranslate" translate="no">{isEn ? `Detail ${currentAgrupacionLabel} - ${startDate} ${selectedHour}:00` : `Detalle ${currentAgrupacionLabel} - ${startDate} ${selectedHour}:00`}</span>}
          </h3>
          <div className="chart-actions" style={{ marginLeft: 'auto' }}>
            {/* Selector de Tipo de Vista del Gráfico (Solo Íconos) */}
            <div className="chart-view-selector" style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1', marginRight: '6px' }}>
              <button
                className={`chart-view-btn ${chartViewType === 'area' ? 'active' : ''}`}
                onClick={() => setChartViewType('area')}
                title={isEn ? 'Gradient Area View' : 'Vista Área con degradado'}
                style={{ border: 'none', background: chartViewType === 'area' ? '#ffffff' : 'transparent', color: chartViewType === 'area' ? '#2563eb' : '#64748b', padding: '6px 9px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: chartViewType === 'area' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s ease' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polygon points="3 17 9 11 13 15 21 7 21 21 3 21 3 17"></polygon></svg>
              </button>
              <button
                className={`chart-view-btn ${chartViewType === 'line' ? 'active' : ''}`}
                onClick={() => setChartViewType('line')}
                title={isEn ? 'Continuous Line View' : 'Vista Líneas continuas'}
                style={{ border: 'none', background: chartViewType === 'line' ? '#ffffff' : 'transparent', color: chartViewType === 'line' ? '#2563eb' : '#64748b', padding: '6px 9px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: chartViewType === 'line' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s ease' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </button>
              <button
                className={`chart-view-btn ${chartViewType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartViewType('bar')}
                title={isEn ? 'Column Bar View' : 'Vista Barras de columnas'}
                style={{ border: 'none', background: chartViewType === 'bar' ? '#ffffff' : 'transparent', color: chartViewType === 'bar' ? '#2563eb' : '#64748b', padding: '6px 9px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: chartViewType === 'bar' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s ease' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              </button>
            </div>

            <button
              className="chart-action-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? (isEn ? 'Exit Fullscreen' : 'Salir pantalla completa') : (isEn ? 'Fullscreen' : 'Pantalla completa')}
            >
              {isFullscreen ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                  {!isMobile && (isEn ? 'Exit Fullscreen' : 'Salir pantalla completa')}
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                  {!isMobile && (isEn ? 'Fullscreen' : 'Pantalla completa')}
                </>
              )}
            </button>

            {!isFullscreen && (
              <>
                <button
                  className="chart-action-btn"
                  onClick={handleExportImage}
                  title={isEn ? 'Export Image' : 'Exportar imagen'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  {!isMobile && (isEn ? 'Export Image' : 'Exportar imagen')}
                </button>
                <button
                  className="chart-action-btn"
                  title={isEn ? 'Export CSV' : 'Exportar CSV'}
                  onClick={() => {
                  if (!historicalData.length) return;
                  const nodoNombre = nodoActivo?.nombre || nodoActivo?.serial_number || 'Desconocido';
                  const categoria = getNodeCategory(nodoActivo) || 'Sin categoría';
                  const ubicacion = nodoActivo?.ubicacion || nodoActivo?.ubicacion_nombre || nodoActivo?.area || 'Desconocida';
                  const headerCols = ["Nodo", "Categoría", "Ubicación", "Agrupación", "Fecha", "Hora", "Etiqueta"];
                  const selectedLecturas = nodoActivo.lecturas.filter(l => checkedVarKeys.includes(l.data_type));
                  const dataCols = selectedLecturas.map(l => `"${l.tipo} (${l.unidad || ''})"`);
                  const csv = [headerCols.concat(dataCols).join(",")];

                  historicalData.forEach(d => {
                    let fechaPart = d.fecha || '';
                    let horaPart = '';
                    if (fechaPart.includes('T')) fechaPart = fechaPart.replace('T', ' ');
                    if (fechaPart.includes(' ')) {
                      const parts = fechaPart.split(' ');
                      fechaPart = parts[0];
                      horaPart = parts[1];
                    }
                    const rowMeta = [
                      `"${nodoNombre}"`,
                      `"${categoria}"`,
                      `"${ubicacion}"`,
                      `"${currentAgrupacionLabel}"`,
                      `"${fechaPart}"`,
                      `"${horaPart}"`,
                      `"${d.label}"`
                    ];
                    const rowData = selectedLecturas.map(l => d[l.data_type] !== undefined ? d[l.data_type] : '');
                    csv.push(rowMeta.concat(rowData).join(","));
                  });
                  const blob = new Blob([csv.join("\n")], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `historico_${nodoActivo.serial_number}.csv`;
                  a.click();
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  {!isMobile && (isEn ? 'Export CSV' : 'Exportar CSV')}
                </button>
              </>
            )}
          </div>
        </div>

        {isLoadingHistory ? (
          <div className="chart-container-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '16px' }}>
            <div className="custom-spinner"></div>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{isEn ? 'Analyzing Data Warehouse...' : 'Analizando Data Warehouse...'}</span>
          </div>
        ) : historicalData.length === 0 ? (
          <div className="loader-container" style={{ border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
            {isEn ? 'No records stored for the selected parameters.' : 'No hay registros almacenados para los parámetros seleccionados.'}
          </div>
        ) : (
          <div className="chart-container-wrapper" ref={exportChartRef} style={{ overflowX: 'auto', overflowY: 'hidden', width: '100%', WebkitOverflowScrolling: 'touch', backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px' }}>
            {/* Encabezado visible dentro del área imprimible de la imagen */}
            <div className="export-chart-header" style={{ marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2563eb', background: 'rgba(37, 99, 235, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                  📡 {nodoActivo?.nombre || nodoActivo?.serial_number || 'Nodo Sensor'}
                </span>
                {nodoActivo?.serial_number && nodoActivo?.nombre && (
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                    ({nodoActivo.serial_number})
                  </span>
                )}
                {(nodoActivo?.ubicacion || nodoActivo?.ubicacion_nombre || nodoActivo?.categoria || nodoActivo?.area) && (
                  <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    📍 {nodoActivo?.ubicacion || nodoActivo?.ubicacion_nombre || nodoActivo?.categoria || nodoActivo?.area}
                  </span>
                )}
              </div>
            </div>
            <div style={{ width: historicalData.length > 15 ? `${Math.max(100, historicalData.length * (isMobile ? 85 : 60))}px` : '100%', height: isMobile ? '380px' : '360px' }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartViewType === 'area' && (
                  <AreaChart key={isEn ? 'en' : 'es'} data={historicalData} margin={{ top: 15, right: isMobile ? 20 : 35, left: isMobile ? 5 : 15, bottom: isMobile ? 45 : 30 }}>
                    <defs>
                      {nodoActivo?.lecturas?.map((l, idx) => {
                        if (!checkedVarKeys.includes(l.data_type)) return null;
                        const theme = getTheme(l.data_type, l.icono, idx);
                        return (
                          <linearGradient key={idx} id={`color${l.data_type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.hex} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={theme.hex} stopOpacity={0} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: isMobile ? 10 : 12, fill: '#334155', fontWeight: 600 }} tickMargin={isMobile ? 10 : 8} height={isMobile ? 50 : 40} axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: isMobile ? 10 : 12, fill: '#334155', fontWeight: 600 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} dx={0} width={isMobile ? 45 : 60} />
                    {chartAxisConfig.split && (
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: isMobile ? 10 : 12, fill: '#334155', fontWeight: 600 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} dx={0} width={isMobile ? 45 : 60} />
                    )}
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} allowEscapeViewBox={{ x: false, y: false }} wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }} />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{ paddingTop: '16px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}
                    />
                    {nodoActivo?.lecturas?.map((l, idx) => {
                      if (!checkedVarKeys.includes(l.data_type)) return null;
                      const theme = getTheme(l.data_type, l.icono, idx);
                      return (
                        <Area
                          key={idx}
                          type="monotone"
                          yAxisId={chartAxisConfig.rightKeys.includes(l.data_type) ? 'right' : 'left'}
                          dataKey={l.data_type}
                          name={`${l.tipo || l.nombre || l.data_type} (${l.unidad || ''})`}
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
                )}

                {chartViewType === 'line' && (
                  <LineChart key={isEn ? 'en' : 'es'} data={historicalData} margin={{ top: 15, right: isMobile ? 20 : 35, left: isMobile ? 5 : 15, bottom: isMobile ? 45 : 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: isMobile ? 10 : 12, fill: '#334155', fontWeight: 600 }} tickMargin={isMobile ? 10 : 8} height={isMobile ? 50 : 40} axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: isMobile ? 10 : 12, fill: '#334155', fontWeight: 600 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} dx={0} width={isMobile ? 45 : 60} />
                    {chartAxisConfig.split && (
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: isMobile ? 10 : 12, fill: '#334155', fontWeight: 600 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} dx={0} width={isMobile ? 45 : 60} />
                    )}
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} allowEscapeViewBox={{ x: false, y: false }} wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }} />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{ paddingTop: '16px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}
                    />
                    {nodoActivo?.lecturas?.map((l, idx) => {
                      if (!checkedVarKeys.includes(l.data_type)) return null;
                      const theme = getTheme(l.data_type, l.icono, idx);
                      return (
                        <Line
                          key={idx}
                          type="monotone"
                          yAxisId={chartAxisConfig.rightKeys.includes(l.data_type) ? 'right' : 'left'}
                          dataKey={l.data_type}
                          name={`${l.tipo || l.nombre || l.data_type} (${l.unidad || ''})`}
                          stroke={theme.hex}
                          strokeWidth={3}
                          dot={<CustomDot dataKey={l.data_type} />}
                          activeDot={<CustomActiveDot dataKey={l.data_type} />}
                        />
                      );
                    })}
                  </LineChart>
                )}

                {chartViewType === 'bar' && (
                  <BarChart key={isEn ? 'en' : 'es'} data={historicalData} margin={{ top: 15, right: isMobile ? 20 : 35, left: isMobile ? 5 : 15, bottom: isMobile ? 45 : 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: isMobile ? 10 : 12, fill: '#334155', fontWeight: 600 }} tickMargin={isMobile ? 10 : 8} height={isMobile ? 50 : 40} axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: isMobile ? 10 : 12, fill: '#334155', fontWeight: 600 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} dx={0} width={isMobile ? 45 : 60} />
                    {chartAxisConfig.split && (
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: isMobile ? 10 : 12, fill: '#334155', fontWeight: 600 }} axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }} tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }} dx={0} width={isMobile ? 45 : 60} />
                    )}
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} allowEscapeViewBox={{ x: false, y: false }} wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }} />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{ paddingTop: '16px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}
                    />
                    {nodoActivo?.lecturas?.map((l, idx) => {
                      if (!checkedVarKeys.includes(l.data_type)) return null;
                      const theme = getTheme(l.data_type, l.icono, idx);
                      return (
                        <Bar
                          key={idx}
                          yAxisId={chartAxisConfig.rightKeys.includes(l.data_type) ? 'right' : 'left'}
                          dataKey={l.data_type}
                          name={`${l.tipo || l.nombre || l.data_type} (${l.unidad || ''})`}
                          fill={theme.hex}
                          radius={[4, 4, 0, 0]}
                        />
                      );
                    })}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
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
                {nodoActivo?.lecturas?.map(l => {
                  if (!checkedVarKeys.includes(l.data_type)) return null;
                  return (
                  <th key={l.data_type} colSpan="3" style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
                    {l.tipo || l.nombre || l.label || l.data_type} ({l.unidad || l.unit || ''})
                  </th>
                  );
                })}
              </tr>
              <tr>
                {nodoActivo?.lecturas?.map(l => {
                  if (!checkedVarKeys.includes(l.data_type)) return null;
                  return (
                  <React.Fragment key={l.data_type + '-cols'}>
                    <th style={{ textAlign: 'center', backgroundColor: '#f8fafc', borderLeft: '1px solid #e2e8f0' }}>Mínimo</th>
                    <th style={{ textAlign: 'center', backgroundColor: '#f8fafc' }}>Promedio</th>
                    <th style={{ textAlign: 'center', backgroundColor: '#f8fafc' }}>Máximo</th>
                  </React.Fragment>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {historicalData.length > 0 ? (
                historicalData.map((row, i) => (
                  <tr key={i}>
                    <td className="sticky-col" style={{ verticalAlign: 'middle' }}>
                      {filterMode === 'range' ? (
                        (() => {
                          const fullTxt = formatFullDateTime(row, currentAgrupacionValue);
                          return (
                            <div className="date-time-marquee-container" title={fullTxt}>
                              <div className="date-time-marquee-content">
                                <span>{fullTxt}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{fullTxt}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <strong>{row.label}</strong>
                      )}
                    </td>
                    {nodoActivo?.lecturas?.map(l => {
                      if (!checkedVarKeys.includes(l.data_type)) return null;
                      const { isLow, isHigh, minExp, maxExp } = getThresholdStatus(l.data_type, row);
                      const isOutOfRange = isLow || isHigh;
                      const valColor = isLow ? '#2563eb' : isHigh ? '#dc2626' : '#3b82f6';
                      const subColor = isLow ? '#2563eb' : isHigh ? '#dc2626' : '#64748b';
                      const bgColor = isLow ? 'rgba(37, 99, 235, 0.08)' : isHigh ? 'rgba(220, 38, 38, 0.08)' : 'transparent';
                      const alertTitle = isLow
                        ? `Nivel Bajo: El valor (${row[l.data_type] !== undefined ? row[l.data_type].toFixed(2) : ''}) está por debajo del mínimo esperado (${minExp})`
                        : isHigh
                          ? `Nivel Alto: El valor (${row[l.data_type] !== undefined ? row[l.data_type].toFixed(2) : ''}) sobrepasó el máximo esperado (${maxExp})`
                          : '';

                      const minValDisp = row[`${l.data_type}_min`] !== undefined ? row[`${l.data_type}_min`].toFixed(2) : (row[l.data_type] !== undefined ? row[l.data_type].toFixed(2) : '-');
                      const maxValDisp = row[`${l.data_type}_max`] !== undefined ? row[`${l.data_type}_max`].toFixed(2) : (row[l.data_type] !== undefined ? row[l.data_type].toFixed(2) : '-');
                      
                      const minTime = formatAtTime(row[`${l.data_type}_min_at`]);
                      const maxTime = formatAtTime(row[`${l.data_type}_max_at`]);

                      return (
                        <React.Fragment key={l.data_type + '-' + i}>
                          <td
                            style={{ textAlign: 'center', borderLeft: '1px solid #cbd5e1', color: '#475569', fontWeight: 400, padding: '8px 10px' }}
                            title={minTime ? `Valor Mínimo: ${minValDisp} (Registrado a las ${minTime} h)` : `Valor Mínimo: ${minValDisp}`}
                          >
                            <div>{minValDisp}</div>
                            {minTime && <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px', fontWeight: 500 }}>a las {minTime} h</div>}
                          </td>
                          <td
                            style={{ textAlign: 'center', fontWeight: isOutOfRange ? 800 : 600, color: valColor, backgroundColor: bgColor, padding: '8px 10px' }}
                            title={`Valor Promedio: ${row[l.data_type] !== undefined ? row[l.data_type].toFixed(2) : '-'}`}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                {row[l.data_type] !== undefined ? row[l.data_type].toFixed(2) : '-'}
                                {isLow && (
                                  <svg title={alertTitle} viewBox="0 0 24 24" fill="#2563eb" stroke="#2563eb" strokeWidth="2" width="13" height="13" style={{ cursor: 'help', flexShrink: 0 }}>
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="#2563eb" />
                                    <line x1="12" y1="9" x2="12" y2="13" stroke="#ffffff" strokeWidth="2.5" />
                                    <circle cx="12" cy="17" r="1.2" fill="#ffffff" stroke="none" />
                                  </svg>
                                )}
                                {isHigh && (
                                  <svg title={alertTitle} viewBox="0 0 24 24" fill="#dc2626" stroke="#dc2626" strokeWidth="2" width="13" height="13" style={{ cursor: 'help', flexShrink: 0 }}>
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="#dc2626" />
                                    <line x1="12" y1="9" x2="12" y2="13" stroke="#ffffff" strokeWidth="2.5" />
                                    <circle cx="12" cy="17" r="1.2" fill="#ffffff" stroke="none" />
                                  </svg>
                                )}
                              </span>
                          </td>
                          <td
                            style={{ textAlign: 'center', color: '#475569', fontWeight: 400, padding: '8px 10px' }}
                            title={maxTime ? `Valor Máximo: ${maxValDisp} (Registrado a las ${maxTime} h)` : `Valor Máximo: ${maxValDisp}`}
                          >
                            <div>{maxValDisp}</div>
                            {maxTime && <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px', fontWeight: 500 }}>a las {maxTime} h</div>}
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
            const isChecked = checkedVarKeys.includes(l.data_type);
            const isSameUnit = !activeSelectedUnit || l.unidad === activeSelectedUnit;
            const isBlocked = isByUnitMode && !isChecked && !isSameUnit;
            const palette = ['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1'];
            const mainColor = palette[idx % palette.length];
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
                  <span>{l.tipo} <small style={{ opacity: 0.85 }}>({l.unidad})</small></span>
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
            {checkedVarKeys.length > 0 && nodoActivo?.lecturas
              ? (nodoActivo.lecturas.find(l => l.data_type === checkedVarKeys[0])?.unidad || '📊')
              : '📊'}
          </span>
        </button>
      </div>
    </div>
  );
}