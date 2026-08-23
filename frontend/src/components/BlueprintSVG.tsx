import React from 'react';

interface BlueprintSVGProps {
  className?: string;
  animated?: boolean;
  opacity?: number;
  size?: number;
}

/** Architectural floor plan fragment — the SocioSphere signature element */
export const BlueprintSVG: React.FC<BlueprintSVGProps> = ({
  className = '',
  animated = false,
  opacity = 0.18,
  size = 400,
}) => {
  const h = Math.round(size * (120 / 160));
  const pulseClass = animated ? 'bp-pulse' : '';

  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${pulseClass}`.trim()}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Outer walls */}
      <path
        className={animated ? 'bp-path bp-animated' : 'bp-path'}
        style={animated ? ({ '--len': '540', '--delay': '0ms' } as React.CSSProperties) : undefined}
        d="M10 10 L150 10 L150 110 L10 110 Z"
        strokeWidth="1.5"
        stroke="#3A5A8C"
        fill="none"
      />
      {/* Interior horizontal wall */}
      <path
        className={animated ? 'bp-path bp-animated' : 'bp-path'}
        style={animated ? ({ '--len': '140', '--delay': '200ms' } as React.CSSProperties) : undefined}
        d="M10 60 L95 60"
        strokeWidth="0.75"
        stroke="#3A5A8C"
        fill="none"
      />
      {/* Interior vertical wall */}
      <path
        className={animated ? 'bp-path bp-animated' : 'bp-path'}
        style={animated ? ({ '--len': '100', '--delay': '280ms' } as React.CSSProperties) : undefined}
        d="M95 10 L95 110"
        strokeWidth="0.75"
        stroke="#3A5A8C"
        fill="none"
      />
      {/* Short interior wall */}
      <path
        className={animated ? 'bp-path bp-animated' : 'bp-path'}
        style={animated ? ({ '--len': '50', '--delay': '350ms' } as React.CSSProperties) : undefined}
        d="M55 60 L55 110"
        strokeWidth="0.75"
        stroke="#3A5A8C"
        fill="none"
      />
      {/* Door arc */}
      <path
        className={animated ? 'bp-path bp-animated' : 'bp-path'}
        style={animated ? ({ '--len': '40', '--delay': '420ms' } as React.CSSProperties) : undefined}
        d="M35 60 Q35 48 47 48"
        strokeWidth="0.75"
        stroke="#3A5A8C"
        fill="none"
      />
      {/* Door threshold */}
      <path
        className={animated ? 'bp-path bp-animated' : 'bp-path'}
        style={animated ? ({ '--len': '12', '--delay': '480ms' } as React.CSSProperties) : undefined}
        d="M35 60 L47 60"
        strokeWidth="0.5"
        strokeDasharray="2 2"
        stroke="#3A5A8C"
        fill="none"
      />
      {/* Stairwell lines */}
      <path
        className={animated ? 'bp-path bp-animated' : 'bp-path'}
        style={animated ? ({ '--len': '200', '--delay': '520ms' } as React.CSSProperties) : undefined}
        d="M105 70 L145 70 M105 78 L145 78 M105 86 L145 86 M105 94 L145 94"
        strokeWidth="0.5"
        stroke="#3A5A8C"
        fill="none"
      />
      {/* Window marks */}
      <path
        className={animated ? 'bp-path bp-animated' : 'bp-path'}
        style={animated ? ({ '--len': '60', '--delay': '580ms' } as React.CSSProperties) : undefined}
        d="M30 10 L30 6 M60 10 L60 6 M110 10 L110 6 M130 10 L130 6"
        strokeWidth="0.75"
        stroke="#3A5A8C"
        fill="none"
      />
    </svg>
  );
};
