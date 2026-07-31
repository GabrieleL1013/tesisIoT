import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../../styles/components/admin/RegistrarNodo.css';
import iotLogoDefault from '../../assets/IOT-LOGO.png';

export default function RegistrarNodo() {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [nodosRegistrados, setNodosRegistrados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [metricasPresets, setMetricasPresets] = useState([]);


  const [searchParams] = useSearchParams();
  const categoriaFiltro = searchParams.get('categoria');
  const navigate = useNavigate();

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

  const getSimulatedValue = (dataType, unit) => {
    const key = dataType.toLowerCase();
    if (key.includes('temp')) return '23.5';
    if (key.includes('hum')) return '58';
    if (key.includes('press') || key.includes('pres')) return '1012';
    if (key.includes('aqi')) return '44';
    if (key.includes('co2')) return '415';
    if (key.includes('pm2') || key.includes('2.5') || key.includes('pm25')) return '11.42';
    if (key.includes('pm10') || key.includes('10')) return '24.01';
    if (key.includes('soil') || key.includes('suelo')) return '78';
    return '12.5';
  };

  useEffect(() => {
    // Fetch locations from PostgreSQL backend
    fetch(`${API_BASE_URL}/ubicaciones`)
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

    // Fetch nodes from PostgreSQL backend
    fetch(`${API_BASE_URL}/nodos`)
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

    // Fetch categories from Laravel API
    fetch(`${API_BASE_URL}/categorias`)
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

    // Load Metrics presets from PostgreSQL database
    fetch(`${API_BASE_URL}/metricas`)
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(metricData => {
        if (Array.isArray(metricData)) {
          setMetricasPresets(metricData);
        }
      })
      .catch(err => {
        console.error("Error fetching metrics presets from PostgreSQL backend:", err);
        setMetricasPresets([]);
      });
  }, [categoriaFiltro]);

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
        title: 'Plantilla Vacía',
        text: 'Este sensor no tiene subvariables configuradas.',
        confirmButtonColor: '#ff9f1c'
      });
      return;
    }

    const nuevasLecturas = sensorTemplate.subvariables.map(sub => ({
      sensor: sensorTemplate.nombre,
      tipo: sub.nombre,
      unidad: sub.unidad,
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
      title: '¡Subvariables Cargadas!',
      text: `Se agregaron ${nuevasLecturas.length} subvariables del sensor "${sensorTemplate.nombre}".`,
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
        nuevasLecturas[index]['data_type'] = found.claveMqtt || '';
      }
    }

    setLecturas(nuevasLecturas);
  };

  const agregarFilaLectura = () => {
    setLecturas([...lecturas, { sensor: '', data_type: '', tipo: '', unidad: '' }]);
  };

  const eliminarFilaLectura = (index) => {
    if (lecturas.length > 1) {
      setLecturas(lecturas.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombreNodo || !serialNumber || !ubicacionId || !categoria) {
      Swal.fire({
        icon: 'error',
        title: 'Campos Incompletos',
        text: 'Por favor, completa todos los campos principales (Nombre, Serial, Ubicación y Categoría).',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const lecturasValidas = lecturas.filter(l => l.data_type.trim() !== '');

    if (lecturasValidas.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan Métricas',
        text: 'Por favor, configure al menos una métrica válida (con su clave MQTT) antes de registrar el nodo.',
        confirmButtonColor: '#ff9f1c'
      });
      return;
    }

    const payload = {
      nombre: nombreNodo,
      serial_number: serialNumber,
      ubicacion_id: ubicacionId,
      categoria: categoria,
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
          title: 'Sin Cambios',
          text: 'No se detectaron cambios para guardar.',
          confirmButtonColor: '#2563eb'
        });
        return;
      }

      Swal.fire({
        title: '¿Guardar Cambios?',
        html: `Estás a punto de actualizar la configuración del nodo.<br/>${cambiosHtml}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#4b5563',
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // API UPDATE NODE (PUT)
          fetchWithAuth(`${API_BASE_URL}/nodos/${editandoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
            .then(res => {
              if (!res.ok) throw new Error("Duplicate or validation error");
              return res.json();
            })
            .then(updatedNode => {
              const list = nodosRegistrados.map(nodo => nodo.id === editandoId ? updatedNode : nodo);
              setNodosRegistrados(list);

              Swal.fire({
                icon: 'success',
                title: '¡Nodo Actualizado!',
                text: 'Los cambios se han guardado con éxito.',
                confirmButtonColor: '#ff9f1c'
              }).then(() => {
                navigate('/admin/dashboard');
              });
              limpiarFormulario();
              setMostrarFormulario(false);
            })
            .catch(err => {
              console.error("Error updating node:", err);
              Swal.fire({
                icon: 'error',
                title: 'Error al Modificar',
                text: 'No se pudo guardar la estación (asegúrate de que el número de serie sea único).',
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
        .then(newNode => {
          const list = [...nodosRegistrados, newNode];
          setNodosRegistrados(list);

          setVerifyingNodeId(newNode.id);
          iniciarVerificacionConexion(newNode.id, newNode.nombre);

          limpiarFormulario();
          setMostrarFormulario(false);
        })
        .catch(err => {
          console.error("Error creating node:", err);
          Swal.fire({
            icon: 'error',
            title: 'Error al Registrar',
            text: 'No se pudo registrar la estación (asegúrate de que el número de serie sea único).',
            confirmButtonColor: '#ff9f1c'
          });
        });
    }
  };


  const cargarEdicion = (nodo) => {
    setEditandoId(nodo.id);
    setNombreNodo(nodo.nombre);
    setSerialNumber(nodo.serial_number);
    setUbicacionId(nodo.ubicacion_id);
    setCategoria(nodo.categoria);

    // Map metrics list, ensuring default sensor name is loaded
    const mappedLecturas = (nodo.lecturas && nodo.lecturas.length > 0)
      ? nodo.lecturas.map(l => ({
        sensor: l.sensor || 'Sensor Integrado',
        data_type: l.data_type,
        tipo: l.tipo,
        unidad: l.unidad
      }))
      : [{ sensor: '', data_type: '', tipo: 'Temperatura', unidad: '°C' }];

    setLecturas(mappedLecturas);
    setBroker(nodo.broker || 'broker.hivemq.com');
    setPort(nodo.port || '1883');
    setTopicData(nodo.topic_data || '');
    setClientId(nodo.client_id || '');
    setUsername(nodo.username || '');
    setPassword(nodo.password || '');
    setUseMqttV5(nodo.use_mqtt_v5 || false);
    setIsSimulated(nodo.is_simulated || false);
    setSaveFrequency(nodo.save_frequency?.toString() || '30');
    setInstabilityAlertInterval(nodo.instability_alert_interval?.toString() || '300');

    setInitialState({
      nombreNodo: nodo.nombre,
      serialNumber: nodo.serial_number,
      ubicacionId: nodo.ubicacion_id,
      categoria: nodo.categoria,
      lecturas: mappedLecturas,
      broker: nodo.broker || 'broker.hivemq.com',
      port: nodo.port || '1883',
      topicData: nodo.topic_data || '',
      clientId: nodo.client_id || '',
      username: nodo.username || '',
      password: nodo.password || '',
      useMqttV5: nodo.use_mqtt_v5 || false,
      isSimulated: nodo.is_simulated || false,
      saveFrequency: nodo.save_frequency?.toString() || '30',
      instabilityAlertInterval: nodo.instability_alert_interval?.toString() || '300'
    });

    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarNodo = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer y desvinculará este nodo del sistema.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // API DELETE
        fetchWithAuth(`${API_BASE_URL}/nodos/${id}`, { method: 'DELETE' })
          .then(() => {
            const listaActualizada = nodosRegistrados.filter(nodo => nodo.id !== id);
            setNodosRegistrados(listaActualizada);

            Swal.fire({
              icon: 'success',
              title: '¡Eliminado!',
              text: 'El nodo ha sido removido del sistema.',
              confirmButtonColor: '#ff9f1c'
            });

            if (editandoId === id) {
              limpiarFormulario();
              setMostrarFormulario(false);
            }
          })
          .catch(err => {
            console.error("Error deleting node:", err);
            Swal.fire({ icon: 'error', title: 'Error de Red', text: 'No se pudo eliminar el nodo en la base de datos.', confirmButtonColor: '#ff9f1c' });
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

    if (nombreNodo !== initialState.nombreNodo) cambios.push(`<b>Nombre:</b> ${initialState.nombreNodo || '(vacío)'} &rarr; ${nombreNodo}`);
    if (serialNumber !== initialState.serialNumber) cambios.push(`<b>Serial:</b> ${initialState.serialNumber || '(vacío)'} &rarr; ${serialNumber}`);
    if (String(ubicacionId) !== String(initialState.ubicacionId)) {
      const ubiAntes = ubicaciones.find(u => String(u.id) === String(initialState.ubicacionId))?.nombre || '(vacío)';
      const ubiDespues = ubicaciones.find(u => String(u.id) === String(ubicacionId))?.nombre || '(vacío)';
      cambios.push(`<b>Ubicación:</b> ${ubiAntes} &rarr; ${ubiDespues}`);
    }
    if (categoria !== initialState.categoria) cambios.push(`<b>Categoría:</b> ${initialState.categoria || '(vacío)'} &rarr; ${categoria}`);

    if (broker !== initialState.broker) cambios.push(`<b>Broker:</b> ${initialState.broker} &rarr; ${broker}`);
    if (String(port) !== String(initialState.port)) cambios.push(`<b>Puerto:</b> ${initialState.port} &rarr; ${port}`);
    if (topicData !== initialState.topicData) cambios.push(`<b>Topic MQTT:</b> ${initialState.topicData} &rarr; ${topicData}`);
    if (clientId !== initialState.clientId) cambios.push(`<b>Client ID:</b> ${initialState.clientId || '(automático)'} &rarr; ${clientId || '(automático)'}`);
    if (username !== initialState.username) cambios.push(`<b>Usuario MQTT:</b> ${initialState.username || '(vacío)'} &rarr; ${username || '(vacío)'}`);
    if (password !== initialState.password) cambios.push(`<b>Clave MQTT:</b> ${(initialState.password ? '****' : '(vacío)')} &rarr; ${(password ? '****' : '(vacío)')}`);

    if (useMqttV5 !== initialState.useMqttV5) cambios.push(`<b>MQTT v5:</b> ${initialState.useMqttV5 ? 'Sí' : 'No'} &rarr; ${useMqttV5 ? 'Sí' : 'No'}`);
    if (isSimulated !== initialState.isSimulated) cambios.push(`<b>Simulado:</b> ${initialState.isSimulated ? 'Sí' : 'No'} &rarr; ${isSimulated ? 'Sí' : 'No'}`);
    if (saveFrequency !== initialState.saveFrequency) cambios.push(`<b>Frec. Guardado:</b> ${initialState.saveFrequency}s &rarr; ${saveFrequency}s`);
    if (instabilityAlertInterval !== initialState.instabilityAlertInterval) cambios.push(`<b>Frec. Alerta:</b> ${initialState.instabilityAlertInterval}s &rarr; ${instabilityAlertInterval}s`);

    if (JSON.stringify(lecturas) !== JSON.stringify(initialState.lecturas)) {
      cambios.push(`<b>Métricas:</b> Fueron modificadas (${initialState.lecturas.length} subvariables &rarr; ${lecturas.length} subvariables)`);
    }

    if (cambios.length === 0) return '';
    return `<div style="text-align: left; font-size: 0.9rem; max-height: 200px; overflow-y: auto; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 10px;">
      <p style="font-weight: 600; margin-bottom: 8px; color: #0f172a;">Cambios registrados (ANTES &rarr; DESPUÉS):</p>
      <ul style="margin: 0; padding-left: 20px; color: #334155;">
        ${cambios.map(c => `<li style="margin-bottom: 4px;">${c}</li>`).join('')}
      </ul>
    </div>`;
  };

  const confirmarCerrar = () => {
    let tieneCambios = false;
    if (editandoId !== null && initialState) {
      const isLecturasSame = JSON.stringify(lecturas) === JSON.stringify(initialState.lecturas);
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
        !isLecturasSame;
    } else {
      tieneCambios = nombreNodo.trim() !== '' || serialNumber.trim() !== '' || ubicacionId !== '' || categoria !== '' || (lecturas && lecturas.length > 0 && lecturas.some(l => (l.sensor && l.sensor.trim() !== '') || (l.data_type && l.data_type.trim() !== '')));
    }

    if (tieneCambios) {
      const cambiosHtml = editandoId ? obtenerCambiosDetallados() : '';
      Swal.fire({
        title: '¿Descartar cambios?',
        html: `Hay datos en el formulario. Si sales, se perderán los cambios no guardados.<br/>${cambiosHtml}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#4b5563',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Seguir editando'
      }).then((result) => {
        if (result.isConfirmed) {
          limpiarFormulario();
          setMostrarFormulario(false);
        }
      });
    } else {
      limpiarFormulario();
      setMostrarFormulario(false);
    }
  };

  const abrirCreacion = () => {
    limpiarFormulario();
    if (categoriaFiltro) {
      setCategoria(categoriaFiltro);
    }
    setMostrarFormulario(true);
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
  const nodosFiltrados = nodosRegistrados
    .filter(n => {
      const matchBusqueda = n.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        n.serial_number.toLowerCase().includes(busqueda.toLowerCase());

      const matchUbi = filtroUbicacion ? n.ubicacion_id.toString() === filtroUbicacion.toString() : true;
      const matchCat = filtroCategoria
        ? n.categoria === filtroCategoria
        : (categoriaFiltro ? n.categoria?.toLowerCase() === categoriaFiltro.toLowerCase() : true);

      return matchBusqueda && matchUbi && matchCat;
    })
    .sort((a, b) => {
      if (ordenFecha === 'name_asc') return a.nombre.localeCompare(b.nombre);
      if (ordenFecha === 'name_desc') return b.nombre.localeCompare(a.nombre);
      if (ordenFecha === 'asc') return Number(a.id) - Number(b.id);
      return Number(b.id) - Number(a.id);
    });

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
              {editandoId ? 'Modificar Nodo Sensor' : 'Registrar Nuevo Nodo'}
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
              Volver al Listado
            </button>
          </div>


          <form onSubmit={handleSubmit} className="space-y-6">

            {/* 1. Datos Generales */}
            <div className="form-section-title">
              <span className="title-number">01</span>
              <h4>Información General del Dispositivo</h4>
            </div>
            <div className="iot-section-box iot-grid">
              <div>
                <label className="iot-label">Nombre de la Estación / Nodo</label>
                <input
                  type="text"
                  value={nombreNodo}
                  onChange={(e) => setNombreNodo(e.target.value)}
                  placeholder="Estación Meteorológica FCVT"
                  className="iot-input"
                />
              </div>
              <div>
                <label className="iot-label">Número de Serie (MQTT Unique ID)</label>
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
                        <span style={{ color: '#64748b', marginRight: '6px', fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>UBICACIÓN GEOGRÁFICA CAMPUS:</span>
                        <span style={{ fontWeight: '600', color: ubicacionId ? '#0f172a' : '#94a3b8' }}>
                          {ubicacionId ? ubicaciones.find(u => u.id == ubicacionId)?.nombre : '-- Seleccionar --'}
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
                    onClick={() => navigate('/admin/ubicaciones')}
                    className="btn-add-inline"
                    title="Añadir nueva ubicación"
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
                        <span style={{ color: '#64748b', marginRight: '6px', fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>LÍNEA DE INVESTIGACIÓN (CATEGORÍA):</span>
                        <span style={{ fontWeight: '600', color: categoria ? '#0f172a' : '#94a3b8' }}>
                          {categoria ? categoria : '-- Seleccionar --'}
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
                    onClick={() => navigate('/admin/categorias')}
                    className="btn-add-inline"
                    title="Añadir nueva categoría"
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
                      <span style={{ color: '#64748b', marginRight: '6px', fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>FRECUENCIA DE GUARDADO EN BD:</span>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>
                        {
                          [
                            { v: '5', l: 'Cada 5 segundos' },
                            { v: '10', l: 'Cada 10 segundos' },
                            { v: '30', l: 'Cada 30 segundos' },
                            { v: '60', l: 'Cada 1 minuto' },
                            { v: '120', l: 'Cada 2 minutos' },
                            { v: '300', l: 'Cada 5 minutos' }
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
                          { v: '5', l: 'Cada 5 seg' },
                          { v: '10', l: 'Cada 10 seg' },
                          { v: '30', l: 'Cada 30 seg' },
                          { v: '60', l: 'Cada 1 min' },
                          { v: '120', l: 'Cada 2 min' },
                          { v: '300', l: 'Cada 5 min' }
                        ].map(opt => (
                          <button
                            key={opt.v}
                            type="button"
                            className={`frec-btn ${saveFrequency === opt.v ? 'selected' : ''}`}
                            onClick={() => { setSaveFrequency(opt.v); setIsFrecDropdownOpen(false); }}
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
                      <span style={{ color: '#64748b', marginRight: '6px', fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ALERTA POR INESTABILIDAD CADA:</span>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>
                        {
                          [
                            { v: '30', l: '30 segundos' },
                            { v: '60', l: '1 minuto' },
                            { v: '120', l: '2 minutos' },
                            { v: '180', l: '3 minutos' },
                            { v: '300', l: '5 minutos' },
                            { v: '600', l: '10 minutos' },
                            { v: '1200', l: '20 minutos' },
                            { v: '1800', l: '30 minutos' },
                            { v: '3600', l: '1 hora' }
                          ].find(o => o.v === instabilityAlertInterval)?.l || '5 minutos'
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
                          { v: '30', l: '30 seg' },
                          { v: '60', l: '1 min' },
                          { v: '120', l: '2 min' },
                          { v: '180', l: '3 min' },
                          { v: '300', l: '5 min' },
                          { v: '600', l: '10 min' },
                          { v: '1200', l: '20 min' },
                          { v: '1800', l: '30 min' },
                          { v: '3600', l: '1 hora' }
                        ].map(opt => (
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
              <h4>Parámetros de Conexión MQTT</h4>
            </div>

            <div className="iot-section-box space-y-4">
              <div className="simulated-checkbox-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1.25rem', padding: '1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="is_simulated"
                    checked={isSimulated}
                    onChange={(e) => setIsSimulated(e.target.checked)}
                    style={{ width: '1.25rem', height: '1.25rem', accentColor: '#2563eb', cursor: 'pointer', margin: 0 }}
                  />
                  <label htmlFor="is_simulated" className="font-semibold text-blue-900 cursor-pointer" style={{ fontSize: '0.95rem', margin: 0 }}>
                    Este es un nodo simulado (Virtual)
                  </label>
                </div>
                <p className="text-sm text-blue-700" style={{ marginLeft: '2.1rem', marginTop: '2px', lineHeight: '1.4' }}>El sistema creará un robot que generará datos automáticos para este nodo usando estos parámetros.</p>
              </div>

              <div className="iot-grid">
                <div>
                  <label className="iot-label">Broker MQTT</label>
                  <input
                    type="text"
                    value={broker}
                    onChange={(e) => setBroker(e.target.value)}
                    placeholder="broker.hivemq.com"
                    className="iot-input"
                  />
                </div>
                <div>
                  <label className="iot-label">Puerto</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="1883"
                    className="iot-input"
                  />
                </div>
                <div>
                  <label className="iot-label">Topic MQTT (Datos)</label>
                  <input
                    type="text"
                    value={topicData}
                    onChange={(e) => setTopicData(e.target.value)}
                    placeholder="iot_uleam/laboratorio"
                    className="iot-input"
                  />
                </div>
                <div>
                  <label className="iot-label">Client ID (Opcional)</label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Dejar vacío para generar uno automático"
                    className="iot-input"
                  />
                </div>
                <div>
                  <label className="iot-label">Usuario MQTT (Opcional)</label>
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
                  <label className="iot-label">Contraseña MQTT (Opcional)</label>
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
                  Utilizar protocolo MQTT v5 (Desmarcar para v3.1.1)
                </label>
              </div>
            </div>

            {/* 3. Parametrización de Métricas */}
            <div className="form-section-title mt-6">
              <span className="title-number">03</span>
              <h4>Configuración y Parametrización de Métricas</h4>
            </div>

            <div className="iot-section-box space-y-4">
              {/* Sensores Disponibles */}
              <div className="sensors-select-container" style={{ borderBottom: '1px solid #f0f2f5', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <span className="iot-label" style={{ fontSize: '0.75rem', color: '#4b5563', marginBottom: '8px', display: 'block' }}>
                  Sensores Disponibles (Haz clic sobre uno para cargar todas sus subvariables):
                </span>
                {metricasPresets.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No hay plantillas de sensores registradas en la base de datos.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    {metricasPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => cargarPlantillaSensor(preset)}
                        className="sensor-select-pill-btn"
                        title={`Cargar subvariables de ${preset.nombre}`}
                      >
                        <img src={preset.imagen || iotLogoDefault} alt="" className="sensor-preset-pill-thumb" />
                        {preset.nombre}
                        <span className="sensor-preset-pill-count">
                          {preset.subvariables ? preset.subvariables.length : 0}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {lecturas.map((lectura, index) => (
                <div key={index} className="metric-row">
                  <div className="metric-col metric-col-sensor">
                    <label className="metric-label">Sensor</label>
                    <input
                      type="text"
                      value={lectura.sensor || ''}
                      onChange={(e) => handleLecturaChange(index, 'sensor', e.target.value)}
                      placeholder="DHT22 / NPK"
                      className="iot-input"
                    />
                  </div>
                  <div className="metric-col metric-col-tipo">
                    <label className="metric-label">Métrica (Subvariable)</label>
                    {(() => {
                      const allSubs = [];
                      metricasPresets.forEach(preset => {
                        if (preset.subvariables) {
                          preset.subvariables.forEach(s => {
                            if (!allSubs.some(x => x.nombre === s.nombre)) {
                              allSubs.push(s);
                            }
                          });
                        }
                      });

                      return (
                        <select
                          value={lectura.tipo}
                          onChange={(e) => handleLecturaChange(index, 'tipo', e.target.value)}
                          className={`iot-select ${lectura.tipo ? 'select-filled' : ''}`}
                        >
                          <option value="">-- Seleccionar Subvariable --</option>
                          {allSubs.map((sub, sIdx) => (
                            <option key={sIdx} value={sub.nombre}>{sub.nombre}</option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                  <div className="metric-col metric-col-datatype">
                    <label className="metric-label">Clave MQTT</label>
                    <input
                      type="text"
                      value={lectura.data_type}
                      onChange={(e) => handleLecturaChange(index, 'data_type', e.target.value)}
                      placeholder="temp / hum / co2"
                      className="iot-input"
                    />
                  </div>
                  <div className="metric-col metric-col-unidad">
                    <label className="metric-label">Unidad</label>
                    <input
                      type="text"
                      value={lectura.unidad}
                      onChange={(e) => handleLecturaChange(index, 'unidad', e.target.value)}
                      placeholder="°C / % / ppm"
                      className="iot-input"
                    />
                  </div>

                  <div className="metric-col-delete">
                    {lecturas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarFilaLectura(index)}
                        className="btn-delete-row"
                        title="Eliminar métrica"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '1.5rem', paddingBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={agregarFilaLectura}
                  className="btn-success-gradient"
                  style={{ width: 'fit-content' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14" style={{ marginRight: '6px' }}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Agregar Fila
                </button>
                <span className="section-inner-subtitle" style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  Añade manualmente o carga las variables MQTT asociadas a los pines y sensores del nodo.
                </span>
              </div>
            </div>

            <div className="form-actions-bar">
              <button
                type="button"
                onClick={confirmarCerrar}
                className="btn-secondary-outline"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-submit-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {editandoId ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span>Guardar Cambios</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
                    </svg>
                    <span>Completar Registro</span>
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
                placeholder="Nombre o serial MQTT..."
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
                    ? (ubicaciones.find(u => u.id.toString() === filtroUbicacion.toString())?.nombre || 'Filtrar Ubicación')
                    : 'Filtrar Ubicación'}
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" className="select-arrow-icon">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showUbiPanel && (
                <div className="pub-news-unified-filter-panel" style={{ minWidth: '240px', left: 0 }}>
                  <div className="filter-panel-section" style={{ width: '100%' }}>
                    <span className="filter-panel-section-title">Ubicación</span>
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
                    <polygon points="12 2 2 7 12 12 22 7 12 2v0zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span>
                    {filtroCategoria || 'Filtrar Línea'}
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" className="select-arrow-icon">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {showCatPanel && (
                  <div className="pub-news-unified-filter-panel" style={{ minWidth: '240px', left: 0 }}>
                    <div className="filter-panel-section" style={{ width: '100%' }}>
                      <span className="filter-panel-section-title">Línea de Investigación</span>
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
                    ordenFecha === 'desc' ? 'Más Recientes' :
                      ordenFecha === 'asc' ? 'Más Antiguos' :
                        ordenFecha === 'name_asc' ? 'Nombre (A-Z)' : 'Nombre (Z-A)'
                  ) : 'Ordenar'}
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" className="select-arrow-icon">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showOrdenPanel && (
                <div className="pub-news-unified-filter-panel" style={{ minWidth: '180px', left: 0 }}>
                  <div className="filter-panel-section" style={{ width: '100%' }}>
                    <span className="filter-panel-section-title">Ordenar por</span>
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
                        <span>Más recientes</span>
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
                        <span>Más antiguos</span>
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
                        Nombre (A-Z)
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
                        Nombre (Z-A)
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
              Crear Nuevo Nodo
            </button>
          </div>

          {/* CARDS GRID DISPLAY */}
          {nodosFiltrados.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 border rounded-xl">
              <p className="text-gray-500 italic text-sm">
                No se encontraron nodos registrados que coincidan con los filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="node-grid">
              {nodosFiltrados.map((nodo) => {
                const ubiInfo = ubicaciones.find(u => u.id.toString() === nodo.ubicacion_id.toString());
                const catInfo = categorias.find(c => c.nombre === nodo.categoria);
                const borderLineColor = catInfo?.colorHex || '#0f2c59';

                return (
                  <div key={nodo.id} className="node-card" onClick={() => setPreviewNode(nodo)} style={{ borderColor: '#e2e8f0', cursor: 'pointer', position: 'relative' }}>
                    {/* Top colored indicator matching the category theme */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '4px',
                      backgroundColor: borderLineColor
                    }} />

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
                      {/* Clickable location tag to redirect to Google Maps coordinates */}
                      {ubiInfo ? (
                        <div className="node-card-location">
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
                          <span>Ubicación Desconocida</span>
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
                          <span className="text-[11px] text-gray-400 italic">Sin métricas parametrizadas</span>
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
                        Terminal
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
                        Editar
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
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
            title="Centrar mapa en la ubicación"
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
                <span className="node-fullscreen-info-label">INFORMACIÓN</span>
                <button
                  type="button"
                  className="node-fullscreen-close-btn"
                  onClick={() => setPreviewNode(null)}
                  title="Cerrar vista"
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
                : getSimulatedValue(selectedVariable.data_type, selectedVariable.unidad);

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
                Lecturas del Dispositivo (Haz clic para ver índice)
              </span>

              <div className="node-fullscreen-readings-list">
                {previewNode.lecturas && previewNode.lecturas.length > 0 ? (
                  previewNode.lecturas.map((l, idx) => {
                    const realReading = latestReadings.find(r => r.clave_mqtt === l.data_type);
                    const simVal = realReading && realReading.valor !== null
                      ? realReading.valor.toString()
                      : getSimulatedValue(l.data_type, l.unidad);
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
                          msg: `El valor registrado (${numVal} ${l.unidad || ''}) está por debajo del mínimo esperado (${minExp} ${l.unidad || ''})`
                        };
                      } else if (maxExp !== null && !isNaN(maxExp) && numVal > maxExp) {
                        outWarning = {
                          type: 'max',
                          msg: `El valor registrado (${numVal} ${l.unidad || ''}) sobrepasa el máximo esperado (${maxExp} ${l.unidad || ''})`
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
                        <span className="node-fullscreen-reading-value font-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {simVal} <span className="node-fullscreen-reading-unit">{l.unidad}</span>
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
                    Sin variables configuradas en este nodo.
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
                  Verificación de Conexión MQTT
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
                  <span>Esperando datos... Tiempo restante: {terminalCountdown}s</span>
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
                  Conexión Exitosa - Cerrar
                </button>
              ) : terminalStatus === 'failed' ? (
                <button
                  onClick={() => setShowTerminal(false)}
                  style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  Continuar (Nodo Inactivo)
                </button>
              ) : (
                <button
                  disabled
                  style={{ backgroundColor: '#334155', color: '#94a3b8', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '500', cursor: 'not-allowed' }}
                >
                  Verificando...
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}