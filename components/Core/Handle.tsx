
import React, { useState } from 'react';
import { Side } from '../../types';

interface HandleProps {
  side: Side;
  index: number;
  nodeId: string;
  isConnected?: boolean;
  isConnecting?: boolean; // True if we are currently dragging a wire from somewhere else
  onClick?: (e: React.MouseEvent, nodeId: string, index: number, side: Side) => void;
}

const colors = {
  bg: '#09090b',         // Surface 1
  border: '#27272a',     // Surface 3
  accent: '#3b82f6',     // Blue 500
  connected: '#fafafa',  // White
  inactive: '#52525b',   // Content 3
  validTarget: '#22c55e', // Green for valid drop target
};

export const Handle: React.FC<HandleProps> = ({
  side,
  index,
  nodeId,
  isConnected,
  isConnecting,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const styles = {
    wrapper: {
      position: 'relative' as const,
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      // If connecting, show green hint on hover, else standard colors
      backgroundColor: colors.bg,
      borderWidth: '2px', 
      borderStyle: 'solid',
      borderColor: isHovered && isConnecting 
        ? colors.validTarget 
        : (isConnected || isHovered) ? colors.accent : colors.border,
      transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      cursor: isConnecting ? 'copy' : 'crosshair',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'auto' as const,
      boxShadow: isHovered ? `0 0 0 4px rgba(0,0,0,0.5)` : 'none',
    },
    // Expanded invisible hit area for better UX
    hitArea: {
      position: 'absolute' as const,
      inset: -12,
      borderRadius: '50%',
      backgroundColor: 'transparent',
      zIndex: -1,
    },
    // Inner dot
    dot: {
      width: '4px',
      height: '4px',
      borderRadius: '50%',
      backgroundColor: isConnected 
        ? colors.connected 
        : isHovered && isConnecting ? colors.validTarget : (isHovered ? colors.accent : colors.inactive),
      transition: 'background-color 0.2s ease',
    },
    // Pulse effect when user is actively looking for a target
    pulse: {
      position: 'absolute' as const,
      inset: -4,
      borderRadius: '50%',
      backgroundColor: isConnecting ? colors.validTarget : colors.accent,
      opacity: isHovered ? 0.4 : 0,
      filter: 'blur(4px)',
      transition: 'opacity 0.2s ease',
      pointerEvents: 'none' as const,
    }
  };

  return (
    <div
      style={styles.wrapper}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(e, nodeId, index, side);
      }}
    >
      <div style={styles.hitArea} />
      <div style={styles.pulse} />
      <div style={styles.dot} />
    </div>
  );
};
