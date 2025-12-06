import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { motion, MotionValue, PanInfo } from 'framer-motion';
import { Handle } from './Handle';
import { Side } from '../../types';
import { useTheme } from './ThemeContext';

const HANDLE_SIZE = 12;

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
    
    const handleOffset = `-${HANDLE_SIZE / 2}px`;
    
    const commonStyle = {
      position: 'absolute' as const,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.space[3], 
      zIndex: 20,
      opacity: showHandles || isConnecting ? 1 : 0, 
      pointerEvents: (showHandles || isConnecting) ? ('auto' as const) : ('none' as const),
      transition: 'opacity 0.2s ease',
    };

    switch (side) {
      case 'top': return { ...commonStyle, top: handleOffset, left: 0, right: 0, height: `${HANDLE_SIZE}px`, flexDirection: 'row' as const };
      case 'bottom': return { ...commonStyle, bottom: handleOffset, left: 0, right: 0, height: `${HANDLE_SIZE}px`, flexDirection: 'row' as const };
      case 'left': return { ...commonStyle, left: handleOffset, top: 0, bottom: 0, width: `${HANDLE_SIZE}px`, flexDirection: 'column' as const };
      case 'right': return { ...commonStyle, right: handleOffset, top: 0, bottom: 0, width: `${HANDLE_SIZE}px`, flexDirection: 'column' as const };
    }
  };

  const styles = {
    shell: {
      position: 'absolute' as const,
      minWidth: '150px',
      width: width || 'auto',
      borderRadius: theme.radius[4],
      background: theme.surface[2],
      boxShadow: isSelected 
        ? `0 0 0 1.5px ${theme.accent.primary}, ${theme.shadow}`
        : theme.shadow,
      border: `1px solid ${isSelected ? theme.accent.primary : theme.border}`,
      cursor: isDraggable ? 'grab' : (isPanMode ? 'grab' : 'default'),
      zIndex: isSelected ? 100 : 10,
      transition: 'box-shadow 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.25s ease',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    contentArea: {
      position: 'relative' as const,
      zIndex: 2,
      width: '100%',
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
      whileTap={isDraggable ? { cursor: 'grabbing', scale: 1.01 } : {}}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <div style={renderHandleGroup('top', handles.top || 0)}>
        {Array.from({ length: handles.top || 0 }).map((_, i) => (
          <Handle 
            key={`top-${i}`}
            side={'top'}
            index={i} 
            nodeId={id}
            isConnecting={isConnecting}
            onClick={onHandleClick}
          />
        ))}
      </div>
      <div style={renderHandleGroup('right', handles.right || 0)}>
        {Array.from({ length: handles.right || 0 }).map((_, i) => (
          <Handle 
            key={`right-${i}`}
            side={'right'}
            index={i} 
            nodeId={id}
            isConnecting={isConnecting}
            onClick={onHandleClick}
          />
        ))}
      </div>
      <div style={renderHandleGroup('bottom', handles.bottom || 0)}>
        {Array.from({ length: handles.bottom || 0 }).map((_, i) => (
          <Handle 
            key={`bottom-${i}`}
            side={'bottom'}
            index={i} 
            nodeId={id}
            isConnecting={isConnecting}
            onClick={onHandleClick}
          />
        ))}
      </div>
      <div style={renderHandleGroup('left', handles.left || 0)}>
        {Array.from({ length: handles.left || 0 }).map((_, i) => (
          <Handle 
            key={`left-${i}`}
            side={'left'}
            index={i} 
            nodeId={id}
            isConnecting={isConnecting}
            onClick={onHandleClick}
          />
        ))}
      </div>

      <div style={styles.contentArea}>
        {children}
      </div>
    </motion.div>
  );
};
