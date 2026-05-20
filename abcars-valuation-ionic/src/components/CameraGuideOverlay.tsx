import React from 'react';
import type { PhotoGuideType } from './PhotoTypeSelector';
import { CameraGuideDefs, CameraGuideShape, CameraGuideThirdsGrid } from './CameraGuideShapes';

interface CameraGuideOverlayProps {
  type: PhotoGuideType | 'car';
}

/**
 * Silueta vectorial semitransparente para la vista de cámara.
 * No usa los SVG de assets/fotos (relleno opaco); esos van en modales de referencia.
 */
const CameraGuideOverlay: React.FC<CameraGuideOverlayProps> = ({ type }) => (
  <svg
    viewBox="0 0 800 600"
    className="car-silhouette landscape-svg camera-guide-shape-svg"
    preserveAspectRatio="xMidYMid meet"
    shapeRendering="geometricPrecision"
    aria-hidden
  >
    <CameraGuideDefs />
    <CameraGuideThirdsGrid />
    <CameraGuideShape type={type || 'car'} />
  </svg>
);

export default CameraGuideOverlay;
