import React, { useMemo } from 'react';
import type { PhotoGuideType } from './PhotoTypeSelector';
import { getCameraGuideSvgMarkup } from '../config/photoGuideCameraSvgs';
import './CameraGuideAssetOverlay.css';

interface CameraGuideAssetOverlayProps {
  type: PhotoGuideType | 'car';
}

/**
 * Ilustración SVG de referencia (assets/fotos) como contorno lineal semitransparente.
 */
const CameraGuideAssetOverlay: React.FC<CameraGuideAssetOverlayProps> = ({ type }) => {
  const markup = useMemo(() => getCameraGuideSvgMarkup(type), [type]);

  if (!markup) {
    return null;
  }

  return (
    <div
      className="camera-guide-asset-overlay"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
};

export default CameraGuideAssetOverlay;
