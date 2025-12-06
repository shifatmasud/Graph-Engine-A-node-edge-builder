import React from 'react';
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
  const { theme } = useTheme();

  const dotColor = isConnected 
    ? theme.accent.primary 
    : theme.content[3];
  
  const borderColor = isConnected 
    ? theme.accent.primary 
    : theme.border;

  const styles = {
    wrapper: {
      position: 'relative' as const,
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: theme.surface[2], // Use node surface color
      border: `1.5px solid ${borderColor}`,
      cursor: isConnecting ? 'crosshair' : 'pointer',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'auto' as const,
      boxShadow: `0 0 0 2px ${theme.surface[1]}`, // Separator from node edge, using canvas color
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
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
      style={styles.wrapper}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(e, nodeId, index, side);
      }}
    >
      <div style={styles.dot} />
    </div>
  );
};