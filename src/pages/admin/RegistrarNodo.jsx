import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useLanguage } from '../../context/LanguageContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import Combobox from '../../components/Combobox';
import '../../styles/components/admin/RegistrarNodo.css';
import iotLogoDefault from '../../assets/IOT-LOGO.png';

const formatImageUrl = (urlStr) => {
  if (!urlStr) return iotLogoDefault;
  if (urlStr.startsWith('data:') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
    return urlStr;
  }
  const backendHost = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${backendHost}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
};

const CustomItemsPerPageSelect = ({ value, onChange, options = [6, 9, 12, 18, 24], language = 'es' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suffix = language === 'en' ? 'page' : 'pág';

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '10px',
          border: '1.5px solid #cbd5e1',
          background: '#ffffff',
          color: '#0f2c59',
          fontWeight: '700',
          fontSize: '0.82rem',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
      >
        <span>{value} / {suffix}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          width="12"
          height="12"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
            padding: '6px',
            minWidth: '115px',
            zIndex: 1100,
            maxWidth: '90vw',
            boxSizing: 'border-box'
          }}
        >
          {options.map((opt) => {
            const isSelected = Number(opt) === Number(value);
            return (
              <div
                key={opt}
                onClick={() => {
                  onChange(Number(opt));
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                  color: isSelected ? '#1e40af' : '#334155',
                  fontWeight: isSelected ? '800' : '600',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{opt} / {suffix}</span>
                {isSelected && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="3" width="12" height="12">
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

export default function RegistrarNodo() {
  const { t, language, triggerContentLoading } = useLanguage();
  usePageTitle({ es: 'Registrar / Editar Nodo', en: 'Register / Edit Node' }, 'Admin · IoT ULEAM');
  const [ubicaciones, setUbicaciones] = useState([]);
  const [nodosRegistrados, setNodosRegistrados] = useState([]);
  const [loadingNodos, setLoadingNodos] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [metricasPresets, setMetricasPresets] = useState([]);

  // Estados para Sensores y Métricas Refactorizados
  const [sensorsList, setSensorsList] = useState([]);
  const [metricsList, setMetricsList] = useState([]);
  const [sensorCards, setSensorCards] = useState([]);

  // Estados de Paginación para Listado de Nodos
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const [searchParams, setSearchParams] = useSearchParams();
  const categoriaFiltro = searchParams.get('categoria');
  const navigate = useNavigate();
  const isEn = language === 'en';

  // Estados del Formulario y Vista
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nombreNodo, setNombreNodo] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');
  const [categoria, setCategoria] = useState('');
  const [lecturas, setLecturas] = useState([]);
  const [broker, setBroker] = useState('broker.hivemq.com');
  const [port, setPort] = useState('1883');
  const [topicData, setTopicData] = useState('');
  const [clientId, setClientId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [useMqttV5, setUseMqttV5] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [saveFrequency, setSaveFrequency] = useState('30');
  const [instabilityAlertInterval, setInstabilityAlertInterval] = useState('300');
  const [isUbiDropdownOpen, setIsUbiDropdownOpen] = useState(false);
  const [initialState, setInitialState] = useState(null);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isFrecDropdownOpen, setIsFrecDropdownOpen] = useState(false);
  const [isAlertIntervalDropdownOpen, setIsAlertIntervalDropdownOpen] = useState(false);

  // Estados de Terminal de Verificación
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [terminalCountdown, setTerminalCountdown] = useState(60);
  const [terminalStatus, setTerminalStatus] = useState('waiting'); // waiting, success, failed
  const [verifyingNodeId, setVerifyingNodeId] = useState(null);

  // Estados de Filtros en Listado
  const [busqueda, setBusqueda] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [previewNode, setPreviewNode] = useState(null); // stores the node to preview
  const [latestReadings, setLatestReadings] = useState([]); // stores real-time readings fetched from backend
  const [selectedVariable, setSelectedVariable] = useState(null); // currently active variable selected in fullscreen preview card
  const [ordenFecha, setOrdenFecha] = useState(null); // desc = más nuevo primero, asc = más antiguo
  const [showUbiPanel, setShowUbiPanel] = useState(false);
  const [showCatPanel, setShowCatPanel] = useState(false);
  const [showOrdenPanel, setShowOrdenPanel] = useState(false);

  // Resetear paginación al cambiar cualquier filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, filtroUbicacion, filtroCategoria, ordenFecha, categoriaFiltro]);

  // Derive active location corresponding to the previewNode
  const activeUbi = previewNode ? ubicaciones.find(u => u.id.toString() === previewNode.ubicacion_id.toString()) : null;

  // Fetch latest readings periodically when previewNode changes
  useEffect(() => {
    if (!previewNode) {
      setLatestReadings([]);
      setSelectedVariable(null);
      return;
    }

    // Auto-select first metric if available
    if (previewNode.lecturas && previewNode.lecturas.length > 0) {
      setSelectedVariable(previewNode.lecturas[0]);
    } else {
      setSelectedVariable(null);
    }

    const fetchReadings = () => {
      fetch(`${API_BASE_URL}/lecturas/ultimas?node_id=${previewNode.id}`)
        .then(res => res.json())
        .then(data => {
          setLatestReadings(data);
        })
        .catch(err => console.error("Error fetching latest node readings:", err));
    };

    fetchReadings();
    const interval = setInterval(fetchReadings, 5000); // Live polling every 5s

    return () => clearInterval(interval);
  }, [previewNode]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.nodos-filter-group-ubi')) {
        setShowUbiPanel(false);
      }
      if (!e.target.closest('.nodos-filter-group-cat')) {
        setShowCatPanel(false);
      }
      if (!e.target.closest('.nodos-filter-group-orden')) {
        setShowOrdenPanel(false);
      }
      if (!e.target.closest('.ubi-dropdown-container')) setIsUbiDropdownOpen(false);
      if (!e.target.closest('.cat-dropdown-container')) setIsCatDropdownOpen(false);
      if (!e.target.closest('.frec-dropdown-container')) setIsFrecDropdownOpen(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Helper to determine the dynamic status index based on node subvariables
  const getVariableIndexStatus = (variable, valueRaw) => {
    if (!variable) return null;
    const val = parseFloat(valueRaw);
    if (isNaN(val)) return null;

    // Extraer mínimo y máximo configurados en la métrica (si existen)
    const minExp = (variable.minExpected !== undefined && variable.minExpected !== null && variable.minExpected !== '')
      ? parseFloat(variable.minExpected)
      : (variable.min_expected !== undefined && variable.min_expected !== null && variable.min_expected !== '')
        ? parseFloat(variable.min_expected)
        : null;

    const maxExp = (variable.maxExpected !== undefined && variable.maxExpected !== null && variable.maxExpected !== '')
      ? parseFloat(variable.maxExpected)
      : (variable.max_expected !== undefined && variable.max_expected !== null && variable.max_expected !== '')
        ? parseFloat(variable.max_expected)
        : null;

    // Si la métrica tiene configurados Mínimo o Máximo esperados válidos
    if (minExp !== null || maxExp !== null) {
      let label = 'Medio';
      let color = '#10b981'; // Verde para dentro del rango (Medio / Óptimo)
      let percent = 50;
      let isOutOfRange = false;
      let outWarningMsg = null;

      if (minExp !== null && val < minExp) {
        label = 'Bajo';
        color = '#3b82f6'; // Azul para nivel bajo por debajo del mínimo
        percent = 2; // Filo izquierdo de la barra indicadora
        isOutOfRange = true;
        outWarningMsg = `El valor registrado (${val} ${variable.unidad || ''}) está por debajo del mínimo esperado (${minExp} ${variable.unidad || ''})`;
      } else if (maxExp !== null && val > maxExp) {
        label = 'Alto';
        color = '#ef4444'; // Rojo para nivel alto por encima del máximo
        percent = 98; // Filo derecho de la barra indicadora
        isOutOfRange = true;
        outWarningMsg = `El valor registrado (${val} ${variable.unidad || ''}) sobrepasa el máximo esperado (${maxExp} ${variable.unidad || ''})`;
      } else {
        label = 'Medio';
        color = '#10b981'; // Verde para el rango medio / normal
        if (minExp !== null && maxExp !== null && maxExp > minExp) {
          const ratio = (val - minExp) / (maxExp - minExp);
          percent = 15 + ratio * 70; // Centrado dentro del rango óptimo
        } else {
          percent = 50;
        }
      }

      return {
        title: variable.tipo || variable.nombre || 'Variable',
        value: `${val} ${variable.unidad || ''}`.trim(),
        label,
        color,
        percent: Math.min(Math.max(percent, 2), 98),
        type: 'custom_range',
        range: ['Bajo', 'Medio', 'Alto'],
        isOutOfRange,
        outWarningMsg
      };
    }

    const key = (variable.data_type || variable.claveMqtt || '').toLowerCase();
    const nombre = (variable.tipo || variable.nombre || '').toLowerCase();

    // 1. CALIDAD DEL AIRE / AQI
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

    // 2. DIÓXIDO DE CARBONO (CO2)
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

    // 3. HUMEDAD (DE SUELO O AMBIENTAL)
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

    // 5. PRESIÓN ATMOSFÉRICA
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

    // Default fallback
    return {
      title: variable.tipo || variable.nombre || 'Variable',
      value: `${val} ${variable.unidad || ''}`.trim(),
      label: 'Medio',
      color: '#10b981',
      percent: 50,
      type: 'default',
      range: ['Bajo', 'Medio', 'Alto']
    };
  };



  useEffect(() => {
    setLoadingNodos(true);

    const pUbicaciones = fetch(`${API_BASE_URL}/ubicaciones`)
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(ubiData => {
        if (Array.isArray(ubiData)) {
          setUbicaciones(ubiData);
        }
      })
      .catch(err => {
        console.error("Error fetching locations in nodes registration:", err);
        setUbicaciones([]);
      });

    const pNodos = fetchWithAuth(`${API_BASE_URL}/nodos?include_credentials=true`)
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(nodosData => {
        if (Array.isArray(nodosData)) {
          setNodosRegistrados(nodosData);
        }
      })
      .catch(err => {
        console.error("Error fetching nodes from PostgreSQL backend:", err);
        setNodosRegistrados([]);
      });

    const pCategorias = fetch(`${API_BASE_URL}/categorias`)
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(catsData => {
        if (Array.isArray(catsData)) {
          setCategorias(catsData);
          if (categoriaFiltro) {
            setCategoria(categoriaFiltro);
          }
        }
      })
      .catch(err => {
        console.error("Error fetching categories from backend:", err);
        setCategorias([]);
        if (categoriaFiltro) {
          setCategoria(categoriaFiltro);
        }
      });

    const pMetricas = fetch(`${API_BASE_URL}/metricas?lang=${language}`)
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(metricData => {
        if (Array.isArray(metricData)) {
          setMetricasPresets(metricData);
          setMetricsList(metricData);
        }
      })
      .catch(err => {
        console.error("Error fetching metrics presets from PostgreSQL backend:", err);
        setMetricasPresets([]);
        setMetricsList([]);
      });

    const pSensorsList = fetch(`${API_BASE_URL}/sensors?lang=${language}`)
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(sensorsData => {
        if (Array.isArray(sensorsData)) {
          setSensorsList(sensorsData);
        }
      })
      .catch(err => {
        console.error("Error fetching sensors list:", err);
        setSensorsList([]);
      });

    Promise.allSettled([pUbicaciones, pNodos, pCategorias, pMetricas, pSensorsList]).finally(() => {
      setLoadingNodos(false);
    });
  }, [categoriaFiltro, language]);

  // Sincronización del estado de la vista con la URL (Historial del Navegador)
  useEffect(() => {
    if (loadingNodos) return;
    const editarIdParam = searchParams.get('editar');
    const accionParam = searchParams.get('accion');

    if (editarIdParam) {
      if (String(editandoId) !== String(editarIdParam) || !mostrarFormulario) {
        const foundNode = nodosRegistrados.find(n => String(n.id) === String(editarIdParam));
        if (foundNode) {
          cargarEdicion(foundNode, false);
        } else {
          fetchWithAuth(`${API_BASE_URL}/nodos/${editarIdParam}?include_credentials=true&lang=${language}`)
            .then(res => res.ok ? res.json() : null)
            .then(freshNodo => {
              if (freshNodo && freshNodo.id) cargarEdicion(freshNodo, false);
            })
            .catch(() => {});
        }
      }
    } else if (accionParam === 'crear') {
      if (!mostrarFormulario || editandoId !== null) {
        setEditandoId(null);
        setMostrarFormulario(true);
      }
    } else {
      if (mostrarFormulario) {
        setEditandoId(null);
        setMostrarFormulario(false);
      }
    }
  }, [searchParams, loadingNodos]);

  // Alerta de cambios pendientes al intentar recargar o cerrar la página
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (mostrarFormulario) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar en el formulario. ¿Estás seguro de que deseas salir?';
        return 'Tienes cambios sin guardar en el formulario. ¿Estás seguro de que deseas salir?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [mostrarFormulario]);

  // Leaflet Map Initialization for Location Preview Modal
  useEffect(() => {
    if (!previewNode || !activeUbi) {
      if (window.leafletPreviewMapInstance) {
        window.leafletPreviewMapInstance.remove();
        window.leafletPreviewMapInstance = null;
      }
      return;
    }

    // Load Leaflet assets dynamically if not present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initPreviewMap = () => {
      if (window.leafletPreviewMapInstance) {
        window.leafletPreviewMapInstance.remove();
        window.leafletPreviewMapInstance = null;
      }

      const lat = parseFloat(activeUbi.latitud);
      const lng = parseFloat(activeUbi.longitud);

      const map = window.L.map('leaflet-map-preview').setView([lat, lng], 17);
      window.leafletPreviewMapInstance = map;

      // Google Maps Hybrid satellite
      window.L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps',
        maxZoom: 20
      }).addTo(map);

      // Custom Map Pin SVG Icon (estilo Google Maps)
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

      // Create static marker
      window.L.marker([lat, lng], {
        icon: mapPinIcon
      }).addTo(map);
    };

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        initPreviewMap();
      };
      document.body.appendChild(script);
    } else {
      const timer = setTimeout(() => {
        initPreviewMap();
      }, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      if (window.leafletPreviewMapInstance) {
        window.leafletPreviewMapInstance.remove();
        window.leafletPreviewMapInstance = null;
      }
    };
  }, [previewNode]);



  const cargarPlantillaSensor = (sensorTemplate) => {
    if (!sensorTemplate.subvariables || sensorTemplate.subvariables.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: isEn ? 'Empty Template' : 'Plantilla Vacía',
        text: isEn ? 'This sensor has no configured subvariables.' : 'Este sensor no tiene subvariables configuradas.',
        confirmButtonColor: '#ff9f1c'
      });
      return;
    }

    const nuevasLecturas = sensorTemplate.subvariables.map(sub => ({
      sensor: sensorTemplate.nombre,
      tipo: sub.nombre,
      unidad: sub.unidad,
      icono: sub.icono || '',
      data_type: sub.claveMqtt
    }));

    // If there is only one empty row, overwrite it; otherwise, append!
    const esFilaInicialVacia = lecturas.length === 1 &&
      lecturas[0].data_type === '' &&
      lecturas[0].tipo === 'Temperatura';

    if (esFilaInicialVacia) {
      setLecturas(nuevasLecturas);
    } else {
      setLecturas([...lecturas, ...nuevasLecturas]);
    }

    Swal.fire({
      icon: 'success',
      title: isEn ? 'Subvariables Loaded!' : '¡Subvariables Cargadas!',
      text: isEn
        ? `Added ${nuevasLecturas.length} subvariables from sensor "${sensorTemplate.nombre}".`
        : `Se agregaron ${nuevasLecturas.length} subvariables del sensor "${sensorTemplate.nombre}".`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  };

  const handleLecturaChange = (index, field, value) => {
    const nuevasLecturas = [...lecturas];
    nuevasLecturas[index][field] = value;

    // Auto-fill unit, JSON MQTT key, and sensor name when metric subvariable type is selected
    if (field === 'tipo') {
      // Flatten all subvariables from presets, keeping their parent sensor group name
      const allSubs = [];
      metricasPresets.forEach(preset => {
        if (preset.subvariables) {
          preset.subvariables.forEach(s => {
            allSubs.push({ ...s, parentSensor: preset.nombre });
          });
        }
      });

      const found = allSubs.find(sub => sub.nombre === value);
      if (found) {
        nuevasLecturas[index]['sensor'] = found.parentSensor || '';
        nuevasLecturas[index]['unidad'] = found.unidad || '';
        nuevasLecturas[index]['icono'] = found.icono || '';
        nuevasLecturas[index]['data_type'] = found.claveMqtt || '';
      }
    }

    setLecturas(nuevasLecturas);
  };

  const agregarFilaLectura = () => {
    setLecturas([...lecturas, { sensor: '', data_type: '', tipo: '', unidad: '' }]);
  };

  // Helper handlers for Sensor Cards and Metrics
  const handleAddExistingSensor = (sensorObj) => {
    if (!sensorObj) return;

    const existingSensor = sensorsList.find(s => String(s.id) === String(sensorObj.id) || s.name.toLowerCase() === (sensorObj.name || sensorObj.label || '').toLowerCase());

    const cardMetrics = (existingSensor?.metrics || []).map(m => {
      const metricInList = metricsList.find(ml => String(ml.id) === String(m.id)) || m;
      const units = metricInList.units || m.units || [];
      const firstUnit = units.find(u => u.unit === m.unit) || units[0] || null;
      const keys = firstUnit ? (firstUnit.json_keys || []) : (m.json_keys || m.jsonKeys || []);
      const stdKeyObj = keys.find(k => k.is_standard) || keys[0];

      return {
        metric_id: m.id,
        name: language === 'en' ? (m.name_en || m.name) : m.name,
        name_es: m.name,
        name_en: m.name_en || m.name,
        unit: firstUnit ? firstUnit.unit : (m.unit || ''),
        selected_unit_id: firstUnit ? firstUnit.id : null,
        min_expected: firstUnit && firstUnit.min_expected !== null && firstUnit.min_expected !== undefined ? String(firstUnit.min_expected) : (m.min_expected !== null && m.min_expected !== undefined ? String(m.min_expected) : ''),
        max_expected: firstUnit && firstUnit.max_expected !== null && firstUnit.max_expected !== undefined ? String(firstUnit.max_expected) : (m.max_expected !== null && m.max_expected !== undefined ? String(m.max_expected) : ''),
        symbol_image: m.symbol_image || '/symbols/default.webp',
        json_key: stdKeyObj ? (typeof stdKeyObj === 'string' ? stdKeyObj : stdKeyObj.key_name) : (m.json_key || ''),
        available_units: units,
        available_keys: keys
      };
    });

    setSensorCards(prev => [
      ...prev,
      {
        sensor_id: existingSensor ? existingSensor.id : null,
        name: sensorObj.name || sensorObj.label,
        brand: existingSensor ? existingSensor.brand : '',
        description: existingSensor ? existingSensor.description : '',
        metrics: cardMetrics
      }
    ]);
  };

  const handleCreateSensorCard = (sensorName) => {
    if (!sensorName.trim()) return;

    fetchWithAuth(`${API_BASE_URL}/sensors?lang=${language}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sensorName.trim() })
    })
      .then(res => res.json())
      .then(newSensor => {
        if (newSensor && newSensor.id) {
          setSensorsList(prev => [...prev, newSensor]);
          setSensorCards(prev => [
            ...prev,
            {
              sensor_id: newSensor.id,
              name: newSensor.name,
              brand: '',
              description: '',
              metrics: []
            }
          ]);
        }
      })
      .catch(() => {
        setSensorCards(prev => [
          ...prev,
          {
            sensor_id: null,
            name: sensorName.trim(),
            brand: '',
            description: '',
            metrics: []
          }
        ]);
      });
  };

  const handleRemoveSensorCard = (cardIdx) => {
    setSensorCards(prev => prev.filter((_, idx) => idx !== cardIdx));
  };

  const handleAddMetricToCard = (cardIdx) => {
    const newMetricRow = {
      metric_id: null,
      name: '',
      unit: '',
      symbol_image: '/symbols/default.webp',
      json_key: '',
      min_expected: '',
      max_expected: '',
      available_keys: []
    };

    setSensorCards(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[cardIdx].metrics.push(newMetricRow);
      return next;
    });
  };

  const handleRemoveMetricFromCard = (cardIdx, metricIdx) => {
    setSensorCards(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[cardIdx].metrics = next[cardIdx].metrics.filter((_, idx) => idx !== metricIdx);
      return next;
    });
  };

  const handleSelectMetricForRow = (cardIdx, metricIdx, metricObj) => {
    const rawName = typeof metricObj === 'string' ? metricObj : (metricObj.name || metricObj.label || '');
    const selected = metricsList.find(m =>
      (metricObj.id && String(m.id) === String(metricObj.id)) ||
      m.name.toLowerCase() === rawName.toLowerCase() ||
      (m.name_en && m.name_en.toLowerCase() === rawName.toLowerCase())
    );

    if (selected) {
      const units = selected.units || [];
      const firstUnit = units[0] || null;
      const keys = firstUnit ? (firstUnit.json_keys || []) : (selected.json_keys || []);
      const stdKeyObj = keys.find(k => k.is_standard) || keys[0];
      const displayName = language === 'en' ? (selected.name_en || selected.name) : selected.name;

      setSensorCards(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next[cardIdx].metrics[metricIdx] = {
          ...next[cardIdx].metrics[metricIdx],
          metric_id: selected.id,
          name: displayName,
          name_es: selected.name,
          name_en: selected.name_en || selected.name,
          unit: firstUnit ? firstUnit.unit : (selected.unit || ''),
          symbol_image: selected.symbol_image || '/symbols/default.webp',
          min_expected: firstUnit && firstUnit.min_expected !== null && firstUnit.min_expected !== undefined ? String(firstUnit.min_expected) : (selected.min_expected !== null && selected.min_expected !== undefined ? String(selected.min_expected) : ''),
          max_expected: firstUnit && firstUnit.max_expected !== null && firstUnit.max_expected !== undefined ? String(firstUnit.max_expected) : (selected.max_expected !== null && selected.max_expected !== undefined ? String(selected.max_expected) : ''),
          json_key: stdKeyObj ? (typeof stdKeyObj === 'string' ? stdKeyObj : stdKeyObj.key_name) : '',
          available_units: units,
          available_keys: keys
        };
        return next;
      });
    } else if (rawName.trim()) {
      // Create new metric via API
      fetchWithAuth(`${API_BASE_URL}/metrics?lang=${language}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: rawName.trim(), unit: 'unidad' })
      })
        .then(res => res.json())
        .then(createdMetric => {
          if (createdMetric && createdMetric.id) {
            setMetricsList(prev => [...prev, createdMetric]);
            const displayName = language === 'en' ? (createdMetric.name_en || createdMetric.name) : createdMetric.name;

            setSensorCards(prev => {
              const next = JSON.parse(JSON.stringify(prev));
              next[cardIdx].metrics[metricIdx] = {
                ...next[cardIdx].metrics[metricIdx],
                metric_id: createdMetric.id,
                name: displayName,
                name_es: createdMetric.name,
                name_en: createdMetric.name_en || createdMetric.name,
                unit: '',
                symbol_image: '/symbols/default.webp',
                json_key: '',
                available_units: [],
                available_keys: []
              };
              return next;
            });
          }
        })
        .catch(() => {
          setSensorCards(prev => {
            const next = JSON.parse(JSON.stringify(prev));
            next[cardIdx].metrics[metricIdx] = {
              ...next[cardIdx].metrics[metricIdx],
              name: rawName,
              metric_id: null,
              json_key: '',
              unit: '',
              available_units: [],
              available_keys: []
            };
            return next;
          });
        });
    }
  };

  const handleSelectUnitForRow = (cardIdx, metricIdx, selectedUnitSymbol) => {
    setSensorCards(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const metricRow = next[cardIdx].metrics[metricIdx];
      const availableUnits = metricRow.available_units || [];
      const matchedUnit = availableUnits.find(u => u.unit === selectedUnitSymbol);

      if (matchedUnit) {
        const keys = matchedUnit.json_keys || [];
        const stdKeyObj = keys.find(k => k.is_standard) || keys[0];

        metricRow.unit = matchedUnit.unit;
        metricRow.min_expected = matchedUnit.min_expected !== null && matchedUnit.min_expected !== undefined ? String(matchedUnit.min_expected) : '';
        metricRow.max_expected = matchedUnit.max_expected !== null && matchedUnit.max_expected !== undefined ? String(matchedUnit.max_expected) : '';
        metricRow.json_key = stdKeyObj ? (typeof stdKeyObj === 'string' ? stdKeyObj : stdKeyObj.key_name) : metricRow.json_key;
        metricRow.available_keys = keys;
      } else {
        metricRow.unit = selectedUnitSymbol;
      }
      return next;
    });
  };

  const handleCreateJsonKey = (cardIdx, metricIdx, newKeyName) => {
    const card = sensorCards[cardIdx];
    const metricRow = card?.metrics[metricIdx];
    if (!metricRow || !newKeyName.trim()) return;

    // Sanitize: lowercase, replace spaces with underscores, remove invalid chars
    const cleanKey = newKeyName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');

    if (metricRow.metric_id) {
      fetchWithAuth(`${API_BASE_URL}/metric-json-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric_id: metricRow.metric_id,
          metric_unit_id: metricRow.selected_unit_id || null,
          key_name: cleanKey,
          is_standard: false
        })
      })
        .then(res => res.json())
        .then(createdKey => {
          setSensorCards(prev => {
            const next = JSON.parse(JSON.stringify(prev));
            const row = next[cardIdx].metrics[metricIdx];
            row.json_key = cleanKey;
            row.available_keys = [...(row.available_keys || []), createdKey];
            return next;
          });
        })
        .catch(() => {
          setSensorCards(prev => {
            const next = JSON.parse(JSON.stringify(prev));
            const row = next[cardIdx].metrics[metricIdx];
            row.json_key = cleanKey;
            return next;
          });
        });
    } else {
      setSensorCards(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const row = next[cardIdx].metrics[metricIdx];
        row.json_key = cleanKey;
        return next;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombreNodo || !serialNumber || !ubicacionId || !categoria) {
      Swal.fire({
        icon: 'error',
        title: isEn ? 'Incomplete Fields' : 'Campos Incompletos',
        text: isEn
          ? 'Please complete all main fields (Name, Serial, Location, and Category).'
          : 'Por favor, completa todos los campos principales (Nombre, Serial, Ubicación y Categoría).',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const hasValidMetrics = sensorCards.some(card =>
      card.metrics && card.metrics.some(m => m.json_key && m.json_key.trim() !== '')
    );

    if (sensorCards.length === 0 || !hasValidMetrics) {
      Swal.fire({
        icon: 'warning',
        title: isEn ? 'Missing Metrics' : 'Faltan Métricas',
        text: isEn
          ? 'Please configure at least one valid sensor and metric (with its MQTT key) before registering the node.'
          : 'Por favor, configure al menos un sensor y una métrica válida (con su clave MQTT) antes de registrar el nodo.',
        confirmButtonColor: '#ff9f1c'
      });
      return;
    }

    const lecturasValidas = [];
    sensorCards.forEach(card => {
      (card.metrics || []).forEach(m => {
        if (m.json_key && m.json_key.trim()) {
          lecturasValidas.push({
            sensor: card.name,
            tipo: m.name,
            unidad: m.unit,
            icono: m.symbol_image,
            data_type: m.json_key
          });
        }
      });
    });

    const payload = {
      nombre: nombreNodo,
      serial_number: serialNumber,
      ubicacion_id: ubicacionId,
      categoria: categoria,
      sensors: sensorCards,
      lecturas: lecturasValidas,
      broker: broker,
      port: port,
      topic_data: topicData,
      client_id: clientId,
      username: username,
      password: password,
      use_mqtt_v5: useMqttV5,
      is_simulated: isSimulated,
      save_frequency: parseInt(saveFrequency, 10) || 30,
      instability_alert_interval: parseInt(instabilityAlertInterval, 10) || 300
    };

    if (editandoId) {
      const cambiosHtml = obtenerCambiosDetallados();

      if (!cambiosHtml) {
        Swal.fire({
          icon: 'info',
          title: isEn ? 'No Changes' : 'Sin Cambios',
          text: isEn ? 'No changes detected to save.' : 'No se detectaron cambios para guardar.',
          confirmButtonColor: '#2563eb'
        });
        return;
      }

      Swal.fire({
        title: isEn ? 'Save Changes?' : '¿Guardar Cambios?',
        html: `${isEn ? 'You are about to update the node configuration.' : 'Estás a punto de actualizar la configuración del nodo.'}<br/>${cambiosHtml}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#4b5563',
        confirmButtonText: isEn ? 'Yes, save' : 'Sí, guardar',
        cancelButtonText: isEn ? 'Cancel' : 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          fetchWithAuth(`${API_BASE_URL}/nodos/${editandoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
            .then(res => {
              if (!res.ok) throw new Error("Duplicate or validation error");
              return res.json();
            })
            .then(() => {
              triggerContentLoading();
              // Re-fetch the full nodes list with credentials to get properly mapped data
              return fetchWithAuth(`${API_BASE_URL}/nodos?include_credentials=true`);
            })
            .then(res => res.json())
            .then(nodosData => {
              if (Array.isArray(nodosData)) setNodosRegistrados(nodosData);

              Swal.fire({
                icon: 'success',
                title: isEn ? 'Node Updated!' : '¡Nodo Actualizado!',
                text: isEn ? 'Changes saved successfully.' : 'Los cambios se han guardado con éxito.',
                confirmButtonColor: '#ff9f1c'
              });
              limpiarFormulario();
              setMostrarFormulario(false);
            })
            .catch(err => {
              console.error("Error updating node:", err);
              Swal.fire({
                icon: 'error',
                title: isEn ? 'Update Error' : 'Error al Modificar',
                text: isEn
                  ? 'Could not save station (make sure the serial number is unique).'
                  : 'No se pudo guardar la estación (asegúrate de que el número de serie sea único).',
                confirmButtonColor: '#ff9f1c'
              });
            });
        }
      });

    } else {
      // API CREATE NODE (POST)
      fetchWithAuth(`${API_BASE_URL}/nodos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) throw new Error("Duplicate or validation error");
          return res.json();
        })
        .then(() => {
          triggerContentLoading();
          return fetchWithAuth(`${API_BASE_URL}/nodos?include_credentials=true`);
        })
        .then(res => res.json())
        .then(nodosData => {
          if (Array.isArray(nodosData)) setNodosRegistrados(nodosData);

          Swal.fire({
            icon: 'success',
            title: isEn ? 'Node Registered!' : '¡Nodo Registrado!',
            text: isEn ? 'The node has been created successfully.' : 'El nodo ha sido creado con éxito.',
            confirmButtonColor: '#ff9f1c'
          });

          limpiarFormulario();
          setMostrarFormulario(false);
        })
        .catch(err => {
          console.error("Error creating node:", err);
          Swal.fire({
            icon: 'error',
            title: isEn ? 'Registration Error' : 'Error al Registrar',
            text: isEn
              ? 'Could not register station (make sure the serial number is unique).'
              : 'No se pudo registrar la estación (asegúrate de que el número de serie sea único).',
            confirmButtonColor: '#ff9f1c'
          });
        });
    }
  };


  const cargarEdicion = (nodo, updateUrl = true) => {
    if (updateUrl && nodo && nodo.id) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('accion');
      newParams.set('editar', String(nodo.id));
      setSearchParams(newParams);
    }
    // Fetch fresh individual node data with full relations and credentials
    fetchWithAuth(`${API_BASE_URL}/nodos/${nodo.id}?include_credentials=true&lang=${language}`)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(freshNodo => {
        setEditandoId(freshNodo.id);
        const nameVal = isEn ? (freshNodo.nombre_en || freshNodo.nombre) : (freshNodo.nombre_es || freshNodo.nombre);
        setNombreNodo(nameVal || '');
        setSerialNumber(freshNodo.serial_number || '');
        // Use numeric comparison-friendly ID: keep as string since ubicacionId state is string
        setUbicacionId(freshNodo.ubicacion_id != null ? String(freshNodo.ubicacion_id) : '');
        setCategoria(freshNodo.categoria_es || freshNodo.categoria || '');

        // Map metrics from subvariables
        const mappedLecturas = (freshNodo.lecturas && freshNodo.lecturas.length > 0)
          ? freshNodo.lecturas.map(l => ({
            sensor: l.sensor || 'Sensor Integrado',
            data_type: l.data_type,
            tipo: l.tipo,
            unidad: l.unidad,
            icono: l.icono || ''
          }))
          : [{ sensor: '', data_type: '', tipo: 'Temperatura', unidad: '\u00b0C' }];

        setLecturas(mappedLecturas);

        let loadedCards = [];
        if (freshNodo.sensor_cards && freshNodo.sensor_cards.length > 0) {
          // Normalize cards: backend uses 'id' for sensor id but frontend tracks 'sensor_id'
          loadedCards = freshNodo.sensor_cards.map(card => ({
            sensor_id: card.sensor_id || card.id || null,
            name: card.name || '',
            brand: card.brand || '',
            description: card.description || '',
            metrics: (card.metrics || []).map(m => {
              const metricInList = metricsList.find(ml =>
                (m.metric_id && String(ml.id) === String(m.metric_id)) ||
                (m.name && ml.name.toLowerCase() === m.name.toLowerCase())
              );
              const units = (m.available_units && m.available_units.length > 0)
                ? m.available_units
                : (metricInList ? (metricInList.units || []) : (m.units || []));

              const matchedUnit = units.find(u => u.unit === m.unit) || units[0] || null;
              const unitKeys = matchedUnit ? (matchedUnit.json_keys || []) : [];
              const backendKeys = m.available_keys || [];
              const mergedKeys = backendKeys.length > 0 ? backendKeys : (metricInList ? (metricInList.json_keys || metricInList.jsonKeys || []) : unitKeys);

              return {
                metric_id: m.metric_id || (metricInList ? metricInList.id : null),
                name: m.name || (metricInList ? (isEn ? (metricInList.name_en || metricInList.name) : metricInList.name) : ''),
                name_es: m.name_es || m.name || (metricInList ? metricInList.name : ''),
                name_en: m.name_en || m.name || (metricInList ? (metricInList.name_en || metricInList.name) : ''),
                unit: m.unit || (matchedUnit ? matchedUnit.unit : ''),
                selected_unit_id: matchedUnit ? matchedUnit.id : null,
                symbol_image: m.symbol_image || (metricInList ? metricInList.symbol_image : '/symbols/default.webp') || '/symbols/default.webp',
                json_key: m.json_key || '',
                min_expected: m.min_expected !== null && m.min_expected !== undefined ? String(m.min_expected) : (matchedUnit && matchedUnit.min_expected !== null ? String(matchedUnit.min_expected) : ''),
                max_expected: m.max_expected !== null && m.max_expected !== undefined ? String(m.max_expected) : (matchedUnit && matchedUnit.max_expected !== null ? String(matchedUnit.max_expected) : ''),
                available_units: units,
                available_keys: mergedKeys
              };
            })
          }));
        } else if (freshNodo.lecturas && freshNodo.lecturas.length > 0) {
          const cardsMap = {};
          freshNodo.lecturas.forEach(l => {
            const sName = l.sensor || 'Sensor Integrado';
            if (!cardsMap[sName]) {
              cardsMap[sName] = {
                sensor_id: l.sensor_id || null,
                name: sName,
                brand: '',
                description: '',
                metrics: []
              };
            }
            const metricInList = metricsList.find(ml =>
              (l.metric_id && String(ml.id) === String(l.metric_id)) ||
              (l.tipo && ml.name.toLowerCase() === l.tipo.toLowerCase())
            );
            const units = metricInList ? (metricInList.units || []) : [];
            const matchedUnit = units.find(u => u.unit === l.unidad) || units[0] || null;
            const keysFromList = matchedUnit ? (matchedUnit.json_keys || []) : (metricInList ? (metricInList.json_keys || metricInList.jsonKeys || []) : []);

            cardsMap[sName].metrics.push({
              metric_id: l.metric_id || (metricInList ? metricInList.id : null),
              name: l.tipo || (metricInList ? metricInList.name : ''),
              unit: l.unidad || (matchedUnit ? matchedUnit.unit : ''),
              selected_unit_id: matchedUnit ? matchedUnit.id : null,
              symbol_image: l.symbol_image || l.icono || (metricInList ? metricInList.symbol_image : '/symbols/default.webp'),
              json_key: l.data_type || '',
              min_expected: l.min_expected !== null && l.min_expected !== undefined ? String(l.min_expected) : '',
              max_expected: l.max_expected !== null && l.max_expected !== undefined ? String(l.max_expected) : '',
              available_units: units,
              available_keys: keysFromList
            });
          });
          loadedCards = Object.values(cardsMap);
        }

        setSensorCards(loadedCards);

        setBroker(freshNodo.broker ?? 'broker.hivemq.com');
        setPort(freshNodo.port != null ? String(freshNodo.port) : '1883');
        setTopicData(freshNodo.topic_data ?? '');
        setClientId(freshNodo.client_id ?? '');
        setUsername(freshNodo.username ?? '');
        setPassword(freshNodo.password ?? '');
        setUseMqttV5(freshNodo.use_mqtt_v5 ?? false);
        setIsSimulated(freshNodo.is_simulated ?? false);
        setSaveFrequency(freshNodo.save_frequency != null ? String(freshNodo.save_frequency) : '30');
        setInstabilityAlertInterval(freshNodo.instability_alert_interval != null ? String(freshNodo.instability_alert_interval) : '300');

        setInitialState({
          nombreNodo: freshNodo.nombre_es || freshNodo.nombre || '',
          serialNumber: freshNodo.serial_number || '',
          ubicacionId: freshNodo.ubicacion_id != null ? String(freshNodo.ubicacion_id) : '',
          categoria: freshNodo.categoria_es || freshNodo.categoria || '',
          sensorCards: loadedCards,
          broker: freshNodo.broker ?? 'broker.hivemq.com',
          port: freshNodo.port != null ? String(freshNodo.port) : '1883',
          topicData: freshNodo.topic_data ?? '',
          clientId: freshNodo.client_id ?? '',
          username: freshNodo.username ?? '',
          password: freshNodo.password ?? '',
          useMqttV5: freshNodo.use_mqtt_v5 ?? false,
          isSimulated: freshNodo.is_simulated ?? false,
          saveFrequency: freshNodo.save_frequency != null ? String(freshNodo.save_frequency) : '30',
          instabilityAlertInterval: freshNodo.instability_alert_interval != null ? String(freshNodo.instability_alert_interval) : '300'
        });

        setMostrarFormulario(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(err => {
        console.error('Error loading node for edit:', err);
        // Fallback to list data if individual fetch fails
        setEditandoId(nodo.id);
        setNombreNodo(nodo.nombre_es || nodo.nombre || '');
        setSerialNumber(nodo.serial_number || '');
        setUbicacionId(nodo.ubicacion_id != null ? String(nodo.ubicacion_id) : '');
        setCategoria(nodo.categoria_es || nodo.categoria || '');
        const fallbackLecturas = (nodo.lecturas && nodo.lecturas.length > 0)
          ? nodo.lecturas.map(l => ({ sensor: l.sensor || 'Sensor Integrado', data_type: l.data_type, tipo: l.tipo_es || l.tipo, unidad: l.unidad }))
          : [{ sensor: '', data_type: '', tipo: 'Temperatura', unidad: '\u00b0C' }];
        setLecturas(fallbackLecturas);
        setBroker(nodo.broker ?? 'broker.hivemq.com');
        setPort(nodo.port != null ? String(nodo.port) : '1883');
        setTopicData(nodo.topic_data ?? '');
        setClientId(nodo.client_id ?? '');
        setUsername(nodo.username ?? '');
        setPassword(nodo.password ?? '');
        setUseMqttV5(nodo.use_mqtt_v5 ?? false);
        setIsSimulated(nodo.is_simulated ?? false);
        setSaveFrequency(nodo.save_frequency != null ? String(nodo.save_frequency) : '30');
        setInstabilityAlertInterval(nodo.instability_alert_interval != null ? String(nodo.instability_alert_interval) : '300');
        setInitialState(null);
        setMostrarFormulario(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
  };

  const eliminarNodo = (id) => {
    Swal.fire({
      title: isEn ? 'Are you sure?' : '¿Estás seguro?',
      text: isEn ? 'This action cannot be undone and will unlink this node from the system.' : 'Esta acción no se puede deshacer y desvinculará este nodo del sistema.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: isEn ? 'Yes, delete' : 'Sí, eliminar',
      cancelButtonText: isEn ? 'Cancel' : 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // API DELETE
        fetchWithAuth(`${API_BASE_URL}/nodos/${id}`, { method: 'DELETE' })
          .then(() => {
            const listaActualizada = nodosRegistrados.filter(nodo => nodo.id !== id);
            setNodosRegistrados(listaActualizada);

            Swal.fire({
              icon: 'success',
              title: isEn ? 'Deleted!' : '¡Eliminado!',
              text: isEn ? 'The node has been removed from the system.' : 'El nodo ha sido removido del sistema.',
              confirmButtonColor: '#ff9f1c'
            });

            if (editandoId === id) {
              limpiarFormulario();
              setMostrarFormulario(false);
            }
          })
          .catch(err => {
            console.error("Error deleting node:", err);
            Swal.fire({
              icon: 'error',
              title: isEn ? 'Network Error' : 'Error de Red',
              text: isEn ? 'Could not delete node in database.' : 'No se pudo eliminar el nodo en la base de datos.',
              confirmButtonColor: '#ff9f1c'
            });
          });
      }
    });
  };


  const limpiarFormulario = () => {
    setEditandoId(null);
    setNombreNodo('');
    setSerialNumber('');
    setUbicacionId('');
    setCategoria('');
    setLecturas([]);
    setSensorCards([]);
    setBroker('broker.hivemq.com');
    setPort('1883');
    setTopicData('');
    setClientId('');
    setUsername('');
    setPassword('');
    setUseMqttV5(false);
    setIsSimulated(false);
    setSaveFrequency('30');
    setInstabilityAlertInterval('300');
    setInitialState(null);
  };

  const obtenerCambiosDetallados = () => {
    if (!initialState) return '';
    const cambios = [];

    const labelNombre = isEn ? 'Name' : 'Nombre';
    const labelSerial = isEn ? 'Serial' : 'Serial';
    const labelUbicacion = isEn ? 'Location' : 'Ubicación';
    const labelCategoria = isEn ? 'Category' : 'Categoría';
    const labelBroker = isEn ? 'Broker' : 'Broker';
    const labelPuerto = isEn ? 'Port' : 'Puerto';
    const labelTopic = isEn ? 'MQTT Topic' : 'Topic MQTT';
    const labelClient = isEn ? 'Client ID' : 'Client ID';
    const labelUser = isEn ? 'MQTT User' : 'Usuario MQTT';
    const labelPass = isEn ? 'MQTT Password' : 'Clave MQTT';
    const labelV5 = isEn ? 'MQTT v5' : 'MQTT v5';
    const labelSim = isEn ? 'Simulated' : 'Simulado';
    const labelFrec = isEn ? 'Save Freq.' : 'Frec. Guardado';
    const labelAlert = isEn ? 'Alert Freq.' : 'Frec. Alerta';
    const labelMetricas = isEn ? 'Metrics' : 'Métricas';

    const textEmpty = isEn ? '(empty)' : '(vacío)';
    const textAuto = isEn ? '(automatic)' : '(automático)';
    const textYes = isEn ? 'Yes' : 'Sí';
    const textNo = isEn ? 'No' : 'No';

    if (nombreNodo !== initialState.nombreNodo) cambios.push(`<b>${labelNombre}:</b> ${initialState.nombreNodo || textEmpty} &rarr; ${nombreNodo}`);
    if (serialNumber !== initialState.serialNumber) cambios.push(`<b>${labelSerial}:</b> ${initialState.serialNumber || textEmpty} &rarr; ${serialNumber}`);
    if (String(ubicacionId) !== String(initialState.ubicacionId)) {
      const ubiAntes = ubicaciones.find(u => String(u.id) === String(initialState.ubicacionId))?.nombre || textEmpty;
      const ubiDespues = ubicaciones.find(u => String(u.id) === String(ubicacionId))?.nombre || textEmpty;
      cambios.push(`<b>${labelUbicacion}:</b> ${ubiAntes} &rarr; ${ubiDespues}`);
    }
    if (categoria !== initialState.categoria) cambios.push(`<b>${labelCategoria}:</b> ${initialState.categoria || textEmpty} &rarr; ${categoria}`);

    if (broker !== initialState.broker) cambios.push(`<b>${labelBroker}:</b> ${initialState.broker} &rarr; ${broker}`);
    if (String(port) !== String(initialState.port)) cambios.push(`<b>${labelPuerto}:</b> ${initialState.port} &rarr; ${port}`);
    if (topicData !== initialState.topicData) cambios.push(`<b>${labelTopic}:</b> ${initialState.topicData} &rarr; ${topicData}`);
    if (clientId !== initialState.clientId) cambios.push(`<b>${labelClient}:</b> ${initialState.clientId || textAuto} &rarr; ${clientId || textAuto}`);
    if (username !== initialState.username) cambios.push(`<b>${labelUser}:</b> ${initialState.username || textEmpty} &rarr; ${username || textEmpty}`);
    if (password !== initialState.password) cambios.push(`<b>${labelPass}:</b> ${(initialState.password ? '****' : textEmpty)} &rarr; ${(password ? '****' : textEmpty)}`);

    if (useMqttV5 !== initialState.useMqttV5) cambios.push(`<b>${labelV5}:</b> ${initialState.useMqttV5 ? textYes : textNo} &rarr; ${useMqttV5 ? textYes : textNo}`);
    if (isSimulated !== initialState.isSimulated) cambios.push(`<b>${labelSim}:</b> ${initialState.isSimulated ? textYes : textNo} &rarr; ${isSimulated ? textYes : textNo}`);
    if (saveFrequency !== initialState.saveFrequency) cambios.push(`<b>${labelFrec}:</b> ${initialState.saveFrequency}s &rarr; ${saveFrequency}s`);
    if (instabilityAlertInterval !== initialState.instabilityAlertInterval) cambios.push(`<b>${labelAlert}:</b> ${initialState.instabilityAlertInterval}s &rarr; ${instabilityAlertInterval}s`);

    if (JSON.stringify(sensorCards) !== JSON.stringify(initialState.sensorCards)) {
      const msgMetricas = isEn
        ? `Sensors & Metrics updated (${(initialState.sensorCards || []).length} sensors &rarr; ${sensorCards.length} sensors)`
        : `Sensores y Métricas actualizados (${(initialState.sensorCards || []).length} sensores &rarr; ${sensorCards.length} sensores)`;
      cambios.push(`<b>${labelMetricas}:</b> ${msgMetricas}`);
    }

    if (cambios.length === 0) return '';

    const headerTitle = isEn ? 'Registered changes (BEFORE &rarr; AFTER):' : 'Cambios registrados (ANTES &rarr; DESPUÉS):';
    return `<div style="text-align: left; font-size: 0.9rem; max-height: 200px; overflow-y: auto; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 10px;">
      <p style="font-weight: 600; margin-bottom: 8px; color: #0f172a;">${headerTitle}</p>
      <ul style="margin: 0; padding-left: 20px; color: #334155;">
        ${cambios.map(c => `<li style="margin-bottom: 4px;">${c}</li>`).join('')}
      </ul>
    </div>`;
  };

  const confirmarCerrar = () => {
    let tieneCambios = false;
    if (editandoId !== null && initialState) {
      const isCardsSame = JSON.stringify(sensorCards) === JSON.stringify(initialState.sensorCards);
      tieneCambios =
        nombreNodo !== initialState.nombreNodo ||
        serialNumber !== initialState.serialNumber ||
        String(ubicacionId) !== String(initialState.ubicacionId) ||
        categoria !== initialState.categoria ||
        broker !== initialState.broker ||
        String(port) !== String(initialState.port) ||
        topicData !== initialState.topicData ||
        clientId !== initialState.clientId ||
        username !== initialState.username ||
        password !== initialState.password ||
        useMqttV5 !== initialState.useMqttV5 ||
        isSimulated !== initialState.isSimulated ||
        saveFrequency !== initialState.saveFrequency ||
        instabilityAlertInterval !== initialState.instabilityAlertInterval ||
        !isCardsSame;
    } else {
      tieneCambios = nombreNodo.trim() !== '' || serialNumber.trim() !== '' || ubicacionId !== '' || categoria !== '' || (sensorCards && sensorCards.length > 0);
    }

    if (tieneCambios) {
      const cambiosHtml = editandoId ? obtenerCambiosDetallados() : '';
      Swal.fire({
        title: t("common.discard_title", isEn ? "Discard changes?" : "¿Descartar cambios?"),
        html: `${t("common.discard_text", isEn ? "There are unsaved form data. If you leave, unsaved changes will be lost." : "Hay datos en el formulario. Si sales, se perderán los cambios no guardados.")}<br/>${cambiosHtml}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#4b5563',
        confirmButtonText: t("common.yes_exit", isEn ? "Yes, leave" : "Sí, salir"),
        cancelButtonText: t("common.keep_editing", isEn ? "Keep editing" : "Seguir editando")
      }).then((result) => {
        if (result.isConfirmed) {
          cerrarFormulario();
        }
      });
    } else {
      cerrarFormulario();
    }
  };

  const cerrarFormulario = () => {
    limpiarFormulario();
    setMostrarFormulario(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('accion');
    newParams.delete('editar');
    setSearchParams(newParams);
  };

  const abrirCreacion = () => {
    limpiarFormulario();
    if (categoriaFiltro) {
      setCategoria(categoriaFiltro);
    }
    setMostrarFormulario(true);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('editar');
    newParams.set('accion', 'crear');
    setSearchParams(newParams);
  };

  // Helper to construct dynamic button text
  const obtenerTextoFiltro = () => {
    const filtrosActivos = [];
    if (filtroUbicacion) {
      const u = ubicaciones.find(x => x.id.toString() === filtroUbicacion.toString());
      if (u) filtrosActivos.push(u.nombre);
    }
    if (filtroCategoria) {
      filtrosActivos.push(filtroCategoria);
    }
    if (ordenFecha === 'asc') {
      filtrosActivos.push('Antiguos');
    } else if (ordenFecha === 'desc') {
      filtrosActivos.push('Recientes');
    } else if (ordenFecha === 'name_asc') {
      filtrosActivos.push('A-Z');
    } else if (ordenFecha === 'name_desc') {
      filtrosActivos.push('Z-A');
    }
    return filtrosActivos.join(' • ');
  };

  const iniciarVerificacionConexion = (nodeId, nodeName) => {
    setShowTerminal(true);
    setTerminalStatus('waiting');
    setTerminalCountdown(60);
    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] Inicializando conexión para nodo: ${nodeName}...`,
      `[${new Date().toLocaleTimeString()}] Esperando tráfico MQTT nuevo en el backend...`
    ]);

    let timeLeft = 60;
    let lastKnownTime = new Date().getTime(); // Fallback

    // Obtenemos el timestamp exacto que tiene la BD en este momento
    fetch(`${API_BASE_URL}/lecturas/ultimas?node_id=${nodeId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0 && data[0].fecha) {
          lastKnownTime = new Date(data[0].fecha).getTime();
        }
      })
      .catch(() => { });

    const timerInterval = setInterval(() => {
      timeLeft -= 1;
      setTerminalCountdown(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        clearInterval(pollInterval);
        setTerminalStatus('failed');
        setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ Tiempo agotado. No se recibieron datos. El nodo quedará inactivo.`]);

        fetch(`${API_BASE_URL}/nodos/${nodeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: false })
        }).then(() => {
          setNodosRegistrados(prev => prev.map(n => n.id === nodeId ? { ...n, estado: false } : n));
        });
      }
    }, 1000);

    const pollInterval = setInterval(() => {
      fetch(`${API_BASE_URL}/lecturas/ultimas?node_id=${nodeId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const hasData = data.some(d => d.valor !== null);
            const readingTime = data[0].fecha ? new Date(data[0].fecha).getTime() : 0;

            // Verificamos que el tiempo del dato sea ESTRICTAMENTE MAYOR al que había cuando empezamos
            if (hasData && readingTime > lastKnownTime) {
              clearInterval(timerInterval);
              clearInterval(pollInterval);
              setTerminalStatus('success');

              // Reconstruir un objeto de payload bonito con TODAS las variables
              const payloadReconstruido = data.reduce((acc, curr) => {
                if (curr.valor !== null) {
                  acc[curr.clave_mqtt] = curr.valor;
                }
                return acc;
              }, {});

              setTerminalLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString()}] ✅ ¡Datos nuevos recibidos exitosamente!`,
                `Payload recibido: ${JSON.stringify(payloadReconstruido)}`
              ]);
            } else {
              setTerminalLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] Escuchando... (Descartando datos antiguos)`]);
            }
          }
        })
        .catch(err => console.error("Error polling terminal", err));
    }, 3000);
  };

  // Filtrado y Ordenamiento Dinámico de Nodos
  const nodosFiltrados = useMemo(() => {
    return nodosRegistrados
      .filter(n => {
        const matchBusqueda = (n.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
          (n.serial_number || '').toLowerCase().includes(busqueda.toLowerCase());

        const matchUbi = filtroUbicacion ? n.ubicacion_id.toString() === filtroUbicacion.toString() : true;
        const matchCat = filtroCategoria
          ? n.categoria === filtroCategoria
          : (categoriaFiltro ? n.categoria?.toLowerCase() === categoriaFiltro.toLowerCase() : true);

        return matchBusqueda && matchUbi && matchCat;
      })
      .sort((a, b) => {
        if (ordenFecha === 'name_asc') return (a.nombre || '').localeCompare(b.nombre || '');
        if (ordenFecha === 'name_desc') return (b.nombre || '').localeCompare(a.nombre || '');
        if (ordenFecha === 'asc') return Number(a.id) - Number(b.id);
        return Number(b.id) - Number(a.id);
      });
  }, [nodosRegistrados, busqueda, filtroUbicacion, filtroCategoria, categoriaFiltro, ordenFecha]);

  const totalPages = Math.ceil(nodosFiltrados.length / itemsPerPage) || 1;

  const paginatedNodos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return nodosFiltrados.slice(start, start + itemsPerPage);
  }, [nodosFiltrados, currentPage, itemsPerPage]);

  return (
    <div className="iot-container">

      {/* MODO FORMULARIO: REGISTRO / EDICIÓN */}
      {mostrarFormulario ? (
        <div>
          {/* ── Cabecera del formulario ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>

            {/* Título con icono */}
            <h2 className="iot-title" style={{ margin: 0 }}>
              {editandoId ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#0f2c59' }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#0f2c59' }}>
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              )}
              {editandoId ? (isEn ? 'Modify Sensor Node' : 'Modificar Nodo Sensor') : (isEn ? 'Register New Node' : 'Registrar Nuevo Nodo')}
            </h2>

            {/* Botón volver con flecha SVG */}
            <button
              onClick={confirmarCerrar}
              className="navy-btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              {isEn ? 'Back to List' : 'Volver al Listado'}
            </button>
          </div>


          <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault(); }} className="space-y-6">

            {/* 1. Datos Generales */}
            <div className="form-section-title">
              <span className="title-number">01</span>
              <h4>{isEn ? 'General Device Information' : 'Información General del Dispositivo'}</h4>
            </div>
            <div className="iot-section-box iot-grid">
              <div>
                <label className="iot-label">{isEn ? 'Station / Node Name' : 'Nombre de la Estación / Nodo'}</label>
                <input
                  type="text"
                  value={nombreNodo}
                  onChange={(e) => setNombreNodo(e.target.value)}
                  placeholder={isEn ? 'FCVT Weather Station' : 'Estación Meteorológica FCVT'}
                  className="iot-input"
                />
              </div>
              <div>
                <label className="iot-label">{isEn ? 'Serial Number (MQTT Unique ID)' : 'Número de Serie (MQTT Unique ID)'}</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="ESP32-WROOM-01"
                  className="iot-input"
                />
              </div>
              <div className="ubi-dropdown-container custom-dropdown-container">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <div
                      className={`custom-dropdown-input ${isUbiDropdownOpen ? 'active' : ''} ${!ubicacionId ? 'empty' : ''}`}
                      onClick={() => setIsUbiDropdownOpen(!isUbiDropdownOpen)}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', marginRight: '6px', fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{isEn ? 'CAMPUS LOCATION:' : 'UBICACIÓN GEOGRÁFICA CAMPUS:'}</span>
                        <span style={{ fontWeight: '600', color: ubicacionId ? '#0f172a' : '#94a3b8' }}>
                          {ubicacionId ? ubicaciones.find(u => u.id == ubicacionId)?.nombre : (isEn ? '-- Select --' : '-- Seleccionar --')}
                        </span>
                      </span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ transform: isUbiDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#64748b' }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                    {isUbiDropdownOpen && (
                      <div className="custom-dropdown-menu">
                        {ubicaciones.map((u) => (
                          <div
                            key={u.id}
                            className={`custom-dropdown-item ${ubicacionId == u.id ? 'selected' : ''}`}
                            onClick={() => { setUbicacionId(u.id); setIsUbiDropdownOpen(false); }}
                          >
                            {u.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/${language}/admin/${isEn ? 'locations' : 'ubicaciones'}`)}
                    className="btn-add-inline"
                    title={isEn ? "Add new location" : "Añadir nueva ubicación"}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="cat-dropdown-container custom-dropdown-container">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <div
                      className={`custom-dropdown-input ${isCatDropdownOpen ? 'active' : ''} ${!categoria ? 'empty' : ''}`}
                      onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', marginRight: '6px', fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{isEn ? 'RESEARCH LINE (CATEGORY):' : 'LÍNEA DE INVESTIGACIÓN (CATEGORÍA):'}</span>
                        <span style={{ fontWeight: '600', color: categoria ? '#0f172a' : '#94a3b8' }}>
                          {categoria ? categoria : (isEn ? '-- Select --' : '-- Seleccionar --')}
                        </span>
                      </span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ transform: isCatDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#64748b' }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                    {isCatDropdownOpen && (
                      <div className="custom-dropdown-menu">
                        {categorias.map((c) => (
                          <div
                            key={c.id}
                            className={`custom-dropdown-item ${categoria == c.nombre ? 'selected' : ''}`}
                            onClick={() => { setCategoria(c.nombre); setIsCatDropdownOpen(false); }}
                          >
                            {c.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/${language}/admin/${isEn ? 'categories' : 'categorias'}`)}
                    className="btn-add-inline"
                    title={isEn ? "Add new category" : "Añadir nueva categoría"}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="frec-dropdown-container custom-dropdown-container">
                <div style={{ position: 'relative' }}>
                  <div
                    className={`custom-dropdown-input ${isFrecDropdownOpen ? 'active' : ''}`}
                    onClick={() => setIsFrecDropdownOpen(!isFrecDropdownOpen)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', marginRight: '6px', fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{isEn ? 'DB SAVE FREQUENCY:' : 'FRECUENCIA DE GUARDADO EN BD:'}</span>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>
                        {
                          [
                            { v: '30', l: isEn ? 'Every 30 seconds' : 'Cada 30 segundos' },
                            { v: '60', l: isEn ? 'Every 1 minute' : 'Cada 1 minuto' },
                            { v: '120', l: isEn ? 'Every 2 minutes' : 'Cada 2 minutos' },
                            { v: '300', l: isEn ? 'Every 5 minutes' : 'Cada 5 minutos' }
                          ].find(o => o.v === saveFrequency)?.l
                        }
                      </span>
                    </span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ transform: isFrecDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#64748b' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  {isFrecDropdownOpen && (
                    <div className="custom-dropdown-menu">
                      <div className="frec-grid">
                        {[
                          { v: '30', l: isEn ? 'Every 30 sec' : 'Cada 30 seg' },
                          { v: '60', l: isEn ? 'Every 1 min' : 'Cada 1 min' },
                          { v: '120', l: isEn ? 'Every 2 min' : 'Cada 2 min' },
                          { v: '300', l: isEn ? 'Every 5 min' : 'Cada 5 min' }
                        ].map(opt => (
                          <button
                            key={opt.v}
                            type="button"
                            className={`frec-btn ${saveFrequency === opt.v ? 'selected' : ''}`}
                            onClick={() => {
                              const newSaveVal = opt.v;
                              setSaveFrequency(newSaveVal);
                              setIsFrecDropdownOpen(false);
                              if (parseInt(instabilityAlertInterval, 10) < parseInt(newSaveVal, 10)) {
                                setInstabilityAlertInterval(newSaveVal);
                              }
                            }}
                          >
                            {opt.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="frec-dropdown-container custom-dropdown-container">
                <div style={{ position: 'relative' }}>
                  <div
                    className={`custom-dropdown-input ${isAlertIntervalDropdownOpen ? 'active' : ''}`}
                    onClick={() => setIsAlertIntervalDropdownOpen(!isAlertIntervalDropdownOpen)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', marginRight: '6px', fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{isEn ? 'INSTABILITY ALERT EVERY:' : 'ALERTA POR INESTABILIDAD CADA:'}</span>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>
                        {
                          [
                            { v: '30', l: isEn ? '30 seconds' : '30 segundos' },
                            { v: '60', l: isEn ? '1 minute' : '1 minuto' },
                            { v: '120', l: isEn ? '2 minutes' : '2 minutos' },
                            { v: '180', l: isEn ? '3 minutes' : '3 minutos' },
                            { v: '300', l: isEn ? '5 minutes' : '5 minutos' },
                            { v: '600', l: isEn ? '10 minutes' : '10 minutos' },
                            { v: '1200', l: isEn ? '20 minutes' : '20 minutos' },
                            { v: '1800', l: isEn ? '30 minutes' : '30 minutos' },
                            { v: '3600', l: isEn ? '1 hour' : '1 hora' }
                          ].find(o => o.v === instabilityAlertInterval)?.l || (isEn ? '5 minutes' : '5 minutos')
                        }
                      </span>
                    </span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ transform: isAlertIntervalDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#64748b' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  {isAlertIntervalDropdownOpen && (
                    <div className="custom-dropdown-menu">
                      <div className="frec-grid">
                        {[
                          { v: '30', l: isEn ? '30 sec' : '30 seg', sec: 30 },
                          { v: '60', l: isEn ? '1 min' : '1 min', sec: 60 },
                          { v: '120', l: isEn ? '2 min' : '2 min', sec: 120 },
                          { v: '180', l: isEn ? '3 min' : '3 min', sec: 180 },
                          { v: '300', l: isEn ? '5 min' : '5 min', sec: 300 },
                          { v: '600', l: isEn ? '10 min' : '10 min', sec: 600 },
                          { v: '1200', l: isEn ? '20 min' : '20 min', sec: 1200 },
                          { v: '1800', l: isEn ? '30 min' : '30 min', sec: 1800 },
                          { v: '3600', l: isEn ? '1 hour' : '1 hora', sec: 3600 }
                        ]
                          .filter(opt => opt.sec >= (parseInt(saveFrequency, 10) || 30))
                          .map(opt => (
                            <button
                              key={opt.v}
                              type="button"
                              className={`frec-btn ${instabilityAlertInterval === opt.v ? 'selected' : ''}`}
                              onClick={() => { setInstabilityAlertInterval(opt.v); setIsAlertIntervalDropdownOpen(false); }}
                            >
                              {opt.l}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Credenciales de Conexión MQTT */}
            <div className="form-section-title mt-6">
              <span className="title-number">02</span>
              <h4>{isEn ? 'MQTT Connection Parameters' : 'Parámetros de Conexión MQTT'}</h4>
            </div>

            <div className="iot-section-box space-y-4">

              {/* Checkbox de Nodo Simulado */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                background: isSimulated ? '#f0fdf4' : '#f8fafc',
                border: `1.5px solid ${isSimulated ? '#86efac' : '#cbd5e1'}`,
                borderRadius: '10px',
                transition: 'all 0.2s ease',
                marginBottom: '1rem'
              }}>
                <input
                  type="checkbox"
                  id="isSimulatedCheckbox"
                  checked={isSimulated}
                  onChange={(e) => setIsSimulated(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: '#16a34a', cursor: 'pointer' }}
                />
                <label htmlFor="isSimulatedCheckbox" style={{ cursor: 'pointer', margin: 0, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.95rem', color: isSimulated ? '#15803d' : '#334155' }}>
                    {isEn ? '⚡ Simulated Node (Automatic Data Generation)' : '⚡ Nodo Simulado (Generación Automática de Datos)'}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    {isEn
                      ? 'If enabled, SIMULATOR_MANAGER.py will start generating and emitting randomized test telemetry within configured min/max stability thresholds.'
                      : 'Si está activado, SIMULATOR_MANAGER.py comenzará a generar y emitir telemetría de prueba con valores aleatorios dentro de los rangos min/máx esperados.'}
                  </span>
                </label>
              </div>

              <div className="iot-grid">
                <div>
                  <label className="iot-label">{isEn ? 'MQTT Broker' : 'Broker MQTT'}</label>
                  <input
                    type="text"
                    value={broker}
                    onChange={(e) => setBroker(e.target.value)}
                    placeholder="broker.hivemq.com"
                    className="iot-input"
                  />
                </div>
                <div>
                  <label className="iot-label">{isEn ? 'Port' : 'Puerto'}</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="1883"
                    className="iot-input"
                  />
                </div>
                <div>
                  <label className="iot-label">{isEn ? 'MQTT Topic (Data)' : 'Topic MQTT (Datos)'}</label>
                  <input
                    type="text"
                    value={topicData}
                    onChange={(e) => setTopicData(e.target.value)}
                    placeholder="iot_uleam/laboratorio"
                    className="iot-input"
                  />
                </div>
                <div>
                  <label className="iot-label">{isEn ? 'Client ID (Optional)' : 'Client ID (Opcional)'}</label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder={isEn ? 'Leave empty to generate automatically' : 'Dejar vacío para generar uno automático'}
                    className="iot-input"
                  />
                </div>
                <div>
                  <label className="iot-label">{isEn ? 'MQTT Username (Optional)' : 'Usuario MQTT (Opcional)'}</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="mqtt-user"
                    className="iot-input"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck="false"
                  />
                </div>
                <div>
                  <label className="iot-label">{isEn ? 'MQTT Password (Optional)' : 'Contraseña MQTT (Opcional)'}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="iot-input"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <input
                  type="checkbox"
                  id="use_mqtt_v5"
                  checked={useMqttV5}
                  onChange={(e) => setUseMqttV5(e.target.checked)}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: '#0f172a', cursor: 'pointer' }}
                />
                <label htmlFor="use_mqtt_v5" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  {isEn ? 'Use MQTT v5 protocol (Uncheck for v3.1.1)' : 'Utilizar protocolo MQTT v5 (Desmarcar para v3.1.1)'}
                </label>
              </div>
            </div>

            {/* 3. Parametrización de Sensores y Métricas */}
            <div className="form-section-title mt-6">
              <span className="title-number">03</span>
              <h4>{isEn ? 'Sensors & Metrics Configuration' : 'Configuración de Sensores y Métricas'}</h4>
            </div>

            <div className="iot-section-box space-y-6">
              {/* Selector de Sensores principales (Combobox) */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1.5px dashed #cbd5e1' }}>
                <label className="iot-label" style={{ marginBottom: '8px' }}>
                  {isEn ? 'Assign or Create Sensor for Node' : 'Asignar o Crear Sensor para el Nodo'}
                </label>
                <Combobox
                  options={sensorsList}
                  placeholder={isEn ? 'Type to search or create sensor (e.g. DHT22, BME280)...' : 'Escribe para buscar o crear sensor (ej. DHT22, BME280)...'}
                  allowCreate={true}
                  createLabelPrefix={isEn ? "CREATE SENSOR" : "CREAR SENSOR"}
                  noOptionsMessage={isEn ? "No matching sensors found" : "No se encontraron sensores coincidentes"}
                  onChange={(selected) => {
                    if (selected) handleAddExistingSensor(selected);
                  }}
                  onCreate={(name) => handleCreateSensorCard(name)}
                />
              </div>

              {/* Tarjetas por Sensor */}
              {sensorCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '0.92rem' }}>
                    {isEn ? 'No sensors assigned to this node yet.' : 'Aún no has asignado sensores a este nodo.'}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    {isEn ? 'Use the search input above to select an existing sensor model or create a new one.' : 'Usa el buscador de arriba para seleccionar un modelo de sensor o crear uno nuevo.'}
                  </p>
                </div>
              ) : (
                sensorCards.map((card, cIdx) => (
                  <div key={cIdx} className="sensor-card">
                    <div className="sensor-card-header">
                      <div className="sensor-card-title">
                        <span className="sensor-card-name">📟 {card.name}</span>
                        {card.brand && <span className="sensor-card-brand">{card.brand}</span>}
                      </div>
                      <div className="sensor-card-actions">
                        <button
                          type="button"
                          className="btn-add-metric-card"
                          onClick={() => handleAddMetricToCard(cIdx)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          {isEn ? 'Add Metric' : 'Agregar Métrica'}
                        </button>
                        <button
                          type="button"
                          className="btn-delete-row"
                          onClick={() => handleRemoveSensorCard(cIdx)}
                          title={isEn ? 'Remove Sensor' : 'Eliminar Sensor'}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="sensor-card-body">
                      {card.metrics.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                          {isEn ? 'No metrics assigned yet. Click "+ Add Metric" above.' : 'Sin métricas asignadas aún. Haz clic en "+ Agregar Métrica".'}
                        </p>
                      ) : (
                        card.metrics.map((metric, mIdx) => (
                          <div key={mIdx} className="metric-row" style={{ borderLeftColor: '#2563eb' }}>
                            {/* 1. Métrica Combobox */}
                            <div className="metric-col" style={{ flex: 1.5 }}>
                              <label className="metric-label">{isEn ? 'Metric' : 'Métrica'}</label>
                              <Combobox
                                value={metric.metric_id
                                  ? { id: metric.metric_id, name: metric.name, label: metric.name }
                                  : metric.name}
                                options={metricsList.map(m => ({
                                  ...m,
                                  name: isEn ? (m.name_en || m.name) : m.name,
                                  label: isEn ? (m.name_en || m.name) : m.name
                                }))}
                                placeholder={isEn ? 'Select metric...' : 'Seleccionar métrica...'}
                                allowCreate={false}
                                noOptionsMessage={isEn ? "No metrics found. Please register it in 'Manage Metrics'." : "Métrica no encontrada. Por favor regístrala en 'Métricas de Nodos'."}
                                onChange={(selected) => handleSelectMetricForRow(cIdx, mIdx, selected)}
                              />
                            </div>

                            {/* 2. Unidad Select Dropdown (Editable con desplegable de subvariables de la métrica) */}
                            <div className="metric-col" style={{ flex: 1 }}>
                              <label className="metric-label">{isEn ? 'Unit' : 'Unidad'}</label>
                              {metric.available_units && metric.available_units.length > 0 ? (
                                <select
                                  value={metric.unit || ''}
                                  onChange={(e) => handleSelectUnitForRow(cIdx, mIdx, e.target.value)}
                                  className="iot-input"
                                  style={{
                                    background: '#ffffff',
                                    border: '1.5px solid #10b981',
                                    color: '#065f46',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    padding: '0.6rem 0.75rem'
                                  }}
                                >
                                  {metric.available_units.map((u, uIdx) => (
                                    <option key={uIdx} value={u.unit}>
                                      {u.unit} ({isEn ? (u.name_en || u.name) : u.name})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={metric.unit || ''}
                                  onChange={(e) => handleSelectUnitForRow(cIdx, mIdx, e.target.value)}
                                  placeholder="°C / % / ppm"
                                  className="iot-input"
                                  style={{ background: '#ffffff', color: '#0f2c59', fontWeight: '700' }}
                                />
                              )}
                            </div>

                            {/* 3. JSON Key Combobox */}
                            <div className="metric-col" style={{ flex: 1.5 }}>
                              <label className="metric-label">{isEn ? 'MQTT / JSON Key' : 'Clave MQTT / JSON'}</label>
                              <Combobox
                                value={metric.json_key}
                                options={(metric.available_keys || []).map(k => ({
                                  label: typeof k === 'string' ? k : k.key_name,
                                  value: typeof k === 'string' ? k : k.key_name,
                                  is_standard: typeof k === 'object' ? Boolean(k.is_standard) : false
                                }))}
                                placeholder={isEn ? 'Select or type key...' : 'Seleccionar o escribir clave...'}
                                allowCreate={true}
                                createLabelPrefix={isEn ? "CREATE KEY" : "CREAR LLAVE"}
                                noOptionsMessage={isEn ? "No matching keys found" : "No se encontraron claves coincidentes"}
                                onChange={(selected) => {
                                  const keyVal = typeof selected === 'object' ? (selected.label || selected.key_name) : selected;
                                  setSensorCards(prev => {
                                    const next = JSON.parse(JSON.stringify(prev));
                                    next[cIdx].metrics[mIdx].json_key = keyVal;
                                    return next;
                                  });
                                }}
                                onCreate={(newKey) => handleCreateJsonKey(cIdx, mIdx, newKey)}
                              />
                            </div>

                            {/* 4. Min Expected Input */}
                            <div className="metric-col" style={{ flex: 0.9 }}>
                              <label className="metric-label">{isEn ? 'Min. Expected' : 'Mín. Esperado'}</label>
                              <input
                                type="number"
                                step="any"
                                value={metric.min_expected ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSensorCards(prev => {
                                    const next = JSON.parse(JSON.stringify(prev));
                                    next[cIdx].metrics[mIdx].min_expected = val;
                                    return next;
                                  });
                                }}
                                placeholder={isEn ? 'e.g. 0' : 'ej. 0'}
                                className="iot-input"
                              />
                            </div>

                            {/* 5. Max Expected Input */}
                            <div className="metric-col" style={{ flex: 0.9 }}>
                              <label className="metric-label">{isEn ? 'Max. Expected' : 'Máx. Esperado'}</label>
                              <input
                                type="number"
                                step="any"
                                value={metric.max_expected ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSensorCards(prev => {
                                    const next = JSON.parse(JSON.stringify(prev));
                                    next[cIdx].metrics[mIdx].max_expected = val;
                                    return next;
                                  });
                                }}
                                placeholder={isEn ? 'e.g. 100' : 'ej. 100'}
                                className="iot-input"
                              />
                            </div>

                            {/* 6. Symbol Image Display (Locked Thumbnail) */}
                            <div className="metric-col" style={{ flex: 0.8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <label className="metric-label" style={{ width: '100%', textAlign: 'center' }}>{isEn ? 'Symbol' : 'Símbolo'}</label>
                              <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '8px',
                                background: '#f8fafc',
                                border: '1.5px solid #cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px',
                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)'
                              }} title={metric.symbol_image || '/symbols/default.webp'}>
                                <img
                                  src={formatImageUrl(metric.symbol_image || '/symbols/default.webp')}
                                  alt="Símbolo"
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = iotLogoDefault;
                                  }}
                                />
                              </div>
                            </div>

                            {/* 7. Delete Button */}
                            <div className="metric-col-delete">
                              <button
                                type="button"
                                className="btn-delete-row"
                                onClick={() => handleRemoveMetricFromCard(cIdx, mIdx)}
                                title={isEn ? 'Delete metric' : 'Eliminar métrica'}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="form-actions-bar">
              <button
                type="button"
                onClick={confirmarCerrar}
                className="btn-secondary-outline"
              >
                {isEn ? 'Cancel' : 'Cancelar'}
              </button>
              <button type="submit" className="btn-submit-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {editandoId ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span>{isEn ? 'Save Changes' : 'Guardar Cambios'}</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
                    </svg>
                    <span>{isEn ? 'Complete Registration' : 'Completar Registro'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* MODO LISTADO DE NODOS ACTIVO (PRIMERA INTERFAZ) */
        <div>
          {/* ── TOOLBAR ÚNICA CON FILTROS SEPARADOS ESTILIZADOS ── */}
          <div className="nodos-toolbar" style={{ position: 'relative', zIndex: 30 }}>
            {/* Búsqueda */}
            <div className="search-box-wrapper" style={{ flex: '1 1 200px', minWidth: '160px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" className="search-box-icon">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder={isEn ? 'Name or MQTT serial...' : 'Nombre o serial MQTT...'}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="filter-input search-box-input"
              />
            </div>

            {/* Filtro Ubicación */}
            <div className="pub-news-filter-group nodos-filter-group-ubi" style={{ position: 'relative' }}>
              <button
                type="button"
                className={`pub-news-unified-filter-btn ${showUbiPanel ? 'open' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUbiPanel(!showUbiPanel);
                  setShowCatPanel(false);
                  setShowOrdenPanel(false);
                }}
                style={{ height: '42px', borderRadius: '12px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>
                  {filtroUbicacion
                    ? (ubicaciones.find(u => u.id.toString() === filtroUbicacion.toString())?.nombre || (isEn ? 'Filter Location' : 'Filtrar Ubicación'))
                    : (isEn ? 'Filter Location' : 'Filtrar Ubicación')}
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" className="select-arrow-icon">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showUbiPanel && (
                <div className="pub-news-unified-filter-panel" style={{ minWidth: '240px', left: 0 }}>
                  <div className="filter-panel-section" style={{ width: '100%' }}>
                    <span className="filter-panel-section-title">{isEn ? 'Location' : 'Ubicación'}</span>
                    <div className="filter-panel-options-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {ubicaciones.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          className={`filter-panel-option-item ${String(filtroUbicacion) === String(u.id) ? 'active' : ''}`}
                          onClick={() => {
                            if (String(filtroUbicacion) === String(u.id)) {
                              setFiltroUbicacion(null);
                            } else {
                              setFiltroUbicacion(String(u.id));
                            }
                            setShowUbiPanel(false);
                          }}
                        >
                          {u.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filtro Línea de Investigación */}
            {!categoriaFiltro && (
              <div className="pub-news-filter-group nodos-filter-group-cat" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className={`pub-news-unified-filter-btn ${showCatPanel ? 'open' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCatPanel(!showCatPanel);
                    setShowUbiPanel(false);
                    setShowOrdenPanel(false);
                  }}
                  style={{ height: '42px', borderRadius: '12px' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    <path d="M12 2 2 7 12 12 22 7 12 2v0zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span>
                    {filtroCategoria || (isEn ? 'Filter Line' : 'Filtrar Línea')}
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" className="select-arrow-icon">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {showCatPanel && (
                  <div className="pub-news-unified-filter-panel" style={{ minWidth: '240px', left: 0 }}>
                    <div className="filter-panel-section" style={{ width: '100%' }}>
                      <span className="filter-panel-section-title">{isEn ? 'Research Line' : 'Línea de Investigación'}</span>
                      <div className="filter-panel-options-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {categorias.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            className={`filter-panel-option-item ${filtroCategoria === c.nombre ? 'active' : ''}`}
                            onClick={() => {
                              if (filtroCategoria === c.nombre) {
                                setFiltroCategoria(null);
                              } else {
                                setFiltroCategoria(c.nombre);
                              }
                              setShowCatPanel(false);
                            }}
                          >
                            {c.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ordenamiento */}
            <div className="pub-news-filter-group nodos-filter-group-orden" style={{ position: 'relative' }}>
              <button
                type="button"
                className={`pub-news-unified-filter-btn ${showOrdenPanel ? 'open' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOrdenPanel(!showOrdenPanel);
                  setShowUbiPanel(false);
                  setShowCatPanel(false);
                }}
                style={{ height: '42px', borderRadius: '12px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
                <span>
                  {ordenFecha ? (
                    ordenFecha === 'desc' ? (isEn ? 'Newest' : 'Más Recientes') :
                      ordenFecha === 'asc' ? (isEn ? 'Oldest' : 'Más Antiguos') :
                        ordenFecha === 'name_asc' ? (isEn ? 'Name (A-Z)' : 'Nombre (A-Z)') : (isEn ? 'Name (Z-A)' : 'Nombre (Z-A)')
                  ) : (isEn ? 'Sort' : 'Ordenar')}
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" className="select-arrow-icon">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showOrdenPanel && (
                <div className="pub-news-unified-filter-panel" style={{ minWidth: '180px', left: 0 }}>
                  <div className="filter-panel-section" style={{ width: '100%' }}>
                    <span className="filter-panel-section-title">{isEn ? 'Sort by' : 'Ordenar por'}</span>
                    <div className="filter-panel-options-list">
                      <button
                        type="button"
                        className={`filter-panel-option-item ${ordenFecha === 'desc' ? 'active' : ''}`}
                        onClick={() => {
                          if (ordenFecha === 'desc') {
                            setOrdenFecha(null);
                          } else {
                            setOrdenFecha('desc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <polyline points="19 12 12 19 5 12" />
                        </svg>
                        <span>{isEn ? 'Newest' : 'Más recientes'}</span>
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${ordenFecha === 'asc' ? 'active' : ''}`}
                        onClick={() => {
                          if (ordenFecha === 'asc') {
                            setOrdenFecha(null);
                          } else {
                            setOrdenFecha('asc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                          <line x1="12" y1="19" x2="12" y2="5" />
                          <polyline points="5 12 12 5 19 12" />
                        </svg>
                        <span>{isEn ? 'Oldest' : 'Más antiguos'}</span>
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${ordenFecha === 'name_asc' ? 'active' : ''}`}
                        onClick={() => {
                          if (ordenFecha === 'name_asc') {
                            setOrdenFecha(null);
                          } else {
                            setOrdenFecha('name_asc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        {isEn ? 'Name (A-Z)' : 'Nombre (A-Z)'}
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${ordenFecha === 'name_desc' ? 'active' : ''}`}
                        onClick={() => {
                          if (ordenFecha === 'name_desc') {
                            setOrdenFecha(null);
                          } else {
                            setOrdenFecha('name_desc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        {isEn ? 'Name (Z-A)' : 'Nombre (Z-A)'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón Crear */}
            <button onClick={abrirCreacion} className="orange-btn-primary" style={{ flexShrink: 0, height: '42px', borderRadius: '12px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {isEn ? 'Create New Node' : 'Crear Nuevo Nodo'}
            </button>
          </div>

          {/* CARDS GRID DISPLAY & SKELETON LOADING */}
          {loadingNodos ? (
            <div className="node-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="node-card" style={{ borderColor: '#e2e8f0', opacity: 0.85, position: 'relative', overflow: 'hidden' }}>
                  <div className="node-card-header" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ height: '18px', width: '60%', background: '#e2e8f0', borderRadius: '6px' }} />
                      <div style={{ height: '16px', width: '25%', background: '#f1f5f9', borderRadius: '10px' }} />
                    </div>
                    <div style={{ height: '12px', width: '35%', background: '#f1f5f9', borderRadius: '4px' }} />
                  </div>
                  <div className="node-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                    <div style={{ height: '14px', width: '50%', background: '#f1f5f9', borderRadius: '4px' }} />
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <div style={{ height: '22px', width: '80px', background: '#f1f5f9', borderRadius: '12px' }} />
                      <div style={{ height: '22px', width: '100px', background: '#f1f5f9', borderRadius: '12px' }} />
                    </div>
                  </div>
                  <div className="node-card-actions" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <div style={{ height: '26px', width: '60px', background: '#f1f5f9', borderRadius: '6px' }} />
                    <div style={{ height: '26px', width: '60px', background: '#f1f5f9', borderRadius: '6px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : nodosFiltrados.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 border rounded-xl" style={{ padding: '3rem 1.5rem', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '14px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" width="44" height="44" style={{ margin: '0 auto 12px auto' }}>
                <rect x="2" y="2" width="20" height="8" rx="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" strokeWidth="3" />
                <line x1="6" y1="18" x2="6.01" y2="18" strokeWidth="3" />
              </svg>
              <p className="text-gray-500 italic text-sm" style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
                {isEn ? 'No registered nodes found matching the applied filters.' : 'No se encontraron nodos registrados que coincidan con los filtros aplicados.'}
              </p>
            </div>
          ) : (
            <>
              <div className="node-grid">
                {paginatedNodos.map((nodo) => {
                  const ubiInfo = ubicaciones.find(u => u.id != null && nodo.ubicacion_id != null && u.id.toString() === nodo.ubicacion_id.toString());
                  const catInfo = categorias.find(c => c.nombre === nodo.categoria);
                  const borderLineColor = catInfo?.colorHex || '#0f2c59';

                  return (
                    <div key={nodo.id} className="node-card" style={{ borderColor: '#e2e8f0', position: 'relative' }}>

                      <div className="node-card-header">
                        <div className="flex justify-between items-start gap-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 className="node-card-title">{nodo.nombre}</h4>
                          <span
                            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${borderLineColor}12`, // ~7% opacity hex
                              color: borderLineColor,
                              border: `1px solid ${borderLineColor}40`,
                              whiteSpace: 'nowrap',
                              fontSize: '10px'
                            }}
                          >
                            {nodo.categoria}
                          </span>
                        </div>
                        <div className="node-card-serial">
                          ID: {nodo.serial_number}
                        </div>
                      </div>

                      <div className="node-card-body">
                        {/* Clickable location tag to view node details & map modal */}
                        {ubiInfo ? (
                          <div
                            className="node-card-location"
                            onClick={() => setPreviewNode(nodo)}
                            style={{ cursor: 'pointer' }}
                            title={isEn ? "View location on map & sensor readings" : "Ver ubicación en el mapa y lecturas del sensor"}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" style={{ color: borderLineColor }}>
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{ubiInfo.nombre}</span>
                          </div>
                        ) : (
                          <div className="node-card-location" style={{ color: '#9ca3af' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{isEn ? 'Unknown Location' : 'Ubicación Desconocida'}</span>
                          </div>
                        )}

                        {/* Dynamic Metrics list tags preview */}
                        <div className="node-card-metrics">
                          {nodo.lecturas && nodo.lecturas.length > 0 ? (
                            nodo.lecturas.map((l, idx) => (
                              <span
                                className="metric-tag"
                                key={idx}
                                title={`MQTT key: ${l.data_type}`}
                              >
                                {l.tipo} ({l.unidad})
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">{isEn ? 'No metrics configured' : 'Sin métricas parametrizadas'}</span>
                          )}
                        </div>
                      </div>

                      <div className="node-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVerifyingNodeId(nodo.id);
                            iniciarVerificacionConexion(nodo.id, nodo.nombre);
                          }}
                          className="btn-action-verify"
                          style={{ background: '#0f2c59', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                          </svg>
                          {isEn ? 'Terminal' : 'Terminal'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cargarEdicion(nodo);
                          }}
                          className="btn-action-edit"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" style={{ marginRight: '4px', display: 'inline-block' }}>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          {isEn ? 'Edit' : 'Editar'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarNodo(nodo.id);
                          }}
                          className="btn-action-delete"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" style={{ marginRight: '4px', display: 'inline-block' }}>
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                          {isEn ? 'Delete' : 'Eliminar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PAGINACIÓN DE NODOS */}
              <div className="nodes-pagination-bar">
                <div className="pagination-info-text">
                  {isEn ? 'Showing ' : 'Mostrando '}
                  <strong>
                    {nodosFiltrados.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                  </strong>
                  {isEn ? ' to ' : ' a '}
                  <strong>
                    {Math.min(currentPage * itemsPerPage, nodosFiltrados.length)}
                  </strong>
                  {isEn ? ' of ' : ' de '}
                  <strong>{nodosFiltrados.length}</strong>
                  {isEn ? ' nodes' : ' nodos'}
                </div>

                <div className="pagination-controls-group">
                  <CustomItemsPerPageSelect
                    value={itemsPerPage}
                    onChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                    options={[6, 9, 12, 18, 24]}
                    language={language}
                  />

                  <div className="pagination-buttons-wrapper">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={`pagination-nav-btn prev-btn ${currentPage === 1 ? 'disabled' : ''}`}
                      title={isEn ? 'Previous page' : 'Página anterior'}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      <span className="pagination-btn-label">{isEn ? 'Prev' : 'Anterior'}</span>
                    </button>

                    <div className="pagination-number-list">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        if (
                          totalPages <= 7 ||
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          const isSelected = page === currentPage;
                          return (
                            <button
                              key={page}
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              className={`pagination-num-btn ${isSelected ? 'active' : ''}`}
                            >
                              {page}
                            </button>
                          );
                        }
                        if (
                          (page === 2 && currentPage > 3) ||
                          (page === totalPages - 1 && currentPage < totalPages - 2)
                        ) {
                          return <span key={page} style={{ padding: '0 4px', color: '#94a3b8', fontSize: '0.8rem' }}>...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={`pagination-nav-btn next-btn ${currentPage >= totalPages ? 'disabled' : ''}`}
                      title={isEn ? 'Next page' : 'Página siguiente'}
                    >
                      <span className="pagination-btn-label">{isEn ? 'Next' : 'Siguiente'}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── FULL SCREEN MAP & SENSOR INFO OVERLAY PREVIEW ── */}
      {previewNode && activeUbi && (
        <div className="node-fullscreen-overlay">
          {/* Map canvas fills 100% of viewport */}
          <div id="leaflet-map-preview" className="node-fullscreen-map"></div>

          {/* Re-center Home Button underneath Zoom Controls */}
          <button
            type="button"
            className="node-fullscreen-home-btn"
            onClick={() => {
              if (window.leafletPreviewMapInstance && activeUbi) {
                const lat = parseFloat(activeUbi.latitud);
                const lng = parseFloat(activeUbi.longitud);
                window.leafletPreviewMapInstance.setView([lat, lng], 17);
              }
            }}
            title={isEn ? "Center map on location" : "Centrar mapa en la ubicación"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" width="16" height="16">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>

          {/* Floating Dark Info Card on Left Side */}
          <div className="node-fullscreen-card">
            {/* Header info */}
            <div className="node-fullscreen-header">
              <div className="node-fullscreen-header-main">
                <span className="node-fullscreen-info-label">{isEn ? 'INFORMATION' : 'INFORMACIÓN'}</span>
                <button
                  type="button"
                  className="node-fullscreen-close-btn"
                  onClick={() => setPreviewNode(null)}
                  title={isEn ? "Close view" : "Cerrar vista"}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <h3 className="node-fullscreen-node-name">
                {previewNode.nombre}
              </h3>

              <p className="node-fullscreen-address" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" width="16" height="16" style={{ flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{activeUbi.nombre}</span>
              </p>

              {activeUbi.descripcion && (
                <p className="node-fullscreen-desc">
                  {activeUbi.descripcion}
                </p>
              )}


            </div>

            {/* Gauge section */}
            {(() => {
              if (!selectedVariable) return null;
              const realValObj = latestReadings.find(r => r.clave_mqtt === selectedVariable.data_type);
              const valStr = realValObj && realValObj.valor !== null
                ? realValObj.valor.toString()
                : '--';

              const status = getVariableIndexStatus(selectedVariable, valStr);
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
                    <span
                      className="node-fullscreen-index-badge"
                      style={{
                        backgroundColor: status.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: status.outWarningMsg ? 'help' : 'default'
                      }}
                      title={status.outWarningMsg || ''}
                    >
                      {status.label}
                      {status.isOutOfRange && (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                          <path d="M12 2L1 21h22L12 2zm0 3.99L20.53 19H3.47L12 5.99zM11 10h2v4h-2zm0 5h2v2h-2z" />
                        </svg>
                      )}
                    </span>
                  </div>

                  {/* Color bar indicator */}
                  <div className="node-fullscreen-gauge-bar-wrapper">
                    <div className="node-fullscreen-gauge-bar" style={{
                      background: status.type === 'air'
                        ? 'linear-gradient(to right, #10b981, #eab308, #f97316, #ef4444, #a855f7, #7f1d1d)'
                        : status.type === 'soil'
                          ? 'linear-gradient(to right, #f97316, #eab308, #10b981, #2563eb)'
                          : status.type === 'custom_range'
                            ? 'linear-gradient(to right, #3b82f6, #10b981, #ef4444)'
                            : 'linear-gradient(to right, #3b82f6, #60a5fa, #10b981, #f59e0b, #ef4444)'
                    }}></div>
                    <div className="node-fullscreen-gauge-indicator" style={{ left: `${status.percent}%` }}></div>
                  </div>

                  <div className="node-fullscreen-gauge-labels">
                    {status.range.map((r, i) => (
                      <span key={i} className={status.label === r ? 'active' : ''}>{r}</span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Sensor Readings List */}
            <div className="node-fullscreen-readings-section">
              <span className="node-fullscreen-section-label">
                {isEn ? 'Device Readings (Click to view index)' : 'Lecturas del Dispositivo (Haz clic para ver índice)'}
              </span>

              <div className="node-fullscreen-readings-list">
                {previewNode.lecturas && previewNode.lecturas.length > 0 ? (
                  previewNode.lecturas.map((l, idx) => {
                    const realReading = latestReadings.find(r => {
                      if (!r || !r.clave_mqtt || !l || !l.data_type) return false;
                      const rNorm = String(r.clave_mqtt).toLowerCase().replace(/[^a-z0-9]/g, '');
                      const lNorm = String(l.data_type).toLowerCase().replace(/[^a-z0-9]/g, '');
                      return rNorm === lNorm || rNorm.includes(lNorm) || lNorm.includes(rNorm);
                    });
                    const simVal = realReading && realReading.valor !== null
                      ? realReading.valor.toString()
                      : '--';
                    const isTemp = l.data_type.toLowerCase().includes('temp');
                    const isHum = l.data_type.toLowerCase().includes('hum') || l.data_type.toLowerCase().includes('soil');
                    const isAqi = l.data_type.toLowerCase().includes('aqi') || l.data_type.toLowerCase().includes('co2') || l.data_type.toLowerCase().includes('pm');
                    const isSelected = selectedVariable?.data_type === l.data_type;

                    const minExp = (l.minExpected !== undefined && l.minExpected !== null && l.minExpected !== '')
                      ? parseFloat(l.minExpected)
                      : (l.min_expected !== undefined && l.min_expected !== null && l.min_expected !== '')
                        ? parseFloat(l.min_expected)
                        : null;

                    const maxExp = (l.maxExpected !== undefined && l.maxExpected !== null && l.maxExpected !== '')
                      ? parseFloat(l.maxExpected)
                      : (l.max_expected !== undefined && l.max_expected !== null && l.max_expected !== '')
                        ? parseFloat(l.max_expected)
                        : null;

                    const numVal = parseFloat(simVal);
                    let outWarning = null;

                    if (!isNaN(numVal)) {
                      if (minExp !== null && !isNaN(minExp) && numVal < minExp) {
                        outWarning = {
                          type: 'min',
                          msg: isEn
                            ? `Recorded value (${numVal} ${l.unidad || ''}) is below expected minimum (${minExp} ${l.unidad || ''})`
                            : `El valor registrado (${numVal} ${l.unidad || ''}) está por debajo del mínimo esperado (${minExp} ${l.unidad || ''})`
                        };
                      } else if (maxExp !== null && !isNaN(maxExp) && numVal > maxExp) {
                        outWarning = {
                          type: 'max',
                          msg: isEn
                            ? `Recorded value (${numVal} ${l.unidad || ''}) exceeds expected maximum (${maxExp} ${l.unidad || ''})`
                            : `El valor registrado (${numVal} ${l.unidad || ''}) sobrepasa el máximo esperado (${maxExp} ${l.unidad || ''})`
                        };
                      }
                    }

                    return (
                      <div
                        className={`node-fullscreen-reading-item ${isSelected ? 'active' : ''}`}
                        key={idx}
                        onClick={() => setSelectedVariable(l)}
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
                        <span className="node-fullscreen-reading-value font-mono notranslate" translate="no" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span className="notranslate" translate="no">{simVal}</span> <span className="node-fullscreen-reading-unit notranslate" translate="no">{l.unidad}</span>
                          {outWarning && (
                            <span
                              title={outWarning.msg}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: outWarning.type === 'min' ? '#3b82f6' : '#ef4444',
                                cursor: 'help',
                                marginLeft: '4px'
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                                <path d="M12 2L1 21h22L12 2zm0 3.99L20.53 19H3.47L12 5.99zM11 10h2v4h-2zm0 5h2v2h-2z" />
                              </svg>
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="node-fullscreen-no-readings">
                    {isEn ? 'No variables configured on this node.' : 'Sin variables configuradas en este nodo.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TERMINAL VIRTUAL PARA VERIFICACIÓN DE CONEXIÓN */}
      {showTerminal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#1e293b', width: '100%', maxWidth: '700px', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: '20px' }}>
            {/* Header de la Terminal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#0f172a', borderBottom: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#eab308' }}></div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                </div>
                <span style={{ color: '#cbd5e1', fontSize: '0.875rem', fontWeight: '500', fontFamily: 'monospace' }}>
                  {isEn ? 'MQTT Connection Verification' : 'Verificación de Conexión MQTT'}
                </span>
              </div>
              <button onClick={() => setShowTerminal(false)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Cuerpo de la Terminal (Logs) */}
            <div style={{ padding: '16px', height: '350px', overflowY: 'auto', backgroundColor: '#1e293b', fontFamily: 'monospace', fontSize: '0.875rem', color: '#10b981', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {terminalLogs.map((log, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', opacity: i === terminalLogs.length - 1 ? 1 : 0.7 }}>
                  <span style={{ color: '#64748b', userSelect: 'none' }}>$</span>
                  <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{log}</span>
                </div>
              ))}
              {terminalStatus === 'waiting' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#eab308', marginTop: '16px', padding: '8px', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '6px' }}>
                  <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  <span>{isEn ? `Waiting for data... Remaining time: ${terminalCountdown}s` : `Esperando datos... Tiempo restante: ${terminalCountdown}s`}</span>
                </div>
              )}
            </div>

            {/* Footer de la Terminal */}
            <div style={{ padding: '12px 16px', backgroundColor: '#0f172a', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end' }}>
              {terminalStatus === 'success' ? (
                <button
                  onClick={() => setShowTerminal(false)}
                  style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {isEn ? 'Successful Connection - Close' : 'Conexión Exitosa - Cerrar'}
                </button>
              ) : terminalStatus === 'failed' ? (
                <button
                  onClick={() => setShowTerminal(false)}
                  style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isEn ? 'Continue (Inactive Node)' : 'Continuar (Nodo Inactivo)'}
                </button>
              ) : (
                <button
                  disabled
                  style={{ backgroundColor: '#334155', color: '#94a3b8', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '500', cursor: 'not-allowed' }}
                >
                  {isEn ? 'Verifying...' : 'Verificando...'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}