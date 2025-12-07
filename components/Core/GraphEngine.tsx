import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, motionValue, MotionValue, useMotionValue, useTransform } from 'framer-motion';
import { Node, Edge, Viewport, Position, NodeData, Side, PendingConnection } from '../../types';
import { NodeShell } from './NodeShell';
import { ConnectionLine } from './ConnectionLine';
import { EdgeConnector } from './EdgeConnector';
import { screenToCanvas, generateId } from '../../utils/geometry';
import { useTheme } from './ThemeContext';

interface GraphEngineProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  renderNode: (node: Node) => React.ReactNode;
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
  readOnly?: boolean;
  activeTool?: 'select' | 'connect' | 'pan';
  onNodeResize?: (id: string, dimensions: { width: number, height: number }) => void;
}

// Helpers
// @ts-ignore
const getDistance = (p1: PointerEvent, p2: PointerEvent) => {
  return Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
};

// @ts-ignore
const getCenter = (p1: PointerEvent, p2: PointerEvent) => {
  return {
    x: (p1.clientX + p2.clientX) / 2,
    y: (p1.clientY + p2.clientY) / 2,
  };
};

export const GraphEngine: React.FC<GraphEngineProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  renderNode,
  viewport,
  onViewportChange,
  readOnly = false,
  activeTool = 'select',
  onNodeResize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeMotionValues = useRef(new Map<string, { x: MotionValue<number>; y: MotionValue<number> }>());
  const { theme } = useTheme();

  // MotionValues for high-performance transformations
  const viewX = useMotionValue(viewport.x);
  const viewY = useMotionValue(viewport.y);
  const viewZoom = useMotionValue(viewport.zoom);

  // Grid background transforms
  const bgPosition = useTransform([viewX, viewY], ([x, y]) => `${x}px ${y}px`);
  const bgSize = useTransform(viewZoom, z => `${20 * z}px ${20 * z}px`);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<Position>({ x: 0, y: 0 });

  // Gesture State
  const pointerCache = useRef<Map<number, PointerEvent>>(new Map());
  const prevPinchInfo = useRef<{ dist: number; center: Position } | null>(null);
  const lastPanPos = useRef<Position | null>(null);
  const isGestureActive = useRef(false);
  const gestureStartPos = useRef<Position | null>(null);

  // Calculate flow depths for sequential animation
  const { edgeDepths, maxDepth } = useMemo(() => {
    const nodeDepths = new Map<string, number>();
    nodes.forEach(n => nodeDepths.set(n.id, 0));

    // Propagate depths (Bellman-Ford style relaxation to handle cycles gracefully)
    // We limit iterations to nodes.length to avoid infinite loops in cycles
    for (let i = 0; i < nodes.length + 1; i++) {
        let changed = false;
        edges.forEach(e => {
            const sD = nodeDepths.get(e.source) || 0;
            const tD = nodeDepths.get(e.target) || 0;
            if (sD + 1 > tD) {
                nodeDepths.set(e.target, sD + 1);
                changed = true;
            }
        });
        if (!changed) break;
    }

    const computedEdgeDepths = new Map<string, number>();
    let max = 0;
    edges.forEach(e => {
        // Edge depth corresponds to the source node's depth
        const depth = nodeDepths.get(e.source) || 0;
        computedEdgeDepths.set(e.id, depth);
        if (depth > max) max = depth;
    });

    return { edgeDepths: computedEdgeDepths, maxDepth: max };
  }, [nodes, edges]);

  // Sync MotionValues
  useEffect(() => {
    if (!isGestureActive.current) {
      viewX.set(viewport.x);
      viewY.set(viewport.y);
      viewZoom.set(viewport.zoom);
    }
  }, [viewport, viewX, viewY, viewZoom]);

  useEffect(() => {
    nodes.forEach(node => {
      let mvs = nodeMotionValues.current.get(node.id);
      if (!mvs) {
        mvs = { x: motionValue(node.position.x), y: motionValue(node.position.y) };
        nodeMotionValues.current.set(node.id, mvs);
      } else {
        if (Math.abs(mvs.x.get() - node.position.x) > 0.1) mvs.x.set(node.position.x);
        if (Math.abs(mvs.y.get() - node.position.y) > 0.1) mvs.y.set(node.position.y);
      }
    });
    
    const currentIds = new Set(nodes.map(n => n.id));
    for (const [id] of nodeMotionValues.current) {
      if (!currentIds.has(id)) {
        nodeMotionValues.current.delete(id);
      }
    }
  }, [nodes]);

  // Keyboard Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;
      
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if (isInput) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          onNodesChange(nodes.filter(n => n.id !== selectedNodeId));
          onEdgesChange(edges.filter(edge => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
          nodeMotionValues.current.delete(selectedNodeId);
          setSelectedNodeId(null);
        }
      }
      if (e.key === 'Escape') {
        setPendingConnection(null);
        setSelectedNodeId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, nodes, edges, onNodesChange, onEdgesChange, readOnly]);

  // --- Unified Pointer Handling (Touch + Mouse) ---

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointerCache.current.set(e.pointerId, e.nativeEvent);
    
    if (e.target === containerRef.current) {
      gestureStartPos.current = { x: e.clientX, y: e.clientY };
    }

    if (pointerCache.current.size === 2) {
      const points = Array.from(pointerCache.current.values());
      // @ts-ignore
      prevPinchInfo.current = {
        dist: getDistance(points[0] as PointerEvent, points[1] as PointerEvent),
        center: getCenter(points[0] as PointerEvent, points[1] as PointerEvent)
      };
      isGestureActive.current = true;
      lastPanPos.current = null;
    } else if (pointerCache.current.size === 1) {
      const isTouch = e.pointerType === 'touch';
      const isPanTool = activeTool === 'pan';
      const isMiddleBtn = e.button === 1;
      const isAltKey = e.button === 0 && e.altKey;

      if (isTouch || isPanTool || isMiddleBtn || isAltKey) {
        isGestureActive.current = true;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    pointerCache.current.set(e.pointerId, e.nativeEvent);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentViewport = { x: viewX.get(), y: viewY.get(), zoom: viewZoom.get() };
      setMouseCanvasPos(screenToCanvas({ x: e.clientX, y: e.clientY }, currentViewport, rect));
    }

    if (pointerCache.current.size === 2 && prevPinchInfo.current) {
      const points = Array.from(pointerCache.current.values());
      // @ts-ignore
      const newDist = getDistance(points[0] as PointerEvent, points[1] as PointerEvent);
      // @ts-ignore
      const newCenter = getCenter(points[0] as PointerEvent, points[1] as PointerEvent);
      
      const oldZoom = viewZoom.get();
      const zoomFactor = newDist / prevPinchInfo.current.dist;
      const newZoom = Math.min(Math.max(oldZoom * zoomFactor, 0.1), 5);

      const pointUnderCursorX = (prevPinchInfo.current.center.x - viewX.get()) / oldZoom;
      const pointUnderCursorY = (prevPinchInfo.current.center.y - viewY.get()) / oldZoom;

      const newX = newCenter.x - (pointUnderCursorX * newZoom);
      const newY = newCenter.y - (pointUnderCursorY * newZoom);

      viewX.set(newX);
      viewY.set(newY);
      viewZoom.set(newZoom);

      prevPinchInfo.current = { dist: newDist, center: newCenter };

    } else if (pointerCache.current.size === 1 && lastPanPos.current) {
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;

      viewX.set(viewX.get() + dx);
      viewY.set(viewY.get() + dy);
      
      lastPanPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    pointerCache.current.delete(e.pointerId);

    if (pointerCache.current.size < 2) {
      prevPinchInfo.current = null;
    }
    
    if (pointerCache.current.size === 0) {
      if (gestureStartPos.current) {
        const dist = Math.hypot(e.clientX - gestureStartPos.current.x, e.clientY - gestureStartPos.current.y);
        if (dist < 5 && e.target === containerRef.current) {
           setSelectedNodeId(null);
           setPendingConnection(null);
        }
      }

      if (isGestureActive.current) {
        isGestureActive.current = false;
        onViewportChange({
          x: viewX.get(),
          y: viewY.get(),
          zoom: viewZoom.get()
        });
      }
      lastPanPos.current = null;
      gestureStartPos.current = null;
    } else if (pointerCache.current.size === 1) {
      const point = pointerCache.current.values().next().value;
      if (point) lastPanPos.current = { x: point.clientX, y: point.clientY };
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const oldZoom = viewZoom.get();
      const newZoom = Math.min(Math.max(oldZoom - e.deltaY * zoomSensitivity, 0.1), 3);
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          const pointX = (mouseX - viewX.get()) / oldZoom;
          const pointY = (mouseY - viewY.get()) / oldZoom;
          
          const newX = mouseX - (pointX * newZoom);
          const newY = mouseY - (pointY * newZoom);
          
          viewX.set(newX);
          viewY.set(newY);
          viewZoom.set(newZoom);
          onViewportChange({ x: newX, y: newY, zoom: newZoom });
      }
    } else {
      const newX = viewX.get() - e.deltaX;
      const newY = viewY.get() - e.deltaY;
      viewX.set(newX);
      viewY.set(newY);
      onViewportChange({ x: newX, y: newY, zoom: viewZoom.get() });
    }
  };

  const handleNodeDrag = useCallback((id: string, x: number, y: number) => {
    if (readOnly || activeTool !== 'select') return;
    const updatedNodes = nodes.map(n => n.id === id ? { ...n, position: { x, y } } : n);
    onNodesChange(updatedNodes);
  }, [nodes, onNodesChange, readOnly, activeTool]);

  const handleNodeAutoResize = useCallback((id: string, width: number, height: number) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    if (Math.abs((node.width || 0) - width) > 1 || Math.abs((node.height || 0) - height) > 1) {
       onNodesChange(nodes.map(n => n.id === id ? { ...n, width, height } : n));
    }
  }, [nodes, onNodesChange]);

  const handleHandleClick = (e: React.MouseEvent, nodeId: string, index: number, side: Side) => {
    if (readOnly || activeTool !== 'connect') return;
    e.stopPropagation();

    if (!pendingConnection) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      const offset = getHandleOffset(node, side, index);
      setPendingConnection({
        sourceNodeId: nodeId,
        sourceHandle: index,
        sourceSide: side,
        startPos: { x: node.position.x + offset.x, y: node.position.y + offset.y }
      });
    } else {
      if (pendingConnection.sourceNodeId === nodeId) {
        setPendingConnection(null);
        return;
      }
      const exists = edges.some(edge => 
        edge.source === pendingConnection.sourceNodeId && 
        edge.target === nodeId &&
        edge.sourceHandle === pendingConnection.sourceHandle &&
        edge.targetHandle === index
      );
      if (!exists) {
        const newEdge: Edge = {
          id: generateId(),
          source: pendingConnection.sourceNodeId,
          sourceHandle: pendingConnection.sourceHandle,
          sourceSide: pendingConnection.sourceSide,
          target: nodeId,
          targetHandle: index,
          targetSide: side
        };
        onEdgesChange([...edges, newEdge]);
      }
      setPendingConnection(null);
    }
  };

  const getHandleOffset = (node: Node, side: Side, index: number) => {
    const width = node.width || 200; 
    const height = node.height || 100;
    const gap = 12;
    const handleSize = 14;
    const count = node.handles[side] || 0;
    const totalSpread = (count * handleSize) + ((count - 1) * gap);
    const startFromCenter = -totalSpread / 2 + handleSize / 2;
    const offsetInGroup = startFromCenter + (index * (handleSize + gap));
    if (side === 'left') return { x: 0, y: height / 2 + offsetInGroup };
    if (side === 'right') return { x: width, y: height / 2 + offsetInGroup };
    if (side === 'top') return { x: width / 2 + offsetInGroup, y: 0 };
    return { x: width / 2 + offsetInGroup, y: height };
  };

  const getCursorStyle = () => {
    if (isGestureActive.current && lastPanPos.current) return 'grabbing';
    if (activeTool === 'pan') return 'grab';
    if (activeTool === 'connect') return 'crosshair';
    return 'default';
  };

  const styles = {
    container: {
      width: '100%',
      height: '100%',
      position: 'relative' as const,
      overflow: 'hidden',
      touchAction: 'none' as const,
    },
    gridBackground: {
      position: 'absolute' as const,
      inset: 0,
      pointerEvents: 'none' as const,
      backgroundImage: `radial-gradient(${theme.grid} 1px, transparent 1px)`,
    },
    canvasTransform: {
      width: '100%',
      height: '100%',
      originX: 0,
      originY: 0,
      willChange: 'transform',
    },
    svgLayer: {
      overflow: 'visible' as const,
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none' as const,
      zIndex: 0,
    },
    nodeLayer: {
      position: 'relative' as const,
      zIndex: 10,
    },
    uiOverlay: {
      position: 'absolute' as const,
      top: theme.space[6],
      right: theme.space[6],
      pointerEvents: 'none' as const,
      textAlign: 'right' as const,
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-end',
      gap: theme.space[2],
    },
    viewportInfo: {
      background: `${theme.surface[2]}B3`,
      padding: `${theme.space[1]} ${theme.space[2]}`,
      borderRadius: theme.radius[2],
      backdropFilter: 'blur(4px)',
    },
    viewportText: {
      fontFamily: '"Victor Mono", monospace',
      fontSize: '12px',
      color: theme.content[2],
    },
    pendingConnectionText: {
      fontFamily: '"Victor Mono", monospace',
      fontSize: '12px',
      color: theme.accent.primary,
    },
  };

  return (
    <div style={styles.container}>
       <motion.div 
        style={{
          ...styles.gridBackground,
          backgroundSize: bgSize,
          backgroundPosition: bgPosition,
        }}
      />

      <div
        ref={containerRef}
        style={{ ...styles.container, cursor: getCursorStyle() }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
      >
        <motion.div
          style={{
            ...styles.canvasTransform,
            x: viewX,
            y: viewY,
            scale: viewZoom
          }}
        >
          {/* Edge Layer */}
          <svg style={styles.svgLayer}>
            {edges.map(edge => {
                const sourceNodeMVs = nodeMotionValues.current.get(edge.source);
                const targetNodeMVs = nodeMotionValues.current.get(edge.target);
                const sNode = nodes.find(n => n.id === edge.source);
                const tNode = nodes.find(n => n.id === edge.target);
                if (!sourceNodeMVs || !targetNodeMVs || !sNode || !tNode) return null;

                const sourceOffset = getHandleOffset(sNode, edge.sourceSide, edge.sourceHandle);
                const targetOffset = getHandleOffset(tNode, edge.targetSide, edge.targetHandle);

                return (
                  <EdgeConnector 
                    key={edge.id}
                    id={edge.id}
                    sourceNode={sourceNodeMVs}
                    targetNode={targetNodeMVs}
                    sourceOffset={sourceOffset}
                    targetOffset={targetOffset}
                    sourceSide={edge.sourceSide}
                    targetSide={edge.targetSide}
                    isConnectMode={activeTool === 'connect'}
                    isPanMode={activeTool === 'pan'}
                    depth={edgeDepths.get(edge.id) || 0}
                    maxDepth={maxDepth}
                    onDelete={(id) => {
                      if (readOnly) return;
                      onEdgesChange(edges.filter(e => e.id !== id));
                    }}
                  />
                );
            })}
             {pendingConnection && (
              <ConnectionLine
                sourcePos={pendingConnection.startPos}
                targetPos={mouseCanvasPos}
                isTemp
              />
            )}
          </svg>

          {/* Node Layer */}
          <div style={styles.nodeLayer}>
            <AnimatePresence>
              {nodes.map(node => {
                 const mvs = nodeMotionValues.current.get(node.id);
                 if (!mvs) return null;

                 return (
                  <NodeShell
                    key={node.id}
                    id={node.id}
                    x={mvs.x}
                    y={mvs.y}
                    width={node.width}
                    height={node.height}
                    handles={node.handles}
                    isSelected={selectedNodeId === node.id}
                    showHandles={activeTool === 'connect'}
                    isDraggable={activeTool === 'select'}
                    isConnecting={!!pendingConnection}
                    isPanMode={activeTool === 'pan'}
                    isResizable={node.data.type === 'embed'}
                    onDrag={handleNodeDrag}
                    onSelect={(id) => {
                      if (activeTool === 'select') {
                        setSelectedNodeId(id);
                      }
                    }}
                    onDimensionsChange={handleNodeAutoResize}
                    onHandleClick={handleHandleClick}
                    onResize={(dims) => onNodeResize?.(node.id, dims)}
                  >
                    {renderNode(node)}
                  </NodeShell>
                 );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

       <div style={styles.uiOverlay}>
        <div style={styles.viewportInfo}>
          <div style={styles.viewportText}>
            X: {viewport.x.toFixed(0)} Y: {viewport.y.toFixed(0)} Z: {viewport.zoom.toFixed(2)}
          </div>
        </div>
        <AnimatePresence>
          {pendingConnection && (
              <motion.div 
                style={styles.pendingConnectionText}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
              >
                  Select target handle...
              </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
