import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useInterfaceText } from "../context/InterfaceTextContext";
import { useInterfaceImage } from "../context/InterfaceImageContext";
import { useLanguage } from "../context/LanguageContext";
import { checkEditPermission } from "../utils/checkEditPermission";
import Swal from "sweetalert2";
import "./EditableImage.css";

// ── ICONS ──
const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    width="14" height="14" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// ─────────────────────────────────────────────
// Image Cropper Component
// ─────────────────────────────────────────────
function ImageCropper({ imageSrc, aspectRatio, recommendedW, recommendedH, onCrop, onCancel }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const stageRef = useRef(null);
  const imgRef = useRef(null);
  const dragging = useRef(null);

  const [cropBox, setCropBox] = useState(null);
  // imgRect: position/size of <img> inside the stage, relative to stage top-left
  const [imgRect, setImgRect] = useState(null);

  // ── Measure image position inside stage after load ──
  const measureImg = useCallback(() => {
    if (!imgRef.current || !stageRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    const imgDomRect = imgRef.current.getBoundingClientRect();

    // img rect relative to stage
    const rel = {
      x: imgDomRect.left - stageRect.left,
      y: imgDomRect.top - stageRect.top,
      w: imgDomRect.width,
      h: imgDomRect.height,
    };
    setImgRect(rel);

    // Initial crop box: centered, 80% of img width, correct AR
    let bw = rel.w * 0.8;
    let bh = bw / aspectRatio;
    if (bh > rel.h * 0.9) { bh = rel.h * 0.9; bw = bh * aspectRatio; }

    setCropBox({
      x: rel.x + (rel.w - bw) / 2,
      y: rel.y + (rel.h - bh) / 2,
      w: bw,
      h: bh,
    });
  }, [aspectRatio]);

  const handleImgLoad = () => measureImg();

  // Also remeasure on window resize
  useEffect(() => {
    window.addEventListener("resize", measureImg);
    return () => window.removeEventListener("resize", measureImg);
  }, [measureImg]);

  // ── DRAG LOGIC (uses refs to avoid stale closures) ──
  const cropBoxRef = useRef(cropBox);
  useEffect(() => { cropBoxRef.current = cropBox; }, [cropBox]);
  const imgRectRef = useRef(imgRect);
  useEffect(() => { imgRectRef.current = imgRect; }, [imgRect]);

  const handleMouseDown = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const box = cropBoxRef.current;
    if (!box) return;
    dragging.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startBox: { ...box },
    };

    const onMove = (ev) => {
      const { type: t, startX, startY, startBox: sb } = dragging.current;
      const ir = imgRectRef.current;
      if (!ir) return;

      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      // Constrain helpers
      const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
      const minSize = 30;

      if (t === "move") {
        const nx = clamp(sb.x + dx, ir.x, ir.x + ir.w - sb.w);
        const ny = clamp(sb.y + dy, ir.y, ir.y + ir.h - sb.h);
        setCropBox({ ...sb, x: nx, y: ny });

      } else if (t === "resize-se") {
        // Drag SE corner → grow right & down
        let nw = Math.max(minSize, sb.w + dx);
        let nh = nw / aspectRatio;
        // Clamp to image bounds
        if (sb.x + nw > ir.x + ir.w) { nw = ir.x + ir.w - sb.x; nh = nw / aspectRatio; }
        if (sb.y + nh > ir.y + ir.h) { nh = ir.y + ir.h - sb.y; nw = nh * aspectRatio; }
        setCropBox({ ...sb, w: Math.max(minSize, nw), h: Math.max(minSize, nw / aspectRatio) });

      } else if (t === "resize-nw") {
        // Drag NW corner → shrink/grow from top-left
        let nw = Math.max(minSize, sb.w - dx);
        let nh = nw / aspectRatio;
        let nx = sb.x + sb.w - nw;
        let ny = sb.y + sb.h - nh;
        if (nx < ir.x) { nx = ir.x; nw = sb.x + sb.w - ir.x; nh = nw / aspectRatio; ny = sb.y + sb.h - nh; }
        if (ny < ir.y) { ny = ir.y; nh = sb.y + sb.h - ir.y; nw = nh * aspectRatio; nx = sb.x + sb.w - nw; }
        if (nw < minSize) { nw = minSize; nh = nw / aspectRatio; nx = sb.x + sb.w - nw; ny = sb.y + sb.h - nh; }
        setCropBox({ x: nx, y: ny, w: nw, h: nh });

      } else if (t === "resize-ne") {
        // Drag NE corner → grow right, shrink from top
        let nw = Math.max(minSize, sb.w + dx);
        let nh = nw / aspectRatio;
        let ny = sb.y + sb.h - nh;
        if (sb.x + nw > ir.x + ir.w) { nw = ir.x + ir.w - sb.x; nh = nw / aspectRatio; ny = sb.y + sb.h - nh; }
        if (ny < ir.y) { ny = ir.y; nh = sb.y + sb.h - ir.y; nw = nh * aspectRatio; }
        if (nw < minSize) { nw = minSize; nh = nw / aspectRatio; ny = sb.y + sb.h - nh; }
        setCropBox({ ...sb, y: ny, w: nw, h: nh });

      } else if (t === "resize-sw") {
        // Drag SW corner → shrink from left, grow down
        let nw = Math.max(minSize, sb.w - dx);
        let nh = nw / aspectRatio;
        let nx = sb.x + sb.w - nw;
        if (nx < ir.x) { nx = ir.x; nw = sb.x + sb.w - ir.x; nh = nw / aspectRatio; }
        if (sb.y + nh > ir.y + ir.h) { nh = ir.y + ir.h - sb.y; nw = nh * aspectRatio; nx = sb.x + sb.w - nw; }
        if (nw < minSize) { nw = minSize; nh = nw / aspectRatio; nx = sb.x + sb.w - nw; }
        setCropBox({ ...sb, x: nx, w: nw, h: nh });
      }
    };

    const onUp = () => {
      dragging.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [aspectRatio]);

  // ── APPLY CROP ──
  const applyCrop = () => {
    if (!cropBox || !imgRef.current || !imgRect) return;
    const img = imgRef.current;

    // Crop box relative to image display area
    const relX = cropBox.x - imgRect.x;
    const relY = cropBox.y - imgRect.y;

    const scaleX = img.naturalWidth / imgRect.w;
    const scaleY = img.naturalHeight / imgRect.h;

    const sx = relX * scaleX;
    const sy = relY * scaleY;
    const sw = cropBox.w * scaleX;
    const sh = cropBox.h * scaleY;

    const canvas = document.createElement("canvas");
    canvas.width = recommendedW;
    canvas.height = recommendedH;
    const ctx = canvas.getContext("2d");

    const isPng = imageSrc && (imageSrc.includes("data:image/png") || imageSrc.includes(".png"));
    const mimeType = isPng ? "image/png" : "image/jpeg";

    if (isPng) {
      ctx.clearRect(0, 0, recommendedW, recommendedH);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, recommendedW, recommendedH);
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, recommendedW, recommendedH);

    const quality = recommendedW <= 300 ? 0.75 : 0.88;
    const croppedDataUrl = isPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", quality);
    onCrop(croppedDataUrl, mimeType);
  };

  if (!imageSrc) return null;

  return (
    <div className="eimg-cropper-overlay">
      <div className="eimg-cropper-box">
        <div className="eimg-cropper-header">
          <span>{isEn ? "✂️ Crop image" : "✂️ Recortar imagen"}</span>
          <span className="eimg-cropper-hint">
            {isEn ? `Recommended: ${recommendedW} × ${recommendedH} px • Drag corner handles to resize` : `Recomendado: ${recommendedW} × ${recommendedH} px • Arrastra las esquinas del recuadro para redimensionar`}
          </span>
        </div>

        {/* Stage: takes whatever size the img needs, clipped to modal width */}
        <div className="eimg-cropper-stage" ref={stageRef} style={{ userSelect: "none", position: "relative" }}>
          <img
            ref={imgRef}
            src={imageSrc}
            alt="crop source"
            className="eimg-cropper-img"
            onLoad={handleImgLoad}
            draggable={false}
            style={{ display: "block", maxWidth: "100%", maxHeight: "60vh", objectFit: "contain" }}
          />

          {/* Dark overlay & crop rect — rendered relative to .eimg-cropper-stage */}
          {cropBox && imgRect && (
            <>
              {/* Top shade */}
              <div className="eimg-crop-shade" style={{ top: 0, left: 0, right: 0, height: Math.max(0, cropBox.y) }} />
              {/* Bottom shade */}
              <div className="eimg-crop-shade" style={{ top: cropBox.y + cropBox.h, left: 0, right: 0, bottom: 0 }} />
              {/* Left shade */}
              <div className="eimg-crop-shade" style={{ top: cropBox.y, left: 0, width: Math.max(0, cropBox.x), height: cropBox.h }} />
              {/* Right shade */}
              <div className="eimg-crop-shade" style={{ top: cropBox.y, left: cropBox.x + cropBox.w, right: 0, height: cropBox.h }} />

              {/* Crop rectangle */}
              <div
                className="eimg-crop-rect"
                style={{ left: cropBox.x, top: cropBox.y, width: cropBox.w, height: cropBox.h, position: "absolute" }}
                onMouseDown={(e) => handleMouseDown(e, "move")}
              >
                {/* Rule of thirds */}
                <div className="eimg-crop-grid">
                  <div className="eimg-crop-grid-h" style={{ top: "33.3%" }} />
                  <div className="eimg-crop-grid-h" style={{ top: "66.6%" }} />
                  <div className="eimg-crop-grid-v" style={{ left: "33.3%" }} />
                  <div className="eimg-crop-grid-v" style={{ left: "66.6%" }} />
                </div>

                {/* 4 corner handles – each stops propagation so they don't trigger "move" */}
                <div className="eimg-crop-handle nw" onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-nw"); }} />
                <div className="eimg-crop-handle ne" onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-ne"); }} />
                <div className="eimg-crop-handle sw" onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-sw"); }} />
                <div className="eimg-crop-handle se" onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-se"); }} />
              </div>
            </>
          )}
        </div>

        <div className="eimg-cropper-actions">
          <button className="eimg-btn eimg-btn-ghost" onClick={onCancel}>{isEn ? "Cancel" : "Cancelar"}</button>
          <button className="eimg-btn eimg-btn-primary" onClick={applyCrop}>{isEn ? "✅ Apply Crop" : "✅ Aplicar recorte"}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main EditableImage Component
// ─────────────────────────────────────────────
export default function EditableImage({
  imageKey,
  defaultSrc = null,
  defaultSvg = null,
  alt = "",
  className = "",
  style = {},
  wrapperClassName = "",
  wrapperStyle = {},
  recommendedWidth = 400,
  recommendedHeight = 400,
  hint = "",
  circular = false,
}) {
  const { editMode, loading: textLoading } = useInterfaceText();
  const { images, imagesLoading, updateImage, deleteImage } = useInterfaceImage();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [hasPermission, setHasPermission] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cropperSrc, setCropperSrc] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const aspectRatio = recommendedWidth / recommendedHeight;

  // ── Derive effective src ──
  const dbEntry = images[imageKey];
  const effectiveSrc = dbEntry?.image_data
    ? `data:${dbEntry.mime_type};base64,${dbEntry.image_data.replace(/^data:[^;]+;base64,/, "")}`
    : defaultSrc;

  // ── Skeleton state: active while global text/image data is loading ──
  const isShowingSkeleton = imagesLoading || textLoading;

  // ── Check permissions ──
  useEffect(() => {
    const checkRole = () => {
      checkEditPermission().then(res => setHasPermission(res));
    };
    checkRole();
    window.addEventListener("userProfileUpdated", checkRole);
    window.addEventListener("appInterfacesUpdated", checkRole);
    return () => {
      window.removeEventListener("userProfileUpdated", checkRole);
      window.removeEventListener("appInterfacesUpdated", checkRole);
    };
  }, []);

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "error",
        title: isEn ? "Please select a valid image file" : "Por favor selecciona un archivo de imagen válido",
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const fileType = file.type;

      // Si es un GIF animado, PNG o SVG, preguntar si desea usarse directo sin compresión ni recorte
      if (fileType === "image/gif" || fileType === "image/png" || fileType === "image/svg+xml") {
        Swal.fire({
          title: isEn ? "Image Format Detected" : "Formato de Imagen Detectado",
          text: isEn 
            ? `You selected a ${fileType.split("/")[1].toUpperCase()} file. Do you want to use the original file directly (uncompressed/uncropped) or open the crop tool?` 
            : `Has seleccionado un archivo ${fileType.split("/")[1].toUpperCase()}. ¿Deseas usar el archivo original directo (sin comprimir/recortar) o abrir la herramienta de recorte?`,
          icon: "question",
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: isEn ? "Use Original (Uncompressed)" : "Usar Original (Sin comprimir)",
          denyButtonText: isEn ? "✂️ Crop image" : "✂️ Recortar imagen",
          cancelButtonText: isEn ? "Cancel" : "Cancelar",
          confirmButtonColor: "#2563eb",
          denyButtonColor: "#475569",
        }).then((res) => {
          if (res.isConfirmed) {
            setPreviewSrc(dataUrl);
          } else if (res.isDenied) {
            setCropperSrc(dataUrl);
          }
        });
      } else {
        setCropperSrc(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropDone = (base64) => {
    setPreviewSrc(base64);
    setCropperSrc(null);
  };

  const handleSave = async () => {
    if (!previewSrc) return;
    setSaving(true);
    try {
      const pure = previewSrc.split(",")[1];
      const mime = previewSrc.match(/^data:([^;]+)/)?.[1] ?? "image/jpeg";
      await updateImage(imageKey, pure, mime);
      setPreviewSrc(null);
      setShowModal(false);
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        icon: "success",
        title: isEn ? "Interface image updated" : "Imagen de interfaz actualizada",
      });
    } catch (err) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "error",
        title: isEn ? "Error saving image" : "Error al guardar la imagen",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const res = await Swal.fire({
      title: isEn ? "Delete custom image?" : "¿Eliminar imagen personalizada?",
      text: isEn ? "The uploaded photo will be deleted and the default image will be restored." : "Se eliminará la foto cargada y se restaurará la imagen predeterminada.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: isEn ? "Yes, delete" : "Sí, eliminar",
      cancelButtonText: isEn ? "Cancel" : "Cancelar",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
    });
    if (!res.isConfirmed) return;

    setSaving(true);
    try {
      await deleteImage(imageKey);
      setShowModal(false);
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        icon: "info",
        title: isEn ? "Image deleted" : "Imagen eliminada",
      });
    } catch (err) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "error",
        title: isEn ? "Error deleting image" : "Error al eliminar la imagen",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasCustomImage = Boolean(dbEntry?.image_data);

  // For circular images: wrapper has overflow: visible so pencil btn isn't clipped.
  // The image itself is clipped via border-radius on the img element.
  const wrapperOverflow = circular ? "visible" : "hidden";

  return (
    <>
      {/* ── Wrapper ── */}
      <div
        className={`eimg-wrapper ${isShowingSkeleton ? "image-skeleton-loader" : ""} ${wrapperClassName}`}
        style={{ position: "relative", overflow: wrapperOverflow, ...wrapperStyle }}
      >
        {/* Show DB image or default img if src is available */}
        {effectiveSrc ? (
          <img
            src={effectiveSrc}
            alt={alt}
            className={className}
            style={{ ...style, opacity: isShowingSkeleton ? 0 : 1, transition: "opacity 0.35s ease" }}
            onLoad={() => setImgLoaded(true)}
          />
        ) : (
          /* Render SVG fallback (for tech card icons) */
          <div
            className={className}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: isShowingSkeleton ? 0 : 1,
              transition: "opacity 0.35s ease",
              ...style
            }}
          >
            {defaultSvg}
          </div>
        )}

        {/* ── Pencil button — uses absolute positioning, z-index above clip ── */}
        {!isShowingSkeleton && hasPermission && editMode && (
          <button
            className={`eimg-pencil-btn ${circular ? "eimg-pencil-btn--circular" : ""}`}
            title={isEn ? `Edit image: ${imageKey}` : `Editar imagen: ${imageKey}`}
            onClick={() => { setPreviewSrc(null); setShowModal(true); }}
            type="button"
          >
            <PencilIcon />
          </button>
        )}
      </div>

      {/* ── Cropper (rendered via Portal to avoid CSS transform containing block issues) ── */}
      {cropperSrc && createPortal(
        <ImageCropper
          imageSrc={cropperSrc}
          aspectRatio={aspectRatio}
          recommendedW={recommendedWidth}
          recommendedH={recommendedHeight}
          onCrop={handleCropDone}
          onCancel={() => setCropperSrc(null)}
        />,
        document.body
      )}

      {/* ── Management Modal (rendered via Portal to ensure center viewport placement) ── */}
      {showModal && createPortal(
        <div className="eimg-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="eimg-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="eimg-modal-header">
              <div>
                <h3 className="eimg-modal-title">{isEn ? "Edit Interface Image" : "Editar imagen de interfaz"}</h3>
                <code className="eimg-modal-key">{imageKey}</code>
              </div>
              <button className="eimg-modal-close" onClick={() => setShowModal(false)}>
                <CloseIcon />
              </button>
            </div>

            {hint && <p className="eimg-modal-hint-text">{hint}</p>}
            <div className="eimg-modal-recommended">
              📐 {isEn ? "Recommended size:" : "Tamaño recomendado:"} <strong>{recommendedWidth} × {recommendedHeight} px</strong>
              {recommendedWidth <= 300 && (
                <span className="eimg-modal-compression-badge">{isEn ? " · Automatic compression applied" : " · Compresión automática aplicada"}</span>
              )}
            </div>

            <div className="eimg-modal-preview-wrap">
              <div className="eimg-modal-preview-label">
                {previewSrc 
                  ? (isEn ? "Crop preview:" : "Vista previa del recorte:") 
                  : hasCustomImage 
                  ? (isEn ? "Current image:" : "Imagen actual:") 
                  : effectiveSrc 
                  ? (isEn ? "Default image:" : "Imagen predeterminada:") 
                  : (isEn ? "No image (SVG icon will be used)" : "Sin imagen (se usará el ícono SVG)")}
              </div>
              <div className="eimg-modal-preview-img-wrap">
                {previewSrc || effectiveSrc ? (
                  <img
                    src={previewSrc || effectiveSrc}
                    alt="preview"
                    style={{ maxWidth: "100%", maxHeight: "280px", objectFit: "contain", borderRadius: "8px" }}
                  />
                ) : (
                  <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{isEn ? "No default image — upload a new one" : "Sin imagen predeterminada — sube una nueva"}</div>
                )}
              </div>
            </div>

            <div className="eimg-modal-actions">
              {previewSrc ? (
                <>
                  <button className="eimg-btn eimg-btn-ghost" onClick={() => setPreviewSrc(null)}>{isEn ? "← Back to crop" : "← Volver a recortar"}</button>
                  <button className="eimg-btn eimg-btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      (isEn ? "Saving…" : "Guardando…")
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                          <polyline points="17 21 17 13 7 13 7 21"></polyline>
                          <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        {isEn ? "Save image" : "Guardar imagen"}
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {hasCustomImage && (
                    <button className="eimg-btn eimg-btn-danger" onClick={handleDelete} disabled={saving}>
                      <TrashIcon /> {saving ? (isEn ? "Deleting…" : "Eliminando…") : (isEn ? "Delete image" : "Eliminar imagen")}
                    </button>
                  )}
                  <button className="eimg-btn eimg-btn-secondary" onClick={handlePickFile}>
                    <UploadIcon />
                    {hasCustomImage ? (isEn ? "Update image" : "Actualizar imagen") : (isEn ? "Upload image" : "Subir imagen")}
                  </button>
                </>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
