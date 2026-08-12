import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useLanguage } from '../../context/LanguageContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import '../../styles/components/admin/GestionarUbicaciones.css';

const CustomItemsPerPageSelect = ({ value, onChange, options = [5, 10, 20, 50], language = 'es' }) => {
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

export default function GestionarUbicaciones() {
  const { language, t, triggerContentLoading } = useLanguage();
  usePageTitle({ es: 'Gestionar Ubicaciones', en: 'Manage Locations' }, 'Admin · IoT ULEAM');
  const [ubicaciones, setUbicaciones] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState(null);
  const [showOrdenPanel, setShowOrdenPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, orden, itemsPerPage]);

  const ubicacionesFiltradas = ubicaciones
    .filter(u => {
      const query = busqueda.toLowerCase().trim();
      if (!query) return true;
      return u.nombre.toLowerCase().includes(query) || (u.descripcion && u.descripcion.toLowerCase().includes(query));
    })
    .sort((a, b) => {
      if (orden === 'name_asc') return a.nombre.localeCompare(b.nombre);
      if (orden === 'name_desc') return b.nombre.localeCompare(a.nombre);
      if (orden === 'asc') return Number(a.id) - Number(b.id);
      return Number(b.id) - Number(a.id);
    });

  const totalPages = Math.ceil(ubicacionesFiltradas.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const ubicacionesPaginadas = ubicacionesFiltradas.slice(startIndex, startIndex + itemsPerPage);

  // Estados del Formulario
  const [editandoId, setEditandoId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');

  // Estados para enlace de Google Maps en el mapa
  const [busquedaMapa, setBusquedaMapa] = useState('');
  const [mapStyle, setMapStyle] = useState('google'); // google, satellite, dark

  // Extraer coordenadas exclusivamente de links de Google Maps o coordenadas directas
  const extractCoordinatesFromText = (text) => {
    if (!text || typeof text !== 'string') return null;
    const str = text.trim();

    // 1. Google Maps @lat,lng format e.g. /@(-?\d+\.\d+),(-?\d+\.\d+)/
    const atMatch = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    // 2. Query params e.g. ?q=-0.951,-80.74 o &query=-0.951,-80.74 o place/name/@lat,lng o place/-0.951,-80.74
    const queryMatch = str.match(/(?:q=|query=|place\/)(-?\d+\.\d+),(?:%20|\s)?(-?\d+\.\d+)/i);
    if (queryMatch) {
      return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
    }

    // 3. Direct lat,lng coordinates e.g. "-0.951732, -80.747621" o "-0.951732 -80.747621"
    const rawCoordMatch = str.match(/^@?(-?\d+\.\d+)(?:,\s*|\s+)(-?\d+\.\d+)$/);
    if (rawCoordMatch) {
      return { lat: parseFloat(rawCoordMatch[1]), lng: parseFloat(rawCoordMatch[2]) };
    }

    return null;
  };

  const aplicarCoordenadasManuales = (lat, lng, label = '') => {
    setLatitud(lat.toFixed(6));
    setLongitud(lng.toFixed(6));
    if (label) setBusquedaMapa(label);

    if (window.leafletMapInstance) {
      window.leafletMapInstance.flyTo([lat, lng], 17, { duration: 1 });
      window.leafletMapInstance.eachLayer((layer) => {
        if (layer instanceof window.L.Marker) {
          layer.setLatLng([lat, lng]);
        }
      });
    }

    Swal.fire({
      icon: 'success',
      title: isEn ? 'Link Loaded' : 'Enlace Cargado',
      text: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
      timer: 1800,
      showConfirmButton: false
    });
  };

  const handleBusquedaMapaChange = (e) => {
    const val = e.target.value;
    setBusquedaMapa(val);
    const coords = extractCoordinatesFromText(val);
    if (coords) {
      aplicarCoordenadasManuales(coords.lat, coords.lng, val);
    }
  };

  const cargarLinkMapa = () => {
    if (!busquedaMapa.trim()) return;

    const coords = extractCoordinatesFromText(busquedaMapa);
    if (coords) {
      aplicarCoordenadasManuales(coords.lat, coords.lng, busquedaMapa);
    } else {
      Swal.fire({
        icon: 'warning',
        title: isEn ? 'Invalid Link' : 'Enlace No Válido',
        text: isEn ? 'Please paste a valid Google Maps URL or coordinates.' : 'Por favor, pega un enlace válido de Google Maps (ej. https://maps.google.com/...) o coordenadas.',
        confirmButtonColor: '#0f2c59'
      });
    }
  };

  // Fetch locations from PostgreSQL backend
  const cargarUbicaciones = (showLoader = false) => {
    if (showLoader) triggerContentLoading();
    fetch(`${API_BASE_URL}/ubicaciones`)
      .then(res => res.json())
      .then(data => {
        setUbicaciones(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Error loading locations from database:", err);
        setUbicaciones([]);
      });
  };

  useEffect(() => {
    cargarUbicaciones();
  }, []);

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

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.ubi-filter-group-orden')) {
        setShowOrdenPanel(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const obtenerTextoOrden = () => {
    if (orden === 'desc') return t("locations.sort_newest", "Más recientes primero");
    if (orden === 'name_asc') return t("locations.sort_name_asc", "Nombre (A-Z)");
    if (orden === 'name_desc') return t("locations.sort_name_desc", "Nombre (Z-A)");
    if (orden === 'asc') return t("locations.sort_oldest", "Más antiguos primero");
    return t("locations.sort", "Ordenar");
  };

  // Leaflet Map Initialization and Synchronization
  useEffect(() => {
    if (!mostrarFormulario) {
      // Clean up map reference when form closes
      if (window.leafletMapInstance) {
        window.leafletMapInstance.remove();
        window.leafletMapInstance = null;
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

    const initMapInstance = () => {
      // Clear existing map instance to prevent duplication
      if (window.leafletMapInstance) {
        window.leafletMapInstance.remove();
        window.leafletMapInstance = null;
      }

      // Initial center coordinates (Manta, Ecuador campus is ~ -0.9517, -80.7476)
      const initialLat = parseFloat(latitud) || -0.9517;
      const initialLng = parseFloat(longitud) || -80.7476;

      const map = window.L.map('leaflet-map-admin').setView([initialLat, initialLng], 16);
      window.leafletMapInstance = map;

      // Add dynamic Google / CartoDB map tiles based on mapStyle selection
      let tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Google Roadmap by default
      let tileAttr = '&copy; Google Maps';
      if (mapStyle === 'satellite') {
        tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Google Hybrid (Satellite + labels)
        tileAttr = '&copy; Google Maps';
      } else if (mapStyle === 'dark') {
        tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        tileAttr = '&copy; OpenStreetMap contributors &copy; CARTO';
      } else if (mapStyle === 'voyager') {
        tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        tileAttr = '&copy; OpenStreetMap contributors &copy; CARTO';
      }

      window.leafletTileLayerInstance = window.L.tileLayer(tileUrl, {
        attribution: tileAttr,
        maxZoom: 20
      }).addTo(map);

      // Custom Map Pin SVG Icon
      const mapPinIcon = window.L.divIcon({
        html: `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
            <circle cx="12" cy="10" r="3" fill="#ffffff"/>
          </svg>
        `,
        className: 'custom-map-pin-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

      // Create draggable marker
      const marker = window.L.marker([initialLat, initialLng], {
        icon: mapPinIcon,
        draggable: true
      }).addTo(map);

      // Sync coordinate inputs when marker is dragged
      marker.on('dragend', function () {
        const position = marker.getLatLng();
        setLatitud(position.lat.toFixed(6));
        setLongitud(position.lng.toFixed(6));
      });

      // Sync coordinate inputs when map is clicked
      map.on('click', function (event) {
        const position = event.latlng;
        marker.setLatLng(position);
        setLatitud(position.lat.toFixed(6));
        setLongitud(position.lng.toFixed(6));
      });

      // Custom center-on-marker control (below zoom buttons)
      const CenterControl = window.L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function () {
          const btn = window.L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-center-btn');
          btn.type = 'button';
          btn.title = 'Centrar mapa en el marcador';
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
              <circle cx="12" cy="12" r="10"/>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor" stroke="none" opacity="0.15"/>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="none" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="10" r="2.5" fill="currentColor"/>
            </svg>`;
          window.L.DomEvent.on(btn, 'click', function (e) {
            window.L.DomEvent.stopPropagation(e);
            const latlng = marker.getLatLng();
            map.flyTo(latlng, 17, { duration: 0.8 });
          });
          return btn;
        }
      });
      new CenterControl().addTo(map);
    };

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        initMapInstance();
      };
      document.body.appendChild(script);
    } else {
      // Tiny delay to ensure DOM container is fully rendered in React layout
      const timer = setTimeout(() => {
        initMapInstance();
      }, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      if (window.leafletMapInstance) {
        window.leafletMapInstance.remove();
        window.leafletMapInstance = null;
      }
    };
  }, [mostrarFormulario]);

  // Change tile layer dynamically when mapStyle changes
  useEffect(() => {
    if (!window.leafletMapInstance || !window.L) return;

    if (window.leafletTileLayerInstance) {
      window.leafletTileLayerInstance.remove();
    }

    let tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Google Roadmap
    let tileAttr = '&copy; Google Maps';
    if (mapStyle === 'satellite') {
      tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Google Hybrid (Satellite + labels)
      tileAttr = '&copy; Google Maps';
    } else if (mapStyle === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      tileAttr = '&copy; OpenStreetMap contributors &copy; CARTO';
    } else if (mapStyle === 'voyager') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      tileAttr = '&copy; OpenStreetMap contributors &copy; CARTO';
    }

    window.leafletTileLayerInstance = window.L.tileLayer(tileUrl, {
      attribution: tileAttr,
      maxZoom: 20
    }).addTo(window.leafletMapInstance);
  }, [mapStyle]);

  // Sync Leaflet marker when input fields for Lat/Lng change manually
  useEffect(() => {
    if (window.leafletMapInstance) {
      const currentLat = parseFloat(latitud);
      const currentLng = parseFloat(longitud);
      if (!isNaN(currentLat) && !isNaN(currentLng)) {
        // Find existing marker and update it, or re-center map
        window.leafletMapInstance.setView([currentLat, currentLng]);
        // Re-find marker in layer list and move it
        window.leafletMapInstance.eachLayer((layer) => {
          if (layer instanceof window.L.Marker) {
            layer.setLatLng([currentLat, currentLng]);
          }
        });
      }
    }
  }, [latitud, longitud]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre || !latitud || !longitud) {
      Swal.fire({
        icon: 'error',
        title: 'Campos Vacíos',
        text: 'Por favor, ingresa el nombre y las coordenadas geográficas de la ubicación.',
        confirmButtonColor: '#ff9f1c'
      });
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      latitud: parseFloat(latitud),
      longitud: parseFloat(longitud)
    };

    if (editandoId) {
      // API UPDATE (PUT)
      fetchWithAuth(`${API_BASE_URL}/ubicaciones/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) throw new Error("Server error");
          return res.json();
        })
        .then(updatedItem => {
          triggerContentLoading();
          const list = ubicaciones.map(u => u.id === editandoId ? updatedItem : u);
          setUbicaciones(list);
          setEditandoId(null);
          setMostrarFormulario(false);

          Swal.fire({
            icon: 'success',
            title: 'Ubicación Actualizada',
            text: 'Los cambios se han guardado con éxito en la base de datos.',
            confirmButtonColor: '#ff9f1c'
          });
          limpiarFormulario();
        })
        .catch(err => {
          console.error("Error updating location:", err);
          Swal.fire({ icon: 'error', title: 'Error de Red', text: 'No se pudo guardar la ubicación en la base de datos.', confirmButtonColor: '#ff9f1c' });
        });
    } else {
      // API CREATE (POST)
      fetchWithAuth(`${API_BASE_URL}/ubicaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) throw new Error("Server error");
          return res.json();
        })
        .then(newItem => {
          triggerContentLoading();
          const list = [...ubicaciones, newItem];
          setUbicaciones(list);
          setMostrarFormulario(false);

          Swal.fire({
            icon: 'success',
            title: 'Ubicación Registrada',
            text: 'El nuevo punto de telemetría ha sido añadido con éxito.',
            confirmButtonColor: '#ff9f1c'
          });
          limpiarFormulario();
        })
        .catch(err => {
          console.error("Error creating location:", err);
          Swal.fire({ icon: 'error', title: 'Error de Red', text: 'No se pudo registrar la ubicación en la base de datos.', confirmButtonColor: '#ff9f1c' });
        });
    }
  };

  const cargarEdicion = (ubi) => {
    setEditandoId(ubi.id);
    setNombre(ubi.nombre);
    setDescripcion(ubi.descripcion || '');
    setLatitud(ubi.latitud);
    setLongitud(ubi.longitud);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarUbicacion = (id) => {
    const ubi = ubicaciones.find(u => u.id === id);
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Esta acción eliminará la ubicación "${ubi?.nombre}" de la base de datos. Los nodos asociados podrían verse afectados.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // API DELETE
        fetchWithAuth(`${API_BASE_URL}/ubicaciones/${id}`, { method: 'DELETE' })
          .then(async res => {
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || 'Server error');
            }
            return data;
          })
          .then(() => {
            const list = ubicaciones.filter(u => u.id !== id);
            setUbicaciones(list);

            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'La ubicación ha sido removida de la base de datos con éxito.',
              confirmButtonColor: '#ff9f1c'
            });

            if (editandoId === id) {
              limpiarFormulario();
              setMostrarFormulario(false);
            }
          })
          .catch(err => {
            console.error("Error deleting location:", err);
            Swal.fire({
              icon: 'error',
              title: 'Restricción de Relación',
              text: err.message || 'No se pudo eliminar la ubicación del servidor.',
              confirmButtonColor: '#ff9f1c'
            });
          });
      }
    });
  };

  const limpiarFormulario = () => {
    setEditandoId(null);
    setNombre('');
    setDescripcion('');
    setLatitud('');
    setLongitud('');
    setBusquedaMapa('');
  };

  const abrirFormulario = () => {
    limpiarFormulario();
    setMostrarFormulario(true);
  };

  const isEn = language === 'en';

  const cerrarFormulario = () => {
    const tieneCambios = nombre.trim() !== '' || descripcion.trim() !== '' || latitud !== '' || longitud !== '';
    
    if (tieneCambios || editandoId !== null) {
      Swal.fire({
        title: t("common.discard_title", isEn ? "Discard changes?" : "¿Descartar cambios?"),
        text: t("common.discard_text", isEn ? "There are unsaved form data. If you leave, unsaved changes will be lost." : "Hay datos en el formulario. Si sales, se perderán los cambios no guardados."),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#4b5563',
        confirmButtonText: t("common.yes_exit", isEn ? "Yes, leave" : "Sí, salir"),
        cancelButtonText: t("common.keep_editing", isEn ? "Keep editing" : "Seguir editando")
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

  return (
    <div className="ubi-page">

      {/* CABECERA DINÁMICA */}
      {mostrarFormulario && (
        <div className="ubi-header">
          <div>
            <h2 className="ubi-heading">
              {editandoId ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                  </svg>
                  {t("locations.edit_title", "Modificar Ubicación Territorial")}
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {t("locations.new_title", "Nueva Ubicación IoT")}
                </>
              )}
            </h2>
            <p className="ubi-subheading">
              {t("locations.form_subheading", "Mapea y asigna las coordenadas geográficas precisas usando Leaflet.")}
            </p>
          </div>

          <button
            onClick={cerrarFormulario}
            className="ubi-btn-back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t("locations.back_to_list", "Volver al Listado")}
          </button>
        </div>
      )}

      {/* MODO FORMULARIO: REGISTRO / EDICIÓN */}
      {mostrarFormulario ? (
        <div className="ubi-form-panel">
          <form onSubmit={handleSubmit} className="ubi-form">
            <div className="ubi-grid">

              {/* Form Input fields */}
              <div className="ubi-fields-column">
                <div className="ubi-field-group">
                  <label className="ubi-label">{t("locations.name_label", "Nombre de la Ubicación / Campus")}</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder={t("locations.name_ph", "Ingresa el nombre de la ubicación")}
                    className="ubi-input"
                  />
                </div>

                <div className="ubi-field-group">
                  <label className="ubi-label">{t("locations.desc_label", "Descripción / Detalles de Acceso")}</label>
                  <input
                    type="text"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder={t("locations.desc_ph", "Ingresa una descripción o detalles")}
                    className="ubi-input"
                  />
                </div>

                <div className="ubi-coords-row">
                  <div className="ubi-field-group">
                    <label className="ubi-label">{t("locations.latitude", "Latitud")}</label>
                    <input
                      type="text"
                      value={latitud}
                      onChange={(e) => setLatitud(e.target.value)}
                      placeholder={t("locations.lat_ph", "Latitud")}
                      className="ubi-input ubi-input-mono"
                    />
                  </div>
                  <div className="ubi-field-group">
                    <label className="ubi-label">{t("locations.longitude", "Longitud")}</label>
                    <input
                      type="text"
                      value={longitud}
                      onChange={(e) => setLongitud(e.target.value)}
                      placeholder={t("locations.lng_ph", "Longitud")}
                      className="ubi-input ubi-input-mono"
                    />
                  </div>
                </div>
              </div>

              {/* REAL MAP DISPLAY */}
              <div className="ubi-map-column">
                <label className="ubi-label mb-2">{t("locations.map_point_label", "Punto de Georreferenciación (Leaflet OpenStreetMap)")}</label>

                {/* MAP SEARCH BAR FOR GOOGLE MAPS LINK */}
                <div className="ubi-map-search-wrapper">
                  <div className="ubi-map-search-bar">
                    <input
                      type="text"
                      value={busquedaMapa}
                      onChange={handleBusquedaMapaChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          cargarLinkMapa();
                        }
                      }}
                      placeholder={t("locations.map_search_ph", "Pega el enlace de Google Maps aquí...")}
                      className="ubi-map-search-input"
                    />
                    <button
                      type="button"
                      onClick={cargarLinkMapa}
                      className="ubi-map-search-btn"
                    >
                      {t("locations.map_search_btn", "Cargar Link")}
                    </button>
                  </div>
                </div>

                {/* MAP ACTIONS ROW */}
                <div className="ubi-map-actions-row">
                  <div className="ubi-map-style-selector" style={{ width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => setMapStyle('google')}
                      className={`ubi-btn-style ${mapStyle === 'google' ? 'active' : ''}`}
                      title="Google Maps Estándar"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" style={{ marginRight: '4px' }}>
                        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                        <line x1="9" y1="3" x2="9" y2="18" />
                        <line x1="15" y1="6" x2="15" y2="21" />
                      </svg>
                      {t("locations.map_style_map", "Mapa")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapStyle('satellite')}
                      className={`ubi-btn-style ${mapStyle === 'satellite' ? 'active' : ''}`}
                      title="Google Maps Satélite (Híbrido)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" style={{ marginRight: '4px' }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      {t("locations.map_style_sat", "Satélite")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapStyle('dark')}
                      className={`ubi-btn-style ${mapStyle === 'dark' ? 'active' : ''}`}
                      title="Mapa Oscuro"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" style={{ marginRight: '4px' }}>
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                      {t("locations.map_style_dark", "Oscuro")}
                    </button>
                  </div>
                </div>

                <div id="leaflet-map-admin" className="leaflet-map-container"></div>
                <p className="ubi-map-tip">
                  {t("locations.map_tip", "Pega el enlace de Google Maps arriba, o bien arrastra el punto rojo o haz clic en el mapa para fijar coordenadas.")}
                </p>
              </div>

            </div>

            <div className="ubi-form-actions">
              <button type="button" onClick={cerrarFormulario} className="ubi-btn-cancel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                {t("admin.cancel", "Cancelar")}
              </button>
              <button type="submit" className="ubi-btn-save">
                {editandoId ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    {t("locations.update_btn", "Actualizar Zona")}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {t("locations.complete_reg_btn", "Completar Registro")}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* MODO LISTADO DE UBICACIONES ACTIVO */
        <>
          <div className="ubi-toolbar" style={{ position: 'relative', zIndex: 30 }}>
            {/* Búsqueda */}
            <div className="ubi-search-wrapper" style={{ flex: '1 1 200px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14" className="ubi-search-icon">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder={t("locations.search_placeholder", "Buscar ubicación...")}
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="ubi-filter-input ubi-search-input"
              />
            </div>

            {/* Ordenar */}
            <div className="pub-news-filter-group ubi-filter-group-orden" style={{ position: 'relative' }}>
              <button
                type="button"
                className={`pub-news-unified-filter-btn ${showOrdenPanel ? 'open' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOrdenPanel(!showOrdenPanel);
                }}
                style={{ height: '42px', borderRadius: '12px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
                <span>{obtenerTextoOrden()}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" className="select-arrow-icon">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showOrdenPanel && (
                <div className="pub-news-unified-filter-panel ubi-order-dropdown-panel">
                  <div className="filter-panel-section" style={{ width: '100%' }}>
                    <span className="filter-panel-section-title">{t("locations.sort_by", "Ordenar por")}</span>
                    <div className="filter-panel-options-list">
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'asc' ? 'active' : ''}`}
                        onClick={() => {
                          if (orden === 'asc') {
                            setOrden(null);
                          } else {
                            setOrden('asc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        {t("locations.sort_oldest", "Más antiguos primero")}
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'desc' ? 'active' : ''}`}
                        onClick={() => {
                          if (orden === 'desc') {
                            setOrden(null);
                          } else {
                            setOrden('desc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        {t("locations.sort_newest", "Más recientes primero")}
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'name_asc' ? 'active' : ''}`}
                        onClick={() => {
                          if (orden === 'name_asc') {
                            setOrden(null);
                          } else {
                            setOrden('name_asc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        {t("locations.sort_name_asc", "Nombre (A-Z)")}
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'name_desc' ? 'active' : ''}`}
                        onClick={() => {
                          if (orden === 'name_desc') {
                            setOrden(null);
                          } else {
                            setOrden('name_desc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        {t("locations.sort_name_desc", "Nombre (Z-A)")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón agregar */}
            <button className="ubi-btn-add" onClick={abrirFormulario} style={{ flexShrink: 0, height: '42px', borderRadius: '12px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="15" height="15">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t("locations.add_location", "Registrar Nueva Ubicación")}
            </button>
          </div>

          <div className="ubi-table-wrapper">
            <table className="ubi-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("locations.col_name_detail", "Nombre / Detalle")}</th>
                  <th>{t("locations.col_gps_coords", "Coordenadas GPS")}</th>
                  <th style={{ textAlign: 'right' }}>{t("locations.col_write_ops", "Operaciones Escritura")}</th>
                </tr>
              </thead>
              <tbody>
                {ubicaciones.length === 0 ? (
                  <tr><td colSpan="4" className="ubi-empty-cell">{t("locations.loading", "Cargando ubicaciones...")}</td></tr>
                ) : ubicacionesFiltradas.length === 0 ? (
                  <tr><td colSpan="4" className="ubi-empty-cell">{t("locations.empty", "No se encontraron ubicaciones que coincidan con la búsqueda.")}</td></tr>
                ) : (
                  ubicacionesPaginadas.map((ubi, index) => (
                    <tr key={ubi.id} className="ubi-row">
                      <td className="ubi-idx">{startIndex + index + 1}</td>
                      <td>
                        <span className="ubi-name">{ubi.nombre}</span>
                        <span className="ubi-desc">{ubi.descripcion || t("locations.no_desc", "Sin descripción adicional")}</span>
                      </td>
                      <td className="ubi-coords-cell">
                        <span className="ubi-coord-pill ubi-coord-pill-lat">Lat: {ubi.latitud}</span>
                        <span className="ubi-coord-pill ubi-coord-pill-lng">Lng: {ubi.longitud}</span>
                      </td>
                      <td>
                        <div className="ubi-row-actions">
                          <button
                            onClick={() => cargarEdicion(ubi)}
                            className="ubi-btn-edit"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            {t("locations.modify", "Modificar")}
                          </button>
                          <button
                            onClick={() => eliminarUbicacion(ubi.id)}
                            className="ubi-btn-delete"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            {t("locations.delete", "Eliminar")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* CONTROLES DE PAGINACIÓN */}
          {ubicacionesFiltradas.length > 0 && (
            <div className="ubi-pagination-bar">
              <div className="pagination-info-text">
                {language === 'en' 
                  ? `Showing ${Math.min(startIndex + 1, ubicacionesFiltradas.length)} to ${Math.min(startIndex + itemsPerPage, ubicacionesFiltradas.length)} of ${ubicacionesFiltradas.length} locations`
                  : `Mostrando ${Math.min(startIndex + 1, ubicacionesFiltradas.length)} a ${Math.min(startIndex + itemsPerPage, ubicacionesFiltradas.length)} de ${ubicacionesFiltradas.length} ubicaciones`}
              </div>

              <div className="pagination-controls-group">
                <CustomItemsPerPageSelect
                  value={itemsPerPage}
                  onChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                  options={[5, 10, 20, 50]}
                  language={language}
                />

                <div className="pagination-buttons-wrapper">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`pagination-nav-btn prev-btn ${currentPage === 1 ? 'disabled' : ''}`}
                    title={language === 'en' ? 'Previous page' : 'Página anterior'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <span className="pagination-btn-label">{language === 'en' ? 'Prev' : 'Anterior'}</span>
                  </button>

                  <div className="pagination-number-list">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`pagination-num-btn ${p === currentPage ? 'active' : ''}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`pagination-nav-btn next-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                    title={language === 'en' ? 'Next page' : 'Página siguiente'}
                  >
                    <span className="pagination-btn-label">{language === 'en' ? 'Next' : 'Siguiente'}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}