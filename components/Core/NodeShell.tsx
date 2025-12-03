import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { motion, MotionValue, PanInfo } from 'framer-motion';
import { Handle } from './Handle';
import { Side } from '../../types';
import { useTheme } from './ThemeContext';

interface NodeShellProps {
  id: string;
  x: MotionValue<number>;
  y: MotionValue<number>;
  isSelected: boolean;
  isConnecting?: boolean; 
  isDraggable?: boolean; 
  isPanMode?: boolean; 
  showHandles?: boolean; 
  handles?: Partial<Record<Side, number>>;
  width?: number;
  children?: React.ReactNode;
  
  onDrag: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
  onDimensionsChange?: (id: string, width: number, height: number) => void;
  onHandleClick: (e: React.MouseEvent, nodeId: string, index: number, side: Side) => void;
}

export const NodeShell: React.FC<NodeShellProps> = ({
  id,
  x,
  y,
  isSelected,
  isConnecting,
  isDraggable = true,
  isPanMode = false,
  showHandles = false,
  handles = { top: 0, right: 0, bottom: 0, left: 0 },
  width = 200, 
  children,
  onDrag,
  onSelect,
  onDimensionsChange,
  onHandleClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onDimensionsChangeRef = useRef(onDimensionsChange);
  const { theme } = useTheme();

  useEffect(() => {
    onDimensionsChangeRef.current = onDimensionsChange;
  }, [onDimensionsChange]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      requestAnimationFrame(() => {
          if (!containerRef.current || !onDimensionsChangeRef.current) return;
          for (const entry of entries) {
            const target = entry.target as HTMLElement;
            const w = target.offsetWidth;
            const h = target.offsetHeight;
            if (w > 0 && h > 0) {
                onDimensionsChangeRef.current(id, w, h);
            }
          }
      });
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [id]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    onDrag(id, x.get(), y.get());
  };

  const renderHandleGroup = (side: Side, count: number) => {
    if (!count) return null;
    return (
      <div 
        style={getHandleGroupStyle(side)}
        className={`transition-opacity duration-300 ${showHandles ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {Array.from({ length: count }).map((_, i) => (
          <Handle 
            key={`${side}-${i}`}
            side={side}
            index={i} 
            nodeId={id}
            isConnecting={isConnecting}
            onClick={onHandleClick}
          />
        ))}
      </div>
    );
  };

  const styles = {
    shell: {
      position: 'absolute' as const,
      minWidth: '150px', 
      width: width || 'auto',
      borderRadius: '12px',
      background: theme.surface[1], // Use theme surface
      backdropFilter: 'blur(12px)',
      boxShadow: isSelected ? `0 20px 50px -10px ${theme.accent.glow}, 0 0 0 1px ${theme.accent.primary}` : theme.shadow,
      border: `1px solid ${isSelected ? theme.accent.primary : theme.border}`,
      cursor: isDraggable ? 'grab' : (isPanMode ? 'grab' : 'default'),
      zIndex: isSelected ? 100 : 10,
      transition: 'box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.3s ease',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    contentArea: {
      position: 'relative' as const,
      zIndex: 2,
      width: '100%',
      pointerEvents: 'none' as const, 
    },
    contentInner: {
      pointerEvents: 'auto' as const,
    }
  };

  return (
    <motion.div
      ref={containerRef}
      style={{ ...styles.shell, x, y }}
      drag={isDraggable} 
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      onPointerDown={(e) => {
        if (!isPanMode) {
            e.stopPropagation(); 
            onSelect(id);
        }
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={isDraggable ? { cursor: 'grabbing', scale: 1.02 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {renderHandleGroup('top', handles.top || 0)}
      {renderHandleGroup('right', handles.right || 0)}
      {renderHandleGroup('bottom', handles.bottom || 0)}
      {renderHandleGroup('left', handles.left || 0)}

      <div style={styles.contentArea}>
        <div style={styles.contentInner}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

const getHandleGroupStyle = (side: Side): React.CSSProperties => {
  const common = {
    position: 'absolute' as const,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    zIndex: 20,
  };

  switch (side) {
    case 'top': return { ...common, top: '-7px', left: 0, right: 0, height: '14px', flexDirection: 'row' };
    case 'bottom': return { ...common, bottom: '-7px', left: 0, right: 0, height: '14px', flexDirection: 'row' };
    case 'left': return { ...common, left: '-7px', top: 0, bottom: 0, width: '14px', flexDirection: 'column' };
    case 'right': return { ...common, right: '-7px', top: 0, bottom: 0, width: '14px', flexDirection: 'column' };
  }
};