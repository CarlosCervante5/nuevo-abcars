import React from 'react';
import type { PhotoGuideType } from './PhotoTypeSelector';
import { getPhotoGuideAsset } from '../config/photoGuideAssets';
import './PhotoGuideIllustration.css';

interface PhotoGuideIllustrationProps {
  type?: PhotoGuideType | 'car';
  title: string;
  /** Solo `card` (modales). La cámara usa `CameraGuideOverlay` (trazo transparente). */
  variant?: 'card';
  className?: string;
}

const PhotoGuideIllustration: React.FC<PhotoGuideIllustrationProps> = ({
  type,
  title,
  variant = 'card',
  className = '',
}) => {
  const src = getPhotoGuideAsset(type);

  return (
    <div
      className={`photo-guide-illustration photo-guide-illustration--${variant} ${className}`.trim()}
      role="img"
      aria-label={title}
    >
      <img src={src} alt="" className="photo-guide-illustration__img" draggable={false} />
    </div>
  );
};

export default PhotoGuideIllustration;
