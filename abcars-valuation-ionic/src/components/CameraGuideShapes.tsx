import React from 'react';
import type { PhotoGuideType } from './PhotoTypeSelector';

export type CameraGuideShapeType = PhotoGuideType | 'car';

const P = 'cameraGuide';

/** Contorno ancho semitransparente: se lee sobre fondos oscuros (cámara). */
function OuterGlow({ d }: { d: string }) {
  return <path className="guide-shape-outer" fill="none" d={d} />;
}

/**
 * Vista frontal / trasera: capó ancho, parabrisas claro, faros redondos (o calaveras).
 * Coordenadas centradas en (0,0); y hacia abajo.
 */
function CarFaceShell({ rear = false }: { rear?: boolean }) {
  /* Silueta exterior: hombros anchos, cintura del parabrisas, base ancha (parachoques). */
  const outer =
    'M 0,-88 L 108,-58 L 122,-12 L 118,42 L 102,82 L 58,100 L 0,106 L -58,100 L -102,82 L -118,42 L -122,-12 L -108,-58 Z';
  /* Parabrisas / luneta más legible */
  const glass = rear
    ? 'M -62,-38 L 0,-52 L 62,-38 L 52,18 L -52,18 Z'
    : 'M -68,-42 L 0,-62 L 68,-42 L 58,22 L -58,22 Z';
  /* Capó o portón superior */
  const hood = rear
    ? 'M -78,-8 L 0,-22 L 78,-8 L 72,12 L -72,12 Z'
    : 'M -82,-12 L 0,-30 L 82,-12 L 74,8 L -74,8 Z';
  /* Línea divisoria “parrilla / portón” */
  const midBar = 'M -100,38 L 100,38';

  return (
    <g>
      <OuterGlow d={outer} />
      <path className="guide-shape-fill" d={outer} />
      <path className="guide-shape-stroke" fill="none" d={outer} />
      <path className="guide-shape-glass" fill="none" d={glass} />
      <path className="guide-shape-hood" fill="none" d={hood} />
      {!rear && (
        <>
          <ellipse className="guide-shape-lamp" cx="-70" cy="58" rx="26" ry="24" fill="none" />
          <ellipse className="guide-shape-lamp" cx="70" cy="58" rx="26" ry="24" fill="none" />
          <path className="guide-shape-grille" fill="none" d="M -55,72 Q 0,82 55,72" />
        </>
      )}
      {rear && (
        <>
          <path className="guide-shape-lamp" fill="none" d="M -72,50 L -40,72 L 40,72 L 72,50" />
          <rect className="guide-shape-plate" x="-28" y="58" width="56" height="22" rx="4" fill="none" />
        </>
      )}
      <path className="guide-shape-detail" fill="none" d={midBar} />
    </g>
  );
}

/**
 * Vista lateral: nariz a la derecha. Perfil sedán reconocible + cabinas y ruedas grandes.
 */
function CarSideShell({ flipX = false }: { flipX?: boolean }) {
  const flip = flipX ? 'scale(-1,1)' : undefined;
  /* Carrocería: morro, techo arqueado, maletero, suelo. */
  const body =
    'M -188,58 Q -198,35 -188,18 L -165,2 L -95,-22 L 25,-26 L 118,-10 Q 188,8 198,42 L 196,68 Q 182,92 138,96 L -115,98 Q -168,95 -188,58 Z';
  /* Techo / línea cintura */
  const roof =
    'M -155,8 Q -40,-48 95,-12 L 118,2 Q 128,18 125,38';
  /* Ventanas lateral (dos huecos) */
  const cabin =
    'M -120,-2 L -15,-8 L 35,-5 L 95,6 L 88,38 L -105,42 Z';
  /* Ruedas muy visibles */
  const wheelR = 34;
  return (
    <g transform={flip}>
      <OuterGlow d={body} />
      <path className="guide-shape-fill" d={body} />
      <path className="guide-shape-stroke" fill="none" d={body} />
      <path className="guide-shape-roofline" fill="none" d={roof} />
      <path className="guide-shape-glass" fill="none" d={cabin} />
      <circle className="guide-shape-wheel" cx="-128" cy="72" r={wheelR} fill="none" />
      <circle className="guide-shape-wheel" cx="142" cy="70" r={wheelR} fill="none" />
      <circle className="guide-shape-wheel-hub" cx="-128" cy="72" r="10" fill="none" />
      <circle className="guide-shape-wheel-hub" cx="142" cy="70" r="10" fill="none" />
    </g>
  );
}

function InteriorFrame({ variant }: { variant: 'wide' | 'seats_front' | 'seats_rear' | 'cabin' | 'driver' }) {
  const shell = 'M -205,-35 L 205,-35 L 178,128 L -178,128 Z';
  return (
    <g>
      <OuterGlow d={shell} />
      <path className="guide-shape-fill" d={shell} />
      <path className="guide-shape-stroke" fill="none" d={shell} />
      {variant === 'wide' && (
        <path className="guide-shape-glass" fill="none" d="M -168,-18 L 168,-18 L 148,102 L -148,102 Z" />
      )}
      {variant === 'seats_front' && (
        <>
          <path className="guide-shape-glass" fill="none" d="M -138,8 L -18,8 L -22,102 L -142,102 Z" />
          <path className="guide-shape-glass" fill="none" d="M 18,8 L 138,8 L 142,102 L 22,102 Z" />
        </>
      )}
      {variant === 'seats_rear' && (
        <path className="guide-shape-glass" fill="none" d="M -155,22 Q 0,0 155,22 L 138,108 L -138,108 Z" />
      )}
      {variant === 'cabin' && (
        <>
          <path className="guide-shape-glass" fill="none" d="M -175,-8 L 175,-8 L 158,92 L -158,92 Z" />
          <line className="guide-shape-detail" x1="-185" y1="38" x2="185" y2="38" />
        </>
      )}
      {variant === 'driver' && (
        <>
          <circle className="guide-shape-wheel" cx="-58" cy="38" r="52" fill="none" />
          <path className="guide-shape-glass" fill="none" d="M 22,-2 L 158,-2 L 172,105 L 38,105 Z" />
        </>
      )}
    </g>
  );
}

function DetailFocus({ variant }: { variant: 'circle' | 'rect' }) {
  const s = 120;
  if (variant === 'circle') {
    return (
      <g>
        <circle className="guide-shape-outer" cx="0" cy="0" r="100" fill="none" />
        <circle className="guide-shape-fill" cx="0" cy="0" r="98" />
        <circle className="guide-shape-stroke" cx="0" cy="0" r="98" fill="none" />
        <circle className="guide-shape-bracket" cx="0" cy="0" r="112" fill="none" strokeDasharray="14 16" />
        <circle className="guide-shape-cross" cx="0" cy="0" r="6" />
        <line className="guide-shape-cross" x1="-135" y1="0" x2="-40" y2="0" />
        <line className="guide-shape-cross" x1="40" y1="0" x2="135" y2="0" />
        <line className="guide-shape-cross" x1="0" y1="-135" x2="0" y2="-40" />
        <line className="guide-shape-cross" x1="0" y1="40" x2="0" y2="135" />
      </g>
    );
  }
  const rd = `M ${-s},${-80} L ${s},${-80} L ${s},${80} L ${-s},${80} Z`;
  return (
    <g>
      <OuterGlow d={rd} />
      <rect className="guide-shape-fill" x={-s} y={-80} width={s * 2} height={160} rx="18" />
      <rect className="guide-shape-stroke" x={-s} y={-80} width={s * 2} height={160} rx="18" fill="none" />
      <path
        className="guide-shape-bracket"
        fill="none"
        d={`M ${-s - 16} ${-80 - 16} L ${-s - 5} ${-80 - 16} L ${-s - 5} ${-80 - 5} M ${s + 16} ${-80 - 16} L ${s + 5} ${-80 - 16} L ${s + 5} ${-80 - 5} M ${-s - 16} ${80 + 16} L ${-s - 5} ${80 + 16} L ${-s - 5} ${80 + 5} M ${s + 16} ${80 + 16} L ${s + 5} ${80 + 16} L ${s + 5} ${80 + 5}`}
      />
      <circle className="guide-shape-cross" cx="0" cy="0" r="5" />
      <line className="guide-shape-cross" x1="-150" y1="0" x2="-45" y2="0" />
      <line className="guide-shape-cross" x1="45" y1="0" x2="150" y2="0" />
      <line className="guide-shape-cross" x1="0" y1="-100" x2="0" y2="-35" />
      <line className="guide-shape-cross" x1="0" y1="35" x2="0" y2="100" />
    </g>
  );
}

function resolveExterior(type: CameraGuideShapeType): React.ReactNode {
  switch (type) {
    case 'lateral_izquierda':
      return <CarSideShell />;
    case 'lateral_derecha':
      return <CarSideShell flipX />;
    case 'frontal':
    case 'car':
      return <CarFaceShell />;
    case 'posterior':
      return <CarFaceShell rear />;
    case 'frontal_izquierda':
      return (
        <g transform="rotate(-20)">
          <CarSideShell />
        </g>
      );
    case 'frontal_derecha':
      return (
        <g transform="rotate(20) scale(-1,1)">
          <CarSideShell />
        </g>
      );
    case 'posterior_izquierda':
      return (
        <g transform="rotate(22) scale(-1,1)">
          <CarSideShell />
        </g>
      );
    case 'posterior_derecha':
      return (
        <g transform="rotate(-22)">
          <CarSideShell />
        </g>
      );
    default:
      return <CarFaceShell />;
  }
}

function resolveInterior(type: CameraGuideShapeType): React.ReactNode {
  switch (type) {
    case 'asientos_delanteros':
      return <InteriorFrame variant="seats_front" />;
    case 'asientos_traseros':
      return <InteriorFrame variant="seats_rear" />;
    case 'vista_cabina':
      return <InteriorFrame variant="cabin" />;
    case 'vista_conductor':
      return <InteriorFrame variant="driver" />;
    case 'interior':
    default:
      return <InteriorFrame variant="wide" />;
  }
}

function resolveDetail(type: CameraGuideShapeType): React.ReactNode {
  const circleTypes: CameraGuideShapeType[] = ['llantas', 'faros_delanteros', 'luces_traseras'];
  if (circleTypes.includes(type)) {
    return <DetailFocus variant="circle" />;
  }
  return <DetailFocus variant="rect" />;
}

export function CameraGuideDefs() {
  return (
    <defs>
      <linearGradient id={`${P}-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bae6fd" />
        <stop offset="40%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
      <linearGradient id={`${P}-fill`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(56, 189, 248, 0.14)" />
        <stop offset="100%" stopColor="rgba(15, 23, 42, 0.28)" />
      </linearGradient>
    </defs>
  );
}

export function CameraGuideThirdsGrid() {
  const line = 'rgba(226, 232, 240, 0.18)';
  const faint = 'rgba(226, 232, 240, 0.1)';
  return (
    <g className="guide-thirds" pointerEvents="none">
      <line x1="266.67" y1="0" x2="266.67" y2="600" stroke={line} strokeWidth="1.25" strokeDasharray="8 10" />
      <line x1="533.33" y1="0" x2="533.33" y2="600" stroke={line} strokeWidth="1.25" strokeDasharray="8 10" />
      <line x1="0" y1="200" x2="800" y2="200" stroke={faint} strokeWidth="1" strokeDasharray="8 10" />
      <line x1="0" y1="400" x2="800" y2="400" stroke={faint} strokeWidth="1" strokeDasharray="8 10" />
      <line x1="400" y1="0" x2="400" y2="600" stroke="rgba(56, 189, 248, 0.14)" strokeWidth="1.25" />
      <line x1="0" y1="300" x2="800" y2="300" stroke="rgba(56, 189, 248, 0.09)" strokeWidth="1" strokeDasharray="4 14" />
    </g>
  );
}

export function CameraGuideShape({ type }: { type: CameraGuideShapeType }) {
  const exterior: CameraGuideShapeType[] = [
    'frontal_izquierda',
    'lateral_izquierda',
    'posterior_izquierda',
    'posterior',
    'posterior_derecha',
    'lateral_derecha',
    'frontal_derecha',
    'frontal',
    'car',
  ];
  const interior: CameraGuideShapeType[] = [
    'interior',
    'asientos_delanteros',
    'asientos_traseros',
    'vista_cabina',
    'vista_conductor',
  ];

  let inner: React.ReactNode;
  if (exterior.includes(type)) {
    inner = resolveExterior(type);
  } else if (interior.includes(type)) {
    inner = resolveInterior(type);
  } else {
    inner = resolveDetail(type);
  }

  /* Escala un poco mayor en frontal para que se “lea” mejor en móvil. */
  const scale = type === 'frontal' || type === 'car' || type === 'posterior' ? 1.12 : 1.05;

  return <g transform={`translate(400, 300) scale(${scale})`}>{inner}</g>;
}
