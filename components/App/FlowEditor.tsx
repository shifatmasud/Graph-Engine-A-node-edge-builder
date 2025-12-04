import React, { useState, useEffect, useRef } from 'react';
import { Node, Edge, Viewport, NodeData, Position } from '../../types';
import { IPOSlate } from '../Core/NodeBlock'; 
import { Dock } from '../Section/Dock';
import { ContextMenu } from '../Section/ContextMenu';
import { GraphEngine } from '../Core/GraphEngine';
import { screenToCanvas, generateId } from '../../utils/geometry';
import { useTheme } from '../Core/ThemeContext';

export const FlowEditor: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [activeTool, setActiveTool] = useState<'select' | 'connect' | 'pan'>('select');
  const { theme } = useTheme();
  
  // Hidden file input for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Context Menu State
  const [contextMenuPos, setContextMenuPos] = useState<Position | null>(null);
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
    const targetX = screenPos ? screenPos.x : window.innerWidth / 2;
    const targetY = screenPos ? screenPos.y : window.innerHeight / 2;

    const pos = screenToCanvas(
         { x: targetX, y: targetY },
         viewport,
         { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight } as DOMRect
    );

    const handles: Node['handles'] = { top: 1, right: 1, bottom: 1, left: 1 };
    const newNode: Node = {
      id: generateId(),
      position: { x: pos.x - 100, y: pos.y - 25 },
      data: { label: `New ${type}`, type },
      handles,
      width: 200, 
    };

    setNodes(prev => [...prev, newNode]);
  };

  const handleUpdateNode = (id: string, data: Partial<NodeData>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
  };

  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
  };

  const handleCopyGlobalPseudo = () => {
    let output = "// NEXUS FLOW GLOBAL PSEUDO CODE\n\n// --- NODES ---\n";
    
    nodes.forEach(n => {
        output += `[${n.data.type.toUpperCase()}] ${n.data.label}`;
        if (n.data.value !== undefined && n.data.value !== '') {
            output += ` = ${n.data.value}`;
        }
        output += '\n';
    });

    output += "\n// --- CONNECTIONS ---\n";
    
    edges.forEach(e => {
        const source = nodes.find(n => n.id === e.source);
        const target = nodes.find(n => n.id === e.target);
        if (source && target) {
            output += `${source.data.label} --> ${target.data.label}\n`;
        }
    });

    navigator.clipboard.writeText(output);
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
    } else if (action === 'copy_pseudo') {
        handleCopyGlobalPseudo();
    }
  };

  const exportProject = () => {
    const project = { version: '1.0', nodes, edges, viewport };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => fileInputRef.current?.click();

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const project = JSON.parse(ev.target?.result as string);
            if (project.nodes && project.edges) {
                setNodes(project.nodes);
                setEdges(project.edges);
                if (project.viewport) setViewport(project.viewport);
            }
        } catch (err) {
            console.error("Invalid project file");
        }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div 
        ref={containerRef}
        className="w-full h-screen font-body selection:bg-accent/30 relative transition-colors duration-300"
        style={{ backgroundColor: theme.surface[1], color: theme.content[1] }}
        onContextMenu={handleContextMenu}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileImport} 
        style={{ display: 'none' }} 
        accept=".json"
      />

      {/* Engine Instance */}
      <GraphEngine
        nodes={nodes}
        edges={edges}
        onNodesChange={setNodes}
        onEdgesChange={setEdges}
        viewport={viewport}
        onViewportChange={setViewport}
        activeTool={activeTool}
        renderNode={(node) => (
            <IPOSlate 
                data={node.data} 
                onUpdate={(data) => handleUpdateNode(node.id, data)}
                onDelete={() => handleDeleteNode(node.id)}
            />
        )}
      />

      {/* UI Overlay */}
      <div className="absolute top-6 left-6 pointer-events-none z-50">
        <h1 
            className="text-4xl font-display tracking-wider opacity-90 drop-shadow-lg"
            style={{ color: theme.content[1] }}
        >Nexus Flow</h1>
        <p className="font-mono text-xs mt-1 tracking-tight" style={{ color: theme.accent.primary }}>
            v3.5 // Mode: {activeTool.toUpperCase()}
        </p>
      </div>

      <Dock 
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        onAddNode={(type) => handleAddNode(type)} 
        onClear={() => { setNodes([]); setEdges([]); }}
        onResetView={() => setViewport({ x: 0, y: 0, zoom: 1 })}
        onImport={triggerImport}
        onExport={exportProject}
        onCopyPseudo={handleCopyGlobalPseudo}
      />

      <ContextMenu 
        position={contextMenuPos} 
        onClose={() => setContextMenuPos(null)} 
        onAction={handleContextAction}
      />
    </div>
  );
};