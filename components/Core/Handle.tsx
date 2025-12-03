import React, { useState } from 'react';
import { Side } from '../../types';
import { useTheme } from './ThemeContext';

interface HandleProps {
  side: Side;
  index: number;
  nodeId: string;
  isConnected?: boolean;
  isConnecting?: boolean; 
  onClick?: (e: React.MouseEvent, nodeId: string, index: number, side: Side) => void;
}

export const Handle: React.FC<HandleProps> = ({
  side,
  index,
  nodeId,
  isConnected,
  isConnecting,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useTheme();

  const styles = {
    wrapper: {
      position: 'relative' as const,
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      backgroundColor: theme.surface[1],
      borderWidth: '2px', 
      borderStyle: 'solid',
      borderColor: isHovered && isConnecting 
        ? theme.accent.valid 
        : (isConnected || isHovered) ? theme.accent.primary : theme.border,
      transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      cursor: isConnecting ? 'copy' : 'crosshair',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'auto' as const,
      boxShadow: isHovered ? `0 0 0 4px ${theme.accent.glow}` : 'none',
    },
    hitArea: {
      position: 'absolute' as const,
      inset: -12,
      borderRadius: '50%',
      backgroundColor: 'transparent',
      zIndex: -1,
    },
    dot: {
      width: '4px',
      height: '4px',
      borderRadius: '50%',
      backgroundColor: isConnected 
        ? theme.content[1] 
        : isHovered && isConnecting ? theme.accent.valid : (isHovered ? theme.accent.primary : theme.content[3]),
      transition: 'background-color 0.2s ease',
    },
    pulse: {
      position: 'absolute' as const,
      inset: -4,
      borderRadius: '50%',
      backgroundColor: isConnecting ? theme.accent.valid : theme.accent.primary,
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