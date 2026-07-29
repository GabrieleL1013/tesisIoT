import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

// Mapeador de Íconos y Temas
const DYNAMIC_ICONS = {
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

export default function ModalExportarCSV({ show, onClose, nodo }) {
  const [descargaMetrics, setDescargaMetrics] = useState({});
  const [descargaRango, setDescargaRango] = useState('24h');
  const [descargaIntervalo, setDescargaIntervalo] = useState('min');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (nodo && nodo.lecturas) {
      const initialChecked = {};
      nodo.lecturas.forEach(l => {
        initialChecked[l.data_type] = true;
      });
      setDescargaMetrics(initialChecked);
    }
  }, [nodo]);

  if (!show || !nodo) return null;

  const getNodeSaveFrequencySeconds = () => {
    if (!nodo) return 5;
    const freq = parseInt(nodo.save_frequency, 10);
    return isNaN(freq) || freq <= 0 ? 5 : freq;
  };

  const getIntervalOptions = () => {
    const freqSec = getNodeSaveFrequencySeconds();
    const freqLabel = freqSec < 60 ? `${freqSec}s` : `${Math.round(freqSec / 60)}min`;

    return [
      { id: 'min', label: `Mínimo (${freqLabel})`, disabled: false },
      { id: '1', label: '1 min', disabled: freqSec > 60 },
      { id: '5', label: '5 min', disabled: freqSec > 300 },
      { id: '15', label: '15 min', disabled: freqSec > 900 },
      { id: '30', label: '30 min', disabled: freqSec > 1800 },
      { id: '60', label: '60 min', disabled: freqSec > 3600 }
    ];
  };

  const handleCheckboxChange = (key) => {
    setDescargaMetrics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDescargarCSV = async () => {
    const selectedKeys = Object.keys(descargaMetrics).filter(k => descargaMetrics[k]);
    if (selectedKeys.length === 0) {
      alert("Por favor, selecciona al menos una lectura.");
      return;
    }

    try {
      setIsExporting(true);
      const now = new Date();
      const nowMs = now.getTime();
      let startDateStr = '';
      let endDateStr = now.toISOString().split('T')[0];
      let cutoffTimeMs = 0;

      if (descargaRango === '24h') {
        cutoffTimeMs = nowMs - (24 * 60 * 60 * 1000);
        const past24h = new Date(cutoffTimeMs);
        startDateStr = past24h.toISOString().split('T')[0];
      } else if (descargaRango === '7d') {
        cutoffTimeMs = nowMs - (7 * 24 * 60 * 60 * 1000);
        const past7d = new Date(cutoffTimeMs);
        startDateStr = past7d.toISOString().split('T')[0];
      } else {
        cutoffTimeMs = nowMs - (30 * 24 * 60 * 60 * 1000);
        const past30d = new Date(cutoffTimeMs);
        startDateStr = past30d.toISOString().split('T')[0];
      }

      const isRawMinimum = descargaIntervalo === 'min';
      const intervalMinutes = isRawMinimum ? 0 : parseInt(descargaIntervalo, 10);

      const timestampMap = new Map();

      const parseDateToMs = (str) => {
        if (!str) return 0;
        const d = new Date(str);
        if (!isNaN(d.getTime())) return d.getTime();
        return 0;
      };

      // 1. Consultar /lecturas directamente de la BD para cada métrica seleccionada
      const promises = selectedKeys.map(key =>
        fetch(`${API_BASE_URL}/lecturas?serial_number=${nodo.serial_number}&clave_mqtt=${key}&filter_mode=range&start_date=${startDateStr}&end_date=${endDateStr}&interval=${intervalMinutes || 1}`)
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
          const rawTime = item.fecha || item.label || (item.created_at ? new Date(item.created_at).toLocaleString('es-ES') : '');
          const pktTimeMs = parseDateToMs(item.fecha || item.created_at);

          if (cutoffTimeMs > 0 && pktTimeMs > 0 && pktTimeMs < cutoffTimeMs) {
            return;
          }

          let timeKey = item.fecha || rawTime;
          let displayTime = rawTime;

          if (!isRawMinimum && intervalMinutes > 0 && pktTimeMs > 0) {
            const bucketMs = Math.floor(pktTimeMs / (intervalMinutes * 60 * 1000)) * (intervalMinutes * 60 * 1000);
            timeKey = `bucket_${bucketMs}`;
            displayTime = new Date(bucketMs).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium', hour12: true });
          }

          if (!timestampMap.has(timeKey)) {
            timestampMap.set(timeKey, { timeKey, rawTime: displayTime, timeMs: pktTimeMs, readings: {} });
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

      // 2. Fallback a /public/lecturas/historico si el primer endpoint no devolvió filas
      if (timestampMap.size === 0) {
        const resPublic = await fetch(`${API_BASE_URL}/public/lecturas/historico?node_id=${nodo.id}&periodo=${descargaRango}&intervalo=${intervalMinutes || 15}`);
        const responseData = await resPublic.json();
        const series = responseData.series || {};

        selectedKeys.forEach(key => {
          const lTemplate = nodo.lecturas ? nodo.lecturas.find(l => l.data_type === key) : null;
          const metricSeries = series[key] || [];
          const varName = lTemplate?.tipo || key;
          const unidad = lTemplate?.unidad || '';

          if (Array.isArray(metricSeries)) {
            metricSeries.forEach(item => {
              const rawTime = item.label || (item.fecha ? new Date(item.fecha).toLocaleString('es-ES') : '');
              const pktTimeMs = parseDateToMs(item.fecha);

              if (cutoffTimeMs > 0 && pktTimeMs > 0 && pktTimeMs < cutoffTimeMs) {
                return;
              }

              const timeKey = item.fecha || rawTime;

              if (!timestampMap.has(timeKey)) {
                timestampMap.set(timeKey, { timeKey, rawTime, timeMs: pktTimeMs, readings: {} });
              }

              const entry = timestampMap.get(timeKey);
              entry.readings[key] = {
                valor: item.valor,
                unidad,
                varName
              };
            });
          }
        });
      }

      if (timestampMap.size === 0) {
        alert("No hay lecturas disponibles en la base de datos para el período seleccionado.");
        setIsExporting(false);
        return;
      }

      let csvRows = [];
      csvRows.push(["Dispositivo", "Fecha y Hora", "Variable", "Valor Registrado", "Unidad"]);

      const sortedEntries = Array.from(timestampMap.values()).sort((a, b) => {
        const timeA = a.timeMs || new Date(a.rawTime || a.timeKey).getTime() || 0;
        const timeB = b.timeMs || new Date(b.rawTime || b.timeKey).getTime() || 0;
        return timeA - timeB;
      });

      sortedEntries.forEach(entry => {
        let fechaStr = entry.rawTime || '';
        if (fechaStr.includes('T')) {
          try {
            fechaStr = new Date(fechaStr).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium', hour12: true });
          } catch(e) {}
        }

        selectedKeys.forEach(key => {
          const r = entry.readings[key];
          if (r && r.valor !== undefined && r.valor !== null) {
            csvRows.push([
              `"${nodo.nombre}"`,
              `"${fechaStr}"`,
              `"${r.varName}"`,
              r.valor,
              `"${r.unidad}"`
            ]);
          }
        });
      });

      if (csvRows.length <= 1) {
        alert("No hay lecturas suficientes registradas en la base de datos para exportar.");
        setIsExporting(false);
        return;
      }

      const csvString = "\uFEFF" + csvRows.map(row => row.join(",")).join("\n");
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `telemetria_${nodo?.nombre.toLowerCase().replace(/\s+/g, '_')}_${descargaRango}_int${descargaIntervalo}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
      onClose();
    } catch (err) {
      console.error("Error al exportar CSV desde la base de datos:", err);
      alert("Ocurrió un error al procesar la descarga de lecturas.");
      setIsExporting(false);
    }
  };

  return (
    <div className="modal-descarga-overlay" onClick={onClose}>
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
              <h3 className="modal-descarga-title">Exportar Datos de Telemetría</h3>
              <p className="modal-descarga-subtitle" style={{ margin: 0 }}>
                Genera y descarga un reporte CSV listo para análisis.
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

        {/* Badge de Dispositivo Seleccionado */}
        <div className="export-device-info-banner">
          <div className="export-device-info-left">
            <span className="export-device-label">Dispositivo</span>
            <span className="export-device-name">{nodo.nombre}</span>
          </div>
          <span className="export-device-serial">{nodo.serial_number}</span>
        </div>

        {/* Sección: Período de Exportación */}
        <div className="modal-section-group" style={{ marginBottom: '1.25rem' }}>
          <span className="modal-section-label">Período de Exportación:</span>
          <div className="modal-range-pills">
            {[
              { id: '24h', label: 'Últimas 24 Horas' },
              { id: '7d', label: 'Últimos 7 Días' },
              { id: '30d', label: 'Últimos 30 Días (Máx.)' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDescargaRango(item.id)}
                className={`modal-range-pill ${descargaRango === item.id ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sección: Intervalo de Tiempo de Métricas */}
        <div className="modal-section-group" style={{ marginBottom: '1.25rem' }}>
          <span className="modal-section-label">Intervalo de Tiempo de Métricas:</span>
          <div className="modal-range-pills" style={{ flexWrap: 'wrap' }}>
            {getIntervalOptions().map(item => (
              <button
                key={item.id}
                type="button"
                disabled={item.disabled}
                onClick={() => !item.disabled && setDescargaIntervalo(item.id)}
                className={`modal-range-pill ${descargaIntervalo === item.id ? 'active' : ''}`}
                style={item.disabled ? { opacity: 0.45, cursor: 'not-allowed', background: '#f1f5f9', color: '#94a3b8', border: '1px solid #cbd5e1' } : {}}
                title={item.disabled ? `La frecuencia de guardado del nodo no permite seleccionar ${item.label}` : ''}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sección: Variables a Incluir */}
        <div className="modal-section-group" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span className="modal-section-label" style={{ margin: 0 }}>Variables a Incluir:</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="export-quick-select-btn"
                onClick={() => {
                  const all = {};
                  nodo.lecturas.forEach(l => all[l.data_type] = true);
                  setDescargaMetrics(all);
                }}
              >
                Seleccionar todas
              </button>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <button
                type="button"
                className="export-quick-select-btn"
                onClick={() => setDescargaMetrics({})}
              >
                Desmarcar todas
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

        {/* Info Box */}
        <div className="export-modal-info-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>Codificación UTF-8 compatible con Microsoft Excel, Python y MATLAB.</span>
        </div>

        {/* Acciones */}
        <div className="modal-action-buttons-row" style={{ marginTop: '1.5rem', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            className="modal-btn-cancel"
            style={{ borderRadius: '10px', padding: '0.65rem 1.2rem' }}
          >
            Cancelar
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
            {isExporting ? 'Generando CSV...' : 'Descargar CSV'}
          </button>
        </div>

        </div>
      </div>
    </div>
  );
}
