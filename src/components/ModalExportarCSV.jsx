import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import '../styles/components/ModalExportarCSV.css';

// Mapeador de Íconos y Temas
const DYNAMIC_ICONS = {
  termometro: { class: 'theme-orange', hex: '#ea580c', bg: '#fff7ed', icon: <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /> },
  humedad: { class: 'theme-blue', hex: '#2563eb', bg: '#eff6ff', icon: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /> },
  presion: { class: 'theme-green', hex: '#10b981', bg: '#ecfdf5', icon: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="12" x2="15" y2="9" /></> },
  viento: { class: 'theme-cyan', hex: '#06b6d4', bg: '#ecfeff', icon: <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" /> },
  lluvia: { class: 'theme-purple', hex: '#8b5cf6', bg: '#f5f3ff', icon: <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25M8 16v4m4-2v4m4-4v4" /> },
  luz: { class: 'theme-orange', hex: '#f59e0b', bg: '#fffbeb', icon: <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></> },
  energia: { class: 'theme-blue', hex: '#6366f1', bg: '#eef2ff', icon: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /> },
  ph: { class: 'theme-green', hex: '#14b8a6', bg: '#f0fdfa', icon: <path d="M10 2v7.31L4.75 18.25A2 2 0 0 0 6.46 21.2h11.08a2 2 0 0 0 1.71-2.95L14 9.31V2" /> },
  sonido: { class: 'theme-purple', hex: '#a855f7', bg: '#faf5ff', icon: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></> },
  general: { class: 'theme-green', hex: '#10b981', bg: '#ecfdf5', icon: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></> }
};

const getTheme = (clave, icono) => {
  let baseTheme = DYNAMIC_ICONS.general;
  const t = (clave || '').toLowerCase();
  if (t.includes('temp')) baseTheme = DYNAMIC_ICONS.termometro;
  else if (t.includes('hum') || t.includes('soil')) baseTheme = DYNAMIC_ICONS.humedad;
  else if (t.includes('press') || t.includes('presion')) baseTheme = DYNAMIC_ICONS.presion;
  else if (t.includes('wind') || t.includes('viento')) baseTheme = DYNAMIC_ICONS.viento;
  else if (t.includes('rain') || t.includes('lluvia')) baseTheme = DYNAMIC_ICONS.lluvia;

  if (icono && DYNAMIC_ICONS[icono]) {
    return DYNAMIC_ICONS[icono];
  }
  return baseTheme;
};

// Helper de Parseo y Formato de Fecha y Hora Coherente (Coincide 100% con el Dashboard en 24h)
const parseToValidDate = (val) => {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;

  if (typeof val === 'number') {
    const ms = val > 1e11 ? val : val * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof val === 'string') {
    let str = val.trim();
    if (!str) return null;

    // 1. Parseo estándar JS para timestamps ISO con zona horaria Z (ej. 2026-07-31T19:37:07.000000Z -> 14:37:07 local)
    let d = new Date(str);
    if (!isNaN(d.getTime())) return d;

    // 2. Si es formato MySQL "YYYY-MM-DD HH:MM:SS" sin T/Z
    if (str.includes(' ') && !str.includes('T')) {
      d = new Date(str.replace(' ', 'T'));
      if (!isNaN(d.getTime())) return d;
    }

    // 3. Fallback extracción manual de componentes
    const match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (match) {
      d = new Date(
        parseInt(match[1], 10),
        parseInt(match[2], 10) - 1,
        parseInt(match[3], 10),
        match[4] ? parseInt(match[4], 10) : 0,
        match[5] ? parseInt(match[5], 10) : 0,
        match[6] ? parseInt(match[6], 10) : 0
      );
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
};

const formatFechaHoraCoherente = (val) => {
  const d = parseToValidDate(val);
  if (!d) return String(val || '');

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export default function ModalExportarCSV({ show, onClose, nodo, defaultPeriodo = 'hoy', defaultIntervalo = '60', isHistorico = false }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPastDateStr = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [descargaMetrics, setDescargaMetrics] = useState({});
  const [descargaRango, setDescargaRango] = useState(defaultPeriodo === '24h' ? 'hoy' : (defaultPeriodo || 'hoy'));
  const [descargaIntervalo, setDescargaIntervalo] = useState(defaultIntervalo || '60');
  const [fechaInicio, setFechaInicio] = useState(getTodayStr());
  const [fechaFin, setFechaFin] = useState(getTodayStr());
  const [isExporting, setIsExporting] = useState(false);
  const [noDataError, setNoDataError] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setDescargaMetrics({});
    setDescargaRango(defaultPeriodo === '24h' ? 'hoy' : (defaultPeriodo || 'hoy'));
    setDescargaIntervalo(defaultIntervalo || '60');
    const today = getTodayStr();
    setFechaInicio(today);
    setFechaFin(today);
    setNoDataError(false);
    setValidationError('');
  }, [nodo, show, defaultPeriodo, defaultIntervalo]);

  if (!show || !nodo) return null;

  const todayStr = getTodayStr();

  const handleRangoChange = (mode) => {
    setDescargaRango(mode);
    setNoDataError(false);
    setValidationError('');
    const today = getTodayStr();

    if (mode === 'hoy') {
      setFechaInicio(today);
      setFechaFin(today);
    } else if (mode === '7d') {
      setFechaInicio(getPastDateStr(7));
      setFechaFin(today);
    } else if (mode === '30d') {
      setFechaInicio(getPastDateStr(30));
      setFechaFin(today);
    } else if (mode === '90d') {
      setFechaInicio(getPastDateStr(90));
      setFechaFin(today);
    }
  };

  const handleFechaInicioChange = (e) => {
    const val = e.target.value;
    if (val > todayStr) return;
    setFechaInicio(val);
    setFechaFin(val);
    setDescargaRango('custom');
    setNoDataError(false);
    setValidationError('');
  };

  const handleFechaFinChange = (e) => {
    const val = e.target.value;
    if (val > todayStr) return;
    setFechaFin(val);
    setDescargaRango('custom');
    setNoDataError(false);
    setValidationError('');
  };

  const handleCheckboxChange = (key) => {
    setDescargaMetrics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setNoDataError(false);
    setValidationError('');
  };

  const handleDescargarCSV = async () => {
    setNoDataError(false);
    setValidationError('');

    const selectedKeys = Object.keys(descargaMetrics).filter(k => descargaMetrics[k]);
    if (selectedKeys.length === 0) {
      setValidationError(isEn ? "Please select at least one variable to download." : "Por favor, selecciona al menos una variable para descargar.");
      return;
    }

    if (fechaInicio > fechaFin) {
      setValidationError(isEn ? "Start date cannot be after end date." : "La fecha de inicio no puede ser posterior a la fecha de fin.");
      return;
    }

    // Validar rango máximo de 90 días
    const startDateMs = new Date(fechaInicio).getTime();
    const endDateMs = new Date(fechaFin).getTime();
    const diffDays = Math.ceil((endDateMs - startDateMs) / (1000 * 60 * 60 * 24));

    if (diffDays > 90) {
      setValidationError(isEn ? "Export period cannot exceed 90 days." : "El período de exportación no puede superar los 90 días como máximo.");
      return;
    }

    try {
      setIsExporting(true);

      if (isHistorico) {
        const resPublic = await fetch(`${API_BASE_URL}/public/lecturas/historico?node_id=${nodo.id}&periodo=${descargaRango}&intervalo=${descargaIntervalo}`);
        const responseData = await resPublic.json();
        const series = responseData.series || {};
        const stats = responseData.stats || {};

        const getAgrupacionTexto = (invMinutes) => {
          const m = parseInt(invMinutes, 10);
          if (isNaN(m)) return invMinutes;
          if (m === 1) return isEn ? 'Real-time (Raw)' : 'Tiempo real (Sin agrupar)';
          if (m === 15) return isEn ? '15 minutes' : '15 minutos';
          if (m === 30) return isEn ? '30 minutes' : '30 minutos';
          if (m === 60) return isEn ? '1 hour' : '1 hora';
          if (m === 120) return isEn ? '2 hours' : '2 horas';
          if (m === 180) return isEn ? '3 hours' : '3 horas';
          if (m === 240) return isEn ? '4 hours' : '4 horas';
          if (m === 300) return isEn ? '5 hours' : '5 horas';
          if (m === 360) return isEn ? '6 hours' : '6 horas';
          if (m === 720) return isEn ? '12 hours' : '12 horas';
          if (m === 1440) return isEn ? '1 day' : '1 día';
          return `${m} min`;
        };

        const getPeriodoTexto = (code) => {
          if (code === '24h') return isEn ? 'Last 24 hours' : 'Últimas 24 horas';
          if (code === '7d') return isEn ? 'Last 7 days' : 'Últimos 7 días';
          if (code === '30d') return isEn ? 'Last 30 days' : 'Últimos 30 días';
          if (code === 'hoy') return isEn ? 'Today' : 'Hoy';
          return code;
        };

        let csvRows = [];
        csvRows.push([
          isEn ? "Node / Device" : "Nodo / Dispositivo",
          "Serial",
          isEn ? "Category" : "Categoría",
          isEn ? "Location" : "Ubicación",
          "Sensor / MQTT Key",
          isEn ? "Variable" : "Variable",
          isEn ? "Unit" : "Unidad",
          isEn ? "Export Period" : "Período de Exportación",
          isEn ? "Grouping Interval" : "Intervalo de Agrupación",
          isEn ? "Interval Start Time" : "Hora Inicio Intervalo",
          isEn ? "Interval End Time" : "Hora Fin Intervalo",
          isEn ? "Average Value" : "Valor Promedio",
          isEn ? "Minimum" : "Mínimo",
          isEn ? "Maximum" : "Máximo"
        ]);

        const catName = nodo.categoria_nombre || nodo.categoria || '';
        const ubiName = nodo.ubicacion_nombre || nodo.location || nodo.ubicacion || '';
        const periodoTexto = getPeriodoTexto(descargaRango);
        const agrupacionTexto = getAgrupacionTexto(descargaIntervalo);

        selectedKeys.forEach(key => {
          const lTemplate = nodo.lecturas ? nodo.lecturas.find(l => l.data_type === key) : null;
          const varName = isEn ? (lTemplate?.tipo_en || lTemplate?.nombre_en || lTemplate?.tipo || key) : (lTemplate?.tipo_es || lTemplate?.tipo || key);
          const unidad = lTemplate?.unidad || '';
          const points = series[key] || [];

          points.forEach(pt => {
            // EVITAR FILAS SIN DATOS RECIBIDOS EN ESE INTERVALO (Para no abultar el archivo CSV)
            if (pt.has_data === false || pt.valor === null || pt.valor === undefined) {
              return;
            }

            const inicioStr = pt.inicio_intervalo || pt.label || pt.fecha;
            const finStr = pt.fin_intervalo || pt.label || pt.fecha;

            csvRows.push([
              `"${nodo.nombre || ''}"`,
              `"${nodo.serial_number || ''}"`,
              `"${catName}"`,
              `"${ubiName}"`,
              `"${key}"`,
              `"${varName}"`,
              `"${unidad}"`,
              `"${periodoTexto}"`,
              `"${agrupacionTexto}"`,
              `"${inicioStr}"`,
              `"${finStr}"`,
              pt.valor !== undefined ? pt.valor : '--',
              pt.min !== undefined && pt.min !== null ? pt.min : '--',
              pt.max !== undefined && pt.max !== null ? pt.max : '--'
            ]);
          });
        });

        if (csvRows.length <= 1) {
          setNoDataError(true);
          setIsExporting(false);
          return;
        }

        const csvString = "\uFEFF" + csvRows.map(row => row.join(",")).join("\n");
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `historico_agrupado_${nodo?.nombre.toLowerCase().replace(/\s+/g, '_')}_${descargaRango}_${descargaIntervalo}m.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExporting(false);
        onClose();
        return;
      }

      const timestampMap = new Map();

      // Consultar endpoint de lecturas filtrado por fechas y clave_mqtt
      const promises = selectedKeys.map(key =>
        fetch(`${API_BASE_URL}/lecturas?serial_number=${nodo.serial_number}&clave_mqtt=${key}&filter_mode=range&start_date=${fechaInicio}&end_date=${fechaFin}&interval=0`)
          .then(r => r.json())
          .then(data => ({ key, data: Array.isArray(data) ? data : [] }))
          .catch(() => ({ key, data: [] }))
      );

      const results = await Promise.all(promises);

      results.forEach(resItem => {
        const lTemplate = nodo.lecturas ? nodo.lecturas.find(l => l.data_type === resItem.key) : null;
        const varName = lTemplate?.tipo || resItem.key;
        const unidad = lTemplate?.unidad || '';

        resItem.data.forEach(item => {
          const rawTimeVal = item.fecha || item.created_at || item.dateTime || item.label;
          const parsedDate = parseToValidDate(rawTimeVal);
          const pktTimeMs = parsedDate ? parsedDate.getTime() : 0;

          const timeKey = item.fecha || (parsedDate ? parsedDate.toISOString() : rawTimeVal);

          if (!timestampMap.has(timeKey)) {
            timestampMap.set(timeKey, { timeKey, rawTimeVal, timeMs: pktTimeMs, readings: {} });
          }

          const entry = timestampMap.get(timeKey);
          if (!entry.readings[resItem.key]) {
            entry.readings[resItem.key] = {
              sum: parseFloat(item.valor) || 0,
              count: 1,
              valor: parseFloat(item.valor) || 0,
              unidad,
              varName
            };
          } else {
            const r = entry.readings[resItem.key];
            r.sum += parseFloat(item.valor) || 0;
            r.count += 1;
            r.valor = Math.round((r.sum / r.count) * 100) / 100;
          }
        });
      });



      // Si no hay datos guardados en el histórico para el rango seleccionado
      if (timestampMap.size === 0) {
        setNoDataError(true);
        setIsExporting(false);
        return;
      }

      let csvRows = [];
      // Encabezados con metadatos completos del nodo
      csvRows.push([
        isEn ? "Node / Device" : "Nodo / Dispositivo",
        "Serial",
        isEn ? "Category" : "Categoría",
        isEn ? "Location" : "Ubicación",
        isEn ? "Latitude" : "Latitud",
        isEn ? "Longitude" : "Longitud",
        "Sensor / MQTT Key",
        isEn ? "Variable" : "Variable",
        isEn ? "Registered Value" : "Valor Registrado",
        isEn ? "Unit" : "Unidad",
        isEn ? "Date & Time" : "Fecha y Hora"
      ]);

      const sortedEntries = Array.from(timestampMap.values()).sort((a, b) => {
        const timeA = a.timeMs || (parseToValidDate(a.rawTimeVal)?.getTime() || 0);
        const timeB = b.timeMs || (parseToValidDate(b.rawTimeVal)?.getTime() || 0);
        return timeA - timeB;
      });

      const catName = nodo.categoria_nombre || nodo.categoria || '';
      const ubiName = nodo.ubicacion_nombre || nodo.location || nodo.ubicacion || '';
      const latVal = nodo.latitud || nodo.lat || nodo.latitude || '';
      const lngVal = nodo.longitud || nodo.lng || nodo.longitude || '';

      sortedEntries.forEach(entry => {
        const fechaStr = formatFechaHoraCoherente(entry.timeMs || entry.rawTimeVal);

        selectedKeys.forEach(key => {
          const r = entry.readings[key];
          if (r && r.valor !== undefined && r.valor !== null) {
            csvRows.push([
              `"${nodo.nombre || ''}"`,
              `"${nodo.serial_number || ''}"`,
              `"${catName}"`,
              `"${ubiName}"`,
              `"${latVal}"`,
              `"${lngVal}"`,
              `"${key}"`,
              `"${r.varName}"`,
              r.valor,
              `"${r.unidad}"`,
              `"${fechaStr}"`
            ]);
          }
        });
      });

      if (csvRows.length <= 1) {
        setNoDataError(true);
        setIsExporting(false);
        return;
      }

      const csvString = "\uFEFF" + csvRows.map(row => row.join(",")).join("\n");
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `telemetria_${nodo?.nombre.toLowerCase().replace(/\s+/g, '_')}_${fechaInicio}_al_${fechaFin}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
      onClose();
    } catch (err) {
      console.error("Error al exportar CSV:", err);
      setValidationError(isEn ? "An error occurred while processing CSV download." : "Ocurrió un error al procesar la descarga del archivo CSV.");
      setIsExporting(false);
    }
  };

  return (
    <div className="modal-descarga-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-descarga-card export-modal-redesign" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-inner-scroll">

          {/* Cabecera del Modal */}
          <div className="export-modal-header">
            <div className="export-modal-title-group">
              <div className="export-modal-icon-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="22" height="22">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <polyline points="9 15 12 18 15 15"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="modal-descarga-title">{isEn ? 'Export Telemetry Data' : 'Exportar Datos de Telemetría'}</h3>
                <p className="modal-descarga-subtitle" style={{ margin: 0 }}>
                  {isEn ? 'Generate and download a CSV report of historical readings.' : 'Genera y descarga un reporte CSV de lecturas históricas.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="export-modal-close-btn"
              onClick={onClose}
            >
              &times;
            </button>
          </div>

          {/* 1. Nombre del Dispositivo / Nodo */}
          <div className="export-device-info-banner" style={{ marginBottom: '1.25rem' }}>
            <div className="export-device-info-left">
              <span className="export-device-label">{isEn ? 'NODE DEVICE' : 'Dispositivo Nodo'}</span>
              <span className="export-device-name" style={{ fontSize: '1.1rem', fontWeight: 800 }}>{nodo.nombre}</span>
            </div>
            <span className="export-device-serial">{nodo.serial_number}</span>
          </div>

          {/* 2. Variables de ese Nodo (Por defecto ninguna marcada) */}
          <div className="modal-section-group" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span className="modal-section-label" style={{ margin: 0 }}>{isEn ? 'Variables to Include (Select those you wish):' : 'Variables a Incluir (Selecciona las que desees):'}</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="export-quick-select-btn"
                  onClick={() => {
                    const all = {};
                    nodo.lecturas?.forEach(l => all[l.data_type] = true);
                    setDescargaMetrics(all);
                    setNoDataError(false);
                    setValidationError('');
                  }}
                >
                  {isEn ? 'Select all' : 'Seleccionar todas'}
                </button>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <button
                  type="button"
                  className="export-quick-select-btn"
                  onClick={() => {
                    setDescargaMetrics({});
                    setNoDataError(false);
                    setValidationError('');
                  }}
                >
                  {isEn ? 'Deselect all' : 'Desmarcar todas'}
                </button>
              </div>
            </div>

            <div className="export-variables-grid">
              {nodo.lecturas && nodo.lecturas.map((l, index) => {
                const isChecked = !!descargaMetrics[l.data_type];
                const theme = getTheme(l.data_type, l.icono);
                return (
                  <label
                    key={index}
                    className="export-variable-card-option"
                    style={{
                      borderColor: isChecked ? theme.hex : '#e2e8f0',
                      backgroundColor: isChecked ? theme.bg : '#ffffff'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCheckboxChange(l.data_type)}
                      className="export-variable-checkbox-hidden"
                    />
                    <div className="export-variable-card-content">
                      <span className="export-var-icon-badge" style={{ color: theme.hex, background: isChecked ? 'rgba(255,255,255,0.7)' : theme.bg }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                          {theme.icon}
                        </svg>
                      </span>
                      <span className="export-var-title">{l.tipo}</span>
                      <span className="export-var-unit">{l.unidad}</span>
                    </div>
                    <div
                      className="export-custom-checkbox-indicator"
                      style={{
                        background: isChecked ? theme.hex : 'transparent',
                        borderColor: isChecked ? theme.hex : '#cbd5e1'
                      }}
                    >
                      {isChecked && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" width="11" height="11">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 3. Período de Exportación */}
          <div className="modal-section-group" style={{ marginBottom: '1.25rem' }}>
            <span className="modal-section-label">{isEn ? 'Export Period (Max 90 days):' : 'Período de Exportación (Máx. 90 días):'}</span>
            <div className="modal-range-pills" style={{ marginBottom: '0.85rem', flexWrap: 'wrap' }}>
              {[
                { id: 'hoy', label: isEn ? 'Today' : 'Hoy' },
                { id: '7d', label: isEn ? 'Last 7 Days' : 'Últimos 7 Días' },
                { id: '30d', label: isEn ? 'Last 30 Days' : 'Últimos 30 Días' },
                { id: '90d', label: isEn ? 'Last 90 Days (Max)' : 'Últimos 90 Días (Máx.)' }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRangoChange(item.id)}
                  className={`modal-range-pill ${descargaRango === item.id ? 'active' : ''}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

          {/* Selector de Rango Personalizado con Inputs de Fecha (Solo para descarga de telemetría completa en Mapa) */}
          {!isHistorico && (
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 16px',
              marginTop: '0.75rem'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </span>
                <span>{isEn ? 'Custom Date Range:' : 'Rango de Fechas Personalizado:'}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748b' }}>
                    {isEn ? 'Start Date' : 'Fecha Inicio'}
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    max={todayStr}
                    onChange={handleFechaInicioChange}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                      outline: 'none'
                    }}
                  />
                </div>
                <span style={{ color: '#94a3b8', fontWeight: 800, marginTop: '18px' }}>➔</span>
                <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748b' }}>
                    {isEn ? 'End Date' : 'Fecha Fin'}
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    max={todayStr}
                    onChange={handleFechaFinChange}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

            {/* Selector de Intervalo de Agrupación para Histórico */}
            {isHistorico && (
              <div style={{ marginTop: '0.75rem' }}>
                <span className="modal-section-label" style={{ marginBottom: '0.4rem', display: 'block' }}>
                  {isEn ? 'Grouping Interval:' : 'Intervalo de Agrupación:'}
                </span>
                <div className="modal-range-pills" style={{ flexWrap: 'wrap' }}>
                  {[
                    { id: '60', label: isEn ? '1 hour' : '1 hora' },
                    { id: '300', label: isEn ? '5 hours' : '5 horas' },
                    { id: '720', label: isEn ? '12 hours' : '12 horas' },
                    { id: '1440', label: isEn ? '1 day' : '1 día' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDescargaIntervalo(item.id)}
                      className={`modal-range-pill ${descargaIntervalo === item.id ? 'active' : ''}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mensaje de Error en Rojo si NO hay datos en el histórico */}
          {noDataError && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '1.25rem'
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{isEn ? 'No historical data found for the selected period.' : 'No hay datos en el histórico.'}</span>
            </div>
          )}

          {/* Mensaje de Validación Básica */}
          {validationError && (
            <div style={{
              background: '#fffbe3',
              border: '1px solid #fde047',
              color: '#854d0e',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '1.25rem'
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{validationError}</span>
            </div>
          )}

          {/* Info Box */}
          <div className="export-modal-info-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{isEn ? 'UTF-8 encoding compatible with Microsoft Excel, Python, and MATLAB. Maximum 90 days.' : 'Codificación UTF-8 compatible con Microsoft Excel, Python y MATLAB. Máximo 90 días.'}</span>
          </div>

          {/* Acciones */}
          <div className="modal-action-buttons-row" style={{ marginTop: '1.5rem', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="modal-btn-cancel"
              style={{ borderRadius: '10px', padding: '0.65rem 1.2rem' }}
            >
              {isEn ? 'Cancel' : 'Cancelar'}
            </button>
            <button
              type="button"
              onClick={handleDescargarCSV}
              disabled={isExporting}
              className="export-btn-download"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {isExporting ? (isEn ? 'Generating CSV...' : 'Generando CSV...') : (isEn ? 'Download CSV File' : 'Descargar Archivo CSV')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
