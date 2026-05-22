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
import { captureVideoFrame } from '../utils/captureVideoFrame';
import { PhotoGuideType } from './PhotoTypeSelector';
import PhotoTypeSelector from './PhotoTypeSelector';
import CameraGuideAssetOverlay from './CameraGuideAssetOverlay';
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
  /** Sesión guiada: no cerrar tras cada foto; avanzar a la siguiente guía. */
  continueAfterCapture?: boolean;
  sessionStep?: number;
  sessionTotal?: number;
  onSkipStep?: () => void;
  onFinishSession?: () => void;
  /** Incrementa al pasar a la siguiente foto en sesión (confirmar o saltar). */
  sessionAdvanceKey?: number;
}

const CameraWithGuide: React.FC<CameraWithGuideProps> = ({
  isOpen,
  onClose,
  onPhotoTaken,
  guideType = 'car',
  photoTitle,
  continueAfterCapture = false,
  sessionStep = 0,
  sessionTotal = 0,
  onSkipStep,
  onFinishSession,
  sessionAdvanceKey = 0,
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
  const sessionActive = continueAfterCapture && sessionTotal > 0;
  const sessionLabel =
    sessionActive && sessionStep > 0
      ? `Foto ${sessionStep} de ${sessionTotal}`
      : photoTitle || 'Tomar Foto con Guía';

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setLoading(false);
      setCapturedImage(null);
      setCapturedFile(null);
      setIsPreviewMode(false);
      setShowInstructions(true);
      setStreamReady(false);
      setShowError(false);
      setCurrentGuideType(guideType || 'car');
    } else {
      setCurrentGuideType(guideType || 'car');
    }
  }, [isOpen, guideType]);

  useEffect(() => {
    if (!isOpen || !continueAfterCapture || sessionAdvanceKey < 1) {
      return;
    }
    setCapturedImage(null);
    setCapturedFile(null);
    setIsPreviewMode(false);
    setShowInstructions(false);
    setStreamReady(false);
    stopCamera();
    const timer = window.setTimeout(() => {
      void startCamera();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [sessionAdvanceKey, isOpen, continueAfterCapture]);

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
        correctOrientation: true,
      });

      if (!image.webPath) {
        setLoading(false);
        return;
      }

      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);

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

  const captureFromVideo = async () => {
    if (!videoRef.current) return;

    try {
      setLoading(true);
      const blob = await captureVideoFrame(videoRef.current);
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);

      setCapturedImage(url);
      setCapturedFile(file);
      stopCamera();
      setIsPreviewMode(true);
    } catch (error) {
      console.error('Error al capturar frame:', error);
      setErrorMessage('No se pudo guardar la foto. Intenta de nuevo.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const resetForNextShot = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setIsPreviewMode(false);
    setLoading(false);
    setShowInstructions(false);
    setStreamReady(false);
    stopCamera();
  };

  const handleConfirm = () => {
    if (!capturedImage || !capturedFile) {
      return;
    }
    const payload = {
      webPath: capturedImage,
      file: capturedFile,
    };
    onPhotoTaken(payload);

    if (continueAfterCapture) {
      resetForNextShot();
      return;
    }

    resetForNextShot();
    onClose();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setIsPreviewMode(false);
    startCamera();
  };

  const renderGuide = () => {
    const guideTitle =
      photoTitle || `Guía: ${String(currentGuideType).replace(/_/g, ' ')}`;
    const guideSubtitle = photoTitle
      ? 'Alinea el vehículo dentro del contorno'
      : 'Mantén el horizonte estable y el sujeto dentro del encuadre';

    return (
      <div className="camera-guide-overlay">
        <div className="camera-guide-caption">
          <p className="guide-title-text">{guideTitle}</p>
          <p className="guide-subtitle-text">{guideSubtitle}</p>
        </div>
        <CameraGuideAssetOverlay type={currentGuideType || 'car'} />
      </div>
    );
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} keepContentsMounted={false}>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="camera-session-title">
            {sessionActive ? (
              <>
                <span className="camera-session-title__step">{sessionLabel}</span>
                {photoTitle ? (
                  <span className="camera-session-title__name">{photoTitle}</span>
                ) : null}
              </>
            ) : (
              photoTitle || 'Tomar Foto con Guía'
            )}
          </IonTitle>
          <IonButtons slot="end">
            {sessionActive && onFinishSession ? (
              <IonButton fill="clear" onClick={onFinishSession}>
                Terminar
              </IonButton>
            ) : null}
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="camera-guide-content">
        {isOpen && loading ? (
          <IonLoading isOpen message="Abriendo cámara..." />
        ) : null}

        {showInstructions ? (
          <div className="camera-guide-instructions-screen">
            <div className="camera-guide-instructions">
              <IonIcon icon={camera} size="large" />
              <h3>Guía para Tomar la Foto</h3>
              <p>Alinea el encuadre con la ilustración de referencia (4:3)</p>
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
              <p className="guide-hint">Revisa el ángulo en la ilustración antes de abrir la cámara</p>
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
                {continueAfterCapture ? 'Usar y siguiente foto' : 'Usar Esta Foto'}
              </IonButton>
              {sessionActive && onSkipStep ? (
                <IonButton expand="block" fill="outline" onClick={onSkipStep}>
                  Saltar esta foto
                </IonButton>
              ) : null}
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

