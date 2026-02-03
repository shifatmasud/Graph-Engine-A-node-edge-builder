import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { motion, MotionValue, PanInfo, useMotionValue } from 'framer-motion';
import { Handle } from './Handle';
import { Side } from '../../types';
import { useTheme } from './ThemeContext';
// FIX: Switched to namespace import for @phosphor-icons/react to resolve module export errors.
import * as Icon from '@phosphor-icons/react';

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
  isResizable?: boolean;
  handles?: Partial<Record<Side, number>>;
  width?: number;
  height?: number;
  children?: React.ReactNode;
  
  onDrag: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
  onDimensionsChange?: (id: string, width: number, height: number) => void;
  
  hoveredHandle?: { nodeId: string; index: number; side: Side } | null;
  onHandlePointerDown: (e: React.PointerEvent<HTMLDivElement>, nodeId: string, index: number, side: Side) => void;
  
  onResize?: (newSize: { width: number, height: number }) => void;
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
  isResizable = false,
  handles = { top: 0, right: 0, bottom: 0, left: 0 },
  width = 200, 
  height,
  children,
  onDrag,
  onSelect,
  onDimensionsChange,
  hoveredHandle,
  onHandlePointerDown,
  onResize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onDimensionsChangeRef = useRef(onDimensionsChange);
  const { theme } = useTheme();
  
  const initialSizeRef = useRef({ width: 0, height: 0 });
  const mvWidth = useMotionValue(width);
  const mvHeight = useMotionValue(height || 0);

  useEffect(() => {
    mvWidth.set(width);
    if(height) mvHeight.set(height);
  }, [width, height, mvWidth, mvHeight]);

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
                if (!isResizable) mvHeight.set(h);
                onDimensionsChangeRef.current(id, w, h);
            }
          }
      });
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [id, isResizable, mvHeight]);

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
      minHeight: '100px',
      borderRadius: theme.radius[4],
      background: theme.surface[2],
      cursor: isDraggable ? 'grab' : (isPanMode ? 'grab' : 'default'),
      zIndex: isSelected ? 100 : 10,
      display: 'flex',
      flexDirection: 'column' as const,
      borderWidth: '1px',
      borderStyle: 'solid',
      // We will animate the actual colors and shadow via Framer Motion's animate prop
    },
    contentArea: {
      position: 'relative' as const,
      zIndex: 2,
      width: '100%',
      flex: 1, 
      display: 'flex',
      minHeight: 0, 
    },
    resizeHandle: {
      position: 'absolute' as const,
      bottom: -4,
      right: -4,
      width: '20px',
      height: '20px',
      cursor: 'nwse-resize',
      zIndex: 30,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      color: theme.content[3],
      opacity: showHandles ? 1 : 0,
      transform: showHandles ? 'scale(1)' : 'scale(0.8)',
      pointerEvents: showHandles ? ('auto' as const) : ('none' as const),
      transition: 'opacity 0.2s ease, transform 0.2s ease',
    }
  };

  // Pre-calculated selection states for smooth transitions
  const selectionVariants = {
    selected: {
      borderColor: theme.accent.primary,
      boxShadow: `0 0 0 1.5px ${theme.accent.primary}, 0 0 20px 4px ${theme.accent.glow}, ${theme.shadow}`,
      scale: 1.015,
    },
    default: {
      borderColor: theme.border,
      boxShadow: theme.shadow,
      scale: 1,
    }
  };

  return (
    <motion.div
      ref={containerRef}
      style={{ 
          ...styles.shell, 
          x, 
          y, 
          width: mvWidth,
          height: height ? mvHeight : 'auto',
      }}
      drag={isDraggable} 
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      onPointerDown={(e) => {
        // Only select if not panning and the click was specifically on the shell background
        // and not intercepted by interactive children (buttons/inputs)
        const isChildInteractive = (e.target as HTMLElement).closest('button, input, textarea');
        if (!isPanMode && !e.defaultPrevented && !isChildInteractive) {
            e.stopPropagation(); 
            onSelect(id);
        }
      }}
      initial="default"
      animate={isSelected ? "selected" : "default"}
      variants={selectionVariants}
      whileTap={isDraggable ? { cursor: 'grabbing', scale: 1.025 } : {}}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
    >
      <div style={renderHandleGroup('top', handles.top || 0)}>
        {Array.from({ length: handles.top || 0 }).map((_, i) => (
          <Handle 
            key={`top-${i}`}
            side={'top'}
            index={i} 
            nodeId={id}
            isConnecting={isConnecting}
            onPointerDown={(e) => onHandlePointerDown(e, id, i, 'top')}
            isPotentialTarget={!!(hoveredHandle && hoveredHandle.nodeId === id && hoveredHandle.index === i && hoveredHandle.side === 'top')}
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
            onPointerDown={(e) => onHandlePointerDown(e, id, i, 'right')}
            isPotentialTarget={!!(hoveredHandle && hoveredHandle.nodeId === id && hoveredHandle.index === i && hoveredHandle.side === 'right')}
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
            onPointerDown={(e) => onHandlePointerDown(e, id, i, 'bottom')}
            isPotentialTarget={!!(hoveredHandle && hoveredHandle.nodeId === id && hoveredHandle.index === i && hoveredHandle.side === 'bottom')}
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
            onPointerDown={(e) => onHandlePointerDown(e, id, i, 'left')}
            isPotentialTarget={!!(hoveredHandle && hoveredHandle.nodeId === id && hoveredHandle.index === i && hoveredHandle.side === 'left')}
          />
        ))}
      </div>

      <div style={styles.contentArea}>
        {children}
      </div>

      {isResizable && (
        <motion.div
            style={styles.resizeHandle}
            drag
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
            onDragStart={() => {
                initialSizeRef.current = { width: mvWidth.get(), height: mvHeight.get() };
            }}
            onDrag={(e, info) => {
                const newWidth = Math.max(200, initialSizeRef.current.width + info.offset.x);
                const newHeight = Math.max(150, initialSizeRef.current.height + info.offset.y);
                mvWidth.set(newWidth);
                mvHeight.set(newHeight);
            }}
            onDragEnd={() => {
                onResize?.({ width: mvWidth.get(), height: mvHeight.get() });
            }}
            onPointerDown={(e) => e.stopPropagation()} 
        >
            <Icon.CornersOut size={12} weight="bold" />
        </motion.div>
    )}
    </motion.div>
  );
};