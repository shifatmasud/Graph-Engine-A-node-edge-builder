import React, { useState, useEffect, useRef } from 'react';
import { Node, Edge, Viewport, NodeData, Position } from '../../types';
import { IPOSlate } from '../Core/NodeBlock'; 
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

    const containerRect = containerRef.current?.getBoundingClientRect();
    const pos = screenToCanvas(
         { x: targetX, y: targetY },
         viewport,
         containerRect || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight } as DOMRect
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
    setContextMenuPos({ x: e.clientX, y: e.clientY });
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
    } else if (action === 'select_tool') {
        setActiveTool(payload);
    } else if (action === 'import') {
        triggerImport();
    } else if (action === 'export') {
        exportProject();
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

  const styles = {
    container: {
      width: '100%',
      height: '100vh', // Full viewport height
      fontFamily: 'Inter, sans-serif',
      position: 'relative' as const,
      overflow: 'hidden',
      backgroundColor: theme.surface[1],
      color: theme.content[1],
      transition: 'background-color 0.3s ease, color 0.3s ease',
      WebkitTouchCallout: 'none', // Disable context menu on long press for iOS Safari
      WebkitUserSelect: 'none', // Disable text selection for iOS Safari
      KhtmlUserSelect: 'none', // Disable text selection for Konqueror
      MozUserSelect: 'none', // Disable text selection for Firefox
      MsUserSelect: 'none', // Disable text selection for Edge/IE
      userSelect: 'none', // Disable text selection for general browsers
    },
    uiOverlay: {
      position: 'absolute' as const,
      top: theme.space[6], // 24px
      left: theme.space[6], // 24px
      pointerEvents: 'none' as const,
      zIndex: 50,
    },
    title: {
      fontSize: '28px',
      fontFamily: '"Bebas Neue", cursive',
      letterSpacing: '0.05em',
      opacity: 0.9,
      color: theme.content[1],
      textShadow: `0 0 10px ${theme.accent.glow}`,
    },
    subtitle: {
      fontFamily: '"Victor Mono", monospace',
      fontSize: '11px',
      marginTop: theme.space[1], // 4px
      letterSpacing: '0.05em',
      color: theme.accent.primary,
      opacity: 0.8,
    }
  };


  return (
    <div 
        ref={containerRef}
        style={styles.container}
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
      <div style={styles.uiOverlay}>
        <h1 
            style={styles.title}
        >Nexus Flow</h1>
        <p style={styles.subtitle}>
            v4.0 // {activeTool.toUpperCase()}
        </p>
      </div>

      <ContextMenu 
        position={contextMenuPos} 
        onClose={() => setContextMenuPos(null)} 
        onAction={handleContextAction}
      />
    </div>
  );
};