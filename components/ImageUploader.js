"use client"

import React, { useState, useRef, useEffect } from "react"

export default function ImageUploader({ onUploadSuccess }) {
  const [imageFile, setImageFile] = useState(null); // Para el archivo seleccionado
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // Para previsualización (archivo o cámara)
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [useCamera, setUseCamera] = useState(false); // Nuevo estado para alternar cámara/archivo
  const [cameraActive, setCameraActive] = useState(false); // Nuevo estado para saber si la cámara está activa
  const [cameraError, setCameraError] = useState(null); // Nuevo estado para errores de cámara

  const videoRef = useRef(null); // Referencia al elemento <video>
  const canvasRef = useRef(null); // Referencia al elemento <canvas>
  const streamRef = useRef(null); // Referencia para el stream de la cámara

  // Efecto para iniciar/detener la cámara
  useEffect(() => {
    if (useCamera) {
      startCamera();
    } else {
      stopCamera();
      setCameraError(null); // Limpiar errores de cámara al cambiar de modo
    }
    // Limpiar al desmontar
    return () => {
      stopCamera();
    };
  }, [useCamera]);

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(false); // Resetear estado de cámara activa
    try {
      // Modificación clave: solicitar la cámara trasera (environment)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" } // Especifica la cámara trasera
        },
        audio: false // No necesitamos audio para esto
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Esperar a que el video cargue los metadatos para asegurar que las dimensiones estén disponibles
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true); // La cámara está activa y reproduciéndose
          console.log("DEBUG: Cámara iniciada y reproduciéndose.");
        };
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Acceso a la cámara denegado. Por favor, permite el acceso en la configuración de tu navegador.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No se encontró ninguna cámara trasera. Intentando con la cámara frontal o asegúrate de que una cámara esté conectada.");
        // Opcional: intentar con la cámara frontal si la trasera no se encuentra
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              setCameraActive(true);
              setCameraError(null); // Limpiar el error si la frontal funciona
              console.log("DEBUG: Cámara frontal iniciada como alternativa.");
            };
          }
        } catch (frontErr) {
          console.error("Error al acceder a la cámara frontal como alternativa:", frontErr);
          setCameraError("No se encontró ninguna cámara disponible o el acceso fue denegado.");
          setUseCamera(false);
          setCameraActive(false);
        }
      } else {
        setCameraError("Error al iniciar la cámara: " + err.message);
      }
      setUseCamera(false); // Volver al modo de subida de archivo si hay un error grave
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      console.log("DEBUG: Cámara detenida.");
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setImageFile(null); // Limpiar archivo de imagen al detener la cámara
    setImagePreviewUrl(null); // Limpiar previsualización de cámara
    setCameraActive(false);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setImageFile(selectedFile);
      setImagePreviewUrl(URL.createObjectURL(selectedFile));
      setUploadError(null);
    } else {
      setImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Asegurarse de que el canvas tenga las mismas dimensiones que el video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir el contenido del canvas a un Blob (archivo)
      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], "captured_photo.jpeg", { type: "image/jpeg" });
          setImageFile(capturedFile);
          setImagePreviewUrl(URL.createObjectURL(capturedFile)); // Mostrar previsualización de la foto capturada
          setUploadError(null);
          // No detener la cámara inmediatamente, permitir al usuario ver la captura
          // La cámara se detendrá cuando se suba la foto o se cambie de modo.
          console.log("DEBUG: Foto capturada.");
        } else {
          setUploadError("Fallo al capturar la imagen.");
          console.error("DEBUG: Fallo al crear Blob de la imagen.");
        }
      }, 'image/jpeg', 0.9); // 0.9 es la calidad JPEG
    } else {
      setUploadError("La cámara no está activa o lista para capturar.");
      console.warn("DEBUG: Intento de captura sin cámara activa.");
    }
  };


  const handleUpload = async () => {
    if (!imageFile) {
      setUploadError("Por favor, selecciona una imagen o toma una foto.");
      return;
    }

    setLoading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Error del backend:", err);
        setUploadError("Error al analizar: " + (err.error || "Desconocido"));
        setLoading(false);
        return;
      }

      const data = await res.json(); // La API de analyze ahora devuelve el objeto meal completo
      console.log("DEBUG: Datos de la comida analizada recibidos:", data);

      // Llama a onUploadSuccess con los datos completos de la comida y la URL de la imagen
      if (onUploadSuccess) {
        onUploadSuccess({ ...data, imageUrl: imagePreviewUrl });
      }

      // Limpiar estados después de una subida exitosa
      setImageFile(null);
      setImagePreviewUrl(null);
      setUseCamera(false); // Volver al modo de subida de archivo por defecto
      stopCamera(); // Asegurarse de que la cámara se detenga después de la subida
    } catch (err) {
      console.error("Error en la petición:", err);
      setUploadError("Error inesperado: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md w-full">
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => {
            setUseCamera(false);
            stopCamera(); // Asegúrate de detener la cámara al cambiar de modo
          }}
          className={`px-4 py-2 rounded-full font-semibold transition-colors duration-200
            ${!useCamera ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
        >
          Subir Archivo
        </button>
        <button
          onClick={() => {
            setUseCamera(true);
            // startCamera() se llamará por el useEffect cuando useCamera cambie a true
          }}
          className={`px-4 py-2 rounded-full font-semibold transition-colors duration-200
            ${useCamera ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
        >
          Tomar Foto
        </button>
      </div>

      {cameraError && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200 text-sm text-center">
          <p>{cameraError}</p>
        </div>
      )}

      {useCamera ? (
        <div className="flex flex-col items-center">
          {!cameraActive && !cameraError && (
            <p className="text-gray-600 mb-4">Iniciando cámara... Por favor, permite el acceso.</p>
          )}
          <video ref={videoRef} className="w-full max-w-md rounded-lg shadow-md mb-4" autoPlay playsInline muted></video>
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas> {/* Canvas oculto para la captura */}
          <button
            onClick={handleTakePhoto}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out shadow-md mb-4"
            disabled={!cameraActive || loading} // Deshabilitar si la cámara no está activa o está cargando
          >
            Capturar Foto
          </button>
          {imagePreviewUrl && ( // Mostrar previsualización de la foto capturada antes de subir
            <div className="mb-4">
              <img src={imagePreviewUrl} alt="Foto Capturada" className="max-w-full h-auto rounded-lg shadow-md" style={{ maxHeight: '150px' }} />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4 p-2 border rounded-lg w-full max-w-md" />
          {imagePreviewUrl && (
            <div className="mb-4">
              <img src={imagePreviewUrl} alt="Previsualización de la comida" className="max-w-full h-auto rounded-lg shadow-md" style={{ maxHeight: '150px' }} />
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleUpload}
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 font-semibold transition-colors duration-200 w-full"
        disabled={loading || !imageFile}
      >
        {loading ? "Analizando..." : "Subir y Analizar"}
      </button>

      {uploadError && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200 text-sm text-center">
          <p>{uploadError}</p>
        </div>
      )}
    </div>
  );
}
