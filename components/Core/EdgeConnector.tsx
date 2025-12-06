import React from 'react';
import { motion, MotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { getBezierPath, getBezierCenter } from '../../utils/geometry';
import { Side } from '../../types';
import { useTheme } from './ThemeContext';
import { X } from '@phosphor-icons/react';

interface EdgeConnectorProps {
  id: string;
  sourceNode: { x: MotionValue<number>; y: MotionValue<number> };
  targetNode: { x: MotionValue<number>; y: MotionValue<number> };
  sourceOffset: { x: number; y: number };
  targetOffset: { x: number; y: number };
  sourceSide: Side;
  targetSide: Side;
  isConnectMode?: boolean;
  isPanMode?: boolean;
  onDelete?: (id: string) => void;
}

export const EdgeConnector: React.FC<EdgeConnectorProps> = ({
  id,
  sourceNode,
  targetNode,
  sourceOffset,
  targetOffset,
  sourceSide,
  targetSide,
  isConnectMode,
  isPanMode = false,
  onDelete
}) => {
  const { theme } = useTheme();

  const meta = useTransform(
    [sourceNode.x, sourceNode.y, targetNode.x, targetNode.y],
    ([sx, sy, tx, ty]) => {
      const start = { x: (sx as number) + sourceOffset.x, y: (sy as number) + sourceOffset.y };
      const end = { x: (tx as number) + targetOffset.x, y: (ty as number) + targetOffset.y };
      
      const path = getBezierPath(start, end, sourceSide, targetSide);
      const center = getBezierCenter(start, end, sourceSide, targetSide);
      return { path, center };
    }
  );

  const pathData = useTransform(meta, m => m.path);
  const centerPos = useTransform(meta, m => m.center);
  const cx = useTransform(centerPos, c => c.x);
  const cy = useTransform(centerPos, c => c.y);
  
  const showFlow = true; 

  const styles = {
    mainPath: {
      fill: 'none',
      strokeLinecap: 'round' as const,
      stroke: theme.content[3],
      strokeWidth: '1.5px',
      strokeOpacity: 0.5,
    },
    flowPath: {
      fill: 'none',
      strokeLinecap: 'round' as const,
      strokeWidth: '2.5px',
      filter: `drop-shadow(0 0 4px ${theme.accent.glow})`,
    }
  };

  return (
    <g style={{ cursor: isPanMode ? 'grab' : 'default' }}>
       <defs>
        <linearGradient id={`grad-flow-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={theme.accent.secondary} />
          <stop offset="100%" stopColor={theme.accent.primary} />
        </linearGradient>
      </defs>

      {/* Main Line (Base) */}
      <motion.path
        d={pathData}
        style={styles.mainPath}
      />
      
      {/* Animated gradient segment */}
      <AnimatePresence>
        {showFlow && (
          <motion.path
            d={pathData}
            style={{
              ...styles.flowPath,
              strokeDasharray: '40 500',
              stroke: `url(#grad-flow-${id})`,
            }}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-540"
              dur="4s"
              repeatCount="indefinite"
              calcMode="linear"
            />
          </motion.path>
        )}
      </AnimatePresence>

      {/* Delete Button (Only in Connect Mode) */}
      <AnimatePresence>
        {isConnectMode && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.15 }}
            style={{ translateX: cx, translateY: cy }}
          >
             <foreignObject x={-12} y={-12} width={24} height={24} style={{ overflow: 'visible', pointerEvents: 'all' }}>
              <button 
                style={{
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  background: theme.surface[1], 
                  border: `1px solid ${theme.accent.danger}`, 
                  color: theme.accent.danger,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(id);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.background = theme.accent.danger;
                  e.currentTarget.style.color = theme.content[1];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = theme.surface[1];
                  e.currentTarget.style.color = theme.accent.danger;
                }}
              >
                 <X size={14} weight="bold" />
              </button>
            </foreignObject>
          </motion.g>
        )}
      </AnimatePresence>
    </g>
  );
};