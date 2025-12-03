
import React, { useState, useEffect, useRef } from 'react';
import { Node, Edge, Viewport, NodeData, Position } from '../../types';
import { IPOSlate } from '../Core/NodeBlock'; 
import { Dock } from '../Section/Dock';
import { ContextMenu } from '../Section/ContextMenu';
import { GraphEngine } from '../Core/GraphEngine';
import { screenToCanvas, generateId } from '../../utils/geometry';

export const FlowEditor: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [activeTool, setActiveTool] = useState<'select' | 'connect' | 'pan'>('select');
  
  // Context Menu State
  const [contextMenuPos, setContextMenuPos] = useState<Position | null>(null);
  
  // Container ref for relative coordinate calculations if needed
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial Data
  useEffect(() => {
    setNodes([
      {
        id: 'input-1',
        position: { x: 100, y: 300 },
        data: { label: 'User Input', type: 'input', value: 'Data Stream' },
        handles: { top: 1, right: 1, bottom: 1, left: 1 },
        width: 200,
      },
      {
        id: 'proc-1',
        position: { x: 400, y: 200 },
        data: { label: 'Normalize', type: 'process' },
        handles: { top: 1, right: 1, bottom: 1, left: 1 },
        width: 200,
      },
       {
        id: 'proc-2',
        position: { x: 400, y: 400 },
        data: { label: 'Sanitize', type: 'process' },
        handles: { top: 1, right: 1, bottom: 1, left: 1 },
        width: 200,
      },
       {
        id: 'out-1',
        position: { x: 750, y: 300 },
        data: { label: 'Database', type: 'output' },
        handles: { top: 1, right: 1, bottom: 1, left: 1 },
        width: 200,
      }
    ]);
    
    setEdges([
        { id: 'e1', source: 'input-1', sourceHandle: 0, sourceSide: 'right', target: 'proc-1', targetHandle: 0, targetSide: 'left' },
        { id: 'e2', source: 'input-1', sourceHandle: 0, sourceSide: 'right', target: 'proc-2', targetHandle: 0, targetSide: 'left' },
        { id: 'e3', source: 'proc-1', sourceHandle: 0, sourceSide: 'right', target: 'out-1', targetHandle: 0, targetSide: 'left' },
        { id: 'e4', source: 'proc-2', sourceHandle: 0, sourceSide: 'right', target: 'out-1', targetHandle: 0, targetSide: 'left' }
    ]);
  }, []);

  const handleAddNode = (type: NodeData['type'], screenPos?: Position) => {
    // If screenPos is provided (from Context Menu), use it. 
    // Otherwise use center of screen (from Dock)
    
    const targetX = screenPos ? screenPos.x : window.innerWidth / 2;
    const targetY = screenPos ? screenPos.y : window.innerHeight / 2;

    const pos = screenToCanvas(
         { x: targetX, y: targetY },
         viewport,
         // Approximating container rect as full window for now since it's full screen
         { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight } as DOMRect
    );

    // Default to all handles active
    const handles: Node['handles'] = { top: 1, right: 1, bottom: 1, left: 1 };

    const newNode: Node = {
      id: generateId(),
      position: { x: pos.x - 100, y: pos.y - 25 }, // Center anchor approximation
      data: { label: `New ${type}`, type },
      handles,
      width: 200, 
    };

    setNodes(prev => [...prev, newNode]);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (activeTool === 'select') {
        setContextMenuPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleContextAction = (action: string, payload?: any) => {
    if (action === 'add_node') {
        handleAddNode(payload, contextMenuPos || undefined);
    } else if (action === 'reset_view') {
        setViewport({ x: 0, y: 0, zoom: 1 });
    } else if (action === 'clear_canvas') {
        setNodes([]);
        setEdges([]);
    }
  };

  return (
    <div 
        ref={containerRef}
        className="w-full h-screen font-body text-content-1 selection:bg-accent/30 relative"
        onContextMenu={handleContextMenu}
    >
      
      {/* Engine Instance */}
      <GraphEngine
        nodes={nodes}
        edges={edges}
        onNodesChange={setNodes}
        onEdgesChange={setEdges}
        viewport={viewport}
        onViewportChange={setViewport}
        activeTool={activeTool}
        renderNode={(node) => <IPOSlate data={node.data} />}
      />

      {/* UI Overlay */}
      <div className="absolute top-6 left-6 pointer-events-none z-50">
        <h1 className="text-4xl font-display text-content-1 tracking-wider opacity-90 drop-shadow-lg">Nexus Flow</h1>
        <p className="font-mono text-xs text-accent mt-1 tracking-tight">v3.2 // Mode: {activeTool.toUpperCase()}</p>
      </div>

      <Dock 
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        onAddNode={(type) => handleAddNode(type)} 
        onClear={() => { setNodes([]); setEdges([]); }}
        onResetView={() => setViewport({ x: 0, y: 0, zoom: 1 })}
      />

      <ContextMenu 
        position={contextMenuPos} 
        onClose={() => setContextMenuPos(null)} 
        onAction={handleContextAction}
      />
    </div>
  );
};
