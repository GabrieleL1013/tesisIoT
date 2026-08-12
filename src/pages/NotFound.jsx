import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotFound() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  usePageTitle("404 Page not found");

  const [hoverBack, setHoverBack] = useState(false);
  const [hoverHome, setHoverHome] = useState(false);

  const homePath = `/${language || "es"}`;

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(homePath);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#ffffff",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        margin: 0,
        padding: "20px",
        boxSizing: "border-box",
        overflow: "hidden",
        userSelect: "none"
      }}
    >
      {/* Icono Carita Triste SVG */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
        <svg
          viewBox="0 0 100 100"
          style={{ width: "110px", height: "110px", color: "#3b3b3b" }}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="50" cy="50" r="42" strokeWidth="6" />
          <circle cx="36" cy="38" r="4.5" fill="currentColor" stroke="none" />
          <circle cx="64" cy="38" r="4.5" fill="currentColor" stroke="none" />
          <path d="M 33 65 Q 50 48 67 65" strokeWidth="5.5" fill="none" />
        </svg>
      </div>

      {/* Texto "404 Page not found" */}
      <h1
        style={{
          fontSize: "2.25rem",
          fontWeight: 300,
          color: "#3b3b3b",
          letterSpacing: "-0.02em",
          margin: "0 0 28px 0",
          fontFamily: "sans-serif",
          textAlign: "center"
        }}
      >
        404 Page not found
      </h1>

      {/* Botones con Íconos SVG e Interacción Hover */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        {/* Botón Retroceder (Flecha Izquierda) - Hover Filo y SVG Rojo */}
        <button
          type="button"
          onClick={handleGoBack}
          onMouseEnter={() => setHoverBack(true)}
          onMouseLeave={() => setHoverBack(false)}
          title="Retroceder"
          aria-label="Retroceder"
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            backgroundColor: hoverBack ? "#fef2f2" : "#f1f5f9",
            border: hoverBack ? "1.5px solid #dc2626" : "1.5px solid #cbd5e1",
            color: hoverBack ? "#dc2626" : "#334155",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: hoverBack ? "0 4px 12px rgba(220,38,38,0.15)" : "0 2px 4px rgba(0,0,0,0.05)"
          }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Botón Volver al Inicio (Casita / Home) - Hover Rojo más Oscuro */}
        <button
          type="button"
          onClick={() => navigate(homePath)}
          onMouseEnter={() => setHoverHome(true)}
          onMouseLeave={() => setHoverHome(false)}
          title="Ir al Inicio"
          aria-label="Ir al Inicio"
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            backgroundColor: hoverHome ? "#991b1b" : "#dc2626",
            border: "none",
            color: "#ffffff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: hoverHome ? "0 6px 16px rgba(153,27,27,0.4)" : "0 4px 12px rgba(220,38,38,0.3)"
          }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
      </div>
    </div>
  );
}
