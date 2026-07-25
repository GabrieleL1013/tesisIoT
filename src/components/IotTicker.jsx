import React from 'react';
import '../styles/components/IotTicker.css';

// ── SVG Icons for the Ticker ──
const SensorNodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="15" x2="23" y2="15" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="15" x2="4" y2="15" />
  </svg>
);

const GatewayIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const DatabaseDiskIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

const SmartAgriIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M12 22V12M12 12a5 5 0 0 1 5-5h2M12 15a5 5 0 0 0-5-5H5M12 8a3 3 0 0 1 3-3h3" />
  </svg>
);

const WaterLevelIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    <path d="M6 18h12M8 15h8M10 12h4" />
  </svg>
);

const SmartBulbIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M9 18h6M10 22h4" />
    <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17h8v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="10" y1="11" x2="14" y2="11" />
  </svg>
);

const DashboardChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M3 3v18h18" />
    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
  </svg>
);

const TemperatureIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
  </svg>
);

const SecurityShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 6v11" />
    <path d="M9 9h6" />
  </svg>
);

const SignalWaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M2 10s3-3 10-3 10 3 10 3" />
    <path d="M6 14s2-2 6-2 6 2 6 2" />
    <path d="M10 18s1-1 2-1 2 1 2 1" />
  </svg>
);

const TICKER_ITEMS = [
  { icon: <SensorNodeIcon />, label: "Nodo Sensor IoT" },
  { icon: <GatewayIcon />, label: "Gateway LoRaWAN" },
  { icon: <DatabaseDiskIcon />, label: "Base de Datos Histórica" },
  { icon: <SmartAgriIcon />, label: "Monitoreo Agrícola" },
  { icon: <WaterLevelIcon />, label: "Nivel de Reservorios" },
  { icon: <SmartBulbIcon />, label: "Eficiencia Energética" },
  { icon: <DashboardChartIcon />, label: "Paneles de Control" },
  { icon: <TemperatureIcon />, label: "Variables Térmicas" },
  { icon: <SecurityShieldIcon />, label: "Criptografía & Seguridad" },
  { icon: <SignalWaveIcon />, label: "Redes Inalámbricas" }
];

export default function IotTicker() {
  // Duplicate the list of items to ensure a seamless infinite loop scrolling effect
  const doubleItems = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <section className="iot-ticker-section">
      <h2 className="iot-ticker-section-title">Tecnologías e Infraestructuras IOT</h2>
      <div className="iot-ticker-container">
        <div className="iot-ticker-track">
          {doubleItems.map((item, index) => (
            <div key={index} className="iot-ticker-item">
              {item.icon}
              <span className="iot-ticker-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
