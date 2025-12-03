
import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { motion, MotionValue, PanInfo } from 'framer-motion';
import { Handle } from './Handle';
import { Side } from '../../types';

interface NodeShellProps {
  id: string;
  x: MotionValue<number>;
  y: MotionValue<number>;
  isSelected: boolean;
  isConnecting?: boolean; // Is the global state currently in "Connecting" mode?
  isDraggable?: boolean; // Controls if node can be dragged
  showHandles?: boolean; // Only show handles in "Connector" mode
  handles?: Partial<Record<Side, number>>;
  width?: number;
  children?: React.ReactNode;
  
  // Events
  onDrag: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
  onDimensionsChange?: (id: string, width: number, height: number) => void;
  onHandleClick: (e: React.MouseEvent, nodeId: string, index: number, side: Side) => void;
}

const theme = {
  surface: 'rgba(9, 9, 11, 0.95)', // Increased opacity for better contrast
  border: {
    idle: 'rgba(39, 39, 42, 1)',   // Zinc 800
    selected: '#3b82f6',           // Blue 500
  },
  glow: {
    idle: '0 4px 6px -1px rgba(0,0,0,0.5)',
    selected: '0 20px 50px -10px rgba(59, 130, 246, 0.3), 0 0 0 1px #3b82f6',
  }
};

export const NodeShell: React.FC<NodeShellProps> = ({
  id,
  x,
  y,
  isSelected,
  isConnecting,
  isDraggable = true,
  showHandles = false,
  handles = { top: 0, right: 0, bottom: 0, left: 0 },
  width = 200, // Match default engine width to avoid misalignment
  children,
  onDrag,
  onSelect,
  onDimensionsChange,
  onHandleClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Ref for callback to prevent observer recreation loop
  const onDimensionsChangeRef = useRef(onDimensionsChange);

  // Keep ref up to date
  useEffect(() => {
    onDimensionsChangeRef.current = onDimensionsChange;
  }, [onDimensionsChange]);

  // Report dimensions for edge calculations
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      // Wrap in RAF to avoid "ResizeObserver loop limit exceeded" and decouple from React render cycle
      requestAnimationFrame(() => {
          if (!containerRef.current || !onDimensionsChangeRef.current) return;

          for (const entry of entries) {
            // Critical: Use offsetWidth/Height to get the border-box size (including borders)
            // contentRect only returns content box. If we feed contentRect back into style.width 
            // (which is border-box), the element will shrink by 2*borderWidth every cycle.
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
    // Only commit drag if it moved significantly to avoid jitter
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
      // Use minWidth to prevent initial collapse before content loads
      minWidth: '150px', 
      width: width || 'auto',
      borderRadius: '12px',
      background: theme.surface,
      backdropFilter: 'blur(12px)',
      boxShadow: isSelected ? theme.glow.selected : theme.glow.idle,
      border: `1px solid ${isSelected ? theme.border.selected : theme.border.idle}`,
      cursor: isDraggable ? 'grab' : 'default',
      zIndex: isSelected ? 100 : 10,
      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
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
        e.stopPropagation(); 
        onSelect(id);
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={isDraggable ? { cursor: 'grabbing', scale: 1.02 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Handles */}
      {renderHandleGroup('top', handles.top || 0)}
      {renderHandleGroup('right', handles.right || 0)}
      {renderHandleGroup('bottom', handles.bottom || 0)}
      {renderHandleGroup('left', handles.left || 0)}

      {/* Content Injection */}
      <div style={styles.contentArea}>
        <div style={styles.contentInner}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

// Helper for positioning handle containers
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
