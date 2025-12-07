import React from 'react';
import { Side } from '../../types';
import { useTheme } from './ThemeContext';

interface HandleProps {
  side: Side;
  index: number;
  nodeId: string;
  isConnected?: boolean;
  isConnecting?: boolean;
  isPotentialTarget?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  // REMOVED: onPointerEnter and onPointerLeave are no longer needed
}

export const Handle: React.FC<HandleProps> = ({
  side,
  index,
  nodeId,
  isConnected,
  isConnecting,
  isPotentialTarget,
  onPointerDown,
}) => {
  const { theme } = useTheme();

  const isTarget = isPotentialTarget && isConnecting;

  const dotColor = isConnected 
    ? theme.accent.primary 
    : theme.content[3];
  
  const borderColor = isTarget
    ? theme.accent.secondary
    : isConnected 
      ? theme.accent.primary 
      : theme.border;

  const visualSize = 12;
  const hitAreaSize = 80; // Large hit area for easy interaction
  const margin = (hitAreaSize - visualSize) / 2;

  const styles = {
    hitArea: {
      position: 'relative' as const,
      width: `${hitAreaSize}px`,
      height: `${hitAreaSize}px`,
      borderRadius: '50%',
      // Use negative margin to increase hit area without affecting layout spacing
      margin: `-${margin}px`,
      cursor: isConnecting ? 'crosshair' : 'pointer',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'auto' as const,
    },
    visual: {
      width: `${visualSize}px`,
      height: `${visualSize}px`,
      borderRadius: '50%',
      backgroundColor: theme.surface[2], // Use node surface color
      border: `1.5px solid ${borderColor}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none' as const, // Clicks are captured by parent hitArea
      boxShadow: `0 0 0 2px ${theme.surface[1]}`, // Separator from node edge, using canvas color
      transform: isTarget ? 'scale(1.4)' : 'scale(1)',
      transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
    },
    dot: {
      width: '4px', 
      height: '4px',
      borderRadius: '50%',
      backgroundColor: dotColor,
      transition: 'all 0.2s ease',
      boxShadow: isConnected ? `0 0 8px 1px ${theme.accent.glow}` : 'none',
    }
  };

  return (
    <div
      style={styles.hitArea}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (onPointerDown) onPointerDown(e);
      }}
      // Add data-attributes for robust hover detection
      data-handle="true"
      data-node-id={nodeId}
      data-handle-index={index}
      data-handle-side={side}
    >
      <div style={styles.visual}>
        <div style={styles.dot} />
      </div>
    </div>
  );
};
