import { API_BASE_URL } from "../config/api";
import { createContext, useState, useContext, useEffect } from "react";

const InterfaceImageContext = createContext();

export function InterfaceImageProvider({ children }) {
  const [images, setImages] = useState({});
  const [imagesLoading, setImagesLoading] = useState(true);

  // Load all interface images on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/interface-images`)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando imágenes de interfaz.");
        return res.json();
      })
      .then((data) => {
        const sanitized = Array.isArray(data) ? {} : data;
        setImages(sanitized);
        setImagesLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar imágenes de interfaz:", err);
        setImagesLoading(false);
      });
  }, []);

  // Upload or update an interface image
  const updateImage = async (key, imageData, mimeType = "image/jpeg") => {
    const response = await fetch(`${API_BASE_URL}/interface-images`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ key, image_data: imageData, mime_type: mimeType }),
    });

    if (!response.ok) {
      throw new Error("No se pudo guardar la imagen en la base de datos.");
    }

    setImages((prev) => ({
      ...prev,
      [key]: { image_data: imageData, mime_type: mimeType },
    }));
    return true;
  };

  // Delete an interface image
  const deleteImage = async (key) => {
    const response = await fetch(`${API_BASE_URL}/interface-images/${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      throw new Error("No se pudo eliminar la imagen.");
    }

    setImages((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    return true;
  };

  return (
    <InterfaceImageContext.Provider value={{ images, imagesLoading, updateImage, deleteImage }}>
      {children}
    </InterfaceImageContext.Provider>
  );
}

export const useInterfaceImage = () => {
  const context = useContext(InterfaceImageContext);
  if (!context) {
    throw new Error("useInterfaceImage debe usarse dentro de un InterfaceImageProvider");
  }
  return context;
};
