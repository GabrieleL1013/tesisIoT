import { API_BASE_URL, fetchWithAuth } from "../config/api";
import { createContext, useState, useContext, useEffect } from "react";

const InterfaceTextContext = createContext();

export function InterfaceTextProvider({ children }) {
  const [texts, setTexts] = useState(() => {
    try {
      const saved = localStorage.getItem("cached_interface_texts");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(() => {
    return Object.keys(texts || {}).length === 0;
  });
  const [editMode, setEditMode] = useState(false);

  // Cargar todos los textos al iniciar y actualizar la caché local
  useEffect(() => {
    fetch(`${API_BASE_URL}/interface-texts`)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando textos de interfaz.");
        return res.json();
      })
      .then((data) => {
        const sanitized = Array.isArray(data) ? {} : data;
        setTexts(sanitized);
        try {
          localStorage.setItem("cached_interface_texts", JSON.stringify(sanitized));
        } catch (e) {
          console.warn("No se pudo guardar en localStorage", e);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar textos dinámicos:", err);
        setLoading(false);
      });
  }, []);

  // Función para actualizar o crear un texto
  const updateText = async (key, textValue) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/interface-texts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ key, text: textValue }),
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar el texto en la base de datos.");
      }

      // Actualizar el estado local y la caché
      setTexts((prev) => {
        const next = { ...prev, [key]: textValue };
        try {
          localStorage.setItem("cached_interface_texts", JSON.stringify(next));
        } catch (e) {
          console.warn("No se pudo actualizar localStorage", e);
        }
        return next;
      });
      return true;
    } catch (error) {
      console.error("Error actualizando texto de interfaz:", error);
      throw error;
    }
  };

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
  };

  return (
    <InterfaceTextContext.Provider value={{ texts, updateText, loading, editMode, toggleEditMode }}>
      {children}
    </InterfaceTextContext.Provider>
  );
}

export const useInterfaceText = () => {
  const context = useContext(InterfaceTextContext);
  if (!context) {
    throw new Error("useInterfaceText debe usarse dentro de un InterfaceTextProvider");
  }
  return context;
};
