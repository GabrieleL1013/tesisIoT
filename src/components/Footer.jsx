import { Link } from "react-router-dom";
import LogoImg from "../assets/LOGO.png";
import IotLogoImg from "../assets/IOT-LOGO.png";
import EditableText from "./EditableText";
import EditableImage from "./EditableImage";
import "../styles/components/Footer.css";

export default function Footer() {
  return (
    <footer className="portal-footer">
      <div className="footer-container">
        
        {/* Columna 1: Logos y Descripción */}
        <div className="footer-brand-col">
          <div className="footer-logos" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <EditableImage
              imageKey="footer_logo_primary"
              defaultSrc={LogoImg}
              alt="ULEAM Logo"
              className="footer-logo-img"
              recommendedWidth={240}
              recommendedHeight={80}
              hint="Logo institucional ULEAM en el pie de página."
            />
            <EditableImage
              imageKey="footer_logo_secondary"
              defaultSrc={IotLogoImg}
              alt="IOT Logo"
              className="footer-logo-img-secondary"
              recommendedWidth={120}
              recommendedHeight={80}
              hint="Logo de IoT ULEAM en el pie de página."
            />
          </div>
          <p className="footer-desc" style={{ marginTop: "1rem" }}>
            <EditableText
              textKey="footer_brand_desc"
              defaultText="Plataforma institucional de telemetría y automatización orientada a la eficiencia energética, gestión de recursos y desarrollo académico en los campus de la ULEAM."
              isTextArea={true}
            />
          </p>
        </div>

        {/* Columna 2: Enlaces Rápidos */}
        <div className="footer-links-col">
          <h3>
            <EditableText textKey="footer_links_title" defaultText="Enlaces Rápidos" />
          </h3>
          <ul>
            <li>
              <Link to="/">
                <EditableText textKey="footer_link_1" defaultText="Inicio" />
              </Link>
            </li>
            <li>
              <Link to="/mapa-tiempo-real">
                <EditableText textKey="footer_link_2" defaultText="Monitoreo" />
              </Link>
            </li>
            <li>
              <a href="/#proyecto">
                <EditableText textKey="footer_link_3" defaultText="Proyecto" />
              </a>
            </li>
          </ul>
        </div>

        {/* Columna 3: Información de Contacto */}
        <div className="footer-contact-col">
          <h3>
            <EditableText textKey="footer_contact_title" defaultText="Contacto & Soporte" />
          </h3>
          <p>
            <strong>
              <EditableText textKey="footer_dept_label" defaultText="Departamento:" />
            </strong>{" "}
            <EditableText
              textKey="footer_dept_value"
              defaultText="Dirección de Innovación Tecnológica & Telecomunicaciones"
            />
          </p>
          <p>
            <strong>
              <EditableText textKey="footer_location_label" defaultText="Ubicación:" />
            </strong>{" "}
            <EditableText textKey="footer_location_value" defaultText="Av. Circunvalación, Manta - Ecuador" />
          </p>
          <p>
            <strong>
              <EditableText textKey="footer_email_label" defaultText="Email:" />
            </strong>{" "}
            <EditableText textKey="footer_email_value" defaultText="dit@uleam.edu.ec" />
          </p>
        </div>

      </div>

      <div className="footer-bottom-bar">
        <p>
          <EditableText
            textKey="footer_copyright"
            defaultText="Universidad Laica Eloy Alfaro de Manabí © 2026 - Todos los derechos reservados"
          />
        </p>
        <span className="portal-system-ver">
          <EditableText
            textKey="footer_system_ver"
            defaultText="Sistema de Telemetría Distribuida - Campus Inteligente v2.4.1"
          />
        </span>
      </div>
    </footer>
  );
}