

import React, { useState, useEffect, useRef } from 'react';
import { Node, Edge, Viewport, NodeData, Position } from '../../types';
import { IPOSlate } from '../Core/NodeBlock'; 
import { EmbedSlate } from '../Core/EmbedSlate';
import { ContextMenu } from '../Section/ContextMenu';
import { Dock } from '../Section/Dock';
import { GraphEngine } from '../Core/GraphEngine';
import { GeneratorModal } from '../Section/GeneratorModal';
import { screenToCanvas, generateId } from '../../utils/geometry';
import { useTheme } from '../Core/ThemeContext';
import { GoogleGenAI, Type } from '@google/genai';

const graphSchema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      description: 'An array of node objects.',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Unique identifier for the node. Should be a short string, e.g., "node-1".' },
          label: { type: Type.STRING, description: 'Display name of the node.' },
          type: { type: Type.STRING, description: "Node type. Must be one of: 'input', 'process', or 'output'." },
          position: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER, description: 'X coordinate on the canvas. Should be a multiple of 10.' },
              y: { type: Type.NUMBER, description: 'Y coordinate on the canvas. Should be a multiple of 10.' },
            },
            required: ['x', 'y']
          },
          value: { 
            type: Type.STRING, 
            description: 'Example data or a brief description of what the node handles. For a "User Input" node, the value could be "User credentials". Keep it concise.' 
          }
        },
        required: ['id', 'label', 'type', 'position', 'value']
      }
    },
    edges: {
      type: Type.ARRAY,
      description: 'An array of edge objects connecting the nodes.',
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING, description: 'The unique ID of the source node for the connection.' },
          target: { type: Type.STRING, description: 'The unique ID of the target node for the connection.' },
        },
        required: ['source', 'target']
      }
    }
  },
  required: ['nodes', 'edges']
};

const initialNodes: Node[] = [
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
];

const initialEdges: Edge[] = [
    { id: 'e1', source: 'input-1', sourceHandle: 0, sourceSide: 'right', target: 'proc-1', targetHandle: 0, targetSide: 'left' },
    { id: 'e2', source: 'input-1', sourceHandle: 0, sourceSide: 'right', target: 'proc-2', targetHandle: 0, targetSide: 'left' },
    { id: 'e3', source: 'proc-1', sourceHandle: 0, sourceSide: 'right', target: 'out-1', targetHandle: 0, targetSide: 'left' },
    { id: 'e4', source: 'proc-2', sourceHandle: 0, sourceSide: 'right', target: 'out-1', targetHandle: 0, targetSide: 'left' }
];

export const FlowEditor: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [activeTool, setActiveTool] = useState<'select' | 'connect' | 'pan'>('select');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const { theme } = useTheme();
  
  // Hidden file input for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Context Menu State
  const [contextMenuPos, setContextMenuPos] = useState<Position | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Node-specific menu state
  const [openNodeMenu, setOpenNodeMenu] = useState<string | null>(null);

  const handleClearCanvas = () => {
    setNodes([]);
    setEdges([]);
  };

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
    
    let data: NodeData;
    let nodeProps: { width: number; height?: number; } = { width: 200 };

    if (type === 'embed') {
        data = { label: 'New Embed', type: 'embed' };
        nodeProps = { width: 400, height: 300 }; // 4:3 aspect ratio
    } else {
        data = { label: `New ${type}`, type };
    }

    const newNode: Node = {
      id: generateId(),
      position: { x: pos.x - nodeProps.width / 2, y: pos.y - (nodeProps.height || 100) / 2 },
      data,
      handles,
      width: nodeProps.width,
      height: nodeProps.height,
    };

    setNodes(prev => [...prev, newNode]);
  };

  const handleUpdateNode = (id: string, updates: { data?: Partial<NodeData>, width?: number, height?: number }) => {
      setNodes(prev => prev.map(n => {
        if (n.id !== id) return n;
        const { data, ...sizeUpdates } = updates;
        return {
            ...n,
            ...sizeUpdates,
            data: data ? { ...n.data, ...data } : n.data,
        };
    }));
  };
  
  const handleNodeResize = (id: string, dimensions: { width: number, height: number }) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...dimensions } : n));
  };


  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
  };

  const handleCopyGlobalPseudo = () => {
    let output = "// NEXUS FLOW GLOBAL PSEUDO CODE\n\n// --- NODES ---\n";
    
    nodes.forEach(n => {
        if (n.data.type !== 'embed') {
            output += `[${n.data.type.toUpperCase()}] ${n.data.label}`;
            if (n.data.value !== undefined && n.data.value !== '') {
                output += ` = ${n.data.value}`;
            }
        } else {
            output += `[EMBED] ${n.data.label} (${n.data.embedData?.fileName || '...'})`
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

  const handleGenerateGraph = async (prompt: string, apiKey: string) => {
    if (!prompt || !apiKey) return;

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `You are an expert system architect and visual designer. Your task is to generate a directed graph based on a user's description. The graph must be represented as a JSON object containing 'nodes' and 'edges'.

Follow these layout rules strictly:
1.  **Canvas & Grid:** Assume a virtual canvas of 1500px wide. Place nodes on a coarse grid, making their 'x' and 'y' coordinates multiples of 50. The top-left of the canvas is (0,0).
2.  **Logical Flow:** The graph must flow logically from left (inputs) to right (outputs). Arrange nodes in clear vertical columns based on their logical sequence.
3.  **Node Spacing:** Maintain a minimum horizontal distance of 250px and a minimum vertical distance of 150px between any two nodes to prevent clutter and overlap.
4.  **Minimize Edge Crossing:** Arrange nodes to minimize the number of crossing connections. This is a high priority.
5.  **Alignment:** Align nodes within the same logical layer (column) vertically for a clean, organized appearance. Start the first column of nodes at x >= 100.
6.  **Schema Adherence & Data:** Each node must have a unique 'id', a 'label', a 'type' ('input', 'process', or 'output'), a 'position' {x, y}, and a 'value'. For the 'value', provide a meaningful and concise example string representing the data the node might handle (e.g., "User credentials" or "JWT Token Validation"). Each edge must connect two nodes using their 'id's in the 'source' and 'target' fields. Ensure all node IDs used in edges exist in the nodes array.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a graph for: "${prompt}"`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: graphSchema,
            systemInstruction,
        },
    });

    const graphData = JSON.parse(response.text);

    if (!graphData.nodes || !graphData.edges) {
        throw new Error("Invalid graph structure received from AI.");
    }

    const newNodes: Node[] = graphData.nodes.map((n: any) => ({
        id: n.id,
        position: n.position,
        data: { label: n.label, type: n.type as ('input'|'process'|'output'), value: n.value },
        handles: { top: 1, right: 1, bottom: 1, left: 1 },
        width: 200,
    }));

    const newEdges: Edge[] = graphData.edges.map((e: any) => ({
        id: generateId(),
        source: e.source,
        sourceHandle: 0,
        sourceSide: 'right',
        target: e.target,
        targetHandle: 0,
        targetSide: 'left',
    }));

    setNodes(newNodes);
    setEdges(newEdges);
    setViewport({ x: 0, y: 0, zoom: 1 });
    setIsGeneratorOpen(false); // On success, close the modal.
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
        handleClearCanvas();
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
    const project = { version: '1.1', nodes, edges, viewport };
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
      // FIX: Added 'as const' to satisfy the CSSProperties type for userSelect.
      WebkitTouchCallout: 'none' as const, // Disable context menu on long press for iOS Safari
      WebkitUserSelect: 'none' as const, // Disable text selection for iOS Safari
      KhtmlUserSelect: 'none' as const, // Disable text selection for Konqueror
      MozUserSelect: 'none' as const, // Disable text selection for Firefox
      MsUserSelect: 'none' as const, // Disable text selection for Edge/IE
      userSelect: 'none' as const, // Disable text selection for general browsers
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
        onNodeResize={handleNodeResize}
        openNodeMenu={openNodeMenu}
        onToggleNodeMenu={(nodeId) => setOpenNodeMenu(prev => prev === nodeId ? null : nodeId)}
        renderNode={(node) => {
            if (node.data.type === 'embed') {
                return <EmbedSlate 
                            data={node.data} 
                            onUpdate={(updates) => handleUpdateNode(node.id, updates)}
                            onDelete={() => handleDeleteNode(node.id)}
                       />
            }
            return <IPOSlate 
                        data={node.data}
                        onUpdate={(data) => handleUpdateNode(node.id, { data })}
                        onDelete={() => handleDeleteNode(node.id)}
                   />
        }}
      />

      {/* UI Overlay */}
      <div style={styles.uiOverlay}>
        <h1 
            style={styles.title}
        >Nexus Flow</h1>
        <p style={styles.subtitle}>
            v4.1 // {activeTool.toUpperCase()}
        </p>
      </div>

      <Dock 
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        onAddNode={handleAddNode}
        onClear={handleClearCanvas}
        onResetView={() => setViewport({ x: 0, y: 0, zoom: 1 })}
        onImport={triggerImport}
        onExport={exportProject}
        onCopyPseudo={handleCopyGlobalPseudo}
        onGenerateGraph={() => setIsGeneratorOpen(true)}
      />

      <ContextMenu 
        position={contextMenuPos} 
        onClose={() => setContextMenuPos(null)} 
        onAction={handleContextAction}
      />
      
      <GeneratorModal 
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onSubmit={handleGenerateGraph}
        shouldConfirm={nodes.length > 0}
        onClear={handleClearCanvas}
      />
    </div>
  );
};