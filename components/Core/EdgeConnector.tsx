import React, { useState } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';
import { getBezierPath } from '../../utils/geometry';
import { Side } from '../../types';
import { useTheme } from './ThemeContext';

interface EdgeConnectorProps {
  id: string;
  sourceNode: { x: MotionValue<number>; y: MotionValue<number> };
  targetNode: { x: MotionValue<number>; y: MotionValue<number> };
  sourceOffset: { x: number; y: number };
  targetOffset: { x: number; y: number };
  sourceSide: Side;
  targetSide: Side;
  isSelected?: boolean;
  isConnectMode?: boolean;
  isPanMode?: boolean;
  onSelect?: (id: string) => void;
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
  isSelected,
  isConnectMode,
  isPanMode = false,
  onSelect,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useTheme();

  const meta = useTransform(
    [sourceNode.x, sourceNode.y, targetNode.x, targetNode.y],
    ([sx, sy, tx, ty]) => {
      const start = { x: (sx as number) + sourceOffset.x, y: (sy as number) + sourceOffset.y };
      const end = { x: (tx as number) + targetOffset.x, y: (ty as number) + targetOffset.y };
      
      const path = getBezierPath(start, end, sourceSide, targetSide);

      const curvature = 50;
      let cp1x = start.x, cp1y = start.y;
      let cp2x = end.x, cp2y = end.y;

      switch (sourceSide) {
        case 'left': cp1x = start.x - curvature; break;
        case 'right': cp1x = start.x + curvature; break;
        case 'top': cp1y = start.y - curvature; break;
        case 'bottom': cp1y = start.y + curvature; break;
      }

      switch (targetSide) {
        case 'left': cp2x = end.x - curvature; break;
        case 'right': cp2x = end.x + curvature; break;
        case 'top': cp2y = end.y - curvature; break;
        case 'bottom': cp2y = end.y + curvature; break;
      }

      const midX = 0.125 * start.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * end.x;
      const midY = 0.125 * start.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * end.y;

      return { path, midX, midY };
    }
  );

  const pathData = useTransform(meta, m => m.path);
  const midX = useTransform(meta, m => m.midX);
  const midY = useTransform(meta, m => m.midY);

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        if (!isPanMode) e.stopPropagation();
        if (!isConnectMode) {
          onSelect?.(id);
        }
      }}
      onPointerDown={(e) => {
        if (!isPanMode) e.stopPropagation();
      }}
      style={{ cursor: isConnectMode ? 'default' : (isPanMode ? 'grab' : 'pointer') }}
    >
      {/* Hit Area */}
      <motion.path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ pointerEvents: 'stroke' }}
      />

      {/* Selected / Danger Glow */}
      <motion.path
        d={pathData}
        fill="none"
        animate={{
          stroke: isSelected ? theme.accent.glow : (isConnectMode && isHovered ? 'rgba(239, 68, 68, 0.3)' : 'transparent'),
          strokeWidth: isSelected || (isConnectMode && isHovered) ? 8 : 0,
        }}
        transition={{ duration: 0.2 }}
        strokeLinecap="round"
      />

      {/* Shadow */}
      <motion.path
        d={pathData}
        fill="none"
        stroke={theme.surface[1]}
        strokeWidth={4}
        strokeLinecap="round"
        style={{ opacity: 0.5 }}
      />

      {/* Main Line */}
      <motion.path
        d={pathData}
        fill="none"
        initial={false}
        animate={{
          stroke: isSelected ? theme.accent.primary : (isConnectMode && isHovered ? theme.accent.danger : theme.content[3]),
        }}
        strokeWidth={2}
        strokeLinecap="round"
      />

      {!isConnectMode && (
        <motion.circle
          r="2"
          fill={isSelected ? theme.accent.primary : theme.content[2]}
        >
          <motion.animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={pathData}
            calcMode="linear"
          />
        </motion.circle>
      )}

      {isConnectMode && (
        <motion.g
            style={{ x: midX, y: midY, pointerEvents: 'auto' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={(e) => {
                e.stopPropagation();
                onDelete?.(id);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            cursor="pointer"
        >
            <circle r="10" fill={theme.surface[2]} stroke={theme.accent.danger} strokeWidth="1.5" />
            <path d="M-3 -3 L3 3 M3 -3 L-3 3" stroke={theme.accent.danger} strokeWidth="1.5" strokeLinecap="round" />
        </motion.g>
      )}
    </g>
  );
};