import { Link } from "react-router-dom";
import LogoImg from "../assets/LOGO.png";
import IotLogoImg from "../assets/IOT-LOGO.png";
import "../styles/components/Footer.css";

export default function Footer() {
  return (
    <footer className="portal-footer">
      <div className="footer-container">
        
        {/* Columna 1: Logos y Descripción */}
        <div className="footer-brand-col">
          <div className="footer-logos">
            <img src={LogoImg} alt="ULEAM Logo" className="footer-logo-img" />
            <img src={IotLogoImg} alt="IOT Logo" className="footer-logo-img-secondary" />
          </div>
          <p className="footer-desc">
            Plataforma institucional de telemetría y automatización orientada a la eficiencia energética, gestión de recursos y desarrollo académico en los campus de la ULEAM.
          </p>
        </div>

        {/* Columna 2: Enlaces Rápidos */}
        <div className="footer-links-col">
          <h3>Enlaces Rápidos</h3>
          <ul>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/mapa-tiempo-real">Monitoreo</Link></li>
            <li><a href="/#proyecto">Proyecto</a></li>
          </ul>
        </div>

        {/* Columna 3: Información de Contacto */}
        <div className="footer-contact-col">
          <h3>Contacto & Soporte</h3>
          <p><strong>Departamento:</strong> Dirección de Innovación Tecnológica & Telecomunicaciones</p>
          <p><strong>Ubicación:</strong> Av. Circunvalación, Manta - Ecuador</p>
          <p><strong>Email:</strong> dit@uleam.edu.ec</p>
        </div>

      </div>

      <div className="footer-bottom-bar">
        <p>Universidad Laica Eloy Alfaro de Manabí © 2026 - Todos los derechos reservados</p>
        <span className="portal-system-ver">Sistema de Telemetría Distribuida - Campus Inteligente v2.4.1</span>
      </div>
    </footer>
  );
}