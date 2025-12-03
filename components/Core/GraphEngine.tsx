import React, { useRef, useState, useCallback, useEffect } from 'react';
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
}

export const GraphEngine: React.FC<GraphEngineProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  renderNode,
  viewport,
  onViewportChange,
  readOnly = false,
  activeTool = 'select'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeMotionValues = useRef(new Map<string, { x: MotionValue<number>; y: MotionValue<number> }>());
  const { theme } = useTheme();

  const viewX = useMotionValue(viewport.x);
  const viewY = useMotionValue(viewport.y);
  const viewZoom = useMotionValue(viewport.zoom);

  useEffect(() => {
    viewX.set(viewport.x);
    viewY.set(viewport.y);
    viewZoom.set(viewport.zoom);
  }, [viewport, viewX, viewY, viewZoom]);

  const bgPosition = useTransform([viewX, viewY], ([x, y]) => `${x}px ${y}px`);
  const bgSize = useTransform(viewZoom, z => `${20 * z}px ${20 * z}px`);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<Position>({ x: 0, y: 0 });

  const isPanning = useRef(false);
  const lastMousePos = useRef<Position>({ x: 0, y: 0 });
  
  const onViewportChangeRef = useRef(onViewportChange);
  useEffect(() => { onViewportChangeRef.current = onViewportChange; }, [onViewportChange]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          onNodesChange(nodes.filter(n => n.id !== selectedNodeId));
          onEdgesChange(edges.filter(edge => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
          nodeMotionValues.current.delete(selectedNodeId);
          setSelectedNodeId(null);
        }
        if (selectedEdgeId) {
          onEdgesChange(edges.filter(e => e.id !== selectedEdgeId));
          setSelectedEdgeId(null);
        }
      }
      if (e.key === 'Escape') {
        setPendingConnection(null);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, nodes, edges, onNodesChange, onEdgesChange, readOnly]);

  const handleWindowPointerMove = useCallback((e: PointerEvent) => {
    if (isPanning.current) {
      e.preventDefault();
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      viewX.set(viewX.get() + dx);
      viewY.set(viewY.get() + dy);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [viewX, viewY]);

  const handleWindowPointerUp = useCallback(() => {
    if (isPanning.current) {
        isPanning.current = false;
        window.removeEventListener('pointermove', handleWindowPointerMove);
        window.removeEventListener('pointerup', handleWindowPointerUp);
        onViewportChangeRef.current({
            x: viewX.get(),
            y: viewY.get(),
            zoom: viewZoom.get()
        });
    }
  }, [handleWindowPointerMove, viewX, viewY, viewZoom]);

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [handleWindowPointerMove, handleWindowPointerUp]);

  const handleNodeDrag = useCallback((id: string, x: number, y: number) => {
    if (readOnly || activeTool !== 'select') return;
    const updatedNodes = nodes.map(n => n.id === id ? { ...n, position: { x, y } } : n);
    onNodesChange(updatedNodes);
  }, [nodes, onNodesChange, readOnly, activeTool]);

  const handleNodeResize = useCallback((id: string, width: number, height: number) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    if (Math.abs((node.width || 0) - width) > 1 || Math.abs((node.height || 0) - height) > 1) {
       onNodesChange(nodes.map(n => n.id === id ? { ...n, width, height } : n));
    }
  }, [nodes, onNodesChange]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey) || (activeTool === 'pan' && e.button === 0)) {
      isPanning.current = true;
      e.preventDefault(); 
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      window.addEventListener('pointermove', handleWindowPointerMove);
      window.addEventListener('pointerup', handleWindowPointerUp);
      return;
    }
    if (e.target === containerRef.current) {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setPendingConnection(null);
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (isPanning.current) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pos = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, rect);
      setMouseCanvasPos(pos);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const zoomSensitivity = 0.001;
      const newZoom = Math.min(Math.max(viewport.zoom - e.deltaY * zoomSensitivity, 0.1), 3);
      onViewportChange({ ...viewport, zoom: newZoom });
    } else {
      onViewportChange({ ...viewport, x: viewport.x - e.deltaX, y: viewport.y - e.deltaY });
    }
  };

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

  const getCursorClass = () => {
    if (activeTool === 'pan') return 'cursor-grab active:cursor-grabbing';
    if (activeTool === 'connect') return 'cursor-crosshair';
    return 'cursor-default';
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
       {/* Grid Background */}
       <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${theme.content[3]} 1px, transparent 1px)`,
          backgroundSize: bgSize,
          backgroundPosition: bgPosition,
          opacity: 0.2
        }}
      />

      <div
        ref={containerRef}
        className={`w-full h-full ${getCursorClass()}`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
        style={{ touchAction: 'none' }}
      >
        <motion.div
          className="w-full h-full origin-top-left"
          style={{
            x: viewX,
            y: viewY,
            scale: viewZoom
          }}
        >
          {/* Edge Layer */}
          <svg className="overflow-visible absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            {edges
              .slice()
              .sort((a, b) => (a.id === selectedEdgeId ? 1 : b.id === selectedEdgeId ? -1 : 0))
              .map(edge => {
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
                    isSelected={selectedEdgeId === edge.id}
                    isConnectMode={activeTool === 'connect'}
                    isPanMode={activeTool === 'pan'}
                    onSelect={(id) => {
                      if (readOnly || activeTool !== 'select') return;
                      setSelectedEdgeId(id);
                      setSelectedNodeId(null);
                    }}
                    onDelete={(id) => {
                      if (readOnly) return;
                      onEdgesChange(edges.filter(e => e.id !== id));
                      if (selectedEdgeId === id) setSelectedEdgeId(null);
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
          <div className="relative z-10">
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
                    handles={node.handles}
                    isSelected={selectedNodeId === node.id}
                    showHandles={activeTool === 'connect'}
                    isDraggable={activeTool === 'select'}
                    isConnecting={!!pendingConnection}
                    isPanMode={activeTool === 'pan'}
                    onDrag={handleNodeDrag}
                    onSelect={(id) => {
                      if (activeTool === 'select') {
                        setSelectedNodeId(id);
                        setSelectedEdgeId(null);
                      }
                    }}
                    onDimensionsChange={handleNodeResize}
                    onHandleClick={handleHandleClick}
                  >
                    {renderNode(node)}
                  </NodeShell>
                 );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

       <div className="absolute top-6 right-6 pointer-events-none text-right">
        <div className="font-mono text-xs" style={{ color: theme.content[3] }}>
          X: {viewport.x.toFixed(0)} Y: {viewport.y.toFixed(0)} Z: {viewport.zoom.toFixed(2)}
        </div>
        {pendingConnection && (
            <div className="mt-2 font-mono text-xs animate-pulse" style={{ color: theme.accent.primary }}>
                Select target handle...
            </div>
        )}
      </div>
    </div>
  );
};