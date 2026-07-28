import { API_BASE_URL } from "../config/api";
import { createContext, useState, useContext, useEffect } from "react";

const InterfaceTextContext = createContext();

export function InterfaceTextProvider({ children }) {
  const [texts, setTexts] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Cargar todos los textos al iniciar
  useEffect(() => {
    fetch(`${API_BASE_URL}/interface-texts`)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando textos de interfaz.");
        return res.json();
      })
      .then((data) => {
        // Si el backend está vacío, puede responder [] en lugar de {}
        const sanitized = Array.isArray(data) ? {} : data;
        setTexts(sanitized);
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
      const response = await fetch(`${API_BASE_URL}/interface-texts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ key, text: textValue }),
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar el texto en la base de datos.");
      }

      // Actualizar el estado local
      setTexts((prev) => ({
        ...prev,
        [key]: textValue,
      }));
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
