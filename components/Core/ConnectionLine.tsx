import React from 'react';
import { getBezierPath } from '../../utils/geometry';
import { Position } from '../../types';
import { useTheme } from './ThemeContext';

interface ConnectionLineProps {
  sourcePos: Position;
  targetPos: Position;
  isTemp?: boolean;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ sourcePos, targetPos, isTemp }) => {
  const { theme } = useTheme();
  const pathData = getBezierPath(sourcePos, targetPos);

  const styles = {
    glowPath: {
      fill: 'none',
      stroke: theme.accent.primary,
      strokeWidth: '4px',
      strokeLinecap: 'round' as const,
      opacity: 0.3,
    },
    mainPath: {
      fill: 'none',
      stroke: theme.accent.primary,
      strokeWidth: '1.5px',
      strokeDasharray: isTemp ? "5,5" : "none",
      transition: 'stroke 0.3s ease',
    },
    terminatorDot: {
      fill: theme.accent.primary,
      filter: `drop-shadow(0 0 3px ${theme.accent.glow})`,
    }
  };

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Glow effect */}
      <path
        d={pathData}
        style={styles.glowPath}
      />
      {/* Main Line */}
      <path
        d={pathData}
        style={styles.mainPath}
      >
        {isTemp && (
          <animate 
            attributeName="stroke-dashoffset" 
            from="100" 
            to="0" 
            dur="2s" 
            repeatCount="indefinite" 
          />
        )}
      </path>
      {/* Terminator dot for temp connections */}
      {isTemp && (
        <circle cx={targetPos.x} cy={targetPos.y} r={4} style={styles.terminatorDot} />
      )}
    </g>
  );
};