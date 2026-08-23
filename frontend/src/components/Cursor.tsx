import React from 'react';
import { useCursor } from '../hooks/useCursor';

export const Cursor: React.FC = () => {
  const { dotRef, ringRef, isHovering, isDesktop } = useCursor();
  if (!isDesktop) return null;
  return (
    <>
      <div ref={dotRef} className={`cursor-dot ${isHovering ? 'hovering' : ''}`} aria-hidden="true" />
      <div ref={ringRef} className={`cursor-ring ${isHovering ? 'hovering' : ''}`} aria-hidden="true" />
    </>
  );
};
