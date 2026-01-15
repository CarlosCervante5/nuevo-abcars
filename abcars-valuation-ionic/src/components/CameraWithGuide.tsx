import React, { useState, useRef, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonLoading,
  IonAlert,
} from '@ionic/react';
import { close, checkmark, camera, swapHorizontal } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PhotoGuideType } from './PhotoTypeSelector';
import PhotoTypeSelector from './PhotoTypeSelector';
import './CameraWithGuide.css';

interface CameraImage {
  webPath: string;
  file?: File;
}

interface CameraWithGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoTaken: (image: CameraImage) => void;
  guideType?: PhotoGuideType | 'car';
  photoTitle?: string;
}

const CameraWithGuide: React.FC<CameraWithGuideProps> = ({
  isOpen,
  onClose,
  onPhotoTaken,
  guideType = 'car',
  photoTitle,
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [streamReady, setStreamReady] = useState(false);
  const [currentGuideType, setCurrentGuideType] = useState<PhotoGuideType | 'car'>(guideType || 'car');
  const [showGuideSelector, setShowGuideSelector] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCapturedFile(null);
      setIsPreviewMode(false);
      setShowInstructions(true);
      setStreamReady(false);
      setCurrentGuideType(guideType || 'car');
    } else {
      setCurrentGuideType(guideType || 'car');
    }
  }, [isOpen, guideType]);

  // Forzar estilos en el DOM para WebView de Android
  useEffect(() => {
    if (isOpen && !showInstructions && !isPreviewMode) {
      const forceStyles = () => {
        const actionsElement = document.querySelector('.camera-guide-actions') as HTMLElement;
        if (actionsElement) {
          actionsElement.style.setProperty('display', 'flex', 'important');
          actionsElement.style.setProperty('flex-direction', 'column', 'important');
          actionsElement.style.setProperty('align-items', 'stretch', 'important');
          actionsElement.style.setProperty('position', 'absolute', 'important');
          actionsElement.style.setProperty('bottom', '2rem', 'important');
          actionsElement.style.setProperty('left', '0', 'important');
          actionsElement.style.setProperty('right', '0', 'important');
          actionsElement.style.setProperty('top', 'auto', 'important');
          actionsElement.style.setProperty('width', '100%', 'important');
          actionsElement.style.setProperty('padding', '0 1rem', 'important');
          actionsElement.style.setProperty('z-index', '10', 'important');
        }
      };
      
      // Aplicar inmediatamente
      forceStyles();
      
      // Aplicar después de un pequeño delay para asegurar que el DOM esté listo
      const timeout = setTimeout(forceStyles, 100);
      const timeout2 = setTimeout(forceStyles, 500);
      
      return () => {
        clearTimeout(timeout);
        clearTimeout(timeout2);
      };
    }
  }, [isOpen, showInstructions, isPreviewMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      setLoading(true);
      setShowInstructions(false);
      
      // Intentar usar getUserMedia siempre primero (funciona en Capacitor WebView también)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('Solicitando acceso a la cámara...');
        // Formato 4:3
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Cámara trasera
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1440, min: 960 },
            aspectRatio: { ideal: 4/3 }, // Formato 4:3
          },
        });
        
        console.log('Stream obtenido:', stream);
        console.log('Video tracks:', stream.getVideoTracks());
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          
          // Esperar a que el video esté listo
          const video = videoRef.current;
          
          const handleLoadedMetadata = async () => {
            console.log('Metadata cargada, reproduciendo video...');
            try {
              await video.play();
              setStreamReady(true);
              console.log('Video reproduciendo correctamente');
            } catch (err) {
              console.error('Error al reproducir video:', err);
            }
          };
          
          const handleLoadedData = () => {
            console.log('Video data cargada');
            setStreamReady(true);
          };
          
          video.onloadedmetadata = handleLoadedMetadata;
          video.onloadeddata = handleLoadedData;
          
          // Si ya tiene metadata, reproducir inmediatamente
          if (video.readyState >= 2) {
            await video.play();
            setStreamReady(true);
          } else {
            // Forzar carga del video
            video.load();
          }
        } else {
          console.error('videoRef.current es null');
        }
      } else {
        throw new Error('getUserMedia no está disponible');
      }
    } catch (error: any) {
      console.error('Error al iniciar cámara:', error);
      setErrorMessage(`Error: ${error.message || 'No se pudo acceder a la cámara'}`);
      setShowError(true);
      setShowInstructions(true); // Volver a mostrar instrucciones si falla
    } finally {
      setLoading(false);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      setLoading(true);
      stopCamera();
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        // Intentar forzar orientación horizontal si es posible
        width: 1920,
        height: 1080,
      });

      if (!image.webPath) {
        setLoading(false);
        return;
      }

      // Convertir URI a File y verificar orientación
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      
      // Crear imagen para verificar dimensiones
      const img = new Image();
      img.src = image.webPath;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Si la imagen está en vertical, rotarla a horizontal
      let finalBlob = blob;
      if (img.height > img.width) {
        const canvas = document.createElement('canvas');
        canvas.width = img.height;
        canvas.height = img.width;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(img, 0, 0);
          ctx.restore();
          
          finalBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((rotatedBlob) => {
              resolve(rotatedBlob || blob);
            }, 'image/jpeg', 0.9);
          });
        }
      }
      
      const file = new File([finalBlob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(finalBlob);

      setCapturedImage(url);
      setCapturedFile(file);
      setIsPreviewMode(true);
      setShowInstructions(false);
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app' && error.message !== 'User cancelled') {
        setErrorMessage('Error al capturar foto. Por favor intenta de nuevo.');
        setShowError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const captureFromVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Asegurar que capturamos en orientación horizontal
    // Si el video está en vertical, rotamos el canvas
    const isPortrait = video.videoHeight > video.videoWidth;
    
    if (isPortrait) {
      // Si está en vertical, intercambiamos dimensiones para forzar horizontal
      canvas.width = video.videoHeight;
      canvas.height = video.videoWidth;
    } else {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (isPortrait) {
        // Rotar 90 grados para convertir a horizontal
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        ctx.restore();
      } else {
        ctx.drawImage(video, 0, 0);
      }
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          
          setCapturedImage(url);
          setCapturedFile(file);
          stopCamera();
          setIsPreviewMode(true);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleConfirm = () => {
    if (capturedImage && capturedFile) {
      onPhotoTaken({
        webPath: capturedImage,
        file: capturedFile,
      });
      setCapturedImage(null);
      setCapturedFile(null);
      setIsPreviewMode(false);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setIsPreviewMode(false);
    startCamera();
  };

  const renderGuide = () => {
    const getGuideTitle = () => {
      return photoTitle || 'Alinea el vehículo con la silueta verde';
    };

    const getGuideSubtitle = () => {
      if (photoTitle) {
        return `Fotografía: ${photoTitle}`;
      }
      return 'Asegúrate de que el vehículo esté centrado';
    };

    // Mapear el tipo de guía al nombre del archivo SVG
    const getSvgPath = (type: PhotoGuideType | 'car'): string => {
      const basePath = '/fotos/';
      const svgMap: Record<string, string> = {
        'frontal_izquierda': `${basePath}frontal-izquierda.svg`,
        'lateral_izquierda': `${basePath}lateral-izquierda.svg`,
        'posterior_izquierda': `${basePath}posterior-izquierda.svg`,
        'posterior': `${basePath}posterior.svg`,
        'posterior_derecha': `${basePath}posterior-derecha.svg`,
        'lateral_derecha': `${basePath}lateral-derecha.svg`,
        'frontal_derecha': `${basePath}frontal-derecha.svg`,
        'frontal': `${basePath}frontal.svg`,
        'interior': `${basePath}interior.svg`,
        'asientos_delanteros': `${basePath}asientos-delanteros.svg`,
        'asientos_traseros': `${basePath}asientos-traseros.svg`,
        'vista_cabina': `${basePath}vista-cabina.svg`,
        'vista_conductor': `${basePath}vista-conductor.svg`,
        'odometro': `${basePath}odometro.svg`,
        'controles': `${basePath}controles.svg`,
        'luces_interiores': `${basePath}luces-internas.svg`,
        'palanca_velocidades': `${basePath}palanca-velocidades.svg`,
        'faros_delanteros': `${basePath}faros-delanteros.svg`,
        'llantas': `${basePath}llantas.svg`,
        'luces_traseras': `${basePath}luces-traceras.svg`,
        'logotipo_marca': `${basePath}logotipo.svg`,
        'motor': `${basePath}motor.svg`,
        'logotipo_modelo': `${basePath}logotipo-modelo.svg`,
        'cajuela': `${basePath}cajuela.svg`,
        'quemacocos': `${basePath}quemacocos.svg`,
        'llaves': `${basePath}llaves.svg`,
        'car': `${basePath}frontal.svg`, // Default
      };
      return svgMap[type] || svgMap['car'];
    };

    const svgPath = getSvgPath(currentGuideType || 'car');

    return (
      <div 
        className="camera-guide-overlay"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: '4 / 3',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        <svg
          viewBox="0 0 800 600"
          className="car-silhouette landscape-svg"
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            background: 'transparent',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Cuadrícula 4x3 - Líneas verticales (4 columnas) */}
          <line x1="200" y1="0" x2="200" y2="600" stroke="#00ff00" strokeWidth="2" strokeDasharray="5,5" opacity="0.4" />
          <line x1="400" y1="0" x2="400" y2="600" stroke="#00ff00" strokeWidth="3" strokeDasharray="5,5" opacity="0.5" />
          <line x1="600" y1="0" x2="600" y2="600" stroke="#00ff00" strokeWidth="2" strokeDasharray="5,5" opacity="0.4" />
          
          {/* Cuadrícula 4x3 - Líneas horizontales (3 filas) */}
          <line x1="0" y1="200" x2="800" y2="200" stroke="#00ff00" strokeWidth="2" strokeDasharray="5,5" opacity="0.4" />
          <line x1="0" y1="400" x2="800" y2="400" stroke="#00ff00" strokeWidth="2" strokeDasharray="5,5" opacity="0.4" />
          
          {/* Línea central horizontal (más visible) */}
          <line x1="0" y1="300" x2="800" y2="300" stroke="#00ff00" strokeWidth="2" strokeDasharray="3,3" opacity="0.3" />
          
          {/* SVG de la silueta centrada con espacios a los lados */}
          {/* La silueta ocupará aproximadamente el 60% del ancho, centrada */}
          <g transform="translate(400, 300)">
            <image
              href={svgPath}
              x="-240"
              y="-300"
              width="480"
              height="600"
              preserveAspectRatio="xMidYMid meet"
              className="silhouette-image"
            />
          </g>
          
          {/* Texto de guía */}
          <text x="400" y="50" textAnchor="middle" fill="#00ff00" fontSize="24" fontWeight="bold" opacity="1" className="guide-title-text">
            {photoTitle || `Guía: ${currentGuideType.replace(/_/g, ' ')}`}
          </text>
          <text x="400" y="80" textAnchor="middle" fill="#ffffff" fontSize="16" opacity="0.9" className="guide-subtitle-text">
            {photoTitle || 'Asegúrate de que el vehículo esté centrado'}
          </text>
        </svg>
      </div>
    );
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{photoTitle || 'Tomar Foto con Guía'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="camera-guide-content">
        <IonLoading isOpen={loading} message="Abriendo cámara..." />

        {showInstructions ? (
          <div className="camera-guide-instructions-screen">
            <div className="camera-guide-instructions">
              <IonIcon icon={camera} size="large" />
              <h3>Guía para Tomar la Foto</h3>
              <p>Alinea el vehículo con la silueta verde para obtener la mejor foto</p>
            </div>
            <div className="guide-preview-container">
              {renderGuide()}
            </div>
            <div className="camera-guide-actions">
              <IonButton 
                expand="block" 
                onClick={startCamera}
                disabled={loading}
                color="primary"
              >
                <IonIcon icon={camera} slot="start" />
                {loading ? 'Abriendo cámara...' : 'Iniciar Vista Previa'}
              </IonButton>
              <p className="guide-hint">La silueta te ayudará a alinear el vehículo cuando tomes la foto</p>
            </div>
          </div>
        ) : !isPreviewMode ? (
          <div 
            className="camera-guide-preview"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
              position: 'relative',
              background: '#000',
              padding: 0,
            }}
          >
            <div 
              className="camera-video-container"
              style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: '#000',
                aspectRatio: '4 / 3',
                height: 'calc(100vw * 3 / 4)',
                minHeight: 'calc(100vw * 3 / 4)',
                maxHeight: 'calc(100vw * 3 / 4)',
                flex: '1 1 auto',
                margin: 0,
                padding: 0,
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {renderGuide()}
              {/* Botón para cambiar guía */}
              <div className="guide-selector-button">
                <IonButton 
                  fill="clear"
                  color="light"
                  onClick={() => setShowGuideSelector(true)}
                  className="change-guide-btn"
                >
                  <IonIcon icon={swapHorizontal} slot="start" />
                  Cambiar Guía
                </IonButton>
              </div>
            </div>
            <div 
              className="camera-guide-actions"
              style={{
                position: 'absolute',
                bottom: '2rem',
                left: 0,
                right: 0,
                top: 'auto',
                width: '100%',
                padding: '0 1rem',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
              }}
            >
              <IonButton 
                expand="block" 
                onClick={captureFromVideo}
                disabled={loading || !streamRef.current || !streamReady}
                color="primary"
                style={{
                  width: '100%',
                  marginBottom: '1rem',
                }}
              >
                <IonIcon icon={camera} slot="start" />
                {loading ? 'Abriendo cámara...' : streamReady ? 'Tomar Foto' : 'Esperando cámara...'}
              </IonButton>
              {!streamReady && !loading && (
                <p style={{ textAlign: 'center', color: 'white', marginTop: '1rem' }}>
                  Iniciando cámara...
                </p>
              )}
              <IonButton 
                expand="block" 
                fill="outline"
                onClick={() => {
                  stopCamera();
                  setShowInstructions(true);
                }}
                style={{
                  width: '100%',
                }}
              >
                Volver
              </IonButton>
            </div>
          </div>
        ) : (
          <div className="camera-guide-result">
            <div className="photo-preview-container">
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Foto capturada"
                  className="photo-preview"
                />
              )}
              {renderGuide()}
            </div>
            <div className="camera-guide-actions">
              <IonButton expand="block" fill="outline" onClick={handleRetake}>
                Volver a Capturar
              </IonButton>
              <IonButton expand="block" color="success" onClick={handleConfirm}>
                <IonIcon icon={checkmark} slot="start" />
                Usar Esta Foto
              </IonButton>
            </div>
          </div>
        )}

        <IonAlert
          isOpen={showError}
          onDidDismiss={() => setShowError(false)}
          header="Error"
          message={errorMessage}
          buttons={['OK']}
        />

        <PhotoTypeSelector
          isOpen={showGuideSelector}
          onClose={() => setShowGuideSelector(false)}
          onSelect={(type, title) => {
            setCurrentGuideType(type);
            setShowGuideSelector(false);
          }}
        />
      </IonContent>
    </IonModal>
  );
};

export default CameraWithGuide;

