import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import LogoImg from "../assets/LOGO.png";
import IotLogoImg from "../assets/IOT-LOGO.png";
import EditableText from "./EditableText";
import EditableImage from "./EditableImage";
import "../styles/components/Footer.css";

export default function Footer() {
  const { language } = useLanguage();
  const mapSlug = language === "en" ? "categories" : "categorias";
  const newsSlug = language === "en" ? "news" : "noticias";
  const articlesSlug = language === "en" ? "articles" : "articulos";

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
             
              isTextArea={true} forcePath="/global" />
          </p>
        </div>

        {/* Columna 2: Enlaces Rápidos */}
        <div className="footer-links-col">
          <h3>
            <EditableText textKey="footer_links_title" forcePath="/global" />
          </h3>
          <ul>
            <li>
              <Link to={`/${language}`}>
                <EditableText textKey="footer_link_1" forcePath="/global" />
              </Link>
            </li>
            <li>
              <Link to={`/${language}/${mapSlug}`}>
                <EditableText textKey="footer_link_2" forcePath="/global" />
              </Link>
            </li>
            <li>
              <Link to={`/${language}/${newsSlug}`}>
                <EditableText textKey="footer_link_3" forcePath="/global" />
              </Link>
            </li>
            <li>
              <Link to={`/${language}/${articlesSlug}`}>
                <EditableText textKey="footer_link_4" forcePath="/global" />
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 3: Información de Contacto */}
        <div className="footer-contact-col">
          <h3>
            <EditableText textKey="footer_contact_title" forcePath="/global" />
          </h3>
          <p>
            <strong>
              <EditableText textKey="footer_dept_label" forcePath="/global" />
            </strong>{" "}
            <EditableText
              textKey="footer_dept_value" forcePath="/global" />
          </p>
          <p>
            <strong>
              <EditableText textKey="footer_location_label" forcePath="/global" />
            </strong>{" "}
            <EditableText textKey="footer_location_value" forcePath="/global" />
          </p>
          <p>
            <strong>
              <EditableText textKey="footer_email_label" forcePath="/global" />
            </strong>{" "}
            <EditableText textKey="footer_email_value" forcePath="/global" />
          </p>
        </div>

      </div>

      <div className="footer-bottom-bar">
        <p>
          <EditableText
            textKey="footer_copyright" forcePath="/global" />
        </p>
        <span className="portal-system-ver">
          <EditableText
            textKey="footer_system_ver" forcePath="/global" />
        </span>
      </div>
    </footer>
  );
}