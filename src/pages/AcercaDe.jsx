import { useEffect } from "react";
import "../styles/AcercaDe.css";
import IotJpg from "../assets/IOT.jpg";
import EditableText from "../components/EditableText";

export default function AcercaDe() {
  useEffect(() => {
    document.title = "Quiénes Somos - Ecosistema IoT ULEAM";
  }, []);

  return (
    <div className="about-page">
      {/* ── HERO BANNER ── */}
      <section 
        className="about-hero" 
        style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.88)), url(${IotJpg})` }}
      >
        <div className="about-hero-overlay" />
        <div className="about-hero-grid" />
        <div className="about-hero-container" style={{ textAlign: "center" }}>
          <h1 className="about-hero-title" style={{ fontSize: "3.5rem", margin: 0 }}>
            <EditableText textKey="acerca_hero_title" defaultText="Quiénes Somos" />
          </h1>
        </div>
      </section>

      {/* ── SECCIÓN PRESENTACIÓN PRINCIPAL ── */}
      <section className="about-intro-section">
        <div className="about-section-container">
          <div className="about-intro-text-block">
            <span className="about-label-red">
              <EditableText textKey="acerca_intro_label" defaultText="Proyecto Institucional" />
            </span>
            <h2>
              <EditableText textKey="acerca_intro_title" defaultText="Desarrollo e Innovación Tecnológica en la ULEAM" />
            </h2>
            <p className="about-intro-p">
              <EditableText 
                textKey="acerca_intro_p" 
                defaultText="Somos la Universidad Laica Eloy Alfaro de Manabí (ULEAM) y nos encargamos del diseño, investigación, calibración y despliegue de soluciones tecnológicas basadas en el Internet de las Cosas (IoT). A través de la sinergia entre la Facultad de Ciencias Informáticas (FACCI) y la Dirección de Innovación Tecnológica (DIT), desarrollamos sensores físicos e infraestructura inalámbrica (WiFi/LoRaWAN) para el monitoreo de recursos y la recolección de datos científicos abiertos." 
                isTextArea={true} 
              />
            </p>
          </div>
        </div>
      </section>

      {/* ── MOSAICO DE IMÁGENES Y CONTENIDO (Ancho completo de pantalla) ── */}
      <section className="about-mosaic-section">
        <div className="about-mosaic-grid">
          
          {/* 1. Imagen (Placa de Circuito Impreso / Microprocesador) */}
          <div className="mosaic-card image-card">
            <img 
              src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80" 
              alt="Placa electrónica de sensor" 
            />
          </div>

          {/* 2. Propósito (01 - Celeste/Azul) */}
          <div className="mosaic-card text-card bg-cyan">
            <span className="card-number">01</span>
            <h3><EditableText textKey="acerca_mosaic_title_prop" defaultText="PROPÓSITO" /></h3>
            <p><EditableText textKey="acerca_mosaic_desc_prop" defaultText="Estamos comprometidos con la automatización del campus y el monitoreo sustentable mediante tecnologías IoT." isTextArea={true} /></p>
          </div>

          {/* 3. Imagen (Mesa de laboratorio con componentes y soldador) */}
          <div className="mosaic-card image-card">
            <img 
              src="https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80" 
              alt="Mesa de hardware y soldadura" 
            />
          </div>

          {/* 4. Imagen (Soldando cables en circuito de nodo IoT) */}
          <div className="mosaic-card image-card">
            <img 
              src="https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=600&q=80" 
              alt="Soldando componentes electrónicos" 
            />
          </div>

          {/* 5. Visión (04 - Celeste/Azul) */}
          <div className="mosaic-card text-card bg-cyan">
            <span className="card-number">04</span>
            <h3><EditableText textKey="acerca_mosaic_title_vis" defaultText="VISIÓN" /></h3>
            <p><EditableText textKey="acerca_mosaic_desc_vis" defaultText="Ser el referente principal de campus inteligente en el país, impulsando proyectos de grado y de investigación estudiantil." isTextArea={true} /></p>
          </div>

          {/* 6. Valores (02 - Rojo/Rosado) */}
          <div className="mosaic-card text-card bg-red">
            <span className="card-number">02</span>
            <h3><EditableText textKey="acerca_mosaic_title_val" defaultText="VALORES" /></h3>
            <p><EditableText textKey="acerca_mosaic_desc_val" defaultText="Fomentamos la innovación abierta, el desarrollo sostenible, el rigor académico y la cooperación institucional." isTextArea={true} /></p>
          </div>

          {/* 7. Imagen (Dispositivo ESP32 con LEDs activos) */}
          <div className="mosaic-card image-card">
            <img 
              src="https://images.unsplash.com/photo-1517055729445-fa7d27394b48?auto=format&fit=crop&w=600&q=80" 
              alt="Dispositivo IoT activo" 
            />
          </div>

          {/* 8. Imagen (Módulo de hardware y antenas) */}
          <div className="mosaic-card image-card">
            <img 
              src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80" 
              alt="Circuito y antenas inalámbricas" 
            />
          </div>

          {/* 9. Misión (03 - Rojo/Rosado) */}
          <div className="mosaic-card text-card bg-red">
            <span className="card-number">03</span>
            <h3><EditableText textKey="acerca_mosaic_title_mis" defaultText="MISIÓN" /></h3>
            <p><EditableText textKey="acerca_mosaic_desc_mis" defaultText="Trabajamos en el desarrollo técnico de sensores y redes inalámbricas para recopilar datos de telemetría continuos y rigurosos." isTextArea={true} /></p>
          </div>

          {/* 10. Imagen (Ajustando nodo IoT en su caja de protección) */}
          <div className="mosaic-card image-card">
            <img 
              src="https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=600&q=80" 
              alt="Calibrando caja de sensor de intemperie" 
            />
          </div>

        </div>
      </section>
    </div>
  );
}
